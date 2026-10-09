// SPDX-License-Identifier: AGPL-3.0-only

// Socket contract, adapted from SRC/shared/events.ts per design §5. Everything
// not called out as a delta below is carried from SRC unchanged, including the
// event names — the client screens are copied wholesale in Phase 3 and must
// keep working against this shape.
//
// Deltas from SRC, all of them consequences of the two defining changes
// (players pick from pools instead of typing; pictures travel as URLs):
//
//   1. `RoundSubmitPayload.answer` → `optionId` (FM-ANS-2, DD-1). The wire
//      carries a pool id the server validates; there is no free text anywhere
//      in the protocol.
//   2. `Story.answers` holds option **ids**; `Story.pictureUrl` → `picture:
//      PictureRef`.
//   3. `PictureRef` replaces every base64 `pictureUrl` (FM-IMG-3, DD-5).
//   4. New error code `INVALID_OPTION`.
//   5. `WobbleEngine` and every `wobbleEngine` field are gone (ARC-3, DD-9) —
//      the CSS recorder is the only engine, so the field would be a lie.
//      `GameStartPayload` held nothing else and is dropped with it; `game:start`
//      now takes no payload.
//
// Deliberately NOT here: `entitlementToken` on `room:create` and `Room.premium`.
// The Polar premium design (design §10) they belonged to was superseded by
// D-6's support rails (`SupportConfig` below) before either shipped.

import type { Language } from './languages.js';
import type { OptionId } from './pools/schema.js';

// ============================================================================
// Core data model (spec §4)
// ============================================================================

export type RoomPhase = 'lobby' | 'playing' | 'reveal' | 'ended';

export interface Player {
  // socket.id — rotates on each connection; no stable identity across reconnects.
  id: string;
  nickname: string;
  // True when this slot's real player disconnected mid-game.
  isBot: boolean;
}

/**
 * A generated picture, by reference (FM-IMG-3, DD-5).
 *
 * Replaces SRC's base64 data URL on every payload that carried one. The socket
 * never moves image bytes: `url` points at the Worker's `/i/<sha256>.png`
 * route, which serves from R2 with immutable cache headers and permissive CORS
 * (design §7.2). `width`/`height` are the fixed generation dimensions, sent so
 * the client can reserve layout space and avoid a reflow when the image lands.
 */
export interface PictureRef {
  url: string;
  width: number;
  height: number;
}

export interface Story {
  /**
   * Length 7; index = question number (0–6); null = not answered yet.
   *
   * These are **option ids** (`who.grumpy-pirate`), not display text — the
   * language-neutral wire format from DD-1, which is what lets a room's content
   * language differ from any player's UI language. Ids resolve to text only at
   * reveal, against the room language — and, since B-15, on each client in a
   * language of its own (`RevealStartPayload.optionIds`). Note that
   * `RevealStartPayload.answers` and `GalleryEntry.answers` use the same field
   * name for the *resolved texts*; see the warning on those types.
   */
  answers: (OptionId | null)[];
  // Set once, never overwritten.
  picture: PictureRef | null;
}

// Opaque server-side timer handle. Treat as unknown on the client;
// cast to NodeJS.Timeout on the server where @types/node is available.
export type ServerTimerHandle = unknown;

export interface Room {
  // 6-char nanoid from the unambiguous alphabet, uppercase. See spec §17.
  code: string;
  // socket.id of current host.
  hostId: string;
  // Content language: questions, pool texts and prose. Independent of the
  // language any individual player reads the UI in.
  language: Language;
  // Multi-language room (B-15): every client plays and reads in its own
  // player's language instead of `language`. Server-side nothing else changes —
  // the wire already carries option ids (DD-1), so each client renders them in
  // its own language from the same shared build; the server still renders
  // `round:start.question` and the reveal/gallery texts in `language`.
  multiLanguage: boolean;
  // Locked at game:start; order drives rotation.
  players: Player[];
  phase: RoomPhase;
  // 0–6 = writing rounds; 7 = reveal.
  currentRound: number;
  // stories[i] belongs to players[i] at round 0.
  stories: Story[];
  // socket.ids that have submitted this round.
  submittedThisRound: Set<string>;
  // Epoch ms.
  roundDeadline: number | null;
  roundTimer: ServerTimerHandle | null;
  // socket.ids of non-bot players who toggled "ready" on the end screen
  // (spec §5 game:ready / game:restartReady). Cleared on restart.
  readyForRestart: Set<string>;
  // True once the host has shared the room gallery (spec §24). While set, a
  // late-arriving picture re-broadcasts gallery:ready so the gallery self-heals.
  galleryShared: boolean;
}

// ============================================================================
// Error codes (spec §5)
// ============================================================================

export type ErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_LOCKED'
  | 'ROOM_FULL'
  | 'NOT_HOST'
  | 'NOT_ENOUGH_PLAYERS'
  | 'INVALID_NICKNAME'
  | 'RATE_LIMITED'
  | 'SERVER_BUSY'
  // NEW (FM-ANS-2) — submitted id is not in this round's pool. An honest client
  // cannot produce it: the options come from the same shared package the server
  // validates against. A dishonest one gets no submitted mark and is
  // timer-autofilled like anyone who never answered.
  | 'INVALID_OPTION';

export interface ErrorPayload {
  code: ErrorCode;
  message: string;
}

// ============================================================================
// Client → Server event payloads (spec §5)
// ============================================================================

export interface RoomCreatePayload {
  nickname: string;
  language: Language;
  // B-15. Absent (an older client) means false.
  multiLanguage?: boolean;
}

export interface RoomCreateAck {
  roomCode: string;
  socketId: string;
}

export interface RoomJoinPayload {
  roomCode: string;
  nickname: string;
}

// Discriminated union: error branch when join fails, success branch otherwise.
export type RoomJoinAck =
  | { error: ErrorPayload }
  | {
      socketId: string;
      players: Player[];
      language: Language;
      hostId: string;
      // B-15: the joiner keeps its own language instead of taking `language`.
      multiLanguage: boolean;
    };

export interface RoundSubmitPayload {
  /**
   * The picked option's id, which must belong to the current round's slot pool
   * (FM-ANS-2). Unlike SRC's `answer`, an empty value is not meaningful: a
   * player who picks nothing simply never submits and is auto-filled when the
   * timer expires (FM-BOT-2), so there is no empty-string branch to handle.
   */
  optionId: OptionId;
}

export interface GameReadyPayload {
  ready: boolean;
}

// ============================================================================
// Server → Client event payloads (spec §5)
// ============================================================================

export interface LobbyUpdatePayload {
  players: Player[];
  hostId: string;
}

// The `support` object of the GET /config response (T-9.3, FM-TIER-3, design
// §10.2). Read once at server boot from the DEPLOYER_* env vars; each field is
// null when its var is unset. Fetched over REST, not a socket event, so it can
// be shown on Home before any room exists.
export interface SupportConfig {
  payId: string | null;
  payIdName: string | null;
  sponsorsUrl: string | null;
  lightningAddress: string | null;
  donateUrl: string | null;
}

export interface RoundStartPayload {
  roundNumber: number;
  // Question text in the room's language.
  question: string;
  // Epoch ms; client computes remaining time from its own Date.now().
  deadline: number;
}

// Unchanged from SRC, and deliberately so (DD-2): the options themselves are
// NOT on this payload. The client bundles the same @funny/shared build as the
// server and renders the combobox for (roundNumber, room.language) locally, so
// the protocol does not grow with pool size and the two sides cannot disagree
// about pool content — they ship as one unit. The same holds for the question
// in a multi-language room (B-15): each client shows `QUESTIONS[its own
// language][roundNumber]` and ignores `question`.

export interface RoundWaitingPayload {
  submitted: number;
  total: number;
}

export interface RevealStartPayload {
  /**
   * This player's 7 answers as **resolved display texts** in the room language
   * — not the option ids stored on `Story.answers`. Same field name as SRC on
   * purpose: the copied client screens highlight these phrases inside `prose`
   * (client/src/prose.ts), so they must be the literal strings the prose was
   * rendered from.
   */
  answers: string[];
  // Rendered story in the room's language.
  prose: string;
  /**
   * The same 7 answers as **option ids** (`Story.answers`), so the client can
   * re-render the story in any language from the shared build (B-15): the
   * player's own language in a multi-language room, or whichever the
   * on-page language switch picks.
   */
  optionIds: (OptionId | null)[];
}

export interface RevealPictureReadyPayload {
  picture: PictureRef;
  // The exact prompt sent to the image Worker — displayed under the
  // picture for debugging which slots the model honored.
  imagePrompt: string;
}

// Discriminator for the reveal:pictureError UX (item 4 of
// BUGS_AND_IMPROVEMENTS_02.md). `CAP_REACHED` lets the client switch to
// the i18n-friendly "oven is full, new cartoons in ~N hours" caption and
// compute the hours-until-reset locally. `GENERIC` (the default when the
// field is absent) keeps the legacy "Generation failed" UX. The wire
// `message` field stays as an English fallback so older clients that
// don't know about `code` still show something sensible.
export type RevealPictureErrorCode = 'CAP_REACHED' | 'GENERIC';

export interface RevealPictureErrorPayload {
  message: string;
  code?: RevealPictureErrorCode;
}

export interface GameRestartReadyPayload {
  readyIds: string[];
}

// Sent to the host when a player is lost — i.e. botified after the §7 grace
// window elapsed with no return (spec §12 host notice).
export interface PlayerLostPayload {
  nickname: string;
}

// Server stats fetched by the Home screen via stats:get (spec §13, §15, §26).
export interface StatsPayload {
  // Number of rooms currently open on this server.
  openRooms: number;
  // AI pictures generated since 00:00 UTC, process-global counter (§11, §17).
  // Counts real generations only: an R2 cache hit costs no slot (FM-TIER-1, DD-6).
  imagesGeneratedToday: number;
  // Daily image cap (`MAX_IMAGES_PER_DAY`); the host can derive "remaining"
  // as imagesLimit - imagesGeneratedToday.
  imagesLimit: number;
  // True when the server can still make a new picture (the Worker's generation
  // switch, T-9.2a). False for a library-only deployment (D-7), where every
  // picture is pre-generated and the cap limits nothing — the Home screen
  // leaves its cap caption out then (B-13).
  liveGeneration: boolean;
}

// One story + its generated picture, for the shared room gallery (spec §24).
export interface GalleryEntry {
  nickname: string;
  isBot: boolean;
  // This story's 7 answers as resolved display texts, for inline phrase
  // highlighting — same contract as RevealStartPayload.answers above.
  answers: string[];
  // Rendered story in the room's language.
  prose: string;
  // The answers as option ids, for re-rendering in another language — same
  // contract as RevealStartPayload.optionIds above (B-15).
  optionIds: (OptionId | null)[];
  // null when no picture exists — a bot slot, or a human whose generation was
  // skipped or failed.
  picture: PictureRef | null;
}

export interface GalleryReadyPayload {
  // One entry per player slot, in players[] order.
  entries: GalleryEntry[];
}

// ============================================================================
// Socket event name maps (for typed socket.io on both sides)
// ============================================================================

export interface ClientToServerEvents {
  'room:create': (payload: RoomCreatePayload, ack: (response: RoomCreateAck) => void) => void;
  'room:join': (payload: RoomJoinPayload, ack: (response: RoomJoinAck) => void) => void;
  'room:leave': () => void;
  // Payload-free since the wobbleEngine choice was removed (DD-9).
  'game:start': () => void;
  'round:submit': (payload: RoundSubmitPayload) => void;
  'reveal:requestPicture': () => void;
  'reveal:retryPicture': () => void;
  'game:ready': (payload: GameReadyPayload) => void;
  'game:restart': () => void;
  'game:end': () => void;
  // Host only; broadcasts the room gallery to every player (spec §24).
  'gallery:share': () => void;
  // One-shot fetch of server stats for the Home screen (spec §13).
  'stats:get': (ack: (response: StatsPayload) => void) => void;
}

export interface ServerToClientEvents {
  'lobby:update': (payload: LobbyUpdatePayload) => void;
  'round:start': (payload: RoundStartPayload) => void;
  'round:waiting': (payload: RoundWaitingPayload) => void;
  'reveal:start': (payload: RevealStartPayload) => void;
  'reveal:pictureReady': (payload: RevealPictureReadyPayload) => void;
  'reveal:pictureError': (payload: RevealPictureErrorPayload) => void;
  'game:restartReady': (payload: GameRestartReadyPayload) => void;
  'game:over': () => void;
  // Host-only: a player was lost (botified after the grace window — spec §12).
  'player:lost': (payload: PlayerLostPayload) => void;
  // The shared room gallery — sent to every player after the host shares, and
  // re-sent when a late picture arrives (spec §24).
  'gallery:ready': (payload: GalleryReadyPayload) => void;
  // Live broadcast of the server-stats payload (spec §26). Fired whenever
  // openRooms or imagesGeneratedToday changes — pairs with the one-shot
  // stats:get fetch so the host's Home-screen counter ticks visibly
  // rather than only updating on remount (item 22 of
  // BUGS_AND_IMPROVEMENTS_01.md). Broadcast to every connected socket;
  // non-Home-screen clients simply ignore it.
  'stats:update': (payload: StatsPayload) => void;
  error: (payload: ErrorPayload) => void;
}
