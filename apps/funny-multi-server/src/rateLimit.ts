// SPDX-License-Identifier: AGPL-3.0-only

// In-memory token-bucket rate limiter (spec §17), FM-CORE-4.
//
// NOT a copy. SRC specifies this in FUNNY_STORIES_SPEC_v4.md §17, ships the
// `RATE_LIMITED` error code in its shared event union, and ships a translated
// `errors.RATE_LIMITED` string in all 15 client catalogs — but never
// implemented it. Nothing in SRC/server reads `x-forwarded-for` or tracks a
// per-IP bucket, so `RATE_LIMITED` is a code the SRC server can never emit.
// SRC's own DEPLOYMENT.md nevertheless tells operators "the rate limiter reads
// x-forwarded-for", which is why the gap is easy to miss. Written here to the
// spec's stated numbers.
//
// Limits (spec §17):
//   room:create  5 per IP per minute
//   room:join   30 per IP per minute
//
// No Redis, matching the rest of the server's in-memory design (spec §18): a
// single Render process holds all rooms, so a per-process bucket is the correct
// scope. Horizontal scaling would need shared state, but so would the room map.

export interface RateLimiterOptions {
  /** Burst size and the number of tokens restored per `intervalMs`. */
  capacity: number;
  /** Refill window in ms. */
  intervalMs: number;
  /**
   * Clock injection point. Tests pass a controllable clock; production uses
   * Date.now. Kept explicit rather than reaching for fake timers so the refill
   * arithmetic is asserted directly.
   */
  now?: () => number;
}

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export interface RateLimiter {
  /** Consumes one token. False = limit exceeded, caller must not process. */
  take(key: string): boolean;
  /** Evicts fully-refilled buckets; called on a timer in production. */
  sweep(): void;
  /** Number of tracked keys — memory-growth assertions. */
  size(): number;
  /** Stops the sweep timer (tests, graceful shutdown). */
  stop(): void;
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { capacity, intervalMs, now = Date.now } = options;
  if (!Number.isFinite(capacity) || capacity <= 0) {
    throw new RangeError('capacity must be a positive number');
  }
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    throw new RangeError('intervalMs must be a positive number');
  }

  const buckets = new Map<string, Bucket>();
  // Tokens restored per millisecond. Continuous refill rather than a fixed
  // window: a fixed window lets a caller spend the whole budget at 0:59 and
  // again at 1:01, i.e. 2x the intended rate across the boundary.
  const refillPerMs = capacity / intervalMs;

  function refill(bucket: Bucket, at: number): void {
    const elapsed = at - bucket.lastRefill;
    if (elapsed <= 0) return;
    bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillPerMs);
    bucket.lastRefill = at;
  }

  function take(key: string): boolean {
    const at = now();
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { tokens: capacity, lastRefill: at };
      buckets.set(key, bucket);
    } else {
      refill(bucket, at);
    }
    if (bucket.tokens < 1) return false;
    bucket.tokens -= 1;
    return true;
  }

  function sweep(): void {
    const at = now();
    for (const [key, bucket] of buckets) {
      refill(bucket, at);
      // A fully-refilled bucket is indistinguishable from an absent one, so
      // dropping it is free and keeps the map from growing with every IP that
      // ever connected.
      if (bucket.tokens >= capacity) buckets.delete(key);
    }
  }

  // Periodic sweep per spec §17. unref() so an idle timer never holds the
  // process (or a test runner) open.
  const timer = setInterval(sweep, intervalMs);
  timer.unref?.();

  return {
    take,
    sweep,
    size: () => buckets.size,
    stop: () => clearInterval(timer),
  };
}

// Spec §17 limits.
export const ROOM_CREATE_PER_MINUTE = 5;
export const ROOM_JOIN_PER_MINUTE = 30;
export const RATE_WINDOW_MS = 60_000;

/**
 * Client IP for bucketing, read from `x-forwarded-for`'s first hop per spec
 * §17 (Render terminates TLS and proxies, so the socket's own address is the
 * proxy's).
 *
 * Caveat worth stating plainly: `x-forwarded-for` is a client-settable header.
 * A trusted proxy appends the real peer, but taking the *first* hop means a
 * caller who sends their own `X-Forwarded-For` picks their own bucket key and
 * can rotate it to evade the limit. Spec §17 nevertheless specifies the first
 * hop, and SRC's DEPLOYMENT.md documents that assumption to operators, so the
 * spec'd behavior is what ships here rather than a silent divergence. Making
 * the trusted-hop count configurable is the real fix and is noted as an open
 * item in steering/tasks.md against T-8.1, where deploy config is settled.
 */
export function clientIp(handshake: {
  headers: Record<string, string | string[] | undefined>;
  address?: string;
}): string {
  const forwarded = handshake.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const first = raw?.split(',')[0]?.trim();
  if (first) return first;
  return handshake.address ?? 'unknown';
}
