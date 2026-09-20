// SPDX-License-Identifier: AGPL-3.0-only

// Local round-robin state machine (T-FO-2.2, FO-CORE-1/2, FO-BOT-1). Single
// device, no server: every seat (human or virtual) answers every question in
// turn, question-major — question 0 for every seat, then question 1, and so
// on for SLOT_COUNT questions. The story each turn writes to is the same
// `storyIndex` rotation Funny Multi uses server-side (FO-ARC-1, unmodified),
// just driven by a local `seatTurn` counter instead of a socket event.
//
// Pure reducer: no timers, no randomness baked in (the virtual-seat "thinking"
// delay and the RNG source both live outside this module — T-FO-3.3 and the
// caller, respectively — so this stays synchronously testable).

import { POOLS, SLOT_COUNT, storyIndex } from '@funny/shared';
import type { OptionId, SlotIndex, Story } from '@funny/shared';

export interface Seat {
  readonly id: string;
  readonly name: string;
  readonly kind: 'human' | 'virtual';
}

export interface GameState {
  readonly seats: readonly Seat[];
  /** 0..SLOT_COUNT-1 while playing; SLOT_COUNT once every question is answered. */
  readonly question: number;
  /** Index into `seats` for whichever seat answers next. */
  readonly seatTurn: number;
  /** stories[i] belongs to seats[i] (mirrors Funny Multi's players[i]/stories[i] pairing). */
  readonly stories: readonly Story[];
}

// OQ-3 (resolved 2026-09-20): solo play is a valid v1 start — 1 human + 1
// virtual seat, no 3-seat room-fairness floor (that floor is Funny Multi's,
// for a shared room; a single device doesn't need company to start).
export const MIN_SEATS = 2;
export const MAX_SEATS = 7;

export function createGame(seats: readonly Seat[]): GameState {
  if (seats.length < MIN_SEATS || seats.length > MAX_SEATS) {
    throw new RangeError(`seats.length must be ${MIN_SEATS}..${MAX_SEATS}, got ${seats.length}`);
  }
  return {
    seats,
    question: 0,
    seatTurn: 0,
    stories: seats.map(() => ({
      answers: new Array<OptionId | null>(SLOT_COUNT).fill(null),
      picture: null,
    })),
  };
}

export function isDone(state: GameState): boolean {
  return state.question >= SLOT_COUNT;
}

/** The seat whose turn it is, or null once the game is done. */
export function currentSeat(state: GameState): Seat | null {
  return isDone(state) ? null : state.seats[state.seatTurn]!;
}

/** The question/slot in play. Only meaningful while `!isDone(state)`. */
export function currentSlot(state: GameState): SlotIndex {
  return state.question as SlotIndex;
}

/**
 * Ids already used at this question's slot by any story — the same
 * same-slot exclusion Funny Multi's server applies (FM-BOT-2,
 * `apps/funny-multi-server/src/game.ts` autoFillFor), reimplemented locally
 * since that version is entangled with `Room`/socket state.
 */
export function usedOptionsThisQuestion(state: GameState): ReadonlySet<OptionId> {
  const used = new Set<OptionId>();
  for (const story of state.stories) {
    const taken = story.answers[state.question];
    if (taken) used.add(taken);
  }
  return used;
}

/**
 * Uniform pick for the current turn's slot, excluding options already used
 * this question where the pool allows it (FO-BOT-1). RNG is injected so
 * callers — and this module's tests — stay deterministic; defaults to
 * `Math.random` for real play.
 */
export function pickVirtualAnswer(state: GameState, rng: () => number = Math.random): OptionId {
  if (isDone(state)) {
    throw new Error('cannot pick a virtual answer after the game is done');
  }
  const pool = POOLS[currentSlot(state)];
  const used = usedOptionsThisQuestion(state);
  const candidates = pool.filter((o) => !used.has(o.id));
  const from = candidates.length > 0 ? candidates : pool;
  return from[Math.floor(rng() * from.length)]!.id;
}

/**
 * Records the current turn's answer against its rotated story and advances
 * to the next seat (or the next question, once every seat has answered this
 * one). Works the same for a human's tap and a virtual seat's auto-pick —
 * callers decide *what* to submit; this only ever advances the turn.
 */
export function submitAnswer(state: GameState, optionId: OptionId): GameState {
  if (isDone(state)) {
    throw new Error('cannot submit an answer after the game is done');
  }
  const seatCount = state.seats.length;
  const storyIdx = storyIndex(state.seatTurn, state.question, seatCount);
  const stories = state.stories.map((story, i) => {
    if (i !== storyIdx) return story;
    const answers = story.answers.slice();
    answers[state.question] = optionId;
    return { ...story, answers };
  });

  const nextSeatTurn = state.seatTurn + 1;
  if (nextSeatTurn < seatCount) {
    return { ...state, stories, seatTurn: nextSeatTurn };
  }
  return { ...state, stories, seatTurn: 0, question: state.question + 1 };
}
