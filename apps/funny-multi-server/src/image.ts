// SPDX-License-Identifier: AGPL-3.0-only

import type { PictureRef } from './types.js';

const MAX_RETRIES = 2;
const TIMEOUT_MS = 15_000;
const EXISTS_TIMEOUT_MS = 5_000;
const STATS_TIMEOUT_MS = 3_000;
const RETRY_DELAY_MS = 1_000;
const MAX_IMAGES_PER_DAY_DEFAULT = 25;

// Read lazily so process.env is populated (env.ts) before first use.
export function maxImagesPerDay(): number {
  const v = Number(process.env.MAX_IMAGES_PER_DAY);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : MAX_IMAGES_PER_DAY_DEFAULT;
}

// ============================================================================
// Daily image cap (design §7.3, spec §11/§17 carried over)
//
// Process-global counter, shared across ALL rooms — the Cloudflare Workers AI
// Neuron budget is account-wide, not per-room. Resets at 00:00 UTC.
//
// Two layers cooperate, unchanged from SRC:
//
//   • `imagesToday` (this module) — in-process counter, incremented atomically
//     inside `reserveImageSlot()` BEFORE the Worker call is awaited. This is
//     authoritative for reservation: concurrent reservations from multiple
//     rooms cannot overshoot the cap because the check + increment are
//     synchronous JS.
//
//   • `workerCount` (this module) — last-known value from the Cloudflare
//     Worker's KV-backed counter. Refreshed lazily via `maybeSyncImageCounter`
//     (TTL-bounded) and eagerly on server startup. Survives a process restart,
//     which resets `imagesToday` to 0.
//
// `imagesGeneratedToday()` returns the **max** of the two, so:
//   – Within a session: local counter dominates (correct and live).
//   – After a restart: KV counter dominates (recovered).
// The cap check uses the same max, so the next reservation correctly fails
// when the KV counter already exceeds the limit even if the local counter is
// still 0 from a cold start.
//
// New in this repo, not in SRC: `releaseImageSlot()`. SRC always reserved
// before calling the Worker because the Worker generated unconditionally on
// every call. This Worker owns a content-addressed cache (design §7.2), so a
// cache hit must cost no slot at all — but the server cannot know a prompt is
// cached without asking the Worker, and asking costs a round trip the reserve
// call cannot simply wait out. `generateImage` below resolves that with an
// `/exists` probe *before* reserving, and `releaseImageSlot` as the refund for
// the race that probe cannot close: another room's request generating the
// same prompt in between this probe and this room's own `/generate` call.
// ============================================================================

let imagesToday = 0;
let dayKey = utcDayKey();
let workerCount = 0;
let lastWorkerSyncMs = 0;
const WORKER_SYNC_TTL_MS = 30_000;

// The Worker's generation switch (T-9.2a) as `/stats` last reported it. False
// until a sync has heard from the Worker. Once it has, only an explicit `false`
// means off: a Worker that predates the switch sends no such field, and that
// Worker always generates.
let workerGenerates = false;

function utcDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// Day rollover at 00:00 UTC resets both counters. Called by every mutator
// (`reserveImageSlot`, `releaseImageSlot`) and by the sync path (which guards
// against stamping a pre-rollover Worker count onto today).
function rolloverIfNewDay(): void {
  const today = utcDayKey();
  if (today === dayKey) return;
  dayKey = today;
  imagesToday = 0;
  workerCount = 0;
  lastWorkerSyncMs = 0;
}

// Fetches the Worker's /stats endpoint and refreshes `workerCount` when the
// response reports today's UTC day. Network failures are silently absorbed —
// the local counter remains a safe fallback. The stamp on `lastWorkerSyncMs`
// is set on completion (success or failure) to bound retry frequency.
//
// The same response carries the generation switch (B-13). It is not a per-day
// figure, so it is taken whatever day the Worker reports, and a failed sync
// leaves the last known answer standing.
export async function syncImageCounterFromWorker(): Promise<void> {
  rolloverIfNewDay();
  const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
  const secret = process.env.CLOUDFLARE_WORKER_SECRET;
  if (!workerUrl || !secret) {
    workerGenerates = false;
    lastWorkerSyncMs = Date.now();
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), STATS_TIMEOUT_MS);
  try {
    const res = await fetch(`${workerUrl}/stats`, {
      headers: { 'X-Secret': secret },
      signal: controller.signal,
    });
    if (!res.ok) return;
    const data = (await res.json()) as { date?: unknown; count?: unknown; generation?: unknown };
    if (data?.date === utcDayKey() && typeof data.count === 'number' && data.count >= 0) {
      workerCount = Math.floor(data.count);
    }
    workerGenerates = data?.generation !== false;
  } catch {
    // Intentionally ignored — see header comment.
  } finally {
    clearTimeout(timer);
    lastWorkerSyncMs = Date.now();
  }
}

// TTL-bounded sync. The first call after startup (or after the TTL expires)
// awaits the Worker round-trip; subsequent calls within the TTL window resolve
// immediately. Use this in request handlers (e.g. `stats:get`) to keep the
// surfaced count fresh without blocking on every request.
export async function maybeSyncImageCounter(): Promise<void> {
  if (lastWorkerSyncMs > 0 && Date.now() - lastWorkerSyncMs < WORKER_SYNC_TTL_MS) {
    return;
  }
  await syncImageCounterFromWorker();
}

// Returns false when the daily ceiling is already reached. On success the
// slot is reserved (counter incremented) BEFORE the Worker call is awaited,
// so concurrent requests from different rooms cannot overshoot the cap.
// Attempts are counted, not successes — a failed generation may still have
// consumed Neurons, and refunding failures would let an abuser dodge the cap.
// The cap check uses max(local, worker) so a cold-started process with a
// pre-existing KV count above the limit correctly refuses new reservations.
export function reserveImageSlot(): boolean {
  rolloverIfNewDay();
  if (imagesGeneratedToday() >= maxImagesPerDay()) return false;
  imagesToday++;
  return true;
}

/**
 * Refunds a reservation that turned out to be unnecessary: `generateImage`
 * reserved a slot on an `/exists` miss, then `/generate` itself reported
 * `cached:true` — another request generated the same prompt in the gap
 * between the two calls. The image is real and free; the slot should be too.
 *
 * Guarded at zero rather than allowed to go negative, and rolled over first so
 * a refund that lands just after midnight decrements the *new* day's (empty)
 * counter instead of borrowing against it.
 */
export function releaseImageSlot(): void {
  rolloverIfNewDay();
  if (imagesToday > 0) imagesToday--;
}

export function imagesGeneratedToday(): number {
  return Math.max(imagesToday, workerCount);
}

/**
 * Whether this deployment can still make a new picture — the Worker's
 * generation switch, as last synced. False for a library-only deployment (D-7:
 * every picture pre-generated, the switch off), where the daily cap above
 * limits nothing; the Home screen leaves its cap caption out then (B-13).
 */
export function liveGeneration(): boolean {
  return workerGenerates;
}

// Test-only — lets tests reset module state between cases. Not part of the
// public API; production code has no reason to call this.
export function __resetImageCounterStateForTests(): void {
  imagesToday = 0;
  workerCount = 0;
  workerGenerates = false;
  lastWorkerSyncMs = 0;
  dayKey = utcDayKey();
}

// ============================================================================
// Worker call (design §7.2/§7.3)
// ============================================================================

/**
 * Thrown by `generateImage` when the daily cap is already reached at the point
 * a real generation would be needed (i.e. the prompt was not already cached).
 * A distinct type rather than a message string so the caller (T-4.4) can map
 * it to `RevealPictureErrorCode.CAP_REACHED` without parsing prose, the same
 * way every other error maps to `GENERIC`.
 */
export class ImageCapReachedError extends Error {
  constructor() {
    super('Daily image generation cap reached');
    this.name = 'ImageCapReachedError';
  }
}

interface WorkerHit {
  cached: true;
  url: string;
  width: number;
  height: number;
}
interface WorkerMiss {
  cached: false;
}
interface WorkerGenerated {
  cached: false;
  url: string;
  width: number;
  height: number;
}

function parseHit(data: unknown): WorkerHit | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  if (
    d.cached === true &&
    typeof d.url === 'string' &&
    typeof d.width === 'number' &&
    typeof d.height === 'number'
  ) {
    return { cached: true, url: d.url, width: d.width, height: d.height };
  }
  return null;
}

function parseExists(data: unknown): WorkerHit | WorkerMiss {
  const hit = parseHit(data);
  if (hit) return hit;
  return { cached: false };
}

function parseGenerated(data: unknown): WorkerHit | WorkerGenerated {
  const hit = parseHit(data);
  if (hit) return hit;
  if (typeof data === 'object' && data !== null) {
    const d = data as Record<string, unknown>;
    if (
      d.cached === false &&
      typeof d.url === 'string' &&
      typeof d.width === 'number' &&
      typeof d.height === 'number'
    ) {
      return { cached: false, url: d.url, width: d.width, height: d.height };
    }
  }
  throw new Error('Worker /generate returned an unexpected response shape');
}

function workerConfig(): { workerUrl: string; secret: string } {
  const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
  const secret = process.env.CLOUDFLARE_WORKER_SECRET;
  if (!workerUrl || !secret) {
    throw new Error('Cloudflare Worker not configured');
  }
  return { workerUrl, secret };
}

/**
 * The `/exists` probe (design §7.3): a cheap R2 head and nothing else, called
 * *before* reserving a cap slot so a cache hit never costs one. Best-effort —
 * a network failure or non-2xx here is treated as a miss rather than thrown,
 * because `/generate` repeats the same head check server-side (worker.js
 * `serveGenerate`) and will report `cached:true` anyway if the prompt really
 * is cached, at which point `generateImage` refunds the slot it reserved on
 * the strength of this probe's false miss. The only cost of that path is one
 * redundant reservation, not a wrong picture or a stuck reveal.
 */
async function probeExists(
  prompt: string,
  workerUrl: string,
  secret: string,
): Promise<WorkerHit | WorkerMiss> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXISTS_TIMEOUT_MS);
  try {
    const res = await fetch(`${workerUrl}/exists?prompt=${encodeURIComponent(prompt)}`, {
      headers: { 'X-Secret': secret },
      signal: controller.signal,
    });
    if (!res.ok) return { cached: false };
    return parseExists(await res.json());
  } catch {
    return { cached: false };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calls `/generate`, retrying on failure exactly as SRC did (same three
 * constants), times out per attempt via AbortController. Throws on exhausted
 * retries or missing configuration. Never logs the request — only status
 * codes surface in errors, so the X-Secret header cannot leak
 * (docs/Cloudflare_usage.md).
 */
async function callGenerate(
  prompt: string,
  workerUrl: string,
  secret: string,
): Promise<WorkerHit | WorkerGenerated> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${workerUrl}/generate?prompt=${encodeURIComponent(prompt)}`, {
        headers: { 'X-Secret': secret },
        signal: controller.signal,
      });
      if (!res.ok) {
        // Surface the Worker's error body (e.g. a Neurons-exhausted message)
        // instead of a bare status code. Truncated to keep the message
        // bounded; the body carries no secret.
        const detail = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
      }
      return parseGenerated(await res.json());
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('unreachable');
}

/**
 * Resolves a prompt to a `PictureRef`, per the design §7.3 flow: probe
 * `/exists` capless; on a hit return it, spending no slot; on a miss, reserve
 * a slot, call `/generate`, and refund the slot if `/generate` itself reports
 * a hit (the race the probe cannot close — another room generated the same
 * prompt in between). Throws `ImageCapReachedError` when the probe missed and
 * the cap is already at its ceiling; throws a plain `Error` for every other
 * failure (Worker unreachable, exhausted retries, malformed response) — both
 * are the caller's (T-4.4) job to turn into `reveal:pictureError`.
 */
export async function generateImage(prompt: string): Promise<PictureRef> {
  const { workerUrl, secret } = workerConfig();

  const probe = await probeExists(prompt, workerUrl, secret);
  if (probe.cached) {
    return { url: probe.url, width: probe.width, height: probe.height };
  }

  if (!reserveImageSlot()) {
    throw new ImageCapReachedError();
  }

  const result = await callGenerate(prompt, workerUrl, secret);
  if (result.cached) {
    releaseImageSlot();
  }
  return { url: result.url, width: result.width, height: result.height };
}
