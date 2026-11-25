// SPDX-License-Identifier: AGPL-3.0-only

// Step 117 (task B-29) — packs in rooms, in-process. Which room is offered the
// Christmas pack, how a free game splits its stories into one golden story and
// the slice (owner decision 1C), that every pick — a player's or a bot's — is
// checked against the pool its own story offers, the golden ending drawn after
// the scene, the gallery revealing the golden story last, and the cut-off
// (FM-PACK-6) at a room's creation and at a game's start.
//
// The workspace's vitest config sets PACK_ROOMS=off so the older suites keep
// playing base rooms; this one turns it back on.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  POOLS,
  PROSE_SLOTS,
  buildAftermathPrompt,
  cutoffOf,
  isGolden,
  optionsFor,
  storyIndex,
  type AuthoredLanguage,
  type OptionId,
  type SlotIndex,
  type StoryContent,
} from '@funny/shared';

vi.mock('./image.js', () => {
  class ImageCapReachedError extends Error {
    constructor() {
      super('Daily image generation cap reached');
      this.name = 'ImageCapReachedError';
    }
  }
  return {
    ImageCapReachedError,
    generateImage: vi.fn((prompt: string) =>
      Promise.resolve({
        url: `https://worker.example.com/i/${prompt.length}.png`,
        width: 1024,
        height: 1024,
      }),
    ),
  };
});

import { __resetRoomsForTest, createRoom, joinRoom, packOffer, packOnSale } from './rooms.js';
import {
  ROUNDS,
  buildGallery,
  handlePictureRequest,
  prepareRestart,
  startGame,
  submitAnswer,
} from './game.js';
import { generateImage } from './image.js';
import type { Room, RoomStory } from './types.js';

const generateImageMock = vi.mocked(generateImage);

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

function makeRoom(playerCount: number, language: AuthoredLanguage = 'en'): Room {
  const room = createRoom('p0', language, 's0');
  for (let i = 1; i < playerCount; i++) joinRoom(room.code, `p${i}`, `s${i}`);
  return room;
}

// The story player i writes in the room's current round.
function storyOf(room: Room, i: number): RoomStory {
  return room.stories[storyIndex(i, room.currentRound, room.players.length)]!;
}

// Every human answers every round with the first option its story offers.
function playThrough(room: Room, io: Parameters<typeof startGame>[1]): void {
  while (room.phase === 'playing') {
    const slot = room.currentRound as SlotIndex;
    for (let i = 0; i < room.players.length; i++) {
      const id = optionsFor(slot, storyOf(room, i).content)[0]!.id;
      submitAnswer(room, `s${i}`, id, io);
      if (room.phase !== 'playing' || room.currentRound !== slot) break;
    }
  }
}

const kinds = (room: Room): string[] => room.stories.map((s) => s.content.kind);
const FREE_CUTOFF = cutoffOf('2027-07-01');

beforeEach(() => {
  __resetRoomsForTest();
  vi.stubEnv('PACK_ROOMS', 'on');
  generateImageMock.mockClear();
});
afterEach(() => {
  __resetRoomsForTest();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('the offer (owner decisions 3A, 4A)', () => {
  it('offers a new room in any of its 20 languages the Christmas pack, switched on', () => {
    for (const language of ['en', 'ru', 'de', 'ja', 'yo'] as const) {
      expect(makeRoom(3, language).pack, language).toEqual({ id: 'chr26', on: true, paid: false });
    }
  });

  it('offers an ar, he or fa room nothing', () => {
    for (const language of ['ar', 'he', 'fa'] as const) {
      expect(makeRoom(3, language).pack, language).toBeNull();
    }
  });

  it('offers nothing with PACK_ROOMS=off, the launch kill switch', () => {
    vi.stubEnv('PACK_ROOMS', 'off');
    expect(makeRoom(3, 'en').pack).toBeNull();
  });

  it('offers nothing from the free cut-off on', () => {
    expect(packOffer('en', FREE_CUTOFF - 1)).toEqual({ id: 'chr26', on: true, paid: false });
    expect(packOffer('en', FREE_CUTOFF)).toBeNull();
  });

  it('sells the pack while its free part is on, and never with the rooms off (Step 123)', () => {
    expect(packOnSale(FREE_CUTOFF - 1)).toBe('chr26');
    // Sales stop with the free part, a month before the paid codes do.
    expect(packOnSale(FREE_CUTOFF)).toBeNull();
    vi.stubEnv('PACK_ROOMS', 'off');
    expect(packOnSale(FREE_CUTOFF - 1)).toBeNull();
  });
});

describe('a free game’s stories (owner decision 1C)', () => {
  for (const n of [3, 4, 5, 6, 7]) {
    it(`gives ${n} players one golden story and the slice (owner, 2026-11-25)`, () => {
      const room = makeRoom(n);
      startGame(room, makeIo().io);
      expect(kinds(room).filter((k) => k === 'full')).toHaveLength(1);
      expect(kinds(room).filter((k) => k === 'slice')).toHaveLength(n - 1);
      for (const story of room.stories) {
        expect(story.content).toMatchObject({ pack: 'chr26' });
        expect(story.ending).toBeNull();
      }
    });
  }

  it('plays the base pools when the host switched the pack off', () => {
    const room = makeRoom(4);
    room.pack = { id: 'chr26', on: false, paid: false };
    startGame(room, makeIo().io);
    expect(kinds(room)).toEqual(['base', 'base', 'base', 'base']);
  });

  it('plays the base pools in a lobby left open across the cut-off', () => {
    vi.useFakeTimers();
    vi.setSystemTime(FREE_CUTOFF - 60_000);
    const room = makeRoom(3);
    expect(room.pack).toEqual({ id: 'chr26', on: true, paid: false });
    vi.setSystemTime(FREE_CUTOFF);
    startGame(room, makeIo().io);
    expect(kinds(room)).toEqual(['base', 'base', 'base']);
  });

  it('keeps the switch on "one more game" and draws the golden story afresh', () => {
    const room = makeRoom(3);
    room.pack = { id: 'chr26', on: false, paid: false };
    const { io } = makeIo();
    startGame(room, io);
    playThrough(room, io);
    expect(room.phase).toBe('reveal');

    expect(prepareRestart(room, 's0')).toEqual({ ok: true });
    startGame(room, io);
    expect(room.pack).toEqual({ id: 'chr26', on: false, paid: false });
    expect(kinds(room)).toEqual(['base', 'base', 'base']);

    room.pack = { id: 'chr26', on: true, paid: false };
    playThrough(room, io);
    prepareRestart(room, 's0');
    startGame(room, io);
    expect(kinds(room).filter((k) => k === 'full')).toHaveLength(1);
  });
});

describe('each player’s round (Step 117)', () => {
  it('sends every player the content of the story it writes this round', () => {
    const room = makeRoom(5);
    const { io, eventsFor } = makeIo();
    startGame(room, io);
    const starts = eventsFor('round:start');
    expect(starts).toHaveLength(5);
    starts.forEach((start, i) => {
      expect(start.target).toBe(`s${i}`);
      expect((start.payload as { content: StoryContent }).content).toEqual(
        storyOf(room, i).content,
      );
    });
  });

  it('checks a pick against its own story’s pool, slot by slot', () => {
    const room = makeRoom(3);
    const { io, eventsFor } = makeIo();
    startGame(room, io);

    // Round 0 ("who"): a golden story takes the pack's, a slice story the base's.
    const golden = [0, 1, 2].find((i) => isGolden(storyOf(room, i).content))!;
    const slice = [0, 1, 2].find((i) => !isGolden(storyOf(room, i).content))!;
    const packWho = optionsFor(0, storyOf(room, golden).content)[0]!.id;
    const baseWho = POOLS[0][0]!.id;
    expect(packWho).toMatch(/^who\.chr26-/);

    submitAnswer(room, `s${golden}`, baseWho, io);
    submitAnswer(room, `s${slice}`, packWho, io);
    expect(eventsFor('error').map((e) => e.target)).toEqual([`s${golden}`, `s${slice}`]);
    expect(room.submittedThisRound.size).toBe(0);

    submitAnswer(room, `s${golden}`, packWho, io);
    submitAnswer(room, `s${slice}`, baseWho, io);
    expect(room.submittedThisRound.size).toBe(2);
    expect(eventsFor('error')).toHaveLength(2);
  });

  it('takes the slice’s when, why and ending from the pack', () => {
    const room = makeRoom(3);
    const { io } = makeIo();
    startGame(room, io);
    playThrough(room, io);
    for (const story of room.stories) {
      story.answers.forEach((id, slot) => {
        const pack = PROSE_SLOTS.includes(slot as SlotIndex) || isGolden(story.content);
        expect(id!.includes('.chr26-'), `slot ${slot} of a ${story.content.kind} story`).toBe(pack);
      });
    }
  });

  it('fills a silent player’s and a bot’s slot from its own story’s pool', () => {
    vi.useFakeTimers();
    const room = makeRoom(7);
    room.players[3]!.isBot = true;
    room.players[6]!.isBot = true;
    const { io } = makeIo();
    startGame(room, io);
    for (let round = 0; round < ROUNDS; round++) vi.runOnlyPendingTimers();
    expect(room.phase).toBe('reveal');
    for (const story of room.stories) {
      story.answers.forEach((id, slot) => {
        const pool = optionsFor(slot as SlotIndex, story.content).map((o) => o.id);
        expect(pool).toContain(id as OptionId);
      });
    }
  });
});

describe('the reveal', () => {
  function revealedRoom(n = 4): Room {
    const room = makeRoom(n);
    const { io } = makeIo();
    startGame(room, io);
    playThrough(room, io);
    expect(room.phase).toBe('reveal');
    return room;
  }

  const ownerOf = (room: Room, golden: boolean): number =>
    room.stories.findIndex((s) => isGolden(s.content) === golden);

  it('sends a golden story’s scene with its ending, the aftermath', async () => {
    const room = revealedRoom();
    const i = ownerOf(room, true);
    const { io, eventsFor } = makeIo();
    await handlePictureRequest(room, `s${i}`, io);

    expect(generateImageMock).toHaveBeenCalledTimes(2);
    expect(generateImageMock.mock.calls[1]![0]).toBe(buildAftermathPrompt(room.stories[i]!));
    const [ready] = eventsFor('reveal:pictureReady');
    expect(ready!.target).toBe(`s${i}`);
    const payload = ready!.payload as { picture: unknown; ending: unknown };
    expect(payload.picture).not.toBeNull();
    expect(payload.ending).toEqual(room.stories[i]!.ending);
    expect(payload.ending).not.toBeNull();

    // Write-once: a retry asks for neither again.
    await handlePictureRequest(room, `s${i}`, io);
    expect(generateImageMock).toHaveBeenCalledTimes(2);
    expect(eventsFor('reveal:pictureReady')[1]!.payload).toMatchObject({ ending: payload.ending });
  });

  it('sends a slice story’s scene alone: its ending is the text card', async () => {
    const room = revealedRoom();
    const i = ownerOf(room, false);
    const { io, eventsFor } = makeIo();
    await handlePictureRequest(room, `s${i}`, io);
    expect(generateImageMock).toHaveBeenCalledTimes(1);
    expect(eventsFor('reveal:pictureReady')[0]!.payload).toMatchObject({ ending: null });
  });

  it('still sends the scene when the aftermath fails, and asks again on a retry', async () => {
    const room = revealedRoom();
    const i = ownerOf(room, true);
    generateImageMock
      .mockImplementationOnce(() =>
        Promise.resolve({
          url: 'https://worker.example.com/i/scene.png',
          width: 1024,
          height: 1024,
        }),
      )
      .mockImplementationOnce(() => Promise.reject(new Error('no such picture')));
    const { io, eventsFor } = makeIo();
    await handlePictureRequest(room, `s${i}`, io);
    expect(eventsFor('reveal:pictureReady')[0]!.payload).toMatchObject({
      picture: { url: 'https://worker.example.com/i/scene.png' },
      ending: null,
    });

    await handlePictureRequest(room, `s${i}`, io);
    expect(generateImageMock).toHaveBeenCalledTimes(3);
    expect(
      (eventsFor('reveal:pictureReady')[1]!.payload as { ending: unknown }).ending,
    ).not.toBeNull();
  });

  it('reveals the golden story last in the gallery, each with its content', () => {
    const room = revealedRoom(6);
    const gallery = buildGallery(room);
    expect(gallery.entries.map((e) => e.content.kind)).toEqual([
      'slice',
      'slice',
      'slice',
      'slice',
      'slice',
      'full',
    ]);
    // Each entry is still its owner's story, only moved.
    for (const entry of gallery.entries) {
      const owner = room.players.findIndex((p) => p.nickname === entry.nickname);
      expect(entry.optionIds).toEqual(room.stories[owner]!.answers);
      expect(entry.ending).toBeNull();
    }
  });

  it('resolves a pack id to its text in the room language', () => {
    const room = makeRoom(3, 'ru');
    const { io } = makeIo();
    startGame(room, io);
    playThrough(room, io);
    const allText = buildGallery(room)
      .entries.flatMap((e) => e.answers)
      .join(' ');
    expect(allText).toMatch(/[а-яё]/i);
    expect(allText).not.toMatch(/chr26/);
    expect(buildGallery(room).entries.every((e) => e.answers.every((a) => a.length > 0))).toBe(
      true,
    );
  });
});
