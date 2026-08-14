// SPDX-License-Identifier: AGPL-3.0-only

// T-4.4 — server-side picture generation for bot-owned stories (ported from
// SRC's item 3 of BUGS_AND_IMPROVEMENTS_02.md). Bot-owned stories never fire
// reveal:requestPicture — there is no client to fire it — so without this a
// disconnected/botified player's story stays picture-less and the room
// gallery (T-5.1) shows a permanent gap.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POOLS, VISUAL_SLOTS, type OptionId, type SlotIndex } from '@funny/shared';

vi.mock('./image.js', () => {
  class ImageCapReachedError extends Error {
    constructor() {
      super('Daily image generation cap reached');
      this.name = 'ImageCapReachedError';
    }
  }
  // A factory, not a stored promise: see game.pictureError.test.ts for why —
  // a pre-built rejection is an unhandled rejection until awaited, and the
  // factory closes that gap by building it only when generateImage runs.
  let produce: () => Promise<{ url: string; width: number; height: number }> = () =>
    Promise.resolve({
      url: 'https://worker.example.com/i/fake.png',
      width: 1024,
      height: 1024,
    });
  return {
    ImageCapReachedError,
    generateImage: vi.fn(() => produce()),
    __setImageResult: (fn: typeof produce) => {
      produce = fn;
    },
  };
});

import { generateBotStoryPictures } from './game.js';
import type { Player, Room, Story } from './types.js';
import * as imageModule from './image.js';

type ImageMockExtras = {
  __setImageResult: (fn: () => Promise<{ url: string; width: number; height: number }>) => void;
};
const imageMock = imageModule as unknown as typeof imageModule & ImageMockExtras;

function completeStory(picture: Story['picture'] = null): Story {
  const answers: (OptionId | null)[] = new Array(7).fill(null);
  for (const slot of VISUAL_SLOTS) {
    answers[slot] = POOLS[slot as SlotIndex][0]!.id;
  }
  return { answers, picture };
}

function player(id: string, nickname: string, isBot: boolean): Player {
  return { id, nickname, isBot };
}

function makeRoom(players: Player[], stories: Story[]): Room {
  return {
    code: 'ABCDEF',
    hostId: players[0]!.id,
    language: 'en',
    players,
    phase: 'reveal',
    currentRound: 7,
    stories,
    submittedThisRound: new Set(),
    roundDeadline: null,
    roundTimer: null,
    readyForRestart: new Set(),
    galleryShared: false,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  imageMock.__setImageResult(() =>
    Promise.resolve({ url: 'https://worker.example.com/i/fake.png', width: 1024, height: 1024 }),
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('generateBotStoryPictures', () => {
  it('does nothing when every player is human', async () => {
    const room = makeRoom(
      [player('s1', 'Alice', false), player('s2', 'Bob', false), player('s3', 'Carol', false)],
      [completeStory(), completeStory(), completeStory()],
    );
    await generateBotStoryPictures(room);
    expect(imageModule.generateImage).not.toHaveBeenCalled();
    for (const s of room.stories) expect(s.picture).toBeNull();
  });

  it('generates a picture for a single bot-owned story', async () => {
    const room = makeRoom(
      [player('s1', 'Alice', false), player('s2', 'Bob', true), player('s3', 'Carol', false)],
      [completeStory(), completeStory(), completeStory()],
    );
    await generateBotStoryPictures(room);
    expect(imageModule.generateImage).toHaveBeenCalledTimes(1);
    expect(room.stories[1]!.picture).toEqual({
      url: 'https://worker.example.com/i/fake.png',
      width: 1024,
      height: 1024,
    });
    expect(room.stories[0]!.picture).toBeNull();
    expect(room.stories[2]!.picture).toBeNull();
  });

  it('skips bot stories that already have a picture (write-once cache)', async () => {
    const existing = {
      url: 'https://worker.example.com/i/existing.png',
      width: 1024,
      height: 1024,
    };
    const room = makeRoom(
      [player('s1', 'Alice', false), player('s2', 'Bob', true)],
      [completeStory(), completeStory(existing)],
    );
    await generateBotStoryPictures(room);
    expect(imageModule.generateImage).not.toHaveBeenCalled();
    expect(room.stories[1]!.picture).toEqual(existing);
  });

  it('stops after the daily cap is hit and does not retry further bot stories', async () => {
    imageMock.__setImageResult(() => Promise.reject(new imageModule.ImageCapReachedError()));
    const room = makeRoom(
      [player('s1', 'Alice', true), player('s2', 'Bob', true), player('s3', 'Carol', true)],
      [completeStory(), completeStory(), completeStory()],
    );
    await generateBotStoryPictures(room);
    // First bot's attempt hits the cap and the loop bails without trying the
    // other two — asserted via the call count, not just the null pictures,
    // so a "capped but kept going anyway" regression would be caught.
    expect(imageModule.generateImage).toHaveBeenCalledTimes(1);
    for (const s of room.stories) expect(s.picture).toBeNull();
  });

  it('does not run when the room is no longer in reveal phase', async () => {
    const room = makeRoom(
      [player('s1', 'Alice', false), player('s2', 'Bob', true)],
      [completeStory(), completeStory()],
    );
    room.phase = 'playing';
    await generateBotStoryPictures(room);
    expect(imageModule.generateImage).not.toHaveBeenCalled();
    expect(room.stories[1]!.picture).toBeNull();
  });

  it('silently absorbs Worker failures and leaves picture null', async () => {
    imageMock.__setImageResult(() => Promise.reject(new Error('boom')));
    const room = makeRoom(
      [player('s1', 'Alice', false), player('s2', 'Bob', true)],
      [completeStory(), completeStory()],
    );
    await expect(generateBotStoryPictures(room)).resolves.toBeUndefined();
    expect(room.stories[1]!.picture).toBeNull();
  });

  it('is idempotent — running twice generates only one picture per bot story', async () => {
    const room = makeRoom(
      [player('s1', 'Alice', false), player('s2', 'Bob', true)],
      [completeStory(), completeStory()],
    );
    await generateBotStoryPictures(room);
    await generateBotStoryPictures(room);
    expect(imageModule.generateImage).toHaveBeenCalledTimes(1);
    expect(room.stories[1]!.picture).toEqual({
      url: 'https://worker.example.com/i/fake.png',
      width: 1024,
      height: 1024,
    });
  });

  it('generates pictures for multiple bot stories sequentially, not in parallel', async () => {
    const order: string[] = [];
    let call = 0;
    vi.mocked(imageModule.generateImage).mockImplementation(() => {
      const n = ++call;
      order.push(`start-${n}`);
      return new Promise((resolve) => {
        setTimeout(() => {
          order.push(`end-${n}`);
          resolve({ url: `https://worker.example.com/i/${n}.png`, width: 1024, height: 1024 });
        }, 5);
      });
    });
    const room = makeRoom(
      [player('s1', 'Alice', true), player('s2', 'Bob', true)],
      [completeStory(), completeStory()],
    );
    await generateBotStoryPictures(room);
    // If the loop fired both calls concurrently, "start-2" would land before
    // "end-1". Sequential awaiting means each call finishes before the next
    // starts — the property that keeps a multi-bot room fair against a human
    // racing the same shared daily cap.
    expect(order).toEqual(['start-1', 'end-1', 'start-2', 'end-2']);
    expect(room.stories[0]!.picture).not.toBeNull();
    expect(room.stories[1]!.picture).not.toBeNull();
  });
});
