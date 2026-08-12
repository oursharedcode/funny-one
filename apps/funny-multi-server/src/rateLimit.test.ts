// SPDX-License-Identifier: AGPL-3.0-only

// T-2.2 — rate limiter (spec §17). This module is written from the spec rather
// than copied (SRC never implemented it), so it carries no inherited test
// coverage and the arithmetic is asserted directly.

import { afterEach, describe, expect, it } from 'vitest';
import {
  RATE_WINDOW_MS,
  ROOM_CREATE_PER_MINUTE,
  ROOM_JOIN_PER_MINUTE,
  clientIp,
  createRateLimiter,
  type RateLimiter,
} from './rateLimit.js';

const limiters: RateLimiter[] = [];

// Controllable clock — the refill maths is the point of these tests, so it is
// driven explicitly rather than through fake timers.
function makeClock(start = 1_000_000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

function make(capacity: number, intervalMs: number, now: () => number): RateLimiter {
  const limiter = createRateLimiter({ capacity, intervalMs, now });
  limiters.push(limiter);
  return limiter;
}

afterEach(() => {
  for (const l of limiters.splice(0)) l.stop();
});

describe('spec §17 limits', () => {
  it('pins the documented numbers', () => {
    expect(ROOM_CREATE_PER_MINUTE).toBe(5);
    expect(ROOM_JOIN_PER_MINUTE).toBe(30);
    expect(RATE_WINDOW_MS).toBe(60_000);
  });
});

describe('token bucket', () => {
  it('allows exactly `capacity` calls in a burst, then denies', () => {
    const clock = makeClock();
    const limiter = make(5, RATE_WINDOW_MS, clock.now);
    for (let i = 0; i < 5; i++) {
      expect(limiter.take('1.1.1.1'), `call ${i + 1} should pass`).toBe(true);
    }
    expect(limiter.take('1.1.1.1')).toBe(false);
    expect(limiter.take('1.1.1.1')).toBe(false);
  });

  it('buckets per key — one IP cannot exhaust another', () => {
    const clock = makeClock();
    const limiter = make(5, RATE_WINDOW_MS, clock.now);
    for (let i = 0; i < 5; i++) limiter.take('1.1.1.1');
    expect(limiter.take('1.1.1.1')).toBe(false);
    expect(limiter.take('2.2.2.2')).toBe(true);
  });

  it('refills continuously — one token per interval/capacity', () => {
    const clock = makeClock();
    const limiter = make(5, RATE_WINDOW_MS, clock.now);
    for (let i = 0; i < 5; i++) limiter.take('ip');
    expect(limiter.take('ip')).toBe(false);

    // 1/5th of the window restores exactly one token.
    clock.advance(RATE_WINDOW_MS / 5);
    expect(limiter.take('ip')).toBe(true);
    expect(limiter.take('ip')).toBe(false);
  });

  it('does not over-refill past capacity after a long idle', () => {
    const clock = makeClock();
    const limiter = make(5, RATE_WINDOW_MS, clock.now);
    limiter.take('ip');
    clock.advance(RATE_WINDOW_MS * 100);
    for (let i = 0; i < 5; i++) {
      expect(limiter.take('ip'), `call ${i + 1} after idle`).toBe(true);
    }
    expect(limiter.take('ip')).toBe(false);
  });

  it('does not allow 2x capacity across a window boundary', () => {
    // The failure mode of a fixed window: spend the budget at the end of one
    // window and again at the start of the next. Continuous refill must cap
    // the two-burst total well below 2x capacity.
    const clock = makeClock();
    const limiter = make(5, RATE_WINDOW_MS, clock.now);
    let allowed = 0;
    for (let i = 0; i < 5; i++) if (limiter.take('ip')) allowed++;
    clock.advance(1_000); // 1s into the next notional window
    for (let i = 0; i < 5; i++) if (limiter.take('ip')) allowed++;
    expect(allowed).toBeLessThan(10);
    expect(allowed).toBe(5);
  });
});

describe('sweep', () => {
  it('evicts fully-refilled buckets so the map does not grow unbounded', () => {
    const clock = makeClock();
    const limiter = make(5, RATE_WINDOW_MS, clock.now);
    for (let i = 0; i < 50; i++) limiter.take(`ip-${i}`);
    expect(limiter.size()).toBe(50);

    clock.advance(RATE_WINDOW_MS);
    limiter.sweep();
    expect(limiter.size()).toBe(0);
  });

  it('keeps buckets that are still spent, so sweeping cannot reset a limit', () => {
    const clock = makeClock();
    const limiter = make(5, RATE_WINDOW_MS, clock.now);
    for (let i = 0; i < 5; i++) limiter.take('ip');
    limiter.sweep();
    expect(limiter.size()).toBe(1);
    expect(limiter.take('ip')).toBe(false);
  });
});

describe('validation', () => {
  it('rejects nonsensical configuration', () => {
    expect(() => createRateLimiter({ capacity: 0, intervalMs: 1000 })).toThrow(RangeError);
    expect(() => createRateLimiter({ capacity: 5, intervalMs: 0 })).toThrow(RangeError);
    expect(() => createRateLimiter({ capacity: NaN, intervalMs: 1000 })).toThrow(RangeError);
  });
});

describe('clientIp', () => {
  it('takes the first hop of x-forwarded-for', () => {
    expect(clientIp({ headers: { 'x-forwarded-for': '203.0.113.7, 70.41.3.18' } })).toBe(
      '203.0.113.7',
    );
  });

  it('handles a header repeated as an array', () => {
    expect(clientIp({ headers: { 'x-forwarded-for': ['203.0.113.7', '10.0.0.1'] } })).toBe(
      '203.0.113.7',
    );
  });

  it('falls back to the socket address when the header is absent or empty', () => {
    expect(clientIp({ headers: {}, address: '198.51.100.4' })).toBe('198.51.100.4');
    expect(clientIp({ headers: { 'x-forwarded-for': '  ' }, address: '198.51.100.4' })).toBe(
      '198.51.100.4',
    );
  });

  it('never returns empty, so a missing IP cannot collapse every caller into one bucket', () => {
    // An empty key would still be *a* key, but returning '' from two different
    // code paths would silently merge unrelated callers; 'unknown' is explicit.
    expect(clientIp({ headers: {} })).toBe('unknown');
  });
});
