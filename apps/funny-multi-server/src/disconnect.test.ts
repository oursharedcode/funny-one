// SPDX-License-Identifier: AGPL-3.0-only

// T-2.4 — the grace-window registry in isolation, on fake timers.
//
// The production windows are 65 s and 10 min, so the timing rules cannot be
// checked over real sockets: the socket suite proves the *behaviour* with
// short windows, this proves the *timing* exactly. Fake timers are safe here
// precisely because there are no sockets in this file — freezing time under a
// live Socket.IO connection would also freeze its heartbeats.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDisconnectRegistry } from './disconnect.js';
import {
  DISCONNECT_GRACE_MS,
  LOBBY_GRACE_MS,
  RECOVERY_MARK_MS,
  RECOVERY_WINDOW_MS,
} from './index.js';

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

  it('runs a window given at the drop instead of the default (Step 132)', () => {
    // The lobby's window is the long one; the default stays the game's.
    const { registry, expired } = makeRegistry(1000);
    registry.schedule('lobby', 5000);
    registry.schedule('game');

    vi.advanceTimersByTime(1000);
    expect(expired).toEqual(['game']);
    vi.advanceTimersByTime(3999);
    expect(expired, 'the lobby seat waits its whole window').toEqual(['game']);
    vi.advanceTimersByTime(1);
    expect(expired).toEqual(['game', 'lobby']);
  });
});

describe('the production windows (spec §7, Step 132)', () => {
  it('waits 65 s in a game and 10 min in the lobby', () => {
    // ACCEPTANCE B14 is the game's; the lobby's is the owner's D3 B.
    expect(DISCONNECT_GRACE_MS).toBe(65_000);
    expect(LOBBY_GRACE_MS).toBe(10 * 60_000);
  });

  it('keeps a saved connection for longer than either window, with the mark to spare', () => {
    // A return inside a window must always recover. The page's last message
    // can be one mark older than its departure, and Socket.IO keeps messages
    // only as long as it keeps the saved state.
    expect(RECOVERY_WINDOW_MS).toBeGreaterThan(LOBBY_GRACE_MS + RECOVERY_MARK_MS);
    expect(RECOVERY_WINDOW_MS).toBeGreaterThan(DISCONNECT_GRACE_MS + RECOVERY_MARK_MS);
  });
});
