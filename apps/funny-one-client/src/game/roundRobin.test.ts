// SPDX-License-Identifier: AGPL-3.0-only

import { POOLS, SLOT_COUNT } from '@funny/shared';
import { describe, expect, it } from 'vitest';
import {
  createGame,
  currentSeat,
  currentSlot,
  isDone,
  MAX_SEATS,
  MIN_SEATS,
  pickVirtualAnswer,
  type Seat,
  submitAnswer,
  usedOptionsThisQuestion,
} from './roundRobin.js';

function seats(n: number, kind: Seat['kind'] = 'human'): Seat[] {
  return Array.from({ length: n }, (_, i) => ({ id: `s${i}`, name: `Seat ${i}`, kind }));
}

// Deterministic "random": cycles through 0, 1/n, 2/n, ... so picks are
// reproducible without ever landing exactly on 1 (which would overflow the
// candidate array via Math.floor).
function sequentialRng(): () => number {
  let i = 0;
  return () => {
    const v = (i % 97) / 97;
    i++;
    return v;
  };
}

describe('createGame', () => {
  it('rejects seat counts below MIN_SEATS or above MAX_SEATS', () => {
    expect(() => createGame(seats(MIN_SEATS - 1))).toThrow(RangeError);
    expect(() => createGame(seats(MAX_SEATS + 1))).toThrow(RangeError);
  });

  it('accepts the OQ-3 solo floor: 1 human + 1 virtual seat', () => {
    const state = createGame([
      { id: 's0', name: 'You', kind: 'human' },
      { id: 's1', name: 'Bot', kind: 'virtual' },
    ]);
    expect(state.seats).toHaveLength(2);
    expect(state.stories).toHaveLength(2);
  });

  it('accepts the full 7-seat ceiling', () => {
    const state = createGame(seats(MAX_SEATS));
    expect(state.stories).toHaveLength(MAX_SEATS);
  });

  it('starts at question 0, seat turn 0, every answer null', () => {
    const state = createGame(seats(3));
    expect(state.question).toBe(0);
    expect(state.seatTurn).toBe(0);
    expect(isDone(state)).toBe(false);
    for (const story of state.stories) {
      expect(story.answers).toHaveLength(SLOT_COUNT);
      expect(story.answers.every((a) => a === null)).toBe(true);
      expect(story.picture).toBeNull();
    }
  });
});

describe('turn order (FO-CORE-2 — question-major round robin)', () => {
  it.each([2, 3, 7])('N=%i — visits every seat before advancing the question', (n) => {
    let state = createGame(seats(n));
    for (let seat = 0; seat < n; seat++) {
      expect(currentSeat(state)?.id).toBe(`s${seat}`);
      expect(currentSlot(state)).toBe(0);
      state = submitAnswer(state, `pick-${seat}`);
    }
    expect(state.question).toBe(1);
    expect(state.seatTurn).toBe(0);
  });

  it('a full 7-question game ends after seatCount * 7 submissions and marks done', () => {
    const n = 4;
    let state = createGame(seats(n));
    let submissions = 0;
    while (!isDone(state)) {
      state = submitAnswer(state, `pick-${submissions}`);
      submissions++;
    }
    expect(submissions).toBe(n * SLOT_COUNT);
    expect(currentSeat(state)).toBeNull();
    expect(state.question).toBe(SLOT_COUNT);
  });

  it('routes each turn to the story storyIndex(seatTurn, question, N) points to', () => {
    // N=3: at question 1, seat 0 -> story 2, seat 1 -> story 0, seat 2 -> story 1
    // (same worked example rotation.test.ts uses for storyIndex directly).
    let state = createGame(seats(3));
    for (let seat = 0; seat < 3; seat++) state = submitAnswer(state, `q0-${seat}`);
    expect(state.question).toBe(1);

    state = submitAnswer(state, 'q1-seat0'); // seat 0 -> story 2
    state = submitAnswer(state, 'q1-seat1'); // seat 1 -> story 0
    state = submitAnswer(state, 'q1-seat2'); // seat 2 -> story 1

    expect(state.stories[2]!.answers[1]).toBe('q1-seat0');
    expect(state.stories[0]!.answers[1]).toBe('q1-seat1');
    expect(state.stories[1]!.answers[1]).toBe('q1-seat2');
  });

  it('rejects submitting or picking once the game is done', () => {
    const n = 2;
    let state = createGame(seats(n));
    for (let i = 0; i < n * SLOT_COUNT; i++) state = submitAnswer(state, `pick-${i}`);
    expect(isDone(state)).toBe(true);
    expect(() => submitAnswer(state, 'late')).toThrow();
    expect(() => pickVirtualAnswer(state)).toThrow();
  });
});

describe('an all-human game', () => {
  it('every story ends with 7 non-null answers, one full game', () => {
    const n = 5;
    let state = createGame(seats(n, 'human'));
    let i = 0;
    while (!isDone(state)) {
      expect(currentSeat(state)?.kind).toBe('human');
      state = submitAnswer(state, `pick-${i}`);
      i++;
    }
    for (const story of state.stories) {
      expect(story.answers.every((a) => a !== null)).toBe(true);
    }
  });
});

describe('an all-virtual game (FO-BOT-1)', () => {
  it('plays itself to completion using pickVirtualAnswer at every turn', () => {
    const n = 6;
    let state = createGame(seats(n, 'virtual'));
    const rng = sequentialRng();
    while (!isDone(state)) {
      expect(currentSeat(state)?.kind).toBe('virtual');
      const pick = pickVirtualAnswer(state, rng);
      state = submitAnswer(state, pick);
    }
    for (const story of state.stories) {
      expect(story.answers.every((a) => a !== null)).toBe(true);
    }
  });

  it('gives every story a distinct option at a question when the pool has enough room', () => {
    // Same invariant as game.test.ts's "auto-fill" describe block server-side:
    // a full room of virtual seats should not repeat an option within one
    // question when the pool is larger than the seat count.
    const n = 7; // smallest pool (visual slots) is 10 ids, so 7 distinct picks always fit.
    let state = createGame(seats(n, 'virtual'));
    const rng = sequentialRng();
    for (let question = 0; question < SLOT_COUNT; question++) {
      for (let seat = 0; seat < n; seat++) {
        const pick = pickVirtualAnswer(state, rng);
        state = submitAnswer(state, pick);
      }
      const picks = state.stories.map((s) => s.answers[question]);
      expect(picks.every((p) => p !== null)).toBe(true);
      expect(new Set(picks).size, `question ${question} should have ${n} distinct options`).toBe(n);
    }
  });
});

describe('a mixed human/virtual game', () => {
  it('reports the correct seat kind at each turn and completes normally', () => {
    const mixed: Seat[] = [
      { id: 's0', name: 'Alice', kind: 'human' },
      { id: 's1', name: 'Bot', kind: 'virtual' },
      { id: 's2', name: 'Bob', kind: 'human' },
    ];
    let state = createGame(mixed);
    const rng = sequentialRng();
    let i = 0;
    while (!isDone(state)) {
      const seat = currentSeat(state)!;
      expect(seat.kind).toBe(mixed[i % 3]!.kind);
      const pick = seat.kind === 'virtual' ? pickVirtualAnswer(state, rng) : `human-pick-${i}`;
      state = submitAnswer(state, pick);
      i++;
    }
    expect(state.stories.every((s) => s.answers.every((a) => a !== null))).toBe(true);
  });
});

describe('usedOptionsThisQuestion / pickVirtualAnswer exclusion (FO-BOT-1)', () => {
  it('excludes options already placed at the current question by other stories', () => {
    let state = createGame(seats(3, 'virtual'));
    const firstPick = pickVirtualAnswer(state, () => 0);
    state = submitAnswer(state, firstPick);

    expect(usedOptionsThisQuestion(state).has(firstPick)).toBe(true);

    // Force the "always pick the first candidate" rng and confirm it never
    // repeats the id already used this question, for every remaining seat.
    for (let seat = 1; seat < 3; seat++) {
      const pick = pickVirtualAnswer(state, () => 0);
      expect(pick).not.toBe(firstPick);
      state = submitAnswer(state, pick);
    }
  });

  it('falls back to the full pool once every distinct option is exhausted', () => {
    // Not reachable through real play at MAX_SEATS=7 against a 10-option
    // pool, so construct the exhausted state directly: every pool id for
    // question 0 already placed on some story. Candidates is then empty and
    // pickVirtualAnswer must fall back to the whole pool rather than
    // throwing or picking from an empty array.
    const base = createGame(seats(2, 'virtual'));
    const pool = POOLS[0];
    expect(pool.length).toBeGreaterThan(0);
    // One story per pool option, each already holding that option's id at
    // question 0 — `used` then covers the entire pool.
    const exhausted = {
      ...base,
      stories: pool.map((o) => ({
        picture: null,
        answers: [o.id, ...new Array(SLOT_COUNT - 1).fill(null)],
      })),
    };

    const pick = pickVirtualAnswer(exhausted, () => 0);
    expect(pool.some((o) => o.id === pick)).toBe(true);
  });
});
