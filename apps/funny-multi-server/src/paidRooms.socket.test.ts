// SPDX-License-Identifier: AGPL-3.0-only

// Step 122 (B-29) — the paid code over real sockets: a room made paid at its
// creation or by any player's room:unlock, every story of its games the
// pack's, the code checked again before each game, wrong codes limited per
// address, and each opening and each paid game a receipt record.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Socket } from 'socket.io-client';
import {
  optionsFor,
  type LobbyUpdatePayload,
  type RoomCreateAck,
  type RoomUnlockAck,
  type RoundStartPayload,
  type SlotIndex,
} from '@funny/shared';
import { __resetRoomsForTest, getRoom } from './rooms.js';
import { createPackCodes } from './codes.js';
import { openReceiptLog, type GameRecord, type RoomRecord } from './receipts.js';
import {
  collect,
  emitWithAck,
  once,
  startTestServer,
  type TestServer,
} from './testutils/socket.js';

const SECRET = 'a-test-secret-of-some-length';
let harness: TestServer | null = null;

beforeEach(() => vi.stubEnv('PACK_ROOMS', 'on'));
afterEach(async () => {
  await harness?.close();
  harness = null;
  __resetRoomsForTest();
  vi.unstubAllEnvs();
});

async function boot(packCodeSecret: string | null = SECRET): Promise<TestServer> {
  const h = await startTestServer({ packCodeSecret, receiptsFile: null });
  harness = h;
  return h;
}

/** A room of three: the host created it, with `code` if given; two guests joined. */
async function roomOf(
  h: TestServer,
  code?: string,
  language: 'en' | 'ar' = 'en',
): Promise<{
  ack: RoomCreateAck;
  roomCode: string;
  sockets: Socket[];
  lobbies: LobbyUpdatePayload[][];
}> {
  const sockets = [await h.connect(), await h.connect(), await h.connect()];
  const lobbies = sockets.map((s) => collect<LobbyUpdatePayload>(s, 'lobby:update'));
  // The server answers room:create before it sends the lobby, so the host's
  // first update can land after the ack: wait for it here, or a later `once`
  // takes it for the next event's (a flake seen under load, Step 124).
  const created = once<LobbyUpdatePayload>(sockets[0]!, 'lobby:update');
  const ack = await emitWithAck<RoomCreateAck>(sockets[0]!, 'room:create', {
    nickname: 'host',
    language,
    ...(code === undefined ? {} : { code }),
  });
  await created;
  for (let i = 1; i < 3; i++) {
    const joined = sockets.slice(0, i + 1).map((s) => once<LobbyUpdatePayload>(s, 'lobby:update'));
    await emitWithAck(sockets[i]!, 'room:join', { roomCode: ack.roomCode, nickname: `guest${i}` });
    await Promise.all(joined);
  }
  return { ack, roomCode: ack.roomCode, sockets, lobbies };
}

function unlock(socket: Socket, code: unknown): Promise<RoomUnlockAck> {
  return emitWithAck<RoomUnlockAck>(socket, 'room:unlock', { code });
}

// A round trip on one socket: the server handles a client's events in order,
// so once this answers, every event the socket sent before it is handled.
function roundTrip(socket: Socket): Promise<unknown> {
  return new Promise((resolve) => socket.emit('stats:get', resolve));
}

/** Every client answers each round the moment it opens, from its story's options. */
function autoPlay(sockets: Socket[]): () => void {
  const handlers = sockets.map((socket, player) => {
    const handler = (payload: RoundStartPayload): void => {
      const options = optionsFor(payload.roundNumber as SlotIndex, payload.content);
      socket.emit('round:submit', { optionId: options[player % options.length]!.id });
    };
    socket.on('round:start', handler);
    return handler;
  });
  return () => sockets.forEach((s, i) => s.off('round:start', handlers[i]!));
}

function records<T extends 'room' | 'game'>(
  h: TestServer,
  type: T,
): (T extends 'room' ? RoomRecord : GameRecord)[] {
  return h.server.receipts.records().filter((r) => r.type === type) as never;
}

const PAID = { id: 'chr26', on: true, paid: true };
const FREE = { id: 'chr26', on: true, paid: false };

describe('a code at the room’s creation', () => {
  it('makes the room paid, tells every player, and keeps the code to the server', async () => {
    const h = await boot();
    const code = h.server.codes.mint('chr26');
    const { ack, roomCode, lobbies } = await roomOf(h, code.toLowerCase());
    expect(ack.codeError).toBeUndefined();
    for (const seen of lobbies) expect(seen.at(-1)?.pack).toEqual(PAID);
    expect(getRoom(roomCode)!.packCode).toBe(code);
    expect(JSON.stringify(lobbies)).not.toContain(code);

    const [room] = records(h, 'room');
    expect(records(h, 'room')).toHaveLength(1);
    expect(room).toMatchObject({
      code,
      how: 'create',
      room: roomCode,
      lang: 'en',
      players: 1,
      country: 'ZZ',
    });
    expect(typeof room!.browser).toBe('string');
  });

  it('plays every story of the game from the pack', async () => {
    const h = await boot();
    const { roomCode, sockets } = await roomOf(h, h.server.codes.mint('chr26'));
    const starts = sockets.map((s) => once<RoundStartPayload>(s, 'round:start'));
    sockets[0]!.emit('game:start');
    for (const start of await Promise.all(starts)) {
      expect(start.content).toEqual({ kind: 'paid', pack: 'chr26' });
    }
    expect(getRoom(roomCode)!.stories.map((s) => s.content.kind)).toEqual(['paid', 'paid', 'paid']);
  });

  it('still makes a room, a free one, when the code is refused, and says why', async () => {
    const h = await boot();
    const code = h.server.codes.mint('chr26');
    const wrong = code.slice(0, -1) + (code.endsWith('Z') ? 'Y' : 'Z');
    const { ack, roomCode, lobbies } = await roomOf(h, wrong);
    expect(ack.codeError?.code).toBe('CODE_INVALID');
    expect(lobbies[0]!.at(-1)?.pack).toEqual(FREE);
    expect(getRoom(roomCode)!.packCode).toBeNull();
    expect(records(h, 'room')).toEqual([]);
  });

  it('refuses a blocked and a waiting code, each with its reason', async () => {
    const h = await boot();
    const blocked = h.server.codes.mint('chr26');
    h.server.codes.block(blocked, 'leaked');
    const waiting = h.server.codes.issue({
      pack: 'chr26',
      rail: 'payid',
      ref: 'r',
      amount: 'A$2.60',
      delivered: 'pay page',
      policy: '2026-11',
      pending: true,
    });
    expect((await roomOf(h, blocked)).ack.codeError?.code).toBe('CODE_BLOCKED');
    expect((await roomOf(h, waiting)).ack.codeError?.code).toBe('CODE_PENDING');
    h.server.codes.claim(waiting);
    expect((await roomOf(h, waiting)).ack.codeError).toBeUndefined();
  });

  it('ignores an empty code, and refuses every code on a server without a secret', async () => {
    const h = await boot(null);
    expect((await roomOf(h, '  ')).ack.codeError).toBeUndefined();
    const code = createPackCodes({ secret: SECRET, log: openReceiptLog({ file: null }) }).mint(
      'chr26',
    );
    const { ack, lobbies } = await roomOf(h, code);
    expect(ack.codeError?.code).toBe('CODE_INVALID');
    expect(lobbies[0]!.at(-1)?.pack).toEqual(FREE);
  });

  it('refuses the pack where the room cannot play it', async () => {
    const h = await boot();
    const code = h.server.codes.mint('chr26');
    const ar = await roomOf(h, code, 'ar');
    expect(ar.ack.codeError?.code).toBe('PACK_UNAVAILABLE');
    expect(getRoom(ar.roomCode)!.pack).toBeNull();

    vi.stubEnv('PACK_ROOMS', 'off');
    const off = await roomOf(h, code);
    expect(off.ack.codeError?.code).toBe('PACK_UNAVAILABLE');
    expect(records(h, 'room')).toEqual([]);
  });
});

describe('room:unlock (B-29 #4)', () => {
  it('lets any player make the room paid, and tells every player', async () => {
    const h = await boot();
    const { roomCode, sockets, lobbies } = await roomOf(h);
    const code = h.server.codes.mint('chr26');
    const updates = sockets.map((s) => once<LobbyUpdatePayload>(s, 'lobby:update'));
    expect(await unlock(sockets[2]!, code)).toEqual({ ok: true });
    for (const update of await Promise.all(updates)) expect(update.pack).toEqual(PAID);
    expect(getRoom(roomCode)!.packCode).toBe(code);
    expect(records(h, 'room')).toEqual([
      expect.objectContaining({ code, how: 'unlock', room: roomCode, players: 3 }),
    ]);
    expect(JSON.stringify(lobbies)).not.toContain(code);
  });

  it('keeps the first code the room’s', async () => {
    const h = await boot();
    const first = h.server.codes.mint('chr26');
    const { roomCode, sockets } = await roomOf(h, first);
    expect(await unlock(sockets[1]!, h.server.codes.mint('chr26'))).toEqual({ ok: true });
    expect(getRoom(roomCode)!.packCode).toBe(first);
    expect(records(h, 'room')).toHaveLength(1);
  });

  it('opens the pack from the next game when the game is under way', async () => {
    const h = await boot();
    const { roomCode, sockets } = await roomOf(h);
    const started = once(sockets[0]!, 'round:start');
    sockets[0]!.emit('game:start');
    await started;
    expect(await unlock(sockets[1]!, h.server.codes.mint('chr26'))).toEqual({ ok: true });
    expect(getRoom(roomCode)!.stories.some((s) => s.content.kind === 'paid')).toBe(false);
    expect(getRoom(roomCode)!.paidGame).toBeNull();
  });

  it('answers a refused code with its reason, and a socket in no room', async () => {
    const h = await boot();
    const { sockets } = await roomOf(h, undefined, 'ar');
    expect(await unlock(sockets[0]!, h.server.codes.mint('chr26'))).toEqual({
      error: expect.objectContaining({ code: 'PACK_UNAVAILABLE' }),
    });
    expect(await unlock(sockets[0]!, 'nonsense')).toEqual({
      error: expect.objectContaining({ code: 'CODE_INVALID' }),
    });
    const loner = await h.connect();
    expect(await unlock(loner, h.server.codes.mint('chr26'))).toEqual({
      error: expect.objectContaining({ code: 'ROOM_NOT_FOUND' }),
    });
  });
});

describe('wrong codes', () => {
  it('are limited to 10 an hour from one address, and only wrong ones count', async () => {
    const h = await boot();
    const blocked = h.server.codes.mint('chr26');
    h.server.codes.block(blocked, 'refund');
    const { sockets } = await roomOf(h);
    // A blocked code is a real code: refused, but not a guess.
    for (let i = 0; i < 12; i++) {
      expect(await unlock(sockets[0]!, blocked)).toEqual({
        error: expect.objectContaining({ code: 'CODE_BLOCKED' }),
      });
    }
    for (let i = 0; i < 10; i++) {
      expect(await unlock(sockets[1]!, `XMAS26-0000-00${String(i).padStart(2, '0')}`)).toEqual({
        error: expect.objectContaining({ code: 'CODE_INVALID' }),
      });
    }
    // The address is spent, whichever player asks and whatever the code.
    expect(await unlock(sockets[2]!, h.server.codes.mint('chr26'))).toEqual({
      error: expect.objectContaining({ code: 'RATE_LIMITED' }),
    });
  });
});

describe('a paid room’s games', () => {
  it('checks the code again before a game, and plays the free part once it is blocked', async () => {
    const h = await boot();
    const code = h.server.codes.mint('chr26');
    const { roomCode, sockets } = await roomOf(h, code);
    h.server.codes.block(code, 'reversed');

    const update = once<LobbyUpdatePayload>(sockets[1]!, 'lobby:update');
    const start = once<RoundStartPayload>(sockets[1]!, 'round:start');
    sockets[0]!.emit('game:start');
    expect((await update).pack).toEqual(FREE);
    expect((await start).content.kind).not.toBe('paid');
    expect(getRoom(roomCode)!.packCode).toBeNull();
    expect(getRoom(roomCode)!.paidGame).toBeNull();
  });

  // Owner decision 3A: the host's switch plays a game without the pack, in a
  // paid room as in a free one, and the code stays the room's meanwhile.
  it('plays a game without the pack once the host switches it off, and keeps the code', async () => {
    const h = await boot();
    const code = h.server.codes.mint('chr26');
    const { roomCode, sockets } = await roomOf(h, code);
    const off = once<LobbyUpdatePayload>(sockets[1]!, 'lobby:update');
    sockets[0]!.emit('room:setPack', { on: false });
    expect((await off).pack).toEqual({ ...PAID, on: false });

    const start = once<RoundStartPayload>(sockets[1]!, 'round:start');
    sockets[0]!.emit('game:start');
    expect((await start).content).toEqual({ kind: 'base' });
    expect(getRoom(roomCode)!.stories.map((s) => s.content.kind)).toEqual(['base', 'base', 'base']);
    expect(getRoom(roomCode)!.packCode).toBe(code);
    expect(getRoom(roomCode)!.paidGame).toBeNull();
  });

  it('plays the pack again once the host switches it back on', async () => {
    const h = await boot();
    const { sockets } = await roomOf(h, h.server.codes.mint('chr26'));
    const off = once<LobbyUpdatePayload>(sockets[1]!, 'lobby:update');
    sockets[0]!.emit('room:setPack', { on: false });
    await off;
    const on = once<LobbyUpdatePayload>(sockets[1]!, 'lobby:update');
    sockets[0]!.emit('room:setPack', { on: true });
    expect((await on).pack).toEqual(PAID);

    const start = once<RoundStartPayload>(sockets[1]!, 'round:start');
    sockets[0]!.emit('game:start');
    expect((await start).content).toEqual({ kind: 'paid', pack: 'chr26' });
  });

  it('carries the code into one more game, and writes each game’s record', async () => {
    const h = await boot();
    const code = h.server.codes.mint('chr26');
    const { roomCode, sockets } = await roomOf(h, code);

    const reveals = sockets.map((s) => once(s, 'reveal:start'));
    const stop = autoPlay(sockets);
    sockets[0]!.emit('game:start');
    await Promise.all(reveals);
    stop();

    sockets[1]!.emit('story:exported', { kind: 'download' });
    sockets[1]!.emit('story:exported', { kind: 'download' });
    sockets[2]!.emit('story:exported', { kind: 'share' });
    sockets[2]!.emit('story:exported', { kind: 'print' });
    await Promise.all([roundTrip(sockets[1]!), roundTrip(sockets[2]!)]);
    expect(records(h, 'game')).toEqual([]);

    const next = once<RoundStartPayload>(sockets[1]!, 'round:start');
    sockets[0]!.emit('game:restart');
    expect((await next).content).toEqual({ kind: 'paid', pack: 'chr26' });
    expect(records(h, 'game')).toEqual([
      expect.objectContaining({
        code,
        room: roomCode,
        players: 3,
        rounds: 7,
        picks: 21,
        cartoons: 0,
        downloads: 2,
        shares: 1,
      }),
    ]);
    expect(getRoom(roomCode)!.paidGame).toMatchObject({ picks: 0, downloads: 0, shares: 0 });
  });

  it('writes the record of a game the host ends, and counts nothing outside the reveal', async () => {
    const h = await boot();
    const code = h.server.codes.mint('chr26');
    const { roomCode, sockets } = await roomOf(h, code);
    const started = once(sockets[0]!, 'round:start');
    sockets[0]!.emit('game:start');
    await started;
    sockets[1]!.emit('story:exported', { kind: 'download' });
    await roundTrip(sockets[1]!);

    const over = once(sockets[1]!, 'game:over');
    sockets[0]!.emit('game:end');
    await over;
    expect(records(h, 'game')).toEqual([
      expect.objectContaining({ code, room: roomCode, rounds: 1, picks: 0, downloads: 0 }),
    ]);
  });

  it('writes the record of a game the server’s shutdown cuts short', async () => {
    const h = await boot();
    const code = h.server.codes.mint('chr26');
    const { sockets } = await roomOf(h, code);
    const started = once(sockets[0]!, 'round:start');
    sockets[0]!.emit('game:start');
    await started;
    harness = null;
    await h.close();
    expect(records(h, 'game')).toEqual([expect.objectContaining({ code, rounds: 1 })]);
  });

  it('writes no game record for a free room', async () => {
    const h = await boot();
    const { sockets } = await roomOf(h);
    const started = once(sockets[0]!, 'round:start');
    sockets[0]!.emit('game:start');
    await started;
    const over = once(sockets[1]!, 'game:over');
    sockets[0]!.emit('game:end');
    await over;
    expect(h.server.receipts.records()).toEqual([]);
  });
});
