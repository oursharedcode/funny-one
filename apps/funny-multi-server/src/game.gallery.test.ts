// SPDX-License-Identifier: AGPL-3.0-only
//
// T-5.1 — buildGallery/shareGallery (spec §24). Unit-level, same technique as
// game.test.ts: a full game is played to reveal in-process (no sockets), then
// buildGallery/shareGallery are exercised directly against the resulting
// room. Wiring (the gallery:share event, the late-picture re-broadcast over a
// real connection) is covered in game.gallery.socket.test.ts and
// game.botPictures.test.ts.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POOLS, type OptionId, type SlotIndex } from '@funny/shared';
import { __resetRoomsForTest, createRoom, joinRoom } from './rooms.js';
import {
  ROUNDS,
  buildGallery,
  resolveAnswers,
  revealProse,
  shareGallery,
  startGame,
  submitAnswer,
} from './game.js';
import type { Room } from './types.js';

interface Emitted {
  target: string;
  event: string;
  payload?: unknown;
}

function makeIo() {
  const emitted: Emitted[] = [];
  const io = {
    to(target: string) {
      return {
        emit(event: string, payload?: unknown) {
          emitted.push({ target, event, payload });
        },
      };
    },
  };
  return {
    emitted,
    io: io as unknown as Parameters<typeof startGame>[1],
    eventsFor: (event: string) => emitted.filter((e) => e.event === event),
  };
}

function optionAt(slot: number, n: number): OptionId {
  const pool = POOLS[slot as SlotIndex];
  return pool[n % pool.length]!.id;
}

function makeRoom(playerCount: number, language: 'en' | 'ru' = 'en'): Room {
  const room = createRoom('p0', language, 's0');
  for (let i = 1; i < playerCount; i++) joinRoom(room.code, `p${i}`, `s${i}`);
  return room;
}

/** Plays a full game to reveal, in-process — every round, every player. */
function playToReveal(room: Room, io: ReturnType<typeof makeIo>['io']): void {
  startGame(room, io);
  for (let round = 0; round < ROUNDS; round++) {
    for (let p = 0; p < room.players.length; p++) {
      submitAnswer(room, `s${p}`, optionAt(round, p), io);
    }
  }
}

beforeEach(() => __resetRoomsForTest());
afterEach(() => __resetRoomsForTest());

describe('buildGallery', () => {
  it('returns one entry per player, in players[] order', () => {
    const room = makeRoom(3);
    const { io } = makeIo();
    playToReveal(room, io);

    const gallery = buildGallery(room);
    expect(gallery.entries).toHaveLength(3);
    expect(gallery.entries.map((e) => e.nickname)).toEqual(['p0', 'p1', 'p2']);
  });

  it('marks a bot entry isBot and a human entry not', () => {
    const room = makeRoom(3);
    room.players[1] = { ...room.players[1]!, isBot: true };
    const { io } = makeIo();
    playToReveal(room, io);

    expect(buildGallery(room).entries.map((e) => e.isBot)).toEqual([false, true, false]);
  });

  it('carries a null picture for a story with no picture yet', () => {
    const room = makeRoom(3);
    const { io } = makeIo();
    playToReveal(room, io);

    for (const e of buildGallery(room).entries) expect(e.picture).toBeNull();
  });

  it("carries a story's generated picture once one exists", () => {
    const room = makeRoom(3);
    const { io } = makeIo();
    playToReveal(room, io);
    room.stories[1]!.picture = {
      url: 'https://worker.example.com/i/x.png',
      width: 1024,
      height: 1024,
    };

    expect(buildGallery(room).entries[1]!.picture).toEqual({
      url: 'https://worker.example.com/i/x.png',
      width: 1024,
      height: 1024,
    });
  });

  it('resolves answers and prose the same way reveal:start already showed the player', () => {
    // The gallery must retell each story exactly as its owner already saw it
    // on their own reveal screen — any divergence here is a story that reads
    // differently in the gallery than it did at reveal.
    const room = makeRoom(3, 'ru');
    const { io } = makeIo();
    playToReveal(room, io);

    const gallery = buildGallery(room);
    room.stories.forEach((story, i) => {
      const answers = resolveAnswers(room, story);
      expect(gallery.entries[i]!.answers).toEqual(answers);
      expect(gallery.entries[i]!.prose).toBe(revealProse(room, answers));
    });
  });

  it("carries each story's option ids, for a client reading in another language (B-15)", () => {
    const room = makeRoom(3);
    room.players[2] = { ...room.players[2]!, isBot: true };
    const { io } = makeIo();
    playToReveal(room, io);

    const gallery = buildGallery(room);
    room.stories.forEach((story, i) => {
      expect(gallery.entries[i]!.optionIds).toEqual(story.answers);
    });
  });
});

describe('shareGallery', () => {
  it('rejects a non-host with NOT_HOST and does not mark the gallery shared', () => {
    const room = makeRoom(3);
    const { io, eventsFor } = makeIo();
    playToReveal(room, io);

    shareGallery(room, 's1', io);

    expect(room.galleryShared).toBe(false);
    const errors = eventsFor('error');
    expect(errors).toHaveLength(1);
    expect(errors[0]!.target).toBe('s1');
    expect(errors[0]!.payload).toMatchObject({ code: 'NOT_HOST' });
    expect(eventsFor('gallery:ready')).toHaveLength(0);
  });

  it('does nothing outside reveal phase, even for the host', () => {
    const room = makeRoom(3);
    const { io, eventsFor } = makeIo();
    startGame(room, io); // phase is 'playing', not 'reveal'

    shareGallery(room, room.hostId, io);

    expect(room.galleryShared).toBe(false);
    expect(eventsFor('gallery:ready')).toHaveLength(0);
    expect(eventsFor('error')).toHaveLength(0);
  });

  it('marks the gallery shared and broadcasts it to the whole room on a host call', () => {
    const room = makeRoom(3);
    const { io, eventsFor } = makeIo();
    playToReveal(room, io);

    shareGallery(room, room.hostId, io);

    expect(room.galleryShared).toBe(true);
    const broadcasts = eventsFor('gallery:ready');
    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0]!.target).toBe(room.code);
    expect(broadcasts[0]!.payload).toEqual(buildGallery(room));
  });
});
