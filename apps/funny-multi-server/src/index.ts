// SPDX-License-Identifier: AGPL-3.0-only

// MUST be first — loads .env into process.env before any other module reads it.
import './env.js';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { Server as SocketIOServer } from 'socket.io';
import { isPackFree, normalizeBasePath } from '@funny/shared';
import type {
  ClientConfig,
  ClientToServerEvents,
  ErrorPayload,
  LobbyUpdatePayload,
  Room,
  ServerToClientEvents,
  SupportConfig,
} from './types.js';
import {
  RoomError,
  allRooms,
  createRoom,
  deleteRoom,
  findRoomForSocket,
  isValidLanguage,
  joinRoom,
  openPaidPack,
  packOnSale,
  removePlayer,
  validateNickname,
  type RemoveResult,
} from './rooms.js';
import {
  fillEmptySeats,
  generateBotStoryPictures,
  handleMidGameBotification,
  handlePictureRequest,
  handleReadyToggle,
  prepareRestart,
  shareGallery,
  startGame,
  submitAnswer,
  takePaidGameRecord,
} from './game.js';
import { createDisconnectRegistry, type DisconnectRegistry } from './disconnect.js';
import {
  RATE_WINDOW_MS,
  ROOM_CREATE_PER_MINUTE,
  ROOM_JOIN_PER_MINUTE,
  WRONG_CODES_PER_HOUR,
  WRONG_CODE_WINDOW_MS,
  clientIp,
  createRateLimiter,
} from './rateLimit.js';
import { browserFamily, openReceiptLog, type ReceiptLog } from './receipts.js';
import { createPackCodes, type CodeError, type PackCodes } from './codes.js';
import { maybeSyncImageCounter, syncImageCounterFromWorker } from './image.js';
import { buildStats, broadcastStats } from './stats.js';
import { createStatsStore, isBotAgent, summaryDays } from './analytics.js';
import { createGeo, type Geo } from './geo.js';
import { registerPayRoutes } from './payid.js';
import { registerSponsorsRoutes, sponsorsRail, type SponsorsSettings } from './sponsors.js';
import { registerAdminRoutes } from './admin.js';
import { registerInvitePreview } from './invitePreview.js';

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

// Step 79 (B-20): the directory geo.ts keeps DB-IP's monthly country file in.
// Unset, no visit's country is counted; docker-compose.yml points it into the
// stats volume.
const GEO_DIR = process.env.GEO_DIR || null;

// Step 122 (B-29): the paid codes' receipt log (receipts.ts). Unset keeps it in
// memory only; docker-compose.yml points it into the stats volume.
const RECEIPTS_FILE = process.env.RECEIPTS_FILE || null;

// Step 122: the secret every paid code is signed with (codes.ts). Unset, or
// shorter than 16 characters, every code is refused as not a code. In the
// VM's .env only, never in the repository: a new secret voids every code.
const PACK_CODE_SECRET = process.env.PACK_CODE_SECRET || null;

// Step 124 (owner decision D1 A, 2026-11-25): the admin page's own secret, the
// last part of its address (admin.ts). Its own so a leaked link is changed
// without voiding a code sold. Unset, or shorter than 16 characters, there is
// no admin page. In the VM's .env only, never in the repository.
const PACK_ADMIN_SECRET = process.env.PACK_ADMIN_SECRET || null;

// Step 125 (B-29): paying through GitHub Sponsors (sponsors.ts) — the pack's
// one-time tier, the number in its checkout link, and the secret set on the
// Sponsors webhook at GitHub. With DEPLOYER_SPONSORS_URL, both are needed
// for anything to sell through Sponsors. The secret in the VM's .env only.
const SPONSORS_TIER_ID = process.env.SPONSORS_TIER_ID || null;
const SPONSORS_WEBHOOK_SECRET = process.env.SPONSORS_WEBHOOK_SECRET || null;

// The English wire text of a refused code; the client shows its own words.
const CODE_MESSAGES: Record<CodeError | 'PACK_UNAVAILABLE', string> = {
  CODE_INVALID: 'That code is not right.',
  CODE_BLOCKED: 'This code no longer works.',
  CODE_ENDED: 'This edition has ended.',
  CODE_PENDING: 'This code is waiting for its payment.',
  PACK_UNAVAILABLE: 'This room cannot play the pack.',
};

// Visit and funnel events per IP per minute. A hub visit sends one or two and
// a game one a handful, so this only stops a script, while a family or a
// school behind one address stays far below it.
const STATS_EVENTS_PER_MINUTE = 60;

// Bounded disconnect grace windows (spec §7, FM-CORE-3). A seat waits for a
// dropped player for a window that depends on the phase. In a game it is
// 65 s, SRC's value (ACCEPTANCE B14): the others are waiting for that seat.
// In the lobby it is 10 min (Step 132): a phone closes the game socket while
// its owner is in a messenger sending the invite, and a lone host who stayed
// away 65 s used to lose the room before anyone could join it.
//
// A client that returns inside its window keeps its slot via Socket.IO
// connection-state recovery, so recovery must outlast both windows; and a
// removal throws the saved state away (forgetSession in buildServer), so a
// return after its window never recovers. A saved state is usable only while
// the last message the page received is still in Socket.IO's buffer, which
// keeps messages for the same span as the state. Every page therefore gets a
// mark each RECOVERY_MARK_MS: a page that leaves has had a message at most a
// minute before, so at the end of the lobby's window its last message is at
// most 11 min old, inside the 12 min kept.
export const LOBBY_GRACE_MS = 10 * 60_000;
export const DISCONNECT_GRACE_MS = 65_000;
export const RECOVERY_MARK_MS = 60_000;
export const RECOVERY_WINDOW_MS = LOBBY_GRACE_MS + 2 * RECOVERY_MARK_MS;

export type GameIO = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

export interface BuiltServer {
  fastify: FastifyInstance;
  io: GameIO;
  /** Pending disconnect-grace timers (T-2.4), exposed for tests. */
  disconnects: DisconnectRegistry;
  /** Step 122: the paid codes' receipt log and the codes, exposed for tests. */
  receipts: ReceiptLog;
  codes: PackCodes;
}

// Split out of SRC's monolithic main() so the transport shell is testable
// without binding a port or racing a listen (index.test.ts drives it via
// fastify.inject). main() below is the thin production entry point; T-2.2+
// register their socket handlers inside this function.
export interface BuildServerOptions {
  logger?: boolean;
  /**
   * Overrides the spec §7 removal window in a game (DISCONNECT_GRACE_MS).
   * Production never passes this. Tests use a few milliseconds so a grace
   * window can actually elapse inside a case.
   */
  disconnectGraceMs?: number;
  /** Step 132: overrides the lobby's removal window (LOBBY_GRACE_MS), for tests. */
  lobbyGraceMs?: number;
  /** Step 132: overrides the recovery mark's period (RECOVERY_MARK_MS), for tests. */
  recoveryMarkMs?: number;
  /** Overrides the BASE_PATH env var; tests use it to mount under a sub-path. */
  basePath?: string;
  /** Overrides the STATS_FILE env var; null keeps the counts in memory. */
  statsFile?: string | null;
  /**
   * Step 79: the country of a visit's address, for the country tally
   * (analytics.ts); left out, no country is counted. main() passes geo.ts's
   * lookup, tests a stand-in.
   */
  countryOf?: (ip: string) => string | null;
  /** Step 122: overrides the RECEIPTS_FILE env var; null keeps the log in memory. */
  receiptsFile?: string | null;
  /** Step 122: overrides the PACK_CODE_SECRET env var; null turns paid codes off. */
  packCodeSecret?: string | null;
  /** Step 124: overrides the PACK_ADMIN_SECRET env var; null, no admin page. */
  packAdminSecret?: string | null;
  /** Step 125: overrides the Sponsors rail's settings (DEPLOYER_SPONSORS_URL and SPONSORS_*). */
  sponsors?: Partial<SponsorsSettings>;
}

export async function buildServer({
  logger = true,
  disconnectGraceMs = DISCONNECT_GRACE_MS,
  lobbyGraceMs = LOBBY_GRACE_MS,
  recoveryMarkMs = RECOVERY_MARK_MS,
  basePath = BASE_PATH,
  statsFile = STATS_FILE,
  countryOf,
  receiptsFile = RECEIPTS_FILE,
  packCodeSecret = PACK_CODE_SECRET,
  packAdminSecret = PACK_ADMIN_SECRET,
  sponsors = {},
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
  // Step 76: the landing page's own ♥ reads the same answer at /api/config,
  // the one path its host's proxy forwards beside the stats (Caddyfile).
  const support: SupportConfig = {
    payId: process.env.DEPLOYER_PAYID || null,
    payIdName: process.env.DEPLOYER_PAYID_NAME || null,
    sponsorsUrl: process.env.DEPLOYER_SPONSORS_URL || null,
    lightningAddress: process.env.DEPLOYER_LIGHTNING_ADDRESS || null,
    kofiUrl: process.env.DEPLOYER_KOFI_URL || null,
    bmcUrl: process.env.DEPLOYER_BMC_URL || null,
    donateUrl: process.env.DEPLOYER_DONATE_URL || null,
  };

  // Step 122 (B-29): the paid codes and their receipt log. Made here, before
  // the routes, because /config says whether a pack is on sale (Step 123).
  const receipts = openReceiptLog({
    file: receiptsFile,
    onError: (err) => fastify.log.error(err, 'receipt log'),
  });
  const codes = createPackCodes({ secret: packCodeSecret, log: receipts });
  if (!codes.enabled) {
    fastify.log.warn(
      'PACK_CODE_SECRET is unset or under 16 characters: every paid code is refused and no pack is on sale',
    );
  }

  // Step 123 (B-29): `pay`, the pack on sale and the rail this visitor is
  // offered first (owner decision D2 A) — PayID where geo.ts places their
  // address in Australia, Sponsors anywhere else and wherever it cannot tell:
  // Sponsors takes a payment from Australia too, PayID from nowhere else. The
  // pay page lets the buyer switch. Null — no pay card, no price on the pay
  // page — without a secret to sign a code with, under PACK_ROOMS=off and
  // once the pack's free part is over (rooms.ts, packOnSale). The address is
  // looked up and dropped; the answer differs per visitor, so nothing may
  // cache it.
  const config = async (request: FastifyRequest, reply: FastifyReply): Promise<ClientConfig> => {
    reply.header('cache-control', 'no-store');
    const pack = codes.enabled ? packOnSale() : null;
    if (!pack) return { support, pay: null };
    const ip = clientIp(
      { headers: request.headers, address: request.socket.remoteAddress },
      TRUSTED_PROXY_HOPS,
    );
    return { support, pay: { pack, rail: countryOf?.(ip) === 'AU' ? 'payid' : 'sponsors' } };
  };
  fastify.get(`${base}config`, config);
  fastify.get(`${base}api/config`, config);

  // Step 124 (B-29): paying by PayID (payid.ts) and the owner's admin page
  // (admin.ts), where a PayID payment is matched to its code.
  const ipOf = (request: FastifyRequest): string =>
    clientIp(
      { headers: request.headers, address: request.socket.remoteAddress },
      TRUSTED_PROXY_HOPS,
    );
  registerPayRoutes(fastify, { base, codes, support, ipOf });
  // Step 125: and through GitHub Sponsors, whose webhook switches a code on.
  const rail = sponsorsRail({
    sponsorsUrl: support.sponsorsUrl,
    tierId: SPONSORS_TIER_ID,
    webhookSecret: SPONSORS_WEBHOOK_SECRET,
    ...sponsors,
  });
  if (!rail) {
    fastify.log.warn(
      'DEPLOYER_SPONSORS_URL, SPONSORS_TIER_ID or SPONSORS_WEBHOOK_SECRET is unset: nothing sells through Sponsors',
    );
  }
  registerSponsorsRoutes(fastify, {
    base,
    codes,
    receipts,
    rail,
    ipOf,
    onSponsorship: (outcome) => fastify.log.info({ outcome }, 'sponsorship'),
  });
  const admin = registerAdminRoutes(fastify, {
    base,
    secret: packAdminSecret,
    codes,
    receipts,
    ipOf,
  });
  if (!admin) fastify.log.warn('PACK_ADMIN_SECRET is unset or under 16 characters: no admin page');

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
    // Step 79: the address is looked up and dropped; only a visit's country
    // is counted.
    return reply.code(visits.record(event, countryOf?.(ip)) ? 204 : 400).send();
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
  //
  // Step 126: the bundle's home itself has a route of its own, so a Christmas
  // room's join link can carry a preview (invitePreview.ts); every other
  // request for it gets the same index.html as before.
  if (NODE_ENV === 'production') {
    await fastify.register(fastifyStatic, { root: CLIENT_DIST, prefix: base });
    registerInvitePreview(fastify, { base, indexFile: join(CLIENT_DIST, 'index.html') });
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

  // Step 132: the recovery mark (see RECOVERY_MARK_MS). No page listens for
  // it; receiving it moves the page's last-message offset forward, so a quiet
  // lobby stays recoverable however long it waits before someone leaves it.
  const recoveryMark = setInterval(() => io.emit('recovery:mark'), recoveryMarkMs);
  recoveryMark.unref();
  fastify.addHook('onClose', async () => {
    clearInterval(recoveryMark);
  });

  // Step 132: a removed player's saved connection state is thrown away, so a
  // page that returns after its window gets a fresh connection (and goes
  // Home, App.tsx) instead of recovering into a seat a bot now holds, or one
  // that is gone. socket.io-adapter 2.5 keeps a state after it is used and has
  // no call to drop one, so this reaches into its map, which is keyed by the
  // private id and holds the public one as `sid`. disconnect.socket.test.ts
  // pins the behaviour: an upgrade that changes the map fails there.
  type SavedStates = Map<string, { sid?: unknown }>;
  const savedStates = (): SavedStates | null => {
    const sessions = (io.of('/').adapter as unknown as { sessions?: unknown }).sessions;
    return sessions instanceof Map ? (sessions as SavedStates) : null;
  };
  if (!savedStates()) {
    fastify.log.error('Socket.IO saved states not found: a removed player could recover');
  }
  function forgetSession(socketId: string): void {
    const states = savedStates();
    if (!states) return;
    for (const [pid, state] of states) if (state.sid === socketId) states.delete(pid);
  }

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

  // ---- Step 122: the paid code (B-29) -------------------------------------
  //
  // A code arrives with room:create (the website remembers it, or its link
  // carries it) or with any player's room:unlock. A good one opens the room's
  // pack from its next game; each opening and each paid game is a receipt
  // record (`receipts` and `codes`, made above for /config). Wrong codes are
  // limited per address (rateLimit.ts): only a wrong one takes a token, so a
  // family's good code never waits.
  const wrongCodeLimiter = createRateLimiter({
    capacity: WRONG_CODES_PER_HOUR,
    intervalMs: WRONG_CODE_WINDOW_MS,
  });

  /** Writes the receipt record of a paid game being left, if it was one. */
  function flushPaidGame(room: Room): void {
    const record = takePaidGameRecord(room);
    if (record) receipts.append(record);
  }
  fastify.addHook('onClose', async () => {
    wrongCodeLimiter.stop();
    // A deploy ends every game in progress (B-27): a paid one keeps its record.
    for (const room of allRooms()) flushPaidGame(room);
  });

  /**
   * A paid code offered for `room` at its creation or by room:unlock: null
   * when it opened the room's pack, or a code already had; otherwise why not.
   */
  function applyCode(
    room: Room,
    raw: unknown,
    how: 'create' | 'unlock',
    ip: string,
    userAgent: string | undefined,
  ): ErrorPayload | null {
    if (!wrongCodeLimiter.peek(ip)) {
      return { code: 'RATE_LIMITED', message: 'Too many wrong codes. Try again later.' };
    }
    const verdict = codes.check(raw);
    if (!verdict.ok) {
      if (verdict.error === 'CODE_INVALID') wrongCodeLimiter.take(ip);
      return { code: verdict.error, message: CODE_MESSAGES[verdict.error] };
    }
    const opened = openPaidPack(room, verdict.pack, verdict.code);
    if (opened === false) {
      return { code: 'PACK_UNAVAILABLE', message: CODE_MESSAGES.PACK_UNAVAILABLE };
    }
    if (opened === 'opened') {
      const country = countryOf?.(ip) ?? null;
      receipts.append({
        type: 'room',
        code: verdict.code,
        how,
        room: room.code,
        lang: room.language,
        players: room.players.filter((p) => !p.isBot).length,
        country: country && /^[A-Z]{2}$/u.test(country) ? country : 'ZZ',
        browser: browserFamily(userAgent),
      });
    }
    return null;
  }

  /**
   * A paid room's code, checked again just before each game: one blocked,
   * lapsed (a PayID claim's 48 hours) or ended since the room opened plays
   * the free part from this game on — or no pack at all once the free part
   * has ended too, so no lobby promises golden stories the game cannot have.
   * True when the room changed.
   */
  function recheckCode(room: Room): boolean {
    if (!room.pack?.paid) return false;
    if (room.packCode && codes.check(room.packCode).ok) return false;
    room.pack = isPackFree(room.pack.id, Date.now()) ? { ...room.pack, paid: false } : null;
    room.packCode = null;
    return true;
  }

  function broadcastLobby(room: Room): void {
    const payload: LobbyUpdatePayload = {
      players: room.players,
      hostId: room.hostId,
      pack: room.pack,
    };
    io.to(room.code).emit('lobby:update', payload);
  }

  // ---- T-2.4: disconnect grace window (spec §7, FM-CORE-3) ----------------
  //
  // A dropped socket is not removed at once. It is removed only if the grace
  // window elapses with no return — which is what makes a tunnel, a locked
  // phone or a Wi-Fi handover survivable mid-game (FM-CORE-3). The window is
  // the lobby's when the socket drops in a lobby, the game's otherwise; Start
  // ends every lobby window still running (game:start below).

  /**
   * Runs the real removal — either because a grace window elapsed with no
   * return, or because the player left on purpose. Returns the removal result
   * so an explicit leave can also drop the socket from its Socket.IO room.
   */
  function finalizePlayerRemoval(socketId: string): RemoveResult | null {
    // First, and whether or not the socket had a seat: once its window is
    // over, nothing may recover into this id (Step 132).
    forgetSession(socketId);
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
    // A room gone with its last player takes its paid game's record along.
    if (result.deleted) flushPaidGame(result.room);
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
    const userAgent = socket.handshake.headers['user-agent'];

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
        // Step 122: a refused code still makes the room, a free one, and the
        // ack says why: the error event is for no room at all.
        const code = payload.code;
        const codeError =
          typeof code === 'string' && code.trim() !== ''
            ? applyCode(room, code, 'create', ip, userAgent)
            : null;
        ack({ roomCode: room.code, socketId: socket.id, ...(codeError ? { codeError } : {}) });
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

    // Step 117 (owner decision 3A): the host's Christmas switch, in the lobby
    // only — "one more game" restarts without a lobby and keeps the switch as
    // it was. A room offered no pack has nothing to switch, and a payload that
    // is not a boolean changes nothing.
    socket.on('room:setPack', (payload) => {
      const room = findRoomForSocket(socket.id);
      if (!room) {
        socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'No room.' });
        return;
      }
      if (room.hostId !== socket.id) {
        socket.emit('error', { code: 'NOT_HOST', message: 'Only the host can change this.' });
        return;
      }
      if (room.phase !== 'lobby') {
        socket.emit('error', { code: 'ROOM_LOCKED', message: 'Game already started.' });
        return;
      }
      if (!room.pack || typeof payload?.on !== 'boolean') return;
      room.pack = { ...room.pack, on: payload.on };
      broadcastLobby(room);
    });

    // Step 122 (B-29 #4, "unlock the room you're in"): any player, at any
    // point of the room. The code opens the pack from the next game, the
    // first if the room is still in its lobby, and nobody leaves or rejoins.
    socket.on('room:unlock', (payload, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      const room = findRoomForSocket(socket.id);
      if (!room || room.phase === 'ended') {
        reply({ error: { code: 'ROOM_NOT_FOUND', message: 'No room.' } });
        return;
      }
      const error = applyCode(room, payload?.code, 'unlock', ip, userAgent);
      if (error) {
        reply({ error });
        return;
      }
      reply({ ok: true });
      broadcastLobby(room);
    });

    // Step 122: a paid story saved or shared, for its game's receipt record.
    socket.on('story:exported', (payload) => {
      const room = findRoomForSocket(socket.id);
      const game = room?.phase === 'reveal' ? room.paidGame : null;
      if (!game) return;
      if (payload?.kind === 'download') game.downloads++;
      else if (payload?.kind === 'share') game.shares++;
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
      // Step 132: Start ends every lobby window. A player still away is
      // dropped as a lobby leaver is, and a page of theirs that comes back
      // later goes Home; the bots below then take the seats up to three.
      for (const player of [...room.players]) {
        if (player.id !== socket.id && disconnects.cancel(player.id)) {
          fastify.log.info({ socketId: player.id }, 'away player dropped at start');
          finalizePlayerRemoval(player.id);
        }
      }
      // Step 130 (B-29 #1): no minimum any more — the host alone starts, and
      // bots take the seats up to three (FM-BOT-3).
      // SRC hard-locked room.wobbleEngine here and re-broadcast the lobby so
      // every joiner recorded with the same engine. Both are gone with the
      // field (DD-9). Step 122 broadcasts again when a paid room's code no
      // longer works, so every client knows this game is not paid; Step 130
      // when bots were seated, so every client has the game's roster.
      const changed = recheckCode(room);
      if (fillEmptySeats(room) > 0 || changed) broadcastLobby(room);
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
      flushPaidGame(room);
      recheckCode(room);
      fillEmptySeats(room);
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
      flushPaidGame(room);
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
      // botifies or removes the player; a lobby waits longer (Step 132).
      const room = findRoomForSocket(socket.id);
      disconnects.schedule(socket.id, room?.phase === 'lobby' ? lobbyGraceMs : disconnectGraceMs);
    });
  });

  return { fastify, io, disconnects, receipts, codes };
}

async function main(): Promise<void> {
  // Step 79: the country lookup downloads its table, so, like the counter
  // sync below, it is made here and never in a test. It is in place before
  // the listen, so no visit comes before it.
  let geo: Geo | null = null;
  const { fastify, io } = await buildServer({
    countryOf: GEO_DIR ? (ip) => geo?.country(ip) ?? null : undefined,
  });
  geo = createGeo({
    dir: GEO_DIR,
    onError: (err) => fastify.log.error(err, 'country table'),
    onLoad: (load) => fastify.log.info(load, 'country table'),
  });
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
