// SPDX-License-Identifier: AGPL-3.0-only

// Copied from SRC/server/src/rooms.ts (design §3: "copy"). Room lifecycle,
// code generation, capacity ceiling and nickname rules are unchanged — the
// answer-pool and picture changes this project makes do not touch any of it.
//
// Two edits only:
//   1. `shared` -> `@funny/shared`.
//   2. `wobbleEngine` removed from createRoom's signature and from the Room it
//      builds (ARC-3 / DD-9 — the field is gone from the protocol, so a server
//      that still set it would not typecheck).
//
// NOT here: the §17 rate limiter. SRC's spec mandates it and SRC's own
// DEPLOYMENT.md documents it, but SRC never implemented it — see rateLimit.ts,
// which is written from the spec rather than copied.

import { customAlphabet } from 'nanoid';
import { AUTHORED_LANGUAGES, type AuthoredLanguage } from '@funny/shared';
import type { ErrorCode, Language, Player, Room } from './types.js';

// Constants from spec §17.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
export const MAX_PLAYERS = 7;
const NICKNAME_MIN = 3;
const NICKNAME_MAX = 20;
const MAX_ROOMS_DEFAULT = 500;

const generateCode = customAlphabet(CODE_ALPHABET, CODE_LENGTH);

// Single in-process room store. No persistence; no Redis. See spec §18.
const rooms = new Map<string, Room>();

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function findRoomForSocket(socketId: string): Room | null {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.id === socketId)) return room;
  }
  return null;
}

export function roomCount(): number {
  return rooms.size;
}

export function getMaxRooms(): number {
  const v = Number(process.env.MAX_ROOMS);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : MAX_ROOMS_DEFAULT;
}

export class RoomError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'RoomError';
  }
}

export type ValidationResult = { ok: true; nickname: string } | { ok: false; message: string };

export function validateNickname(raw: unknown): ValidationResult {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (trimmed.length < NICKNAME_MIN) {
    return { ok: false, message: `Nickname must be at least ${NICKNAME_MIN} characters.` };
  }
  if (trimmed.length > NICKNAME_MAX) {
    return { ok: false, message: `Nickname must be at most ${NICKNAME_MAX} characters.` };
  }
  return { ok: true, nickname: trimmed };
}

/**
 * A room's content language must be one the server can *fully* render: the 7
 * questions, the prose template, and a complete set of pool display texts.
 *
 * Narrowed from SRC (T-2.3). SRC checked `isLanguage`, accepting all 15,
 * because its answers were free text and its stand-ins existed for every
 * language. Here, `POOL_TEXTS` and `src/i18n/*.json` cover en and ru until
 * T-6.2/T-6.3, so accepting `de` would create a room that plays fine for seven
 * rounds and then throws at reveal — the worst possible moment, with the whole
 * story already written. Rejecting at creation is the honest failure.
 *
 * Widening is a one-line change in the shared package: T-6.3 extends
 * `AuthoredLanguage` to the full `Language` union and this follows, as does the
 * i18n boot check. Deliberately keyed to that same union rather than a local
 * list, so the three cannot drift apart.
 */
export function isValidLanguage(value: unknown): value is AuthoredLanguage {
  return typeof value === 'string' && (AUTHORED_LANGUAGES as readonly string[]).includes(value);
}

export function createRoom(nickname: string, language: Language, hostSocketId: string): Room {
  if (rooms.size >= getMaxRooms()) {
    throw new RoomError('SERVER_BUSY', 'Server at capacity. Please try again later.');
  }
  let code = generateCode();
  while (rooms.has(code)) code = generateCode();

  const player: Player = { id: hostSocketId, nickname, isBot: false };
  const room: Room = {
    code,
    hostId: hostSocketId,
    language,
    players: [player],
    phase: 'lobby',
    currentRound: 0,
    stories: [],
    submittedThisRound: new Set(),
    roundDeadline: null,
    roundTimer: null,
    readyForRestart: new Set(),
    galleryShared: false,
  };
  rooms.set(code, room);
  return room;
}

// Removes a room from the store. Called when the host ends the game (spec §5
// game:end) — the game is in-memory only, so the room is simply discarded.
export function deleteRoom(code: string): void {
  const room = rooms.get(code);
  if (room?.roundTimer) clearTimeout(room.roundTimer as NodeJS.Timeout);
  rooms.delete(code);
}

export function joinRoom(rawCode: unknown, nickname: string, socketId: string): Room {
  const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
  const room = rooms.get(code);
  if (!room) throw new RoomError('ROOM_NOT_FOUND', 'Room not found.');
  if (room.phase !== 'lobby') {
    throw new RoomError('ROOM_LOCKED', 'This game has already started.');
  }
  if (room.players.length >= MAX_PLAYERS) {
    throw new RoomError('ROOM_FULL', 'Room is full.');
  }
  // Idempotent re-join for the same socket — happens if the client retries
  // the ack handler. Don't duplicate the slot.
  if (room.players.some((p) => p.id === socketId)) return room;
  room.players.push({ id: socketId, nickname, isBot: false });
  return room;
}

export interface RemoveResult {
  room: Room;
  deleted: boolean;
  // True when removal happened during a 'playing' or 'reveal' phase — the
  // player stays in players[] as a bot. The caller (game runner) needs to
  // auto-fill their current-round answer and check whether the round
  // advances. False for lobby-phase removals.
  becameBot: boolean;
}

// Returns the room the player was in (with mutations applied) or null when
// they weren't in any room.
export function removePlayer(socketId: string): RemoveResult | null {
  for (const room of rooms.values()) {
    const idx = room.players.findIndex((p) => p.id === socketId);
    if (idx === -1) continue;

    // Game phase (spec §7): mark as bot, don't remove (rotation integrity).
    if (room.phase !== 'lobby') {
      room.players[idx] = { ...room.players[idx]!, isBot: true };

      // Host promotion if host botified.
      if (room.hostId === socketId) {
        const next = room.players.find((p) => !p.isBot);
        if (next) room.hostId = next.id;
      }

      // All-bots room: delete immediately (spec §7).
      if (room.players.every((p) => p.isBot)) {
        if (room.roundTimer) clearTimeout(room.roundTimer as NodeJS.Timeout);
        rooms.delete(room.code);
        return { room, deleted: true, becameBot: true };
      }

      return { room, deleted: false, becameBot: true };
    }

    // Lobby phase: splice the player out.
    room.players.splice(idx, 1);

    if (room.players.length === 0) {
      rooms.delete(room.code);
      return { room, deleted: true, becameBot: false };
    }

    // Host left? Promote next non-bot. In lobby there are no bots, so it's
    // just players[0], but the check is correct for the unified case.
    if (room.hostId === socketId) {
      const next = room.players.find((p) => !p.isBot);
      if (next) room.hostId = next.id;
    }
    return { room, deleted: false, becameBot: false };
  }
  return null;
}

// Test-only: the store is module-level singleton state, so suites that create
// rooms must be able to reset it between cases. Not called by production code.
export function __resetRoomsForTest(): void {
  for (const room of rooms.values()) {
    if (room.roundTimer) clearTimeout(room.roundTimer as NodeJS.Timeout);
  }
  rooms.clear();
}
