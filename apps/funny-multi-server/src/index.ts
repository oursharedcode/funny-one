// SPDX-License-Identifier: AGPL-3.0-only

// MUST be first — loads .env into process.env before any other module reads it.
import './env.js';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { Server as SocketIOServer } from 'socket.io';
import type {
  ClientToServerEvents,
  LobbyUpdatePayload,
  Room,
  ServerToClientEvents,
} from './types.js';
import {
  RoomError,
  createRoom,
  deleteRoom,
  findRoomForSocket,
  isValidLanguage,
  joinRoom,
  removePlayer,
  validateNickname,
} from './rooms.js';
import { handleReadyToggle, prepareRestart, startGame, submitAnswer } from './game.js';
import {
  RATE_WINDOW_MS,
  ROOM_CREATE_PER_MINUTE,
  ROOM_JOIN_PER_MINUTE,
  clientIp,
  createRateLimiter,
} from './rateLimit.js';

// ---------------------------------------------------------------------------
// T-2.1 — bootstrap only (design §3). This is SRC/server/src/index.ts reduced
// to the transport shell: Fastify, CORS, /health, static client serving, and
// the Socket.IO server. Every socket handler SRC wired up here is deliberately
// absent and arrives with the task that owns it:
//
//   T-2.4  disconnect grace window, botification, host migration, player:lost
//   T-4.4  reveal:requestPicture / reveal:retryPicture
//   T-5.1  gallery:share      T-5.3  stats:get
//
// Not carried from SRC:
//   - POST /test/image — dev-only harness for the dropped Test* client screens
//     (design §3), and it existed to inspect the translate stack that DD-8
//     deletes. There is no `translationFailed` in this codebase.
//   - maxHttpBufferSize: 8e6 — SRC raised the 1 MB Socket.IO default because
//     gallery:ready carried every player's picture as base64. Pictures are now
//     URLs (FM-IMG-3 / DD-5, the MUL-2 socket-size mandate), so a 7-player
//     gallery is a few KB of text and the default stands. Carrying the override
//     would preserve a workaround for a problem the design removed.
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT ?? 3000);
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const DEV_CLIENT_ORIGIN = 'http://localhost:5173';

// Built client bundle, relative to dist/index.js (spec §14: one process serves
// both). SRC pointed at '../../client/dist/'; the workspace layout renames the
// app and adds an apps/ level, and this file's depth below the app root is
// unchanged, so only the sibling name moves.
const CLIENT_DIST = fileURLToPath(new URL('../../funny-multi-client/dist/', import.meta.url));

// Bounded disconnect grace window (spec §7). A client that returns within
// RECOVERY_WINDOW_MS keeps its slot via Socket.IO connection-state recovery.
// SRC paired this with a slightly longer DISCONNECT_GRACE_MS removal timer so
// recovery always wins the race; that timer lands with T-2.4's disconnect rules.
export const RECOVERY_WINDOW_MS = 60_000;

export type GameIO = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

export interface BuiltServer {
  fastify: FastifyInstance;
  io: GameIO;
}

// Split out of SRC's monolithic main() so the transport shell is testable
// without binding a port or racing a listen (index.test.ts drives it via
// fastify.inject). main() below is the thin production entry point; T-2.2+
// register their socket handlers inside this function.
export async function buildServer({ logger = true } = {}): Promise<BuiltServer> {
  const fastify = Fastify({ logger });

  await fastify.register(fastifyCors, {
    origin: NODE_ENV === 'production' ? false : DEV_CLIENT_ORIGIN,
    credentials: true,
  });

  fastify.get('/health', async () => ({ ok: true }));

  // Production: this same Fastify process serves the built client bundle —
  // one process, no nginx sidecar (spec §14). Unmatched routes fall back to
  // index.html so the SPA can handle deep links like /?room=ABCDEF. In dev
  // the client runs on Vite's own server, so static serving is skipped.
  if (NODE_ENV === 'production') {
    await fastify.register(fastifyStatic, { root: CLIENT_DIST });
    fastify.setNotFoundHandler((_request, reply) => reply.sendFile('index.html'));
  }

  await fastify.ready();

  const io: GameIO = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    fastify.server,
    {
      cors: {
        origin: NODE_ENV === 'production' ? false : DEV_CLIENT_ORIGIN,
        credentials: true,
      },
      connectionStateRecovery: {
        maxDisconnectionDuration: RECOVERY_WINDOW_MS,
      },
    },
  );

  // Per-IP token buckets (spec §17). Held per server instance rather than at
  // module scope so tests get a fresh limiter with each buildServer().
  const createLimiter = createRateLimiter({
    capacity: ROOM_CREATE_PER_MINUTE,
    intervalMs: RATE_WINDOW_MS,
  });
  const joinLimiter = createRateLimiter({
    capacity: ROOM_JOIN_PER_MINUTE,
    intervalMs: RATE_WINDOW_MS,
  });
  fastify.addHook('onClose', async () => {
    createLimiter.stop();
    joinLimiter.stop();
  });

  function broadcastLobby(room: Room): void {
    const payload: LobbyUpdatePayload = {
      players: room.players,
      hostId: room.hostId,
      donateUrl: process.env.DEPLOYER_DONATE_URL || null,
    };
    io.to(room.code).emit('lobby:update', payload);
  }

  io.on('connection', (socket) => {
    // T-2.4 replaces this with the real grace-window handling; until then the
    // logging proves the transport is live and mirrors SRC's log lines.
    if (socket.recovered) {
      fastify.log.info({ socketId: socket.id }, 'socket recovered');
    } else {
      fastify.log.info({ socketId: socket.id }, 'socket connected');
    }

    const ip = clientIp(socket.handshake);

    socket.on('room:create', (payload, ack) => {
      // Rate check first: a limited caller must not consume a room slot or a
      // code. room:create has no error branch on its ack (RoomCreateAck is a
      // success shape), so failures travel on the `error` event — SRC's
      // convention, which the copied HomeScreen listens for.
      if (!createLimiter.take(ip)) {
        socket.emit('error', { code: 'RATE_LIMITED', message: 'Too many rooms. Slow down.' });
        return;
      }
      const v = validateNickname(payload?.nickname);
      if (!v.ok) {
        socket.emit('error', { code: 'INVALID_NICKNAME', message: v.message });
        return;
      }
      if (!isValidLanguage(payload?.language)) {
        socket.emit('error', { code: 'INVALID_NICKNAME', message: 'Invalid language.' });
        return;
      }
      try {
        const room = createRoom(v.nickname, payload.language, socket.id);
        socket.join(room.code);
        ack({ roomCode: room.code, socketId: socket.id });
        broadcastLobby(room);
      } catch (err) {
        if (err instanceof RoomError) {
          socket.emit('error', { code: err.code, message: err.message });
        } else {
          fastify.log.error(err);
          socket.emit('error', { code: 'SERVER_BUSY', message: 'Unexpected error.' });
        }
      }
    });

    socket.on('room:join', (payload, ack) => {
      // Unlike create, join failures go through the ack's error branch. Spec
      // §17 says "emit error" for a rate-limit hit, but the copied HomeScreen
      // join path only ever inspects `ack.error` — emitting instead would
      // leave its spinner stuck forever. Each event keeps its own SRC error
      // convention; the code and message are the spec's.
      if (!joinLimiter.take(ip)) {
        ack({ error: { code: 'RATE_LIMITED', message: 'Too many attempts. Slow down.' } });
        return;
      }
      const v = validateNickname(payload?.nickname);
      if (!v.ok) {
        ack({ error: { code: 'INVALID_NICKNAME', message: v.message } });
        return;
      }
      try {
        const room = joinRoom(payload?.roomCode, v.nickname, socket.id);
        socket.join(room.code);
        ack({
          socketId: socket.id,
          players: room.players,
          language: room.language,
          hostId: room.hostId,
        });
        broadcastLobby(room);
      } catch (err) {
        if (err instanceof RoomError) {
          ack({ error: { code: err.code, message: err.message } });
        } else {
          fastify.log.error(err);
          ack({ error: { code: 'SERVER_BUSY', message: 'Unexpected error.' } });
        }
      }
    });

    socket.on('room:leave', () => {
      // An explicit leave is intentional and takes effect immediately — it is
      // never routed through T-2.4's disconnect grace window.
      const result = removePlayer(socket.id);
      if (!result) return;
      socket.leave(result.room.code);
      if (!result.deleted) broadcastLobby(result.room);
    });

    socket.on('game:start', () => {
      const room = findRoomForSocket(socket.id);
      if (!room) {
        socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'No room.' });
        return;
      }
      if (room.hostId !== socket.id) {
        socket.emit('error', { code: 'NOT_HOST', message: 'Only the host can start.' });
        return;
      }
      if (room.phase !== 'lobby') {
        socket.emit('error', { code: 'ROOM_LOCKED', message: 'Game already started.' });
        return;
      }
      if (room.players.length < 3) {
        socket.emit('error', {
          code: 'NOT_ENOUGH_PLAYERS',
          message: 'Need at least 3 players.',
        });
        return;
      }
      // SRC hard-locked room.wobbleEngine here and re-broadcast the lobby so
      // every joiner recorded with the same engine. Both are gone with the
      // field (DD-9), and with them the only reason this handler broadcast.
      startGame(room, io);
    });

    socket.on('round:submit', (payload) => {
      const room = findRoomForSocket(socket.id);
      if (!room) return;
      // Pass the raw value through: submitAnswer owns validation, and a
      // non-string here is exactly the tampered-client case it rejects.
      submitAnswer(room, socket.id, payload?.optionId, io);
    });

    socket.on('game:ready', (payload) => {
      const room = findRoomForSocket(socket.id);
      if (!room) return;
      handleReadyToggle(room, socket.id, payload?.ready === true, io);
    });

    socket.on('game:restart', () => {
      const room = findRoomForSocket(socket.id);
      if (!room) {
        socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'No room.' });
        return;
      }
      const result = prepareRestart(room, socket.id);
      if (!result.ok) {
        socket.emit('error', result.error);
        return;
      }
      broadcastLobby(room);
      startGame(room, io);
    });

    socket.on('game:end', () => {
      const room = findRoomForSocket(socket.id);
      if (!room) return;
      if (room.hostId !== socket.id) {
        socket.emit('error', { code: 'NOT_HOST', message: 'Only the host can end the game.' });
        return;
      }
      room.phase = 'ended';
      io.to(room.code).emit('game:over');
      deleteRoom(room.code);
    });

    socket.on('disconnect', (reason) => {
      fastify.log.info({ socketId: socket.id, reason }, 'socket disconnected');
    });
  });

  return { fastify, io };
}

async function main(): Promise<void> {
  const { fastify } = await buildServer();
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
}

// Only run when executed directly, not when imported by a test. pathToFileURL
// rather than a `file://` template: on Windows the raw argv path is
// `C:\...`, which does not concatenate into a valid URL.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
