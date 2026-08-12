// SPDX-License-Identifier: AGPL-3.0-only

// T-2.2 — room lifecycle (FM-CORE-1/4). rooms.ts is a near-verbatim copy of
// SRC's, but SRC shipped it with no dedicated suite (its coverage came
// incidentally through game.test.ts), so the invariants are pinned here: the
// unambiguous code alphabet, the capacity ceiling, nickname bounds, and the
// lobby-vs-in-game removal split that rotation integrity depends on.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  MAX_PLAYERS,
  RoomError,
  __resetRoomsForTest,
  createRoom,
  deleteRoom,
  findRoomForSocket,
  getMaxRooms,
  getRoom,
  isValidLanguage,
  joinRoom,
  removePlayer,
  roomCount,
  validateNickname,
} from './rooms.js';

beforeEach(() => __resetRoomsForTest());
afterEach(() => {
  __resetRoomsForTest();
  delete process.env.MAX_ROOMS;
});

describe('room codes (spec §17)', () => {
  it('are 6 chars from the unambiguous alphabet', () => {
    // No 0/O, no 1/I/L — the whole point is a code read aloud across a room.
    for (let i = 0; i < 200; i++) {
      const room = createRoom('Ada', 'en', `sock-${i}`);
      expect(room.code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });

  it('are unique across many rooms', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 300; i++) codes.add(createRoom('Ada', 'en', `sock-${i}`).code);
    expect(codes.size).toBe(300);
  });

  it('join uppercases and trims the entered code', () => {
    const room = createRoom('Ada', 'en', 'host');
    const joined = joinRoom(`  ${room.code.toLowerCase()}  `, 'Bob', 'bob');
    expect(joined.code).toBe(room.code);
  });
});

describe('capacity (FM-CORE-4)', () => {
  it('defaults to 500 rooms and honours MAX_ROOMS', () => {
    expect(getMaxRooms()).toBe(500);
    process.env.MAX_ROOMS = '2';
    expect(getMaxRooms()).toBe(2);
  });

  it('ignores a nonsense MAX_ROOMS rather than locking the server out', () => {
    process.env.MAX_ROOMS = 'banana';
    expect(getMaxRooms()).toBe(500);
    process.env.MAX_ROOMS = '-3';
    expect(getMaxRooms()).toBe(500);
  });

  it('rejects room creation past the ceiling with SERVER_BUSY', () => {
    process.env.MAX_ROOMS = '2';
    createRoom('A', 'en', 's1');
    createRoom('B', 'en', 's2');
    expect(roomCount()).toBe(2);
    try {
      createRoom('C', 'en', 's3');
      expect.unreachable('third room should have been rejected');
    } catch (err) {
      expect(err).toBeInstanceOf(RoomError);
      expect((err as RoomError).code).toBe('SERVER_BUSY');
    }
  });

  it('caps a room at MAX_PLAYERS with ROOM_FULL', () => {
    const room = createRoom('host', 'en', 'host');
    for (let i = 1; i < MAX_PLAYERS; i++) joinRoom(room.code, `p${i}`, `s${i}`);
    expect(room.players).toHaveLength(MAX_PLAYERS);
    expect(() => joinRoom(room.code, 'extra', 'extra')).toThrow(RoomError);
  });
});

describe('nickname rules (3–20, spec §17)', () => {
  it('accepts the boundaries and trims', () => {
    expect(validateNickname('abc')).toEqual({ ok: true, nickname: 'abc' });
    expect(validateNickname('a'.repeat(20))).toEqual({ ok: true, nickname: 'a'.repeat(20) });
    expect(validateNickname('  Ada  ')).toEqual({ ok: true, nickname: 'Ada' });
  });

  it('rejects just outside the boundaries', () => {
    expect(validateNickname('ab').ok).toBe(false);
    expect(validateNickname('a'.repeat(21)).ok).toBe(false);
  });

  it('rejects whitespace-only and non-strings', () => {
    // Trimming happens before the length check, so '   ' is length 0, not 3.
    expect(validateNickname('     ').ok).toBe(false);
    expect(validateNickname(undefined).ok).toBe(false);
    expect(validateNickname(42).ok).toBe(false);
    expect(validateNickname(null).ok).toBe(false);
  });
});

describe('language validation', () => {
  it('accepts shipped languages and rejects anything else', () => {
    expect(isValidLanguage('en')).toBe(true);
    expect(isValidLanguage('ru')).toBe(true);
    expect(isValidLanguage('klingon')).toBe(false);
    expect(isValidLanguage(undefined)).toBe(false);
    expect(isValidLanguage(7)).toBe(false);
  });
});

describe('join guards', () => {
  it('rejects an unknown code', () => {
    expect(() => joinRoom('ZZZZZZ', 'Bob', 'bob')).toThrow(RoomError);
  });

  it('rejects joining a game already in progress with ROOM_LOCKED', () => {
    const room = createRoom('host', 'en', 'host');
    room.phase = 'playing';
    try {
      joinRoom(room.code, 'Bob', 'bob');
      expect.unreachable('join should have been rejected');
    } catch (err) {
      expect((err as RoomError).code).toBe('ROOM_LOCKED');
    }
  });

  it('is idempotent for the same socket', () => {
    const room = createRoom('host', 'en', 'host');
    joinRoom(room.code, 'Bob', 'bob');
    joinRoom(room.code, 'Bob', 'bob');
    expect(room.players.filter((p) => p.id === 'bob')).toHaveLength(1);
  });
});

describe('removal', () => {
  it('splices a player out in the lobby', () => {
    const room = createRoom('host', 'en', 'host');
    joinRoom(room.code, 'Bob', 'bob');
    const result = removePlayer('bob');
    expect(result).toMatchObject({ deleted: false, becameBot: false });
    expect(room.players.map((p) => p.id)).toEqual(['host']);
  });

  it('botifies rather than splices mid-game, preserving rotation integrity', () => {
    // players[] order drives storyIndex(), so an in-game removal must not
    // change the array's length or ordering.
    const room = createRoom('host', 'en', 'host');
    joinRoom(room.code, 'Bob', 'bob');
    joinRoom(room.code, 'Cy', 'cy');
    room.phase = 'playing';

    const result = removePlayer('bob');
    expect(result).toMatchObject({ deleted: false, becameBot: true });
    expect(room.players.map((p) => p.id)).toEqual(['host', 'bob', 'cy']);
    expect(room.players.find((p) => p.id === 'bob')?.isBot).toBe(true);
  });

  it('promotes a new host when the host leaves', () => {
    const room = createRoom('host', 'en', 'host');
    joinRoom(room.code, 'Bob', 'bob');
    removePlayer('host');
    expect(room.hostId).toBe('bob');
  });

  it('promotes a non-bot host mid-game, never a bot', () => {
    const room = createRoom('host', 'en', 'host');
    joinRoom(room.code, 'Bob', 'bob');
    joinRoom(room.code, 'Cy', 'cy');
    room.phase = 'playing';
    room.players[1] = { ...room.players[1]!, isBot: true };

    removePlayer('host');
    expect(room.hostId).toBe('cy');
  });

  it('deletes the room when the last lobby player leaves', () => {
    const room = createRoom('host', 'en', 'host');
    const result = removePlayer('host');
    expect(result).toMatchObject({ deleted: true, becameBot: false });
    expect(getRoom(room.code)).toBeUndefined();
    expect(roomCount()).toBe(0);
  });

  it('deletes an all-bots room mid-game (spec §7)', () => {
    const room = createRoom('host', 'en', 'host');
    joinRoom(room.code, 'Bob', 'bob');
    room.phase = 'playing';
    removePlayer('host');
    expect(getRoom(room.code)).toBeDefined();

    const result = removePlayer('bob');
    expect(result).toMatchObject({ deleted: true, becameBot: true });
    expect(getRoom(room.code)).toBeUndefined();
  });

  it('returns null for a socket in no room', () => {
    expect(removePlayer('ghost')).toBeNull();
  });
});

describe('lookup and teardown', () => {
  it('finds the room for a socket, and null once removed', () => {
    const room = createRoom('host', 'en', 'host');
    expect(findRoomForSocket('host')?.code).toBe(room.code);
    removePlayer('host');
    expect(findRoomForSocket('host')).toBeNull();
  });

  it('deleteRoom clears a pending round timer so it cannot fire into a dead room', () => {
    const room = createRoom('host', 'en', 'host');
    let fired = false;
    room.roundTimer = setTimeout(() => (fired = true), 5);
    deleteRoom(room.code);
    expect(getRoom(room.code)).toBeUndefined();
    return new Promise((resolve) => setTimeout(resolve, 30)).then(() => {
      expect(fired).toBe(false);
    });
  });
});
