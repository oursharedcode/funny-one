// SPDX-License-Identifier: AGPL-3.0-only

// T-2.4 — the grace-window registry in isolation, on fake timers.
//
// The production window is 65 s, so the timing rules cannot be checked over
// real sockets: the socket suite proves the *behaviour* with a short window,
// this proves the *timing* exactly. Fake timers are safe here precisely because
// there are no sockets in this file — freezing time under a live Socket.IO
// connection would also freeze its heartbeats.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDisconnectRegistry } from './disconnect.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function makeRegistry(graceMs = 1000) {
  const expired: string[] = [];
  const registry = createDisconnectRegistry({ graceMs, onExpire: (id) => expired.push(id) });
  return { registry, expired };
}

describe('disconnect registry', () => {
  it('removes only after the full window elapses', () => {
    const { registry, expired } = makeRegistry();
    registry.schedule('a');

    vi.advanceTimersByTime(999);
    expect(expired, 'a player must survive right up to the deadline').toEqual([]);

    vi.advanceTimersByTime(1);
    expect(expired).toEqual(['a']);
  });

  it('cancels a pending removal when the socket returns', () => {
    const { registry, expired } = makeRegistry();
    registry.schedule('a');
    expect(registry.cancel('a')).toBe(true);

    vi.advanceTimersByTime(10_000);
    expect(expired, 'a recovered socket must never be removed').toEqual([]);
    expect(registry.pending()).toBe(0);
  });

  it('reports no pending removal to cancel when none is armed', () => {
    const { registry } = makeRegistry();
    expect(registry.cancel('never-seen')).toBe(false);
  });

  it('does not claim to cancel a removal that already happened', () => {
    // The entry is deleted before onExpire runs, so a late `recovered` for a
    // socket whose window has closed cannot report a rescue that did not occur.
    const { registry, expired } = makeRegistry();
    registry.schedule('a');
    vi.advanceTimersByTime(1000);
    expect(expired).toEqual(['a']);
    expect(registry.cancel('a')).toBe(false);
  });

  it('restarts the window when the same socket drops twice', () => {
    // A flapping connection: each drop earns a fresh full window, and the
    // first drop's timer must not fire on top of the second.
    const { registry, expired } = makeRegistry();
    registry.schedule('a');
    vi.advanceTimersByTime(600);
    registry.schedule('a');

    vi.advanceTimersByTime(600);
    expect(expired, 'the superseded timer must not fire').toEqual([]);
    expect(registry.pending()).toBe(1);

    vi.advanceTimersByTime(400);
    expect(expired).toEqual(['a']);
  });

  it('tracks windows per socket', () => {
    const { registry, expired } = makeRegistry();
    registry.schedule('a');
    vi.advanceTimersByTime(500);
    registry.schedule('b');
    expect(registry.pending()).toBe(2);

    vi.advanceTimersByTime(500);
    expect(expired).toEqual(['a']);
    vi.advanceTimersByTime(500);
    expect(expired).toEqual(['a', 'b']);
    expect(registry.pending()).toBe(0);
  });

  it('drops pending windows on clearAll without running them', () => {
    // Server shutdown: a timer that outlived its server would remove a player
    // from a room store that no longer belongs to it.
    const { registry, expired } = makeRegistry();
    registry.schedule('a');
    registry.schedule('b');
    registry.clearAll();

    expect(registry.pending()).toBe(0);
    vi.advanceTimersByTime(10_000);
    expect(expired).toEqual([]);
  });
});
