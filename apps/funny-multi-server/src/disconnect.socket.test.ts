// SPDX-License-Identifier: AGPL-3.0-only

// T-2.4 — disconnect rules over real Socket.IO connections (FM-CORE-3, spec §7).
//
// These need a real transport: the grace window is armed by Socket.IO's own
// `disconnect` event and disarmed by its connection-state recovery, neither of
// which exists when handlers are called directly. `disconnect.test.ts` covers
// the timing rules exactly; this covers what actually happens to a room.
//
// Every server here is built with a short `disconnectGraceMs` so a window can
// close inside a test. The window's *length* is not what these assert.

import { afterEach, describe, expect, it } from 'vitest';
import type { Socket } from 'socket.io-client';
import { POOLS, type SlotIndex } from '@funny/shared';
import { __resetRoomsForTest, getRoom } from './rooms.js';
import { emitWithAck, once, startTestServer, type TestServer } from './testutils/socket.js';

const GRACE_MS = 80;

let harness: TestServer | null = null;

afterEach(async () => {
  await harness?.close();
  harness = null;
  __resetRoomsForTest();
});

/** Lets in-flight broadcasts land before a test starts listening for the next. */
function settle(ms = GRACE_MS * 3): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function optionAt(slot: number, n: number): string {
  const pool = POOLS[slot as SlotIndex];
  return pool[n % pool.length]!.id;
}

/** A lobby of `count` players; sockets[0] is the host. */
async function lobby(
  count: number,
  opts: { graceMs?: number; reconnection?: boolean } = {},
): Promise<{ roomCode: string; sockets: Socket[] }> {
  const h = await startTestServer({ disconnectGraceMs: opts.graceMs ?? GRACE_MS });
  harness = h;

  const sockets: Socket[] = [];
  for (let i = 0; i < count; i++) {
    sockets.push(await h.connect({ reconnection: opts.reconnection ?? false }));
  }

  const { roomCode } = await emitWithAck<{ roomCode: string }>(sockets[0]!, 'room:create', {
    nickname: 'player0',
    language: 'en',
  });
  for (let i = 1; i < count; i++) {
    const ack = await emitWithAck<{ error?: unknown }>(sockets[i]!, 'room:join', {
      roomCode,
      nickname: `player${i}`,
    });
    expect(ack.error, `player ${i} failed to join`).toBeUndefined();
  }
  await settle(30);
  return { roomCode, sockets };
}

/** A lobby with the game started and round 0 under way. */
async function started(count: number): Promise<{ roomCode: string; sockets: Socket[] }> {
  const { roomCode, sockets } = await lobby(count);
  const starts = sockets.map((s) => once<{ roundNumber: number }>(s, 'round:start'));
  sockets[0]!.emit('game:start');
  for (const s of starts) expect((await s).roundNumber).toBe(0);
  return { roomCode, sockets };
}

describe('grace window (spec §7)', () => {
  it('keeps a dropped player’s slot until the window closes', async () => {
    // The point of the whole feature: a tunnel or a locked phone must not cost
    // you your seat. Removing on `disconnect` would be one line and wrong.
    const { roomCode, sockets } = await lobby(3, { graceMs: 400 });
    const remaining = once<{ players: { nickname: string }[] }>(sockets[1]!, 'lobby:update');

    sockets[2]!.disconnect();
    await settle(60);

    expect(getRoom(roomCode)!.players).toHaveLength(3);
    expect(harness!.server.disconnects.pending()).toBe(1);

    expect((await remaining).players.map((p) => p.nickname)).toEqual(['player0', 'player1']);
    expect(getRoom(roomCode)!.players).toHaveLength(2);
    expect(harness!.server.disconnects.pending()).toBe(0);
  });

  it('restores the slot when the socket returns inside the window', async () => {
    // Connection-state recovery: same socket id, same seat, pending removal
    // cancelled. Without the cancel the player would be dropped moments after
    // successfully reconnecting.
    const { roomCode, sockets } = await lobby(3, { graceMs: 3000, reconnection: true });
    const dropped = sockets[2]!;
    const originalId = dropped.id;

    const reconnected = once(dropped, 'connect');
    dropped.io.engine.close(); // a network drop, not an intentional leave
    await reconnected;

    expect(dropped.recovered, 'the client should report a recovered session').toBe(true);
    expect(dropped.id).toBe(originalId);
    expect(harness!.server.disconnects.pending()).toBe(0);
    expect(getRoom(roomCode)!.players.map((p) => p.nickname)).toEqual([
      'player0',
      'player1',
      'player2',
    ]);

    await settle(200);
    expect(getRoom(roomCode)!.players, 'the cancelled window must not fire later').toHaveLength(3);
  });
});

describe('lobby-phase departure', () => {
  it('promotes the next player when the host drops', async () => {
    const { roomCode, sockets } = await lobby(3);
    const update = once<{ players: unknown[]; hostId: string }>(sockets[1]!, 'lobby:update');

    sockets[0]!.disconnect();
    const payload = await update;

    expect(payload.hostId).toBe(sockets[1]!.id);
    expect(payload.players).toHaveLength(2);
    expect(getRoom(roomCode)!.hostId).toBe(sockets[1]!.id);
  });

  it('deletes the room once the last player’s window closes', async () => {
    const { roomCode, sockets } = await lobby(3);
    for (const s of sockets) s.disconnect();
    await settle();
    expect(getRoom(roomCode)).toBeUndefined();
  });

  it('sends no player:lost for a lobby departure', async () => {
    // player:lost is a mid-game notice (spec §12) — it tells the host that a
    // *bot is now playing someone's slot*. In the lobby the player is simply
    // gone from the roster, which lobby:update already says.
    const { sockets } = await lobby(3);
    let lost = false;
    sockets[0]!.on('player:lost', () => (lost = true));

    const update = once(sockets[0]!, 'lobby:update');
    sockets[2]!.disconnect();
    await update;
    await settle(40);

    expect(lost).toBe(false);
  });
});

describe('mid-game botification (FM-CORE-3)', () => {
  it('botifies the slot, auto-fills the round and advances', async () => {
    // The slot must stay: dropping it would renumber every remaining player and
    // scramble the rotation of the six answers already written.
    const { roomCode, sockets } = await started(3);

    sockets[0]!.emit('round:submit', { optionId: optionAt(0, 0) });
    sockets[2]!.emit('round:submit', { optionId: optionAt(0, 2) });
    await settle(30);
    expect(getRoom(roomCode)!.currentRound, 'the round waits on the third player').toBe(0);

    const nextRound = once<{ roundNumber: number }>(sockets[0]!, 'round:start');
    sockets[1]!.disconnect();
    expect((await nextRound).roundNumber).toBe(1);

    const room = getRoom(roomCode)!;
    expect(room.players).toHaveLength(3);
    expect(room.players[1]!.isBot).toBe(true);
    expect(room.players[1]!.nickname, 'a bot keeps the name it inherited').toBe('player1');
    // Round 0 is complete — the dropped player's slot was filled, not skipped.
    expect(room.stories.every((s) => s.answers[0] !== null)).toBe(true);
  });

  it('tells the host which player was lost', async () => {
    const { sockets } = await started(3);
    const lost = once<{ nickname: string }>(sockets[0]!, 'player:lost');
    sockets[1]!.disconnect();
    expect((await lost).nickname).toBe('player1');
  });

  it('sends player:lost to the promoted host when the host is the one lost', async () => {
    // hostId has already moved by the time the notice goes out, so it reaches
    // the player who now needs it rather than the socket that just vanished.
    const { roomCode, sockets } = await started(3);
    const lost = once<{ nickname: string }>(sockets[1]!, 'player:lost');

    sockets[0]!.disconnect();
    expect((await lost).nickname).toBe('player0');
    expect(getRoom(roomCode)!.hostId).toBe(sockets[1]!.id);
  });

  it('deletes an all-bot room rather than playing on alone', async () => {
    const { roomCode, sockets } = await started(3);
    for (const s of sockets) s.disconnect();
    await settle();
    expect(getRoom(roomCode)).toBeUndefined();
  });
});

describe('explicit leave', () => {
  it('takes effect immediately, without waiting out the window', async () => {
    const { roomCode, sockets } = await lobby(3, { graceMs: 5000 });
    const update = once<{ players: unknown[] }>(sockets[0]!, 'lobby:update');

    sockets[2]!.emit('room:leave');
    expect((await update).players).toHaveLength(2);
    expect(getRoom(roomCode)!.players).toHaveLength(2);
  });

  it('auto-fills the current round when a player quits mid-game', async () => {
    // Divergence from SRC, which botified on room:leave but never auto-filled:
    // the other players then waited out the full 60 s round timer for an answer
    // that could no longer arrive.
    const { roomCode, sockets } = await started(3);
    sockets[0]!.emit('round:submit', { optionId: optionAt(0, 0) });
    sockets[2]!.emit('round:submit', { optionId: optionAt(0, 2) });
    await settle(30);

    const nextRound = once<{ roundNumber: number }>(sockets[0]!, 'round:start');
    sockets[1]!.emit('room:leave');
    expect((await nextRound).roundNumber).toBe(1);
    expect(getRoom(roomCode)!.stories.every((s) => s.answers[0] !== null)).toBe(true);
  });

  it('leaves no pending window behind when the socket then disconnects', async () => {
    const { roomCode, sockets } = await lobby(3);
    sockets[2]!.emit('room:leave');
    await once(sockets[0]!, 'lobby:update');
    sockets[2]!.disconnect();
    await settle();

    // The window fires against a socket that is no longer in any room; it must
    // be a no-op rather than removing whoever now sits at that index.
    expect(getRoom(roomCode)!.players).toHaveLength(2);
  });
});
