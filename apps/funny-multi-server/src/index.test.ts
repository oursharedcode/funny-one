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
import type { AddressInfo } from 'node:net';
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { io as ioClient, type Socket } from 'socket.io-client';
import { buildServer, type BuiltServer } from './index.js';
import { ENV_PATH } from './env.js';
import { __resetRoomsForTest } from './rooms.js';

let built: BuiltServer | null = null;
const clients: Socket[] = [];

afterEach(async () => {
  for (const c of clients.splice(0)) c.disconnect();
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

// Boots on port 0 so concurrent runs cannot collide on a fixed port.
async function listen(): Promise<string> {
  const server = await boot();
  await server.fastify.listen({ port: 0, host: '127.0.0.1' });
  const { port } = server.fastify.server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

function connect(url: string): Promise<Socket> {
  const socket = ioClient(url, { transports: ['websocket'], forceNew: true });
  clients.push(socket);
  return new Promise((resolve, reject) => {
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', reject);
    setTimeout(() => reject(new Error('timed out waiting for connect')), 5000);
  });
}

function emitWithAck<T>(socket: Socket, event: string, payload: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (response: T) => resolve(response));
    setTimeout(() => reject(new Error(`timed out waiting for ${event} ack`)), 5000);
  });
}

function once<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.once(event, (payload: T) => resolve(payload));
    setTimeout(() => reject(new Error(`timed out waiting for ${event}`)), 5000);
  });
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
    const url = await listen();
    const socket = await connect(url);
    expect(socket.id).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// T-2.2 — lobby wiring
// ---------------------------------------------------------------------------

describe('room:create', () => {
  it('acks with a room code and the socket id', async () => {
    const url = await listen();
    const host = await connect(url);
    const ack = await emitWithAck<{ roomCode: string; socketId: string }>(host, 'room:create', {
      nickname: 'Ada',
      language: 'en',
    });
    expect(ack.roomCode).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    expect(ack.socketId).toBe(host.id);
  });

  it('broadcasts lobby:update to the creator', async () => {
    const url = await listen();
    const host = await connect(url);
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
    const url = await listen();
    const host = await connect(url);
    const err = once<{ code: string }>(host, 'error');
    host.emit('room:create', { nickname: 'ab', language: 'en' }, () => {
      throw new Error('ack must not fire on a rejected create');
    });
    expect((await err).code).toBe('INVALID_NICKNAME');
  });

  it('emits error for an unknown language', async () => {
    const url = await listen();
    const host = await connect(url);
    const err = once<{ code: string }>(host, 'error');
    host.emit('room:create', { nickname: 'Ada', language: 'klingon' }, () => {});
    expect((await err).code).toBe('INVALID_NICKNAME');
  });
});

describe('room:join', () => {
  it('acks with the player list and room language', async () => {
    const url = await listen();
    const host = await connect(url);
    const { roomCode } = await emitWithAck<{ roomCode: string }>(host, 'room:create', {
      nickname: 'Ada',
      language: 'ru',
    });

    const joiner = await connect(url);
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
    const url = await listen();
    const host = await connect(url);
    const { roomCode } = await emitWithAck<{ roomCode: string }>(host, 'room:create', {
      nickname: 'Ada',
      language: 'en',
    });

    const joiner = await connect(url);
    const hostSees = once<{ players: { nickname: string }[] }>(host, 'lobby:update');
    void emitWithAck(joiner, 'room:join', { roomCode, nickname: 'Bob' });
    expect((await hostSees).players.map((p) => p.nickname)).toEqual(['Ada', 'Bob']);
  });

  it('returns errors through the ack, never the error event', async () => {
    // The copied HomeScreen inspects `ack.error`; an emitted `error` would
    // leave its busy spinner stuck forever.
    const url = await listen();
    const joiner = await connect(url);
    const ack = await emitWithAck<{ error: { code: string } }>(joiner, 'room:join', {
      roomCode: 'ZZZZZZ',
      nickname: 'Bob',
    });
    expect(ack.error.code).toBe('ROOM_NOT_FOUND');
  });

  it('returns INVALID_NICKNAME through the ack', async () => {
    const url = await listen();
    const joiner = await connect(url);
    const ack = await emitWithAck<{ error: { code: string } }>(joiner, 'room:join', {
      roomCode: 'ZZZZZZ',
      nickname: 'x',
    });
    expect(ack.error.code).toBe('INVALID_NICKNAME');
  });
});

describe('room:leave', () => {
  it('removes the player and broadcasts to those remaining', async () => {
    const url = await listen();
    const host = await connect(url);
    const { roomCode } = await emitWithAck<{ roomCode: string }>(host, 'room:create', {
      nickname: 'Ada',
      language: 'en',
    });
    const joiner = await connect(url);
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

describe('rate limiting (spec §17)', () => {
  it('allows 5 room:create per IP per minute, then emits RATE_LIMITED', async () => {
    const url = await listen();
    const host = await connect(url);

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
    const url = await listen();
    const joiner = await connect(url);

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
    const url = await listen();
    const host = await connect(url);
    const { roomCode } = await emitWithAck<{ roomCode: string }>(host, 'room:create', {
      nickname: 'Ada',
      language: 'en',
    });
    for (let i = 0; i < 5; i++) {
      host.emit('room:create', { nickname: 'Ada', language: 'en' }, () => {});
    }

    const joiner = await connect(url);
    const ack = await emitWithAck<{ players?: unknown[]; error?: unknown }>(joiner, 'room:join', {
      roomCode,
      nickname: 'Bob',
    });
    expect(ack.error).toBeUndefined();
    expect(ack.players).toHaveLength(2);
  });
});
