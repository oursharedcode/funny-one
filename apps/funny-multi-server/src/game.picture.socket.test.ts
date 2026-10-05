// SPDX-License-Identifier: AGPL-3.0-only

// T-4.4 — reveal:requestPicture / reveal:retryPicture wiring, and the
// bot-at-reveal-time auto-generation path, exercised over a real Socket.IO
// connection rather than by calling the handlers directly. Mirrors Gate 2's
// rationale (game.socket.test.ts): calling a function in-process cannot see
// anything that only goes wrong on the wire — a handler registered under the
// wrong event name, or an emit that reaches the wrong socket. `./image.js` is
// mocked so this never touches a real Cloudflare Worker; Gate 4 is where a
// real one is required.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { POOLS, type OptionId, type SlotIndex } from '@funny/shared';
import type { Socket } from 'socket.io-client';

vi.mock('./image.js', () => {
  class ImageCapReachedError extends Error {
    constructor() {
      super('Daily image generation cap reached');
      this.name = 'ImageCapReachedError';
    }
  }
  // A factory, not a stored promise: see game.pictureError.test.ts for why —
  // a pre-built rejection is an unhandled rejection until awaited, and here
  // the gap is wide open, since a real socket round-trip runs between test
  // setup and the moment the server actually calls generateImage.
  let produce: () => Promise<{ url: string; width: number; height: number }> = () =>
    Promise.resolve({
      url: 'https://worker.example.com/i/fake.png',
      width: 1024,
      height: 1024,
    });
  return {
    ImageCapReachedError,
    generateImage: vi.fn(() => produce()),
    // What stats.ts reads: this file runs a real server, so a stats read can
    // land on the mock (seen under load, Step 58).
    imagesGeneratedToday: () => 0,
    liveGeneration: () => false,
    maxImagesPerDay: () => 25,
    __setImageResult: (fn: typeof produce) => {
      produce = fn;
    },
  };
});

const { __resetRoomsForTest, getRoom } = await import('./rooms.js');
const { emitWithAck, once, startTestServer } = await import('./testutils/socket.js');
const imageModule = await import('./image.js');

type ImageMockExtras = {
  __setImageResult: (fn: () => Promise<{ url: string; width: number; height: number }>) => void;
};
const imageMock = imageModule as unknown as typeof imageModule & ImageMockExtras;

let harness: Awaited<ReturnType<typeof startTestServer>> | null = null;

afterEach(async () => {
  await harness?.close();
  harness = null;
  __resetRoomsForTest();
  vi.clearAllMocks();
  imageMock.__setImageResult(() =>
    Promise.resolve({ url: 'https://worker.example.com/i/fake.png', width: 1024, height: 1024 }),
  );
});

function optionAt(slot: number, n: number): OptionId {
  const pool = POOLS[slot as SlotIndex];
  return pool[n % pool.length]!.id;
}

/** Plays through every round with 3 players and lands everyone in reveal. */
async function playToReveal(): Promise<{ roomCode: string; sockets: Socket[] }> {
  const h = await startTestServer();
  harness = h;
  const sockets = [await h.connect(), await h.connect(), await h.connect()];

  const { roomCode } = await emitWithAck<{ roomCode: string }>(sockets[0]!, 'room:create', {
    nickname: 'player0',
    language: 'en',
  });
  for (let i = 1; i < 3; i++) {
    await emitWithAck(sockets[i]!, 'room:join', { roomCode, nickname: `player${i}` });
  }

  const revealPromises = sockets.map((s) => once(s, 'reveal:start'));
  sockets.forEach((s, player) => {
    s.on('round:start', (data: { roundNumber: number }) => {
      s.emit('round:submit', { optionId: optionAt(data.roundNumber, player) });
    });
  });
  sockets[0]!.emit('game:start');
  await Promise.all(revealPromises);

  return { roomCode, sockets };
}

describe('reveal:requestPicture / reveal:retryPicture — wired over real sockets', () => {
  it('requests, generates and delivers a picture to the requesting socket only', async () => {
    const { sockets } = await playToReveal();

    const ready = once<{ picture: { url: string } }>(sockets[0]!, 'reveal:pictureReady');
    let othersSawReady = false;
    sockets[1]!.on('reveal:pictureReady', () => (othersSawReady = true));
    sockets[2]!.on('reveal:pictureReady', () => (othersSawReady = true));

    sockets[0]!.emit('reveal:requestPicture');

    const payload = await ready;
    expect(payload.picture.url).toBe('https://worker.example.com/i/fake.png');
    expect(othersSawReady, 'only the requester should receive their own picture').toBe(false);
  });

  it('retries against the same handler and re-delivers from the write-once cache', async () => {
    const { sockets } = await playToReveal();

    const firstReady = once<{ picture: { url: string } }>(sockets[0]!, 'reveal:pictureReady');
    sockets[0]!.emit('reveal:requestPicture');
    const first = await firstReady;

    const retryReady = once<{ picture: { url: string } }>(sockets[0]!, 'reveal:pictureReady');
    sockets[0]!.emit('reveal:retryPicture');
    const second = await retryReady;

    expect(second.picture.url).toBe(first.picture.url);
    expect(imageModule.generateImage).toHaveBeenCalledTimes(1); // the retry served from cache
  });

  it('emits reveal:pictureError with code CAP_REACHED when the daily cap is hit', async () => {
    imageMock.__setImageResult(() => Promise.reject(new imageModule.ImageCapReachedError()));
    const { sockets } = await playToReveal();

    const error = once<{ code: string }>(sockets[0]!, 'reveal:pictureError');
    sockets[0]!.emit('reveal:requestPicture');
    expect((await error).code).toBe('CAP_REACHED');
  });
});

describe('bot-owned stories generate automatically on entering reveal', () => {
  it('generates a picture for a player who botified mid-game, with no client request', async () => {
    // Short grace window so the mid-game disconnect resolves inside the test
    // rather than the production 65 s. See disconnect.socket.test.ts for the
    // precedent — this is the same technique.
    const h = await startTestServer({ disconnectGraceMs: 30 });
    harness = h;
    const sockets = [await h.connect(), await h.connect(), await h.connect()];

    const { roomCode } = await emitWithAck<{ roomCode: string }>(sockets[0]!, 'room:create', {
      nickname: 'player0',
      language: 'en',
    });
    for (let i = 1; i < 3; i++) {
      await emitWithAck(sockets[i]!, 'room:join', { roomCode, nickname: `player${i}` });
    }

    const firstRound = once<{ roundNumber: number }>(sockets[0]!, 'round:start');
    sockets[0]!.emit('game:start');
    await firstRound;

    // Player 2 drops without answering and never returns — the grace window
    // elapses and they botify (spec §7), auto-filling every remaining round.
    sockets[2]!.disconnect();
    await new Promise((r) => setTimeout(r, 60));

    // Players 0 and 1 finish the remaining rounds; player 2's slot is
    // auto-filled by the bot path already covered in game.test.ts.
    const revealPromises = [once(sockets[0]!, 'reveal:start'), once(sockets[1]!, 'reveal:start')];
    [sockets[0]!, sockets[1]!].forEach((s, player) => {
      s.on('round:start', (data: { roundNumber: number }) => {
        s.emit('round:submit', { optionId: optionAt(data.roundNumber, player) });
      });
    });
    // Round 0 is already open; answer it directly since the listener above
    // only attaches for rounds still to come.
    sockets[0]!.emit('round:submit', { optionId: optionAt(0, 0) });
    sockets[1]!.emit('round:submit', { optionId: optionAt(0, 1) });
    await Promise.all(revealPromises);

    // The bot's story got a picture with no reveal:requestPicture ever sent
    // for it — enterRevealPhase's generateBotStoryPictures call is what did
    // this.
    expect(imageModule.generateImage).toHaveBeenCalledTimes(1);
    const room = getRoom(roomCode)!;
    const botIndex = room.players.findIndex((p) => p.isBot);
    expect(botIndex).toBeGreaterThanOrEqual(0);
    expect(room.stories[botIndex]!.picture).toEqual({
      url: 'https://worker.example.com/i/fake.png',
      width: 1024,
      height: 1024,
    });
  });
});
