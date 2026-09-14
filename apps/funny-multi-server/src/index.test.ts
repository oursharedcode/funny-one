// SPDX-License-Identifier: AGPL-3.0-only

// T-2.1 bootstrap smoke tests + T-2.2 lobby wiring, exercised over a real
// Socket.IO connection rather than by calling the handlers directly — the
// wiring (ack vs. `error` event, room joining, broadcast fan-out) is precisely
// what a direct call would not cover.
//
// This file also exists so the workspace is not silently skipped by the root
// `npm run test -ws --if-present`, which treats a missing `test` script as a
// pass — a bootstrap with no tests would look green while proving nothing.

import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { io as ioClient, type Socket } from 'socket.io-client';
import { buildServer, type BuildServerOptions, type BuiltServer } from './index.js';
import { ENV_PATH } from './env.js';
import { __resetRoomsForTest } from './rooms.js';
import { emitWithAck, once, startTestServer, type TestServer } from './testutils/socket.js';

// Two shapes of test here: HTTP checks that only need a built (unlistened)
// Fastify via `inject`, and socket checks that need a real listener. The
// shared harness in testutils/socket.ts covers the latter and is also used by
// game.socket.test.ts.
let built: BuiltServer | null = null;
let harness: TestServer | null = null;

afterEach(async () => {
  await harness?.close();
  harness = null;
  if (built) {
    await built.io.close();
    await built.fastify.close();
    built = null;
  }
  __resetRoomsForTest();
});

async function boot(): Promise<BuiltServer> {
  const server = await buildServer({ logger: false });
  built = server;
  return server;
}

async function listen(options: BuildServerOptions = {}): Promise<TestServer> {
  const h = await startTestServer(options);
  harness = h;
  return h;
}

function connect(h: TestServer): Promise<Socket> {
  return h.connect();
}

// ---------------------------------------------------------------------------
// T-2.1 — transport shell
// ---------------------------------------------------------------------------

describe('env', () => {
  it('resolves .env at the workspace root, not inside apps/', () => {
    // The loadEnvFile catch in env.ts is silent, so a wrong depth would show
    // up only as mysteriously unset config. Assert the path instead.
    //
    // Identify the root by the workspace manifest that is actually there,
    // never by directory name: this repo's folder is `funnyone` locally but
    // `funny-one` in CI (GitHub checks out under the repo name), and an
    // endsWith() on the local name passes for the wrong reason on one machine
    // and fails on the other. SRC's depth lands on apps/, which has no
    // package.json, so this still catches the regression it is here for.
    const root = dirname(ENV_PATH);
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      name?: string;
      workspaces?: string[];
    };
    expect(manifest.name).toBe('funny-family');
    expect(manifest.workspaces).toContain('apps/*');
    expect(basename(ENV_PATH)).toBe('.env');
    expect(ENV_PATH.replace(/\\/g, '/')).not.toContain('/apps/');
  });
});

describe('http', () => {
  it('GET /health returns ok', async () => {
    const server = await boot();
    const res = await server.fastify.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('allows the dev client origin through CORS', async () => {
    const server = await boot();
    const res = await server.fastify.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'http://localhost:5173' },
    });
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('serves no client bundle outside production', async () => {
    // Static serving is registered only when NODE_ENV=production (dev uses
    // Vite), so an unmatched route must 404 rather than fall back to
    // index.html — which does not exist until T-3.1 anyway.
    const server = await boot();
    const res = await server.fastify.inject({ method: 'GET', url: '/definitely-not-a-route' });
    expect(res.statusCode).toBe(404);
  });
});

describe('socket.io', () => {
  it('accepts a websocket connection', async () => {
    const h = await listen();
    const socket = await connect(h);
    expect(socket.id).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// T-8.1 — BASE_PATH mount (requirements D-5)
// ---------------------------------------------------------------------------
//
// Production sits behind Caddy at /funny37-game/, so every path the process
// answers on must move with the base — and only there. The negative cases
// matter as much as the positive ones: a server that still answered at the
// root would mask a client built with the wrong base until the first real
// deploy, where the shell would load and the socket never connect.

describe('base path', () => {
  const BASE = '/funny37-game/';

  it('serves /health under the base and nowhere else', async () => {
    const server = await buildServer({ logger: false, basePath: BASE });
    built = server;
    const under = await server.fastify.inject({ method: 'GET', url: `${BASE}health` });
    expect(under.statusCode).toBe(200);
    expect(under.json()).toEqual({ ok: true });
    const root = await server.fastify.inject({ method: 'GET', url: '/health' });
    expect(root.statusCode).toBe(404);
  });

  it('accepts every spelling of the base the deploy config might pass', async () => {
    // The env var is typed by hand in .env / a build arg; the normaliser is
    // what keeps "funny37-game" and "/funny37-game/" from being two deploys.
    const server = await buildServer({ logger: false, basePath: 'funny37-game' });
    built = server;
    const res = await server.fastify.inject({ method: 'GET', url: `${BASE}health` });
    expect(res.statusCode).toBe(200);
  });

  it('answers Socket.IO under the base path and refuses the default path', async () => {
    const h = await listen({ basePath: BASE });
    const open = (path: string): Promise<Socket> =>
      new Promise((resolve, reject) => {
        const socket = ioClient(h.url, {
          path,
          transports: ['websocket'],
          forceNew: true,
          reconnection: false,
        });
        socket.on('connect', () => resolve(socket));
        socket.on('connect_error', (err) => {
          socket.disconnect();
          reject(err);
        });
      });

    const socket = await open(`${BASE}socket.io`);
    expect(socket.id).toBeTruthy();
    socket.disconnect();

    await expect(open('/socket.io')).rejects.toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// T-2.2 — lobby wiring
// ---------------------------------------------------------------------------

describe('room:create', () => {
  it('acks with a room code and the socket id', async () => {
    const h = await listen();
    const host = await connect(h);
    const ack = await emitWithAck<{ roomCode: string; socketId: string }>(host, 'room:create', {
      nickname: 'Ada',
      language: 'en',
    });
    expect(ack.roomCode).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    expect(ack.socketId).toBe(host.id);
  });

  it('broadcasts lobby:update to the creator', async () => {
    const h = await listen();
    const host = await connect(h);
    const lobby = once<{ players: { nickname: string }[]; hostId: string; donateUrl: unknown }>(
      host,
      'lobby:update',
    );
    void emitWithAck(host, 'room:create', { nickname: 'Ada', language: 'en' });
    const payload = await lobby;
    expect(payload.players.map((p) => p.nickname)).toEqual(['Ada']);
    expect(payload.hostId).toBe(host.id);
    // donateUrl is null unless the operator set DEPLOYER_DONATE_URL.
    expect(payload.donateUrl).toBeNull();
  });

  it('emits error (not an ack) for a bad nickname', async () => {
    // RoomCreateAck has no error branch, so create failures must travel on the
    // `error` event — the convention the copied HomeScreen listens for.
    const h = await listen();
    const host = await connect(h);
    const err = once<{ code: string }>(host, 'error');
    host.emit('room:create', { nickname: 'ab', language: 'en' }, () => {
      throw new Error('ack must not fire on a rejected create');
    });
    expect((await err).code).toBe('INVALID_NICKNAME');
  });

  it('emits error for an unknown language', async () => {
    const h = await listen();
    const host = await connect(h);
    const err = once<{ code: string }>(host, 'error');
    host.emit('room:create', { nickname: 'Ada', language: 'klingon' }, () => {});
    expect((await err).code).toBe('INVALID_NICKNAME');
  });
});

describe('room:join', () => {
  it('acks with the player list and room language', async () => {
    const h = await listen();
    const host = await connect(h);
    const { roomCode } = await emitWithAck<{ roomCode: string }>(host, 'room:create', {
      nickname: 'Ada',
      language: 'ru',
    });

    const joiner = await connect(h);
    const ack = await emitWithAck<{
      players: { nickname: string }[];
      language: string;
      hostId: string;
    }>(joiner, 'room:join', { roomCode, nickname: 'Bob' });

    expect(ack.players.map((p) => p.nickname)).toEqual(['Ada', 'Bob']);
    expect(ack.language).toBe('ru');
    expect(ack.hostId).toBe(host.id);
  });

  it('broadcasts lobby:update to players already in the room', async () => {
    const h = await listen();
    const host = await connect(h);
    const { roomCode } = await emitWithAck<{ roomCode: string }>(host, 'room:create', {
      nickname: 'Ada',
      language: 'en',
    });

    const joiner = await connect(h);
    const hostSees = once<{ players: { nickname: string }[] }>(host, 'lobby:update');
    void emitWithAck(joiner, 'room:join', { roomCode, nickname: 'Bob' });
    expect((await hostSees).players.map((p) => p.nickname)).toEqual(['Ada', 'Bob']);
  });

  it('returns errors through the ack, never the error event', async () => {
    // The copied HomeScreen inspects `ack.error`; an emitted `error` would
    // leave its busy spinner stuck forever.
    const h = await listen();
    const joiner = await connect(h);
    const ack = await emitWithAck<{ error: { code: string } }>(joiner, 'room:join', {
      roomCode: 'ZZZZZZ',
      nickname: 'Bob',
    });
    expect(ack.error.code).toBe('ROOM_NOT_FOUND');
  });

  it('returns INVALID_NICKNAME through the ack', async () => {
    const h = await listen();
    const joiner = await connect(h);
    const ack = await emitWithAck<{ error: { code: string } }>(joiner, 'room:join', {
      roomCode: 'ZZZZZZ',
      nickname: 'x',
    });
    expect(ack.error.code).toBe('INVALID_NICKNAME');
  });
});

describe('room:leave', () => {
  it('removes the player and broadcasts to those remaining', async () => {
    const h = await listen();
    const host = await connect(h);
    const { roomCode } = await emitWithAck<{ roomCode: string }>(host, 'room:create', {
      nickname: 'Ada',
      language: 'en',
    });
    const joiner = await connect(h);
    // The handlers ack before broadcasting (SRC's order), so the join's
    // lobby:update is still in flight when its ack resolves. Drain it before
    // listening for the leave broadcast, or this test reads the wrong one.
    const joinBroadcast = once<{ players: { nickname: string }[] }>(host, 'lobby:update');
    await emitWithAck(joiner, 'room:join', { roomCode, nickname: 'Bob' });
    expect((await joinBroadcast).players).toHaveLength(2);

    const hostSees = once<{ players: { nickname: string }[] }>(host, 'lobby:update');
    joiner.emit('room:leave');
    expect((await hostSees).players.map((p) => p.nickname)).toEqual(['Ada']);
  });
});

// ---------------------------------------------------------------------------
// T-5.3 — stats
// ---------------------------------------------------------------------------

describe('stats:get', () => {
  it('acks with the current room count and image counters', async () => {
    const h = await listen();
    const host = await connect(h);
    await emitWithAck(host, 'room:create', { nickname: 'Ada', language: 'en' });

    // stats:get carries no payload — only an ack callback (see HomeScreen.tsx's
    // `socket.emit('stats:get', (s) => setStats(s))`). emitWithAck always
    // inserts a payload slot before the ack, which would shift the server's
    // single-argument handler's `ack` parameter onto that slot instead.
    const stats = await new Promise<{
      openRooms: number;
      imagesGeneratedToday: number;
      imagesLimit: number;
    }>((resolve) => host.emit('stats:get', resolve));
    expect(stats.openRooms).toBe(1);
    expect(stats.imagesGeneratedToday).toBe(0);
    expect(stats.imagesLimit).toBeGreaterThan(0);
  });
});

describe('stats:update broadcasts', () => {
  it('fires after a room is created', async () => {
    const h = await listen();
    const host = await connect(h);
    const stats = once<{ openRooms: number }>(host, 'stats:update');
    void emitWithAck(host, 'room:create', { nickname: 'Ada', language: 'en' });
    expect((await stats).openRooms).toBe(1);
  });

  it('fires when the last player leaves and the room is deleted', async () => {
    const h = await listen();
    const host = await connect(h);
    // room:create's own stats:update may still be in flight when its ack
    // resolves (same race the room:leave suite above documents for
    // lobby:update) — drain it before listening for the deletion broadcast,
    // or this test can read the wrong one.
    const created = once(host, 'stats:update');
    await emitWithAck(host, 'room:create', { nickname: 'Ada', language: 'en' });
    await created;

    const stats = once<{ openRooms: number }>(host, 'stats:update');
    host.emit('room:leave');
    expect((await stats).openRooms).toBe(0);
  });

  it('does not fire when a room empties partially', async () => {
    const h = await listen();
    const host = await connect(h);
    const { roomCode } = await emitWithAck<{ roomCode: string }>(host, 'room:create', {
      nickname: 'Ada',
      language: 'en',
    });
    const joiner = await connect(h);
    const joinBroadcast = once(host, 'lobby:update');
    await emitWithAck(joiner, 'room:join', { roomCode, nickname: 'Bob' });
    await joinBroadcast;

    let sawStatsUpdate = false;
    host.on('stats:update', () => {
      sawStatsUpdate = true;
    });
    const leftBroadcast = once(host, 'lobby:update');
    joiner.emit('room:leave');
    await leftBroadcast;
    expect(sawStatsUpdate).toBe(false);
  });

  it('fires after game:end deletes the room', async () => {
    const h = await listen();
    const host = await connect(h);
    const created = once(host, 'stats:update');
    await emitWithAck(host, 'room:create', { nickname: 'Ada', language: 'en' });
    await created;

    const stats = once<{ openRooms: number }>(host, 'stats:update');
    host.emit('game:end');
    expect((await stats).openRooms).toBe(0);
  });
});

describe('rate limiting (spec §17)', () => {
  it('allows 5 room:create per IP per minute, then emits RATE_LIMITED', async () => {
    const h = await listen();
    const host = await connect(h);

    for (let i = 0; i < 5; i++) {
      const ack = await emitWithAck<{ roomCode: string }>(host, 'room:create', {
        nickname: 'Ada',
        language: 'en',
      });
      expect(ack.roomCode, `create ${i + 1} should succeed`).toBeTruthy();
    }

    const err = once<{ code: string }>(host, 'error');
    host.emit('room:create', { nickname: 'Ada', language: 'en' }, () => {
      throw new Error('ack must not fire on a rate-limited create');
    });
    expect((await err).code).toBe('RATE_LIMITED');
  });

  it('rate-limits room:join through the ack branch', async () => {
    const h = await listen();
    const joiner = await connect(h);

    // 30 per minute; all of these miss (unknown room) but still spend a token,
    // which is the point — the limit guards the attempt, not the outcome.
    let limited: { error: { code: string } } | null = null;
    for (let i = 0; i < 31; i++) {
      const ack = await emitWithAck<{ error?: { code: string } }>(joiner, 'room:join', {
        roomCode: 'ZZZZZZ',
        nickname: 'Bob',
      });
      if (ack.error?.code === 'RATE_LIMITED') {
        limited = ack as { error: { code: string } };
        break;
      }
    }
    expect(limited, 'the 31st join should have been rate limited').not.toBeNull();
  });

  it('does not let the create limit block joins', async () => {
    // Separate buckets per action — exhausting create must leave join usable.
    const h = await listen();
    const host = await connect(h);
    const { roomCode } = await emitWithAck<{ roomCode: string }>(host, 'room:create', {
      nickname: 'Ada',
      language: 'en',
    });
    for (let i = 0; i < 5; i++) {
      host.emit('room:create', { nickname: 'Ada', language: 'en' }, () => {});
    }

    const joiner = await connect(h);
    const ack = await emitWithAck<{ players?: unknown[]; error?: unknown }>(joiner, 'room:join', {
      roomCode,
      nickname: 'Bob',
    });
    expect(ack.error).toBeUndefined();
    expect(ack.players).toHaveLength(2);
  });
});
