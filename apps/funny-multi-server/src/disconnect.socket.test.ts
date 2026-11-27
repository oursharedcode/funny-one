// SPDX-License-Identifier: AGPL-3.0-only

// T-2.4 — disconnect rules over real Socket.IO connections (FM-CORE-3, spec §7).
//
// These need a real transport: the grace window is armed by Socket.IO's own
// `disconnect` event and disarmed by its connection-state recovery, neither of
// which exists when handlers are called directly. `disconnect.test.ts` covers
// the timing rules exactly; this covers what actually happens to a room.
//
// Every server here is built with short windows so one can close inside a
// test; both phases get the same one unless a test names the lobby's. The
// windows' *lengths* are not what these assert.

import { afterEach, describe, expect, it } from 'vitest';
import type { Socket } from 'socket.io-client';
import { POOLS, seatBotNumber, type SlotIndex } from '@funny/shared';
import { __resetRoomsForTest, getRoom } from './rooms.js';
import {
  collect,
  emitWithAck,
  once,
  startTestServer,
  type TestServer,
} from './testutils/socket.js';

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

interface LobbyOptions {
  /** Both windows, unless `lobbyGraceMs` names the lobby's. */
  graceMs?: number;
  lobbyGraceMs?: number;
  recoveryMarkMs?: number;
  reconnection?: boolean;
}

/** A lobby of `count` players; sockets[0] is the host. */
async function lobby(
  count: number,
  opts: LobbyOptions = {},
): Promise<{ roomCode: string; sockets: Socket[] }> {
  const graceMs = opts.graceMs ?? GRACE_MS;
  const h = await startTestServer({
    disconnectGraceMs: graceMs,
    lobbyGraceMs: opts.lobbyGraceMs ?? graceMs,
    ...(opts.recoveryMarkMs === undefined ? {} : { recoveryMarkMs: opts.recoveryMarkMs }),
  });
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
async function started(
  count: number,
  opts: LobbyOptions = {},
): Promise<{ roomCode: string; sockets: Socket[] }> {
  const { roomCode, sockets } = await lobby(count, opts);
  const starts = sockets.map((s) => once<{ roundNumber: number }>(s, 'round:start'));
  sockets[0]!.emit('game:start');
  for (const s of starts) expect((await s).roundNumber).toBe(0);
  return { roomCode, sockets };
}

/** Polls until `check` holds: for what the server does after a client's own event. */
async function until(check: () => boolean, what: string): Promise<void> {
  const deadline = Date.now() + 2000;
  while (!check()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await settle(10);
  }
}

/**
 * A network drop the page does not retry: a phone whose owner is in a
 * messenger. The sockets here have reconnection off, so the page stays away
 * until `comeBack`. Resolves once the server has armed the window.
 */
async function goAway(socket: Socket): Promise<void> {
  const before = harness!.server.disconnects.pending();
  const gone = once(socket, 'disconnect');
  socket.io.engine.close();
  await gone;
  await until(() => harness!.server.disconnects.pending() > before, 'the window to arm');
}

/** The page returns: reconnects, recovering its old connection if the server lets it. */
async function comeBack(socket: Socket): Promise<void> {
  const back = once(socket, 'connect');
  socket.connect();
  await back;
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

  it('broadcasts stats:update when the grace window deletes the room (T-5.3)', async () => {
    // The all-bot deletion above goes through the same finalizePlayerRemoval
    // path room:leave uses; this checks the broadcast reaches a socket that
    // is still connected to see it, not just that the room is gone. A
    // fourth, uninvolved socket outlives every player's disconnect and is
    // the one that observes the broadcast.
    const { sockets } = await started(3);
    const observer = await harness!.connect();
    const stats = once<{ openRooms: number }>(observer, 'stats:update');
    for (const s of sockets) s.disconnect();
    expect((await stats).openRooms).toBe(0);
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

// Step 132 (B-29): a phone drops the game's connection while its owner is in
// a messenger sending the invite. A lobby therefore waits far longer than a
// game, and a page that comes back after its window must not recover into the
// seat it lost: it gets a fresh connection, which App.tsx sends Home.
describe('the lobby waits longer (Step 132)', () => {
  it('keeps a lone host’s room past the game’s window, and lets them back in', async () => {
    // Step 127's finding: the room closed with its only player before anyone
    // could open the invite.
    const { roomCode, sockets } = await lobby(1, { lobbyGraceMs: 5000 });
    const host = sockets[0]!;
    const hostId = host.id;

    await goAway(host);
    await settle(); // three game windows
    expect(getRoom(roomCode), 'the room waits for its host').toBeDefined();

    // A friend opens the invite meanwhile.
    const guest = await harness!.connect();
    const ack = await emitWithAck<{ error?: unknown }>(guest, 'room:join', {
      roomCode,
      nickname: 'friend',
    });
    expect(ack.error).toBeUndefined();

    const missed = once<{ players: { nickname: string }[] }>(host, 'lobby:update');
    await comeBack(host);
    expect(host.recovered, 'the host is back in their own seat').toBe(true);
    expect(host.id).toBe(hostId);
    expect(harness!.server.disconnects.pending()).toBe(0);
    expect((await missed).players.map((p) => p.nickname)).toEqual(['player0', 'friend']);

    const round = once<{ roundNumber: number }>(guest, 'round:start');
    host.emit('game:start');
    expect((await round).roundNumber).toBe(0);
  });

  it('keeps the game’s window short', async () => {
    // ACCEPTANCE B14: mid-game the others are waiting for that seat.
    const { roomCode, sockets } = await started(3, { lobbyGraceMs: 60_000 });
    const lost = once<{ nickname: string }>(sockets[0]!, 'player:lost');
    await goAway(sockets[1]!);
    expect((await lost).nickname).toBe('player1');
    expect(getRoom(roomCode)!.players[1]!.isBot).toBe(true);
  });

  it('gives a page back after the game’s window a fresh connection, not the bot’s seat', async () => {
    const { roomCode, sockets } = await started(3, { lobbyGraceMs: 60_000 });
    const away = sockets[1]!;
    const awayId = away.id;
    const notices = collect<{ nickname: string }>(sockets[0]!, 'player:lost');

    await goAway(away);
    await until(() => notices.length > 0, 'player:lost');
    await comeBack(away);

    expect(away.recovered, 'the seat is a bot’s now').toBe(false);
    expect(away.id).not.toBe(awayId);
    const room = getRoom(roomCode)!;
    expect(room.players[1]!.id).toBe(awayId);
    expect(room.players[1]!.isBot).toBe(true);
    await settle(60);
    expect(notices, 'the host hears of the loss once').toHaveLength(1);
  });

  it('gives a page back after the lobby’s window a fresh connection', async () => {
    const { roomCode, sockets } = await lobby(2, { lobbyGraceMs: GRACE_MS });
    const away = sockets[1]!;
    const awayId = away.id;
    const update = once<{ players: unknown[] }>(sockets[0]!, 'lobby:update');

    await goAway(away);
    expect((await update).players).toHaveLength(1);
    await comeBack(away);

    expect(away.recovered).toBe(false);
    expect(away.id).not.toBe(awayId);
    expect(getRoom(roomCode)!.players.map((p) => p.nickname)).toEqual(['player0']);
  });

  it('drops a player still away at Start, and a bot takes the seat', async () => {
    const { roomCode, sockets } = await lobby(3, { lobbyGraceMs: 60_000 });
    const [host, here, away] = sockets as [Socket, Socket, Socket];
    const awayId = away.id;
    await goAway(away);

    const round = once<{ roundNumber: number }>(here, 'round:start');
    host.emit('game:start');
    expect((await round).roundNumber).toBe(0);

    const room = getRoom(roomCode)!;
    expect(room.players.map((p) => p.nickname)).toEqual(['player0', 'player1', 'Bot 1']);
    expect(seatBotNumber(room.players[2]!.id)).toBe(1);
    expect(room.players.some((p) => p.id === awayId)).toBe(false);
    expect(harness!.server.disconnects.pending(), 'Start ended the window').toBe(0);

    // Their page, back later, is not let into the game.
    await comeBack(away);
    expect(away.recovered).toBe(false);
    expect(away.id).not.toBe(awayId);
  });

  it('sends every page the recovery mark', async () => {
    const { sockets } = await lobby(1, { recoveryMarkMs: 40 });
    await once(sockets[0]!, 'recovery:mark');
  });

  it('keeps a quiet page recoverable with the mark', async () => {
    // Socket.IO recovers a page only while the last message it received is in
    // the server's buffer, which keeps messages as long as it keeps a saved
    // state. A lobby can be quiet for longer than that before someone leaves
    // it. Emptying the buffer stands in for those minutes passing; a mark
    // received after that is what still lets the page back in.
    const { roomCode, sockets } = await lobby(2, { lobbyGraceMs: 5000, recoveryMarkMs: 40 });
    const away = sockets[1]!;
    const awayId = away.id;
    const adapter = harness!.server.io.of('/').adapter as unknown as {
      packets: { id: string }[];
    };
    adapter.packets.length = 0;
    // A mark already on its way when the buffer was emptied is gone from it,
    // and the page keeps that mark's offset as its last: wait for a mark the
    // server still holds. (Waiting for the first one flaked under load.)
    let offset = await once<string>(away, 'recovery:mark');
    while (!adapter.packets.some((packet) => packet.id === offset)) {
      offset = await once<string>(away, 'recovery:mark');
    }

    await goAway(away);
    await comeBack(away);
    expect(away.recovered).toBe(true);
    expect(away.id).toBe(awayId);
    expect(getRoom(roomCode)!.players).toHaveLength(2);
  });

  it('cannot recover a quiet page whose last message has gone (why the mark exists)', async () => {
    // The control for the test above: the same page, with no mark since.
    const { sockets } = await lobby(2, { lobbyGraceMs: 5000 });
    const away = sockets[1]!;
    const adapter = harness!.server.io.of('/').adapter as unknown as { packets: unknown[] };
    adapter.packets.length = 0;

    await goAway(away);
    await comeBack(away);
    expect(away.recovered).toBe(false);
  });
});
