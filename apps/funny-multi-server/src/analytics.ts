// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: visit and click counts for the Funny Family landing page (the hub,
// apps/funny-family-site) and for the funnel that runs from it into Funny
// Multi and on to the gift sheet. The hub's /stats/ page reads them back.
//
// Not stats.ts, which is the live room/picture counter the Home screen shows.
//
// What is kept is a count per UTC day per combination of a few coarse,
// allow-listed labels — the event, the hub variant, the language, where the
// visit came from — and nothing else: no IP address, no user agent, no
// identifier, nothing finer than the day. That is what lets the game stay
// cookie-free and banner-free, and lets the summary route be public. A label
// outside its allowlist rejects the whole event, so nobody can write free text
// into the file and the key space is closed (780 combinations a day at most).
//
// Persistence is one JSON file (STATS_FILE; docker-compose.yml mounts a volume
// for it), written whole and atomically when something changed, at most every
// FLUSH_MS and once more on close. Without STATS_FILE (dev, tests) the counts
// live in memory only.

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { LANGUAGES } from '@funny/shared';

export const STAT_EVENTS = ['hub_view', 'hub_click', 'fm_view', 'fm_support', 'fm_gift'] as const;
export type StatEvent = (typeof STAT_EVENTS)[number];

/** The labels an event can carry, in key order after the event itself. */
export const STAT_FIELDS = ['v', 'l', 's', 't', 'r', 'd'] as const;
type Field = (typeof STAT_FIELDS)[number];

const VARIANTS = ['a', 'b'] as const;
const LANGUAGE_CODES: readonly string[] = LANGUAGES.map((option) => option.code);
// Where a Funny Multi visit came from: the hub's "Play" link, or anywhere else.
const SOURCES = ['hub', 'direct'] as const;
// A hub visit's referrer, classified in the browser (no URL is ever sent).
const REFERRERS = ['direct', 'search', 'social', 'oursharedcode', 'games', 'other'] as const;
// Phone-sized screen or not.
const DEVICES = ['m', 'd'] as const;
// What was clicked on the hub: either game, the source code, the video, the
// author's site.
const HUB_TARGETS = ['fm', 'fo', 'gh', 'video', 'root'] as const;
// Which gift rail was used on Funny Multi's support sheet.
const GIFT_TARGETS = ['payid', 'sponsors', 'lightning', 'donate'] as const;

// Each event's own labels. Every one listed is required, except that a Funny
// Multi event carries `v` only when it came through the hub — a visit that did
// not has no variant to report.
const SPEC: Record<StatEvent, Partial<Record<Field, readonly string[]>>> = {
  hub_view: { v: VARIANTS, l: LANGUAGE_CODES, r: REFERRERS, d: DEVICES },
  hub_click: { v: VARIANTS, l: LANGUAGE_CODES, t: HUB_TARGETS },
  fm_view: { v: VARIANTS, l: LANGUAGE_CODES, s: SOURCES },
  fm_support: { v: VARIANTS, l: LANGUAGE_CODES, s: SOURCES },
  fm_gift: { v: VARIANTS, l: LANGUAGE_CODES, s: SOURCES, t: GIFT_TARGETS },
};

function isStatEvent(value: unknown): value is StatEvent {
  return typeof value === 'string' && (STAT_EVENTS as readonly string[]).includes(value);
}

/**
 * The storage key of a valid event — `e|v|l|s|t|r|d`, an absent label empty —
 * or null when anything about it is off: an unknown event or field, a label
 * the event does not take, a value outside its allowlist, a missing label.
 */
export function statKey(input: unknown): string | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  const event = record.e;
  if (!isStatEvent(event)) return null;
  for (const name of Object.keys(record)) {
    if (name !== 'e' && !(STAT_FIELDS as readonly string[]).includes(name)) return null;
  }
  const spec = SPEC[event];
  const viaHub = event.startsWith('hub_') || record.s === 'hub';
  const parts: string[] = [event];
  for (const name of STAT_FIELDS) {
    const allowed = spec[name];
    const value = record[name];
    const wanted = allowed !== undefined && (name !== 'v' || viaHub);
    if (!wanted) {
      if (value !== undefined) return null;
      parts.push('');
      continue;
    }
    if (typeof value !== 'string' || !allowed.includes(value)) return null;
    parts.push(value);
  }
  return parts.join('|');
}

/**
 * Crawlers, link previews and scripts: their visits are not people's. Not
 * "telegram" or "discord": their bots already say "bot", and Telegram's
 * in-app browser names itself in a person's user agent.
 */
const BOT_AGENT =
  /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|whatsapp|vkshare|curl|wget|python|httpclient|okhttp|go-http|node-fetch|axios|java\/|phantom|selenium|puppeteer|playwright/i;

export function isBotAgent(userAgent: string | undefined): boolean {
  if (!userAgent) return true;
  // CUBOT is a phone maker: its model names would otherwise read as "bot".
  return BOT_AGENT.test(userAgent.replace(/cubot/gi, ''));
}

export interface StatsSummary {
  /** First and last UTC day covered, inclusive (YYYY-MM-DD). */
  from: string;
  to: string;
  /** The labels each key holds after the event, in order. */
  fields: readonly string[];
  /** day → key → count; days with no events are absent. */
  days: Record<string, Record<string, number>>;
}

export interface StatsStore {
  /** Counts one event. False when the event is not one this module accepts. */
  record(input: unknown): boolean;
  /** The counts of the last `days` UTC days, today included. */
  summary(days: number): StatsSummary;
  /** Writes the file now if anything changed since the last write. */
  flush(): void;
  /** Stops the flush timer and writes what is pending. */
  stop(): void;
}

export interface StatsStoreOptions {
  /** The JSON file the counts persist to; null keeps them in memory only. */
  file: string | null;
  flushMs?: number;
  /** Days older than this are dropped. */
  retentionDays?: number;
  /** Clock injection point for tests. */
  now?: () => Date;
  /** Where a failed read or write is reported; the counting never stops for it. */
  onError?: (err: unknown) => void;
}

export const FLUSH_MS = 15_000;
export const RETENTION_DAYS = 400;
export const SUMMARY_DEFAULT_DAYS = 30;

const DAY_MS = 86_400_000;

function utcDay(at: Date): string {
  return at.toISOString().slice(0, 10);
}

interface StatsFile {
  version: 1;
  days: Record<string, Record<string, number>>;
}

function readDays(file: string, onError: (err: unknown) => void): StatsFile['days'] {
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    // No file yet is the normal first start; anything else is worth a line.
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') onError(err);
    return {};
  }
  try {
    const parsed = JSON.parse(text) as Partial<StatsFile>;
    const days: StatsFile['days'] = {};
    for (const [day, counts] of Object.entries(parsed.days ?? {})) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || typeof counts !== 'object' || !counts) continue;
      const kept: Record<string, number> = {};
      for (const [key, n] of Object.entries(counts)) {
        if (Number.isSafeInteger(n) && n > 0) kept[key] = n;
      }
      days[day] = kept;
    }
    return days;
  } catch (err) {
    // Keep the unreadable file for a look rather than overwrite it at the
    // first flush.
    onError(err);
    try {
      renameSync(file, `${file}.corrupt`);
    } catch {
      // Nothing more to do: counting starts over either way.
    }
    return {};
  }
}

export function createStatsStore(options: StatsStoreOptions): StatsStore {
  const {
    file,
    flushMs = FLUSH_MS,
    retentionDays = RETENTION_DAYS,
    now = () => new Date(),
    onError = () => {},
  } = options;
  const days: StatsFile['days'] = file ? readDays(file, onError) : {};
  let dirty = false;

  function prune(): void {
    const oldest = utcDay(new Date(now().getTime() - (retentionDays - 1) * DAY_MS));
    for (const day of Object.keys(days)) {
      if (day < oldest) delete days[day];
    }
  }
  prune();

  function record(input: unknown): boolean {
    const key = statKey(input);
    if (!key) return false;
    const day = utcDay(now());
    let counts = days[day];
    if (!counts) {
      counts = {};
      days[day] = counts;
      prune();
    }
    counts[key] = (counts[key] ?? 0) + 1;
    dirty = true;
    return true;
  }

  function summary(span: number): StatsSummary {
    const today = now();
    const from = utcDay(new Date(today.getTime() - (span - 1) * DAY_MS));
    const to = utcDay(today);
    const slice: StatsSummary['days'] = {};
    for (const [day, counts] of Object.entries(days)) {
      if (day >= from && day <= to) slice[day] = { ...counts };
    }
    return { from, to, fields: STAT_FIELDS, days: slice };
  }

  function flush(): void {
    if (!file || !dirty) return;
    // Cleared before the write: an event counted while a write fails is
    // retried with the next one, and a write that fails leaves the old file
    // whole (tmp + rename).
    dirty = false;
    const tmp = `${file}.tmp`;
    try {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(tmp, JSON.stringify({ version: 1, days } satisfies StatsFile));
      renameSync(tmp, file);
    } catch (err) {
      dirty = true;
      onError(err);
    }
  }

  // unref() so an idle timer never holds the process (or a test runner) open.
  const timer = file ? setInterval(flush, flushMs) : null;
  timer?.unref?.();

  return {
    record,
    summary,
    flush,
    stop() {
      if (timer) clearInterval(timer);
      flush();
    },
  };
}

/** `?days=` of the summary route: a whole number of days, 1 to RETENTION_DAYS. */
export function summaryDays(raw: unknown): number {
  const n = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : SUMMARY_DEFAULT_DAYS;
  return Math.min(RETENTION_DAYS, Math.max(1, n));
}
