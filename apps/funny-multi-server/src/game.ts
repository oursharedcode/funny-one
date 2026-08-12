// SPDX-License-Identifier: AGPL-3.0-only

// Round flow, adapted from SRC/server/src/game.ts per design §6.
// → FM-CORE-5..8, FM-BOT-1/2, FM-ANS-2/4/5
//
// The shape of the round loop is SRC's and is deliberately unchanged: bots fill
// at the top of each round, humans submit, the round advances on the last
// submission or on the 60 s timer, and after 7 rounds every non-bot player gets
// their own assembled story. What changed is what an answer *is*.
//
// Deltas from SRC:
//
//  1. **`storyIndex` is imported, not defined.** T-1.2 extracted it to
//     `@funny/shared` (FM-ARC-2) so the client can compute the same rotation.
//     SRC's copy stays in SRC.
//
//  2. **`submitAnswer` validates an option id** against the current round's
//     pool (FM-ANS-2, DD-1). Invalid → `INVALID_OPTION` and *no* submitted
//     mark, so a dishonest client is timer-autofilled like anyone who never
//     answered. There is no truncation and no profanity filter: SRC needed both
//     because answers were free text, and DD-8 deletes that stack outright.
//
//  3. **Auto-fill picks from the pool, not a stand-in list.** SRC's
//     `pickStandin` returned one of a handful of canned strings per language;
//     bots now draw uniformly from the same pool humans pick from, excluding
//     ids already used at this slot in this room this round (design §6) so a
//     room of bots does not produce seven identical stories.
//
//  4. **Reveal resolves ids to display texts** in the room language before
//     rendering prose. `Story.answers` holds ids; `RevealStartPayload.answers`
//     holds the resolved texts the client highlights inside the prose.
//
// Not here, by task boundary: picture generation and `reveal:pictureReady`
// (Phase 4 — T-4.4), the room gallery (T-5.1), and `broadcastStats` (T-5.3).
// SRC's `enterRevealPhase` kicked off bot-story pictures; that call arrives
// with T-4.4.

import type { Server as SocketIOServer } from 'socket.io';
import {
  POOLS,
  POOL_TEXTS,
  SLOT_COUNT,
  storyIndex,
  type OptionId,
  type SlotIndex,
} from '@funny/shared';
import type {
  ClientToServerEvents,
  ErrorPayload,
  Room,
  ServerToClientEvents,
  Story,
} from './types.js';
import { QUESTIONS, renderProse, requireAuthoredLanguage } from './i18n/index.js';
import { polishProse } from './grammar.js';

// One round per pool slot. Tied to the shared schema rather than restated, so
// adding a slot cannot silently leave a round unplayed.
export const ROUNDS = SLOT_COUNT;
export const ROUND_DURATION_MS = Number(process.env.ROUND_DURATION_MS ?? 60_000);

type IO = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

// Membership lookup per slot, built once. `submitAnswer` runs on every player
// keystroke-equivalent (one per round per player), so this stays O(1) rather
// than scanning a 22-element array.
const POOL_IDS: readonly ReadonlySet<OptionId>[] = Array.from(
  { length: SLOT_COUNT },
  (_, slot) => new Set(POOLS[slot as SlotIndex].map((o) => o.id)),
);

function slotOf(round: number): SlotIndex {
  return round as SlotIndex;
}

// ============================================================================
// Game lifecycle
// ============================================================================

export function startGame(room: Room, io: IO): void {
  room.phase = 'playing';
  room.currentRound = 0;
  room.galleryShared = false; // reset for a restarted game
  room.stories = room.players.map<Story>(() => ({
    answers: new Array<OptionId | null>(ROUNDS).fill(null),
    picture: null,
  }));
  startRound(room, io);
}

function startRound(room: Room, io: IO): void {
  room.submittedThisRound = new Set();

  // Bots get auto-filled at the top of every round (spec §17).
  for (const p of room.players) {
    if (p.isBot) autoFillFor(room, p.id);
  }

  room.roundDeadline = Date.now() + ROUND_DURATION_MS;

  io.to(room.code).emit('round:start', {
    roundNumber: room.currentRound,
    question: QUESTIONS[requireAuthoredLanguage(room.language)][room.currentRound] ?? '???',
    deadline: room.roundDeadline,
  });

  clearRoundTimer(room);
  room.roundTimer = setTimeout(() => {
    advanceRound(room, io);
  }, ROUND_DURATION_MS);

  // If every slot is a bot they are all filled already — advance immediately.
  maybeAdvance(room, io);
}

/**
 * Handles `round:submit` (FM-ANS-2). Returns nothing; errors reach the player
 * on the `error` event.
 *
 * An out-of-pool id is rejected *without* a submitted mark. An honest client
 * cannot produce one — its options come from the same `@funny/shared` build the
 * server validates against, deployed as one unit (DD-2) — so the case only
 * arises from a tampered client, which then gets auto-filled at the deadline
 * exactly like a silent one. Marking it submitted would let a crafted payload
 * skip a slot and leave a hole in someone's story.
 */
export function submitAnswer(room: Room, socketId: string, optionId: unknown, io: IO): void {
  if (room.phase !== 'playing') return;
  if (room.submittedThisRound.has(socketId)) return;

  const playerIdx = room.players.findIndex((p) => p.id === socketId);
  if (playerIdx === -1) return;
  const player = room.players[playerIdx]!;
  if (player.isBot) return; // already auto-filled at round start

  const slot = slotOf(room.currentRound);
  if (typeof optionId !== 'string' || !POOL_IDS[slot]!.has(optionId)) {
    io.to(socketId).emit('error', {
      code: 'INVALID_OPTION',
      message: 'That answer is not one of this round’s options.',
    });
    return;
  }

  const storyIdx = storyIndex(playerIdx, room.currentRound, room.players.length);
  room.stories[storyIdx]!.answers[room.currentRound] = optionId;
  room.submittedThisRound.add(socketId);

  broadcastWaiting(room, io);
  maybeAdvance(room, io);
}

/**
 * Bot and timer-expiry fill (FM-BOT-2, design §6).
 *
 * Draws uniformly from this round's pool, preferring ids not already used at
 * this slot by another story in this room this round. Without that exclusion a
 * room with several bots would routinely hand out the same "who" to three
 * different stories, which reads as a bug on the reveal screen even though the
 * draw was fair.
 *
 * The exclusion cannot run dry in practice: the smallest pool is 10 (visual
 * slots) against a 7-player maximum, so there are always unused ids left. The
 * fallback to the full pool exists so a future pool edit that breaks that
 * invariant degrades to SRC's plain-uniform behaviour instead of throwing.
 */
function autoFillFor(room: Room, socketId: string): void {
  if (room.submittedThisRound.has(socketId)) return;
  const playerIdx = room.players.findIndex((p) => p.id === socketId);
  if (playerIdx === -1) return;

  const slot = slotOf(room.currentRound);
  const pool = POOLS[slot];
  const used = new Set<OptionId>();
  for (const story of room.stories) {
    const taken = story.answers[room.currentRound];
    if (taken) used.add(taken);
  }
  const candidates = pool.filter((o) => !used.has(o.id));
  const from = candidates.length > 0 ? candidates : pool;
  const pick = from[Math.floor(Math.random() * from.length)]!;

  const storyIdx = storyIndex(playerIdx, room.currentRound, room.players.length);
  room.stories[storyIdx]!.answers[room.currentRound] = pick.id;
  room.submittedThisRound.add(socketId);
}

function broadcastWaiting(room: Room, io: IO): void {
  const total = room.players.length;
  const submitted = room.submittedThisRound.size;
  for (const p of room.players) {
    if (p.isBot) continue;
    if (!room.submittedThisRound.has(p.id)) continue;
    io.to(p.id).emit('round:waiting', { submitted, total });
  }
}

function maybeAdvance(room: Room, io: IO): void {
  if (room.submittedThisRound.size >= room.players.length) {
    advanceRound(room, io);
  }
}

function advanceRound(room: Room, io: IO): void {
  clearRoundTimer(room);

  // Timer-expiry path: auto-fill anyone still missing.
  for (const p of room.players) autoFillFor(room, p.id);

  room.currentRound++;
  if (room.currentRound >= ROUNDS) {
    enterRevealPhase(room, io);
    return;
  }
  startRound(room, io);
}

function clearRoundTimer(room: Room): void {
  if (room.roundTimer) {
    clearTimeout(room.roundTimer as NodeJS.Timeout);
    room.roundTimer = null;
  }
}

// ============================================================================
// Reveal (prose only — pictures arrive with T-4.4)
// ============================================================================

/**
 * Turns a story's 7 option ids into display texts in the room's language
 * (DD-1). This is the point where the language-neutral wire format becomes
 * readable, and it is why a room's content language can differ from any
 * player's UI language.
 *
 * An unfilled slot resolves to '' rather than throwing: every slot is filled by
 * `advanceRound` before reveal, so a null here would mean a bug upstream, and
 * an empty slot degrades to a slightly odd sentence rather than a crash on the
 * payoff screen. `polishProse` collapses the double space it leaves behind.
 */
export function resolveAnswers(room: Room, story: Story | undefined): string[] {
  const texts = POOL_TEXTS[requireAuthoredLanguage(room.language)];
  return Array.from({ length: ROUNDS }, (_, i) => {
    const id = story?.answers[i];
    return id ? (texts[id] ?? '') : '';
  });
}

// Renders a story's prose and runs the offline polish pass: Russian gets its
// clause commas, and every language gets the opening capital and terminal
// period (see grammar.ts — the T-1.5 carry-over). Synchronous and instant, so
// it never delays the reveal.
export function revealProse(room: Room, answers: readonly string[]): string {
  const prose = renderProse(requireAuthoredLanguage(room.language), answers);
  return polishProse(room.language, prose);
}

// stories[i] belongs to players[i] (spec §4): each non-bot player receives
// their own assembled story as private prose. Bots have no client to send to.
export function enterRevealPhase(room: Room, io: IO): void {
  room.phase = 'reveal';
  room.players.forEach((player, i) => {
    if (player.isBot) return;
    const answers = resolveAnswers(room, room.stories[i]);
    io.to(player.id).emit('reveal:start', {
      answers,
      prose: revealProse(room, answers),
    });
  });
}

// stories[i] belongs to players[i] (spec §4). A player's own story is at
// their index in the players array.
export function getStoryForPlayer(room: Room, socketId: string): Story | null {
  const idx = room.players.findIndex((p) => p.id === socketId);
  if (idx === -1) return null;
  return room.stories[idx] ?? null;
}

// ============================================================================
// Mid-game disconnect — called from the socket disconnect handler when a
// player who was in a 'playing' room becomes a bot. Wired up by T-2.4.
// ============================================================================

export function handleMidGameBotification(room: Room, socketId: string, io: IO): void {
  if (room.phase !== 'playing') return;
  autoFillFor(room, socketId);
  maybeAdvance(room, io);
}

// ============================================================================
// End screen — "one more game" readiness and restart (spec §4, §5, §16 step 10)
// ============================================================================

// Toggles a non-bot player's "ready for another game" flag and broadcasts the
// full ready set so every client (and the host's restart button) stays in sync.
export function handleReadyToggle(room: Room, socketId: string, ready: boolean, io: IO): void {
  if (room.phase !== 'reveal') return;
  const player = room.players.find((p) => p.id === socketId);
  if (!player || player.isBot) return;

  if (ready) room.readyForRestart.add(socketId);
  else room.readyForRestart.delete(socketId);

  io.to(room.code).emit('game:restartReady', {
    readyIds: [...room.readyForRestart],
  });
}

// Validates a host's restart request and, on success, resets the room to a
// fresh pre-game state per spec §4 "One more game" reset: drops bots, rebuilds
// the host if needed, clears the ready set. The caller then broadcasts the new
// roster and calls startGame to rebuild stories and begin round 0.
export function prepareRestart(
  room: Room,
  socketId: string,
): { ok: true } | { ok: false; error: ErrorPayload } {
  if (room.phase !== 'reveal') {
    return { ok: false, error: { code: 'ROOM_LOCKED', message: 'Game is not over yet.' } };
  }
  if (room.hostId !== socketId) {
    return { ok: false, error: { code: 'NOT_HOST', message: 'Only the host can restart.' } };
  }
  const nonBots = room.players.filter((p) => !p.isBot);
  if (nonBots.length < 3) {
    return {
      ok: false,
      error: { code: 'NOT_ENOUGH_PLAYERS', message: 'Need at least 3 players.' },
    };
  }

  room.players = nonBots;
  if (!room.players.some((p) => p.id === room.hostId)) {
    room.hostId = room.players[0]!.id;
  }
  room.readyForRestart.clear();
  return { ok: true };
}
