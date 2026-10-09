// SPDX-License-Identifier: AGPL-3.0-only

// T-4.4 — handlePictureRequest's reveal:pictureError payload carries a `code`
// discriminator so the client can switch to the i18n'd "oven is full, new
// cartoons in ~N hours" caption on CAP_REACHED and keep the generic
// "Generation failed" UX otherwise (ported from SRC's item 4 of
// BUGS_AND_IMPROVEMENTS_02.md, adapted for PictureRef and ImageCapReachedError
// in place of SRC's base64 pictureUrl and boolean-checked cap).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POOLS, VISUAL_SLOTS, type OptionId, type SlotIndex } from '@funny/shared';

vi.mock('./image.js', () => {
  class ImageCapReachedError extends Error {
    constructor() {
      super('Daily image generation cap reached');
      this.name = 'ImageCapReachedError';
    }
  }
  // A factory, not a stored promise: `Promise.reject(...)` constructed ahead
  // of time is an unhandled rejection until something awaits it, and a test
  // that sets one up before the code under test runs leaves exactly that gap.
  // Calling the factory only when generateImage is actually invoked means the
  // rejection is created and awaited in the same tick.
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

import { handlePictureRequest } from './game.js';
import type { Player, Room, Story } from './types.js';
import * as imageModule from './image.js';

type ImageMockExtras = {
  __setImageResult: (fn: () => Promise<{ url: string; width: number; height: number }>) => void;
};
const imageMock = imageModule as unknown as typeof imageModule & ImageMockExtras;

// A story with every visual slot filled from real pool ids — buildPrompt
// (called for real, unmocked) needs a genuine option id per visual slot, and
// this is the fixture-equivalent of "seven rounds happened".
function completeStory(): Story {
  const answers: (OptionId | null)[] = new Array(7).fill(null);
  for (const slot of VISUAL_SLOTS) {
    answers[slot] = POOLS[slot as SlotIndex][0]!.id;
  }
  return { answers, picture: null };
}

function makeRoom(players: Player[], stories: Story[]): Room {
  return {
    code: 'ABCDEF',
    hostId: players[0]!.id,
    language: 'en',
    multiLanguage: false,
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

// Captures `(event, payload)` pairs emitted to specific socket ids via
// io.to(id).emit(...). handlePictureRequest only ever targets a socket id.
function makeIo() {
  const targeted: Array<{ to: string; event: string; payload: unknown }> = [];
  const io = {
    to: vi.fn((id: string) => ({
      emit: vi.fn((event: string, payload: unknown) => {
        targeted.push({ to: id, event, payload });
      }),
    })),
    emit: vi.fn(),
  };
  return { io: io as unknown as Parameters<typeof handlePictureRequest>[2], targeted };
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

describe('handlePictureRequest error payloads', () => {
  it('emits code "CAP_REACHED" when generateImage throws ImageCapReachedError', async () => {
    imageMock.__setImageResult(() => Promise.reject(new imageModule.ImageCapReachedError()));
    const room = makeRoom([{ id: 's1', nickname: 'Alice', isBot: false }], [completeStory()]);
    const { io, targeted } = makeIo();

    await handlePictureRequest(room, 's1', io);

    const errors = targeted.filter((e) => e.event === 'reveal:pictureError');
    expect(errors).toHaveLength(1);
    expect(errors[0]!.to).toBe('s1');
    expect(errors[0]!.payload).toMatchObject({ code: 'CAP_REACHED' });
    // Wire fallback `message` stays for any client that doesn't read `code`.
    expect(errors[0]!.payload).toHaveProperty('message');
  });

  it('emits code "GENERIC" when generateImage throws any other error', async () => {
    imageMock.__setImageResult(() => Promise.reject(new Error('boom')));
    const room = makeRoom([{ id: 's1', nickname: 'Alice', isBot: false }], [completeStory()]);
    const { io, targeted } = makeIo();

    await handlePictureRequest(room, 's1', io);

    const errors = targeted.filter((e) => e.event === 'reveal:pictureError');
    expect(errors).toHaveLength(1);
    expect(errors[0]!.payload).toMatchObject({ code: 'GENERIC' });
  });

  it('emits no error and includes the picture on success', async () => {
    const room = makeRoom([{ id: 's1', nickname: 'Alice', isBot: false }], [completeStory()]);
    const { io, targeted } = makeIo();

    await handlePictureRequest(room, 's1', io);

    const errors = targeted.filter((e) => e.event === 'reveal:pictureError');
    const readys = targeted.filter((e) => e.event === 'reveal:pictureReady');
    expect(errors).toHaveLength(0);
    expect(readys).toHaveLength(1);
    expect(readys[0]!.payload).toMatchObject({
      picture: { url: 'https://worker.example.com/i/fake.png', width: 1024, height: 1024 },
    });
  });

  it('does nothing when the room is not in reveal phase', async () => {
    const room = makeRoom([{ id: 's1', nickname: 'Alice', isBot: false }], [completeStory()]);
    room.phase = 'playing';
    const { io, targeted } = makeIo();

    await handlePictureRequest(room, 's1', io);

    expect(targeted).toHaveLength(0);
    expect(imageModule.generateImage).not.toHaveBeenCalled();
  });

  it('does nothing when the socket has no story in this room', async () => {
    const room = makeRoom([{ id: 's1', nickname: 'Alice', isBot: false }], [completeStory()]);
    const { io, targeted } = makeIo();

    await handlePictureRequest(room, 'unknown-socket', io);

    expect(targeted).toHaveLength(0);
    expect(imageModule.generateImage).not.toHaveBeenCalled();
  });

  it('serves a retry against the write-once cache without calling generateImage again', async () => {
    const story = completeStory();
    story.picture = { url: 'https://worker.example.com/i/already.png', width: 1024, height: 1024 };
    const room = makeRoom([{ id: 's1', nickname: 'Alice', isBot: false }], [story]);
    const { io, targeted } = makeIo();

    await handlePictureRequest(room, 's1', io);

    expect(imageModule.generateImage).not.toHaveBeenCalled();
    const readys = targeted.filter((e) => e.event === 'reveal:pictureReady');
    expect(readys).toHaveLength(1);
    expect(readys[0]!.payload).toMatchObject({
      picture: { url: 'https://worker.example.com/i/already.png' },
    });
  });
});
