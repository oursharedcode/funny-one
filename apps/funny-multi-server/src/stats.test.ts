// SPDX-License-Identifier: AGPL-3.0-only
//
// T-5.3 — stats.ts is a thin wrapper (buildStats) plus a broadcast helper
// around counters already tested in rooms.test.ts and image.test.ts, so the
// unit coverage here is deliberately small: the shape is correct and the
// broadcast reaches `io.emit` with that shape. Wiring — the socket events and
// call sites that actually invoke this — is covered in index.test.ts and
// disconnect.socket.test.ts, over real sockets.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StatsPayload } from '@funny/shared';
import { buildStats, broadcastStats } from './stats.js';
import { __resetRoomsForTest, createRoom } from './rooms.js';
import { __resetImageCounterStateForTests, reserveImageSlot } from './image.js';

beforeEach(() => {
  __resetRoomsForTest();
  __resetImageCounterStateForTests();
});

afterEach(() => {
  __resetRoomsForTest();
  __resetImageCounterStateForTests();
  delete process.env.MAX_IMAGES_PER_DAY;
});

describe('buildStats', () => {
  it('reflects zero rooms and zero images on a clean process', () => {
    expect(buildStats()).toEqual<StatsPayload>({
      openRooms: 0,
      imagesGeneratedToday: 0,
      imagesLimit: 25,
    });
  });

  it('reflects the live room count', () => {
    createRoom('Ada', 'en', 's1');
    createRoom('Bob', 'en', 's2');
    expect(buildStats().openRooms).toBe(2);
  });

  it('reflects the live image counter and configured limit', () => {
    process.env.MAX_IMAGES_PER_DAY = '10';
    reserveImageSlot();
    reserveImageSlot();
    expect(buildStats()).toEqual<StatsPayload>({
      openRooms: 0,
      imagesGeneratedToday: 2,
      imagesLimit: 10,
    });
  });
});

describe('broadcastStats', () => {
  it('emits stats:update with the current snapshot', () => {
    createRoom('Ada', 'en', 's1');
    const emit = vi.fn();
    broadcastStats({ emit } as unknown as Parameters<typeof broadcastStats>[0]);
    expect(emit).toHaveBeenCalledWith('stats:update', buildStats());
    expect(emit).toHaveBeenCalledWith('stats:update', expect.objectContaining({ openRooms: 1 }));
  });
});
