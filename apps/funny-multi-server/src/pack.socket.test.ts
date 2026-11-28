// SPDX-License-Identifier: AGPL-3.0-only

// Step 117 (owner decision 3A) — the host's Christmas switch over real
// sockets: every player's lobby carries the room's pack, only the host may
// flip it, only in the lobby, and the game that starts plays what it says.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Socket } from 'socket.io-client';
import type { LobbyUpdatePayload, RoomCreateAck, RoundStartPayload } from '@funny/shared';
import { __resetRoomsForTest, getRoom } from './rooms.js';
import {
  collect,
  emitWithAck,
  once,
  startTestServer,
  type TestServer,
} from './testutils/socket.js';

let harness: TestServer | null = null;

beforeEach(() => vi.stubEnv('PACK_ROOMS', 'on'));
afterEach(async () => {
  await harness?.close();
  harness = null;
  __resetRoomsForTest();
  vi.unstubAllEnvs();
});

async function lobbyOf(
  language: 'en' | 'ar',
): Promise<{ roomCode: string; sockets: Socket[]; lobbies: LobbyUpdatePayload[][] }> {
  const h = await startTestServer();
  harness = h;
  const sockets = [await h.connect(), await h.connect(), await h.connect()];
  const lobbies = sockets.map((s) => collect<LobbyUpdatePayload>(s, 'lobby:update'));
  const { roomCode } = await emitWithAck<{ roomCode: string }>(sockets[0]!, 'room:create', {
    nickname: 'host',
    language,
  });
  for (let i = 1; i < 3; i++) {
    // Every player in the room so far sees the join, the newcomer included.
    const joined = sockets.slice(0, i + 1).map((s) => once<LobbyUpdatePayload>(s, 'lobby:update'));
    await emitWithAck(sockets[i]!, 'room:join', { roomCode, nickname: `guest${i}` });
    await Promise.all(joined);
  }
  return { roomCode, sockets, lobbies };
}

// A round trip on one socket: the server handles a client's events in order,
// so once this answers, every event the socket sent before it is handled.
function roundTrip(socket: Socket): Promise<unknown> {
  return new Promise((resolve) => socket.emit('stats:get', resolve));
}

describe('the Christmas switch (owner decision 3A)', () => {
  it('shows every player an en room’s pack, on', async () => {
    const { lobbies } = await lobbyOf('en');
    for (const seen of lobbies) {
      expect(seen.at(-1)?.pack).toEqual({ id: 'chr26', on: true, paid: false });
    }
  });

  it('tells the host in the create ack what the lobby then says (Step 133)', async () => {
    const h = await startTestServer();
    harness = h;
    const host = await h.connect();
    const lobby = once<LobbyUpdatePayload>(host, 'lobby:update');
    const en = await emitWithAck<RoomCreateAck>(host, 'room:create', {
      nickname: 'host',
      language: 'en',
    });
    expect(en.pack).toEqual({ id: 'chr26', on: true, paid: false });
    expect((await lobby).pack).toEqual(en.pack);

    const other = await h.connect();
    const ar = await emitWithAck<RoomCreateAck>(other, 'room:create', {
      nickname: 'host',
      language: 'ar',
    });
    expect(ar.pack).toBeNull();
  });

  it('lets the host switch it off, and the game plays the base pools', async () => {
    const { roomCode, sockets } = await lobbyOf('en');
    const updates = sockets.map((s) => once<LobbyUpdatePayload>(s, 'lobby:update'));
    sockets[0]!.emit('room:setPack', { on: false });
    for (const update of await Promise.all(updates)) {
      expect(update.pack).toEqual({ id: 'chr26', on: false, paid: false });
    }

    const start = once<RoundStartPayload>(sockets[1]!, 'round:start');
    sockets[0]!.emit('game:start');
    expect((await start).content).toEqual({ kind: 'base' });
    expect(getRoom(roomCode)!.stories.every((s) => s.content.kind === 'base')).toBe(true);
  });

  it('refuses a guest, and changes nothing', async () => {
    const { roomCode, sockets } = await lobbyOf('en');
    const error = once<{ code: string }>(sockets[1]!, 'error');
    sockets[1]!.emit('room:setPack', { on: false });
    expect((await error).code).toBe('NOT_HOST');
    expect(getRoom(roomCode)!.pack).toEqual({ id: 'chr26', on: true, paid: false });
  });

  it('refuses a change once the game has started', async () => {
    const { roomCode, sockets } = await lobbyOf('en');
    const started = once(sockets[0]!, 'round:start');
    sockets[0]!.emit('game:start');
    await started;
    const error = once<{ code: string }>(sockets[0]!, 'error');
    sockets[0]!.emit('room:setPack', { on: false });
    expect((await error).code).toBe('ROOM_LOCKED');
    expect(getRoom(roomCode)!.pack).toEqual({ id: 'chr26', on: true, paid: false });
  });

  it('ignores a payload that is not a boolean, and a room with no pack', async () => {
    const en = await lobbyOf('en');
    const enLobby = collect<LobbyUpdatePayload>(en.sockets[0]!, 'lobby:update');
    en.sockets[0]!.emit('room:setPack', { on: 'no' });
    en.sockets[0]!.emit('room:setPack', null);
    // A round trip after both, so the server has handled them.
    await roundTrip(en.sockets[0]!);
    expect(enLobby).toEqual([]);
    expect(getRoom(en.roomCode)!.pack).toEqual({ id: 'chr26', on: true, paid: false });
    await harness?.close();
    harness = null;

    const ar = await lobbyOf('ar');
    expect(getRoom(ar.roomCode)!.pack).toBeNull();
    const arLobby = collect<LobbyUpdatePayload>(ar.sockets[0]!, 'lobby:update');
    ar.sockets[0]!.emit('room:setPack', { on: true });
    await roundTrip(ar.sockets[0]!);
    expect(arLobby).toEqual([]);
    expect(getRoom(ar.roomCode)!.pack).toBeNull();
  });
});
