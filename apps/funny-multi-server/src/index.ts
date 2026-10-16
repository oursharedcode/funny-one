// SPDX-License-Identifier: AGPL-3.0-only

// MUST be first — loads .env into process.env before any other module reads it.
import './env.js';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { Server as SocketIOServer } from 'socket.io';
import { normalizeBasePath } from '@funny/shared';
import type {
  ClientToServerEvents,
  LobbyUpdatePayload,
  Room,
  ServerToClientEvents,
  SupportConfig,
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
  type RemoveResult,
} from './rooms.js';
import {
  generateBotStoryPictures,
  handleMidGameBotification,
  handlePictureRequest,
  handleReadyToggle,
  prepareRestart,
  shareGallery,
  startGame,
  submitAnswer,
} from './game.js';
import { createDisconnectRegistry, type DisconnectRegistry } from './disconnect.js';
import {
  RATE_WINDOW_MS,
  ROOM_CREATE_PER_MINUTE,
  ROOM_JOIN_PER_MINUTE,
  clientIp,
  createRateLimiter,
} from './rateLimit.js';
import { maybeSyncImageCounter, syncImageCounterFromWorker } from './image.js';
import { buildStats, broadcastStats } from './stats.js';
import { createStatsStore, isBotAgent, summaryDays } from './analytics.js';

// ---------------------------------------------------------------------------
// T-2.1 — bootstrap only (design §3). This is SRC/server/src/index.ts reduced
// to the transport shell: Fastify, CORS, /health, static client serving, and
// the Socket.IO server. Every socket handler SRC wired up here was
// deliberately absent from this bootstrap and arrived with the task that
// owns it:
//
// reveal:requestPicture / reveal:retryPicture land at T-4.4, below.
// stats:get / stats:update land at T-5.3, below.
// gallery:share / gallery:ready land at T-5.1, below.
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
const DEV_CLIENT_ORIGIN = 'http://localhost:5183';

// Number of trusted reverse-proxy hops in front of this process, for
// `clientIp`'s x-forwarded-for parsing (rateLimit.ts). Default 1 matches
// Render's single TLS-terminating proxy; raise it if a CDN or load balancer
// sits in front of Render.
const TRUSTED_PROXY_HOPS = Number(process.env.TRUSTED_PROXY_HOPS ?? 1);

// URL sub-path this process is mounted under (requirements D-5): `/` in dev
// and in production (the game owns its host since B-1a; it was `/funny37-game/`
// behind the owner's Caddy before), or any sub-path a proxy of your own routes
// to it. Everything path-shaped below hangs
// off it — the static prefix, /health, the Socket.IO path — and the client
// build bakes the same value in (vite.config.ts), so the two must be fed the
// same BASE_PATH; docker-compose.yml does exactly that.
const BASE_PATH = normalizeBasePath(process.env.BASE_PATH);

// Built client bundle, relative to dist/index.js (spec §14: one process serves
// both). SRC pointed at '../../client/dist/'; the workspace layout renames the
// app and adds an apps/ level, and this file's depth below the app root is
// unchanged, so only the sibling name moves.
const CLIENT_DIST = fileURLToPath(new URL('../../funny-multi-client/dist/', import.meta.url));

// Step 72: where the visit and funnel counts persist (analytics.ts). Unset
// keeps them in memory only; docker-compose.yml points it into a volume.
const STATS_FILE = process.env.STATS_FILE || null;

// Visit and funnel events per IP per minute. A hub visit sends one or two and
// a game one a handful, so this only stops a script, while a family or a
// school behind one address stays far below it.
const STATS_EVENTS_PER_MINUTE = 60;

// Bounded disconnect grace window (spec §7). A client that returns within
// RECOVERY_WINDOW_MS keeps its slot via Socket.IO connection-state recovery;
// the removal timer is a touch longer so recovery always wins the race. Both
// values are SRC's.
export const RECOVERY_WINDOW_MS = 60_000;
export const DISCONNECT_GRACE_MS = RECOVERY_WINDOW_MS + 5_000;

export type GameIO = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

export interface BuiltServer {
  fastify: FastifyInstance;
  io: GameIO;
  /** Pending disconnect-grace timers (T-2.4), exposed for tests. */
  disconnects: DisconnectRegistry;
}

// Split out of SRC's monolithic main() so the transport shell is testable
// without binding a port or racing a listen (index.test.ts drives it via
// fastify.inject). main() below is the thin production entry point; T-2.2+
// register their socket handlers inside this function.
export interface BuildServerOptions {
  logger?: boolean;
  /**
   * Overrides the spec §7 removal window. Production never passes this — the
   * default is the only value that satisfies "longer than recovery". Tests use
   * a few milliseconds so a grace window can actually elapse inside a case.
   */
  disconnectGraceMs?: number;
  /** Overrides the BASE_PATH env var; tests use it to mount under a sub-path. */
  basePath?: string;
  /** Overrides the STATS_FILE env var; null keeps the counts in memory. */
  statsFile?: string | null;
}

export async function buildServer({
  logger = true,
  disconnectGraceMs = DISCONNECT_GRACE_MS,
  basePath = BASE_PATH,
  statsFile = STATS_FILE,
}: BuildServerOptions = {}): Promise<BuiltServer> {
  const base = normalizeBasePath(basePath);
  const fastify = Fastify({ logger });

  await fastify.register(fastifyCors, {
    origin: NODE_ENV === 'production' ? false : DEV_CLIENT_ORIGIN,
    credentials: true,
  });

  fastify.get(`${base}health`, async () => ({ ok: true }));

  // T-9.3 (FM-TIER-3, design §10.2): support-rail addresses, read once at
  // boot from DEPLOYER_* env vars. A REST route rather than a socket payload
  // because the Home ♥ affordance has to show this before any room exists.
  const support: SupportConfig = {
    payId: process.env.DEPLOYER_PAYID || null,
    payIdName: process.env.DEPLOYER_PAYID_NAME || null,
    sponsorsUrl: process.env.DEPLOYER_SPONSORS_URL || null,
    lightningAddress: process.env.DEPLOYER_LIGHTNING_ADDRESS || null,
    kofiUrl: process.env.DEPLOYER_KOFI_URL || null,
    bmcUrl: process.env.DEPLOYER_BMC_URL || null,
    donateUrl: process.env.DEPLOYER_DONATE_URL || null,
  };
  fastify.get(`${base}config`, async () => ({ support }));

  // Step 72: visit and funnel counts (analytics.ts). The landing page posts
  // here through its own host's proxy (deploy/caddy/Caddyfile) and so does
  // this game's client (funnel.ts); the landing page's /stats/ reads the
  // summary. Beacons arrive as text/plain JSON — sendBeacon's own type, which
  // needs no CORS preflight — so a string body is parsed here.
  const visits = createStatsStore({
    file: statsFile,
    onError: (err) => fastify.log.error(err, 'visit counts'),
  });
  const statsLimiter = createRateLimiter({
    capacity: STATS_EVENTS_PER_MINUTE,
    intervalMs: RATE_WINDOW_MS,
  });
  fastify.addHook('onClose', async () => {
    statsLimiter.stop();
    visits.stop();
  });

  fastify.post(`${base}api/stats`, { bodyLimit: 1024 }, async (request, reply) => {
    // A crawler's or a script's visit is dropped quietly, not refused: there
    // is nothing for it to fix.
    if (isBotAgent(request.headers['user-agent'])) return reply.code(204).send();
    const ip = clientIp(
      { headers: request.headers, address: request.socket.remoteAddress },
      TRUSTED_PROXY_HOPS,
    );
    if (!statsLimiter.take(ip)) return reply.code(429).send();
    let event: unknown = request.body;
    if (typeof event === 'string') {
      try {
        event = JSON.parse(event);
      } catch {
        return reply.code(400).send();
      }
    }
    return reply.code(visits.record(event) ? 204 : 400).send();
  });

  fastify.get<{ Querystring: { days?: string } }>(
    `${base}api/stats/summary`,
    async (request, reply) => {
      reply.header('cache-control', 'no-store').header('x-robots-tag', 'noindex');
      return visits.summary(summaryDays(request.query.days));
    },
  );

  // Production: this same Fastify process serves the built client bundle —
  // one process, no nginx sidecar (spec §14). Unmatched routes fall back to
  // index.html so the SPA can handle deep links like /?room=ABCDEF. In dev
  // the client runs on Vite's own server, so static serving is skipped.
  // The bundle is mounted under the base path because the client was built
  // with the same value as Vite's `base`, so every asset URL in it already
  // carries the prefix.
  if (NODE_ENV === 'production') {
    await fastify.register(fastifyStatic, { root: CLIENT_DIST, prefix: base });
    fastify.setNotFoundHandler((_request, reply) => reply.sendFile('index.html'));
  }

  await fastify.ready();

  const io: GameIO = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    fastify.server,
    {
      // Socket.IO's default is `/socket.io`; under a sub-path the client
      // (socket.ts) asks for `${base}socket.io`, so the server must listen
      // there — and nowhere else, which is what the base-path test pins.
      path: `${base}socket.io`,
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
    };
    io.to(room.code).emit('lobby:update', payload);
  }

  // ---- T-2.4: disconnect grace window (spec §7, FM-CORE-3) ----------------
  //
  // A dropped socket is not removed at once. It is removed only if the grace
  // window elapses with no return — which is what makes a tunnel, a locked
  // phone or a Wi-Fi handover survivable mid-game (FM-CORE-3).

  /**
   * Runs the real removal — either because a grace window elapsed with no
   * return, or because the player left on purpose. Returns the removal result
   * so an explicit leave can also drop the socket from its Socket.IO room.
   */
  function finalizePlayerRemoval(socketId: string): RemoveResult | null {
    const result = removePlayer(socketId);
    if (!result) return null;

    if (result.becameBot && !result.deleted) {
      // Mid-game: the slot stays (rotation integrity) and turns into a bot, so
      // the current round must not stall waiting for an answer that can no
      // longer come. This auto-fills it and advances if it was the last one.
      // A no-op when the room is already in reveal (nothing here checks phase
      // beyond what handleMidGameBotification itself guards).
      handleMidGameBotification(result.room, socketId, io);

      // Reveal-phase drop: this player will never fire reveal:requestPicture
      // now that they're a bot, so their story's picture would otherwise stay
      // null forever — the same gap enterRevealPhase's call closes for anyone
      // who was already a bot when reveal began. Fire-and-forget, same as
      // there.
      if (result.room.phase === 'reveal') {
        void generateBotStoryPictures(result.room, io);
      }

      // Tell the host a player was lost (spec §12). `removePlayer` has already
      // promoted a new host if the lost player *was* the host, so hostId here
      // is whoever should now receive the notice. The botified player keeps
      // their slot and nickname, which is what the message names.
      const lost = result.room.players.find((p) => p.id === socketId);
      if (lost) io.to(result.room.hostId).emit('player:lost', { nickname: lost.nickname });
    }

    if (!result.deleted) broadcastLobby(result.room);
    // Room count only changes when the room itself is gone (spec's
    // "action changes the counter" rule) — covers both the all-bot deletion
    // above and the lobby-phase empty-room deletion in `removePlayer`. This
    // one call site serves both the disconnect-grace-expiry path and the
    // explicit room:leave path below, which share this function (T-2.4).
    if (result.deleted) broadcastStats(io);
    return result;
  }

  const disconnects = createDisconnectRegistry({
    graceMs: disconnectGraceMs,
    onExpire: finalizePlayerRemoval,
  });
  // Without this a pending window outlives the server it belongs to: in tests
  // it would fire against a room store the next case has already reset, and
  // emit on a closed io. See disconnect.ts.
  fastify.addHook('onClose', async () => {
    disconnects.clearAll();
  });

  io.on('connection', (socket) => {
    if (socket.recovered) {
      // Returned inside the window (spec §7) — cancel the pending removal. The
      // socket keeps its id, its rooms and any events it missed, so from the
      // game's point of view the player never left.
      disconnects.cancel(socket.id);
      fastify.log.info({ socketId: socket.id }, 'socket recovered');
    } else {
      fastify.log.info({ socketId: socket.id }, 'socket connected');
    }

    const ip = clientIp(socket.handshake, TRUSTED_PROXY_HOPS);

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
        // Anything but a literal true is an ordinary room (B-15).
        const room = createRoom(
          v.nickname,
          payload.language,
          socket.id,
          payload.multiLanguage === true,
        );
        socket.join(room.code);
        ack({ roomCode: room.code, socketId: socket.id });
        broadcastLobby(room);
        broadcastStats(io);
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
          multiLanguage: room.multiLanguage,
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
      // An explicit leave is intentional: it takes effect immediately and is
      // never routed through the grace window. It does share the *removal*
      // path, which is a deliberate divergence from SRC — SRC called
      // `removePlayer` directly here, so a player who quit mid-game was
      // botified but their current round was never auto-filled, and everyone
      // else waited out the full 60 s round timer for an answer that could not
      // arrive. Same end state, so the same handling; only the delay differs.
      disconnects.cancel(socket.id);
      const result = finalizePlayerRemoval(socket.id);
      if (result) socket.leave(result.room.code);
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

    // Identical handler for both events (spec §11): a retry is just another
    // request against the same write-once story (design §7.3, T-4.4).
    socket.on('reveal:requestPicture', () => {
      const room = findRoomForSocket(socket.id);
      if (!room) return;
      void handlePictureRequest(room, socket.id, io);
    });

    socket.on('reveal:retryPicture', () => {
      const room = findRoomForSocket(socket.id);
      if (!room) return;
      void handlePictureRequest(room, socket.id, io);
    });

    socket.on('game:ready', (payload) => {
      const room = findRoomForSocket(socket.id);
      if (!room) return;
      handleReadyToggle(room, socket.id, payload?.ready === true, io);
    });

    // Host-only; broadcasts the room gallery to every player (spec §24).
    // shareGallery itself emits the NOT_HOST error, so no ack or pre-check
    // is needed here.
    socket.on('gallery:share', () => {
      const room = findRoomForSocket(socket.id);
      if (!room) return;
      shareGallery(room, socket.id, io);
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
      broadcastStats(io);
    });

    // One-shot fetch for the Home screen (spec §13). Refreshes the
    // Worker-side image counter first (TTL-bounded — see
    // `maybeSyncImageCounter`), so a process that just restarted on Render's
    // free tier doesn't hand back a stale 0 for today's image count.
    socket.on('stats:get', async (ack) => {
      await maybeSyncImageCounter();
      ack(buildStats());
    });

    socket.on('disconnect', (reason) => {
      fastify.log.info({ socketId: socket.id, reason }, 'socket disconnected');
      // Defer the removal (spec §7). Only a window that elapses with no return
      // botifies or removes the player.
      disconnects.schedule(socket.id);
    });
  });

  return { fastify, io, disconnects };
}

async function main(): Promise<void> {
  const { fastify, io } = await buildServer();
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  fastify.log.info(`mounted under ${BASE_PATH}`);

  // Docker stops a container with SIGTERM and kills it 10 s later. Closing
  // runs the onClose hooks, among them the one that writes the visit counts
  // (analytics.ts) — without it a deploy would lose the counts since the last
  // periodic write. The timer bounds a close that hangs on a stuck socket.
  const shutdown = (signal: NodeJS.Signals): void => {
    fastify.log.info(`${signal}: closing`);
    setTimeout(() => process.exit(0), 5_000).unref();
    void io
      .close()
      .catch(() => {})
      .then(() => fastify.close())
      .finally(() => process.exit(0));
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);

  // Eager initial sync of the Worker-side daily counter. Fire-and-forget: a
  // Worker that's unreachable at startup must not block the server from
  // accepting connections. The first `stats:get` retries via the TTL path in
  // `maybeSyncImageCounter` regardless. Placed in `main()` rather than
  // `buildServer()` so tests (which call `buildServer()` directly) never
  // trigger a real network call.
  void syncImageCounterFromWorker();
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
