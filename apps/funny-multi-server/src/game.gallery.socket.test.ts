// SPDX-License-Identifier: AGPL-3.0-only
//
// T-5.1 — gallery:share wiring and the self-heal-on-late-picture re-broadcast
// (spec §24), exercised over real Socket.IO connections. Mirrors the
// rationale in game.picture.socket.test.ts: calling handlePictureRequest or
// shareGallery in-process (game.gallery.test.ts, game.botPictures.test.ts)
// cannot see anything that only goes wrong on the wire — the wrong room
// receiving a broadcast, or a player who never gets one. `./image.js` is
// mocked so this never touches a real Cloudflare Worker.

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

const { __resetRoomsForTest } = await import('./rooms.js');
const { emitWithAck, once, startTestServer } = await import('./testutils/socket.js');

let harness: Awaited<ReturnType<typeof startTestServer>> | null = null;

afterEach(async () => {
  await harness?.close();
  harness = null;
  __resetRoomsForTest();
  vi.clearAllMocks();
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

describe('gallery:share — wired over real sockets', () => {
  it('broadcasts gallery:ready to every player in the room, host included', async () => {
    const { sockets } = await playToReveal();

    const readies = sockets.map((s) =>
      once<{ entries: { nickname: string }[] }>(s, 'gallery:ready'),
    );
    sockets[0]!.emit('gallery:share');

    const payloads = await Promise.all(readies);
    for (const payload of payloads) {
      expect(payload.entries.map((e) => e.nickname)).toEqual(['player0', 'player1', 'player2']);
    }
  });

  it('does not reach a second, uninvolved room', async () => {
    const first = await playToReveal();
    const bystander = harness!;
    const outsider = await bystander.connect();
    await emitWithAck(outsider, 'room:create', { nickname: 'outsider', language: 'en' });

    let outsiderSawGalleryReady = false;
    outsider.on('gallery:ready', () => (outsiderSawGalleryReady = true));

    const hostReady = once(first.sockets[0]!, 'gallery:ready');
    first.sockets[0]!.emit('gallery:share');
    await hostReady;

    expect(outsiderSawGalleryReady).toBe(false);
  });

  it('rejects a non-host with NOT_HOST and broadcasts nothing', async () => {
    const { sockets } = await playToReveal();

    let sawGalleryReady = false;
    sockets[0]!.on('gallery:ready', () => (sawGalleryReady = true));
    sockets[1]!.on('gallery:ready', () => (sawGalleryReady = true));

    const err = once<{ code: string }>(sockets[1]!, 'error');
    sockets[1]!.emit('gallery:share');
    expect((await err).code).toBe('NOT_HOST');
    expect(sawGalleryReady).toBe(false);
  });
});

describe('self-heal on a late picture (spec §24)', () => {
  it('re-broadcasts gallery:ready to the whole room once a picture lands after sharing', async () => {
    const { sockets } = await playToReveal();

    // Drain the share's own gallery:ready on every socket this test later
    // listens on — not just the sharer's. io.to(room.code).emit fans out to
    // each connection independently, so socket 0's own copy having arrived
    // does not mean socket 2's has too; a once() registered for the *next*
    // broadcast before socket 2's first copy lands would catch that stale
    // one instead.
    const initial = [
      once<{ entries: { picture: unknown }[] }>(sockets[0]!, 'gallery:ready'),
      once<{ entries: { picture: unknown }[] }>(sockets[2]!, 'gallery:ready'),
    ];
    sockets[0]!.emit('gallery:share');
    for (const before of await Promise.all(initial)) {
      expect(before.entries.every((e) => e.picture === null)).toBe(true);
    }

    // A late picture for player 1's own story should refresh everyone's view
    // of the gallery, not just the requester's.
    const refreshed = [
      once<{ entries: { nickname: string; picture: unknown }[] }>(sockets[0]!, 'gallery:ready'),
      once<{ entries: { nickname: string; picture: unknown }[] }>(sockets[2]!, 'gallery:ready'),
    ];
    sockets[1]!.emit('reveal:requestPicture');

    const [seenByHost, seenByOther] = await Promise.all(refreshed);
    for (const payload of [seenByHost, seenByOther]) {
      const entry = payload.entries.find((e) => e.nickname === 'player1')!;
      expect(entry.picture).toMatchObject({ url: 'https://worker.example.com/i/fake.png' });
    }
  });

  it('does not broadcast gallery:ready when a picture is requested before any share', async () => {
    const { sockets } = await playToReveal();

    let sawGalleryReady = false;
    for (const s of sockets) s.on('gallery:ready', () => (sawGalleryReady = true));

    const ready = once(sockets[0]!, 'reveal:pictureReady');
    sockets[0]!.emit('reveal:requestPicture');
    await ready;

    expect(sawGalleryReady).toBe(false);
  });

  it('does not re-broadcast for a retry served from the write-once cache', async () => {
    const { sockets } = await playToReveal();

    const firstReady = once(sockets[0]!, 'reveal:pictureReady');
    sockets[0]!.emit('reveal:requestPicture');
    await firstReady;

    sockets[0]!.emit('gallery:share');
    // Drain the share's own gallery:ready before watching for an unwanted one.
    await once(sockets[0]!, 'gallery:ready');

    let sawGalleryReady = false;
    sockets[0]!.on('gallery:ready', () => (sawGalleryReady = true));
    const retryReady = once(sockets[0]!, 'reveal:pictureReady');
    sockets[0]!.emit('reveal:retryPicture');
    await retryReady;

    expect(sawGalleryReady).toBe(false);
  });
});
