// SPDX-License-Identifier: AGPL-3.0-only
//
// T-7.3 — FM-NFR-2's byte budget (FM-IMG-3 target: ~250 B per reveal, ~30 KB
// per game on the socket), pinned as a real assertion rather than a one-off
// DevTools observation. `./image.js` is mocked with a realistically-sized
// R2 URL (a real Worker route is `/i/<sha256 hex>.png`) so the byte counts
// aren't flattered by the short `fake.png` placeholder other suites use.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { POOLS, type OptionId, type SlotIndex } from '@funny/shared';
import type { Socket } from 'socket.io-client';

const REALISTIC_URL = 'https://funny37.example.workers.dev/i/' + 'a1b2c3d4e5f6'.repeat(5) + '.png';

vi.mock('./image.js', () => {
  class ImageCapReachedError extends Error {
    constructor() {
      super('Daily image generation cap reached');
      this.name = 'ImageCapReachedError';
    }
  }
  return {
    ImageCapReachedError,
    generateImage: vi.fn(() => Promise.resolve({ url: REALISTIC_URL, width: 1024, height: 1024 })),
  };
});

const { __resetRoomsForTest } = await import('./rooms.js');
const { MAX_PLAYERS } = await import('./rooms.js');
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

/** Fills a full 7-player room and plays every round through to reveal. */
async function playToRevealFullRoom(): Promise<{ sockets: Socket[] }> {
  const h = await startTestServer();
  harness = h;
  const sockets: Socket[] = [];
  for (let i = 0; i < MAX_PLAYERS; i++) sockets.push(await h.connect());

  const { roomCode } = await emitWithAck<{ roomCode: string }>(sockets[0]!, 'room:create', {
    nickname: 'player0',
    language: 'en',
  });
  for (let i = 1; i < MAX_PLAYERS; i++) {
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

  return { sockets };
}

/** Bytes a JSON-serializable payload actually occupies on the wire (UTF-8). */
function wireBytes(payload: unknown): number {
  return Buffer.byteLength(JSON.stringify(payload), 'utf8');
}

describe('FM-NFR-2 — reveal socket payloads carry URLs, not image bytes', () => {
  it('a single picture reference stays near the ~250 B target', async () => {
    const { sockets } = await playToRevealFullRoom();

    const ready = once<{ picture: { url: string; width: number; height: number } }>(
      sockets[0]!,
      'reveal:pictureReady',
    );
    sockets[0]!.emit('reveal:requestPicture');
    const { picture } = await ready;

    expect(picture.url).toBe(REALISTIC_URL);
    // Generous headroom over the ~250 B target: real R2 URLs and CDN hosts
    // vary, but this is still two-plus orders of magnitude under the ~1.35 MB
    // base64 payload FM-IMG-3 replaces, which is the property worth guarding.
    expect(wireBytes(picture)).toBeLessThan(400);
  });

  it('a full game (7 players) stays under the ~30 KB picture-traffic budget', async () => {
    const { sockets } = await playToRevealFullRoom();

    // Every player requests their own picture — the human path every real
    // game exercises once per reveal.
    let totalBytes = 0;
    for (const s of sockets) {
      const ready = once<{ picture: unknown }>(s, 'reveal:pictureReady');
      s.emit('reveal:requestPicture');
      const { picture } = await ready;
      totalBytes += wireBytes(picture);
    }

    // The host then shares the gallery: one broadcast, fanned out to all 7
    // sockets, each carrying all 7 stories' pictures (spec §24).
    const readies = sockets.map((s) =>
      once<{ entries: { picture: unknown }[] }>(s, 'gallery:ready'),
    );
    sockets[0]!.emit('gallery:share');
    const payloads = await Promise.all(readies);
    for (const payload of payloads) {
      for (const entry of payload.entries) totalBytes += wireBytes(entry.picture);
    }

    expect(totalBytes).toBeLessThan(30 * 1024);
  });
});
