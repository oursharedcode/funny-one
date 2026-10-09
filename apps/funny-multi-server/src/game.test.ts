// SPDX-License-Identifier: AGPL-3.0-only

// T-2.3 — round flow (design §13). Adapted from SRC's game.test.ts family, with
// every answer fixture rewritten from free text to option ids.
//
// The load-bearing assertions here are the ones that would otherwise only fail
// on a real reveal screen: rotation placement (a wrong storyIndex still
// produces seven complete stories, just the wrong seven), id-to-text resolution
// in the room language, and the INVALID_OPTION path leaving no submitted mark.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POOLS, POOL_TEXTS, storyIndex, type OptionId, type SlotIndex } from '@funny/shared';
import { __resetRoomsForTest, createRoom, joinRoom } from './rooms.js';
import {
  ROUNDS,
  ROUND_DURATION_MS,
  enterRevealPhase,
  handleReadyToggle,
  prepareRestart,
  resolveAnswers,
  startGame,
  storyOptionIds,
  submitAnswer,
} from './game.js';
import type { Room } from './types.js';

interface Emitted {
  target: string;
  event: string;
  payload?: unknown;
}

function makeIo() {
  const emitted: Emitted[] = [];
  const io = {
    to(target: string) {
      return {
        emit(event: string, payload?: unknown) {
          emitted.push({ target, event, payload });
        },
      };
    },
  };
  return {
    emitted,
    io: io as unknown as Parameters<typeof startGame>[1],
    eventsFor: (event: string) => emitted.filter((e) => e.event === event),
  };
}

// nth option of a slot — the fixture equivalent of "player types something".
function optionAt(slot: number, n: number): OptionId {
  const pool = POOLS[slot as SlotIndex];
  return pool[n % pool.length]!.id;
}

function makeRoom(playerCount: number, language: 'en' | 'ru' = 'en'): Room {
  const room = createRoom('p0', language, 's0');
  for (let i = 1; i < playerCount; i++) joinRoom(room.code, `p${i}`, `s${i}`);
  return room;
}

beforeEach(() => __resetRoomsForTest());
afterEach(() => {
  __resetRoomsForTest();
  vi.useRealTimers();
});

describe('setup', () => {
  it('ties ROUNDS to the shared slot count', () => {
    expect(ROUNDS).toBe(7);
  });

  it('builds one empty story per player', () => {
    const room = makeRoom(3);
    const { io } = makeIo();
    startGame(room, io);

    expect(room.phase).toBe('playing');
    expect(room.currentRound).toBe(0);
    expect(room.stories).toHaveLength(3);
    for (const story of room.stories) {
      expect(story.answers).toHaveLength(7);
      expect(story.answers.every((a) => a === null)).toBe(true);
      expect(story.picture).toBeNull();
    }
  });

  it('emits round:start with the room-language question and a deadline', () => {
    const room = makeRoom(3, 'ru');
    const { io, eventsFor } = makeIo();
    startGame(room, io);

    const starts = eventsFor('round:start');
    expect(starts).toHaveLength(1);
    expect(starts[0]!.payload).toMatchObject({ roundNumber: 0, question: 'Кто?' });
    expect((starts[0]!.payload as { deadline: number }).deadline).toBeGreaterThan(Date.now() - 1);
  });
});

describe('rotation (FM-CORE-6)', () => {
  it('places round-0 answers on each player’s own story', () => {
    const room = makeRoom(3);
    const { io } = makeIo();
    startGame(room, io);

    for (let i = 0; i < 3; i++) submitAnswer(room, `s${i}`, optionAt(0, i), io);
    for (let i = 0; i < 3; i++) {
      expect(room.stories[i]!.answers[0]).toBe(optionAt(0, i));
    }
  });

  it('rotates by one story per round, matching storyIndex', () => {
    const room = makeRoom(3);
    const { io } = makeIo();
    startGame(room, io);

    // Round 0 — everyone submits, which advances to round 1.
    for (let i = 0; i < 3; i++) submitAnswer(room, `s${i}`, optionAt(0, i), io);
    expect(room.currentRound).toBe(1);

    for (let i = 0; i < 3; i++) submitAnswer(room, `s${i}`, optionAt(1, i), io);
    for (let i = 0; i < 3; i++) {
      const expected = storyIndex(i, 1, 3);
      expect(expected).toBe((i - 1 + 3) % 3);
      expect(room.stories[expected]!.answers[1]).toBe(optionAt(1, i));
    }
  });
});

describe('submitAnswer validation (FM-ANS-2)', () => {
  it('rejects an id that is not in the pool and leaves no submitted mark', () => {
    const room = makeRoom(3);
    const { io, eventsFor } = makeIo();
    startGame(room, io);

    submitAnswer(room, 's0', 'who.not-a-real-option', io);

    const errors = eventsFor('error');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ target: 's0' });
    expect((errors[0]!.payload as { code: string }).code).toBe('INVALID_OPTION');
    // The critical half: no submitted mark, so the round cannot advance on a
    // rejected answer and the player is auto-filled at the deadline instead.
    expect(room.submittedThisRound.has('s0')).toBe(false);
    expect(room.stories[0]!.answers[0]).toBeNull();
    expect(room.currentRound).toBe(0);
  });

  it('rejects a valid id belonging to a different slot', () => {
    // The subtle tampering case: a real id, wrong round. Round 0 is `who.*`.
    const room = makeRoom(3);
    const { io, eventsFor } = makeIo();
    startGame(room, io);

    submitAnswer(room, 's0', optionAt(5, 0), io);
    expect((eventsFor('error')[0]!.payload as { code: string }).code).toBe('INVALID_OPTION');
    expect(room.stories[0]!.answers[0]).toBeNull();
  });

  it('rejects non-string payloads without throwing', () => {
    const room = makeRoom(3);
    const { io, eventsFor } = makeIo();
    startGame(room, io);

    for (const bad of [undefined, null, 42, {}, []]) {
      submitAnswer(room, 's0', bad, io);
    }
    expect(eventsFor('error')).toHaveLength(5);
    expect(room.submittedThisRound.size).toBe(0);
  });

  it('ignores a second submission from the same player in one round', () => {
    const room = makeRoom(3);
    const { io } = makeIo();
    startGame(room, io);

    submitAnswer(room, 's0', optionAt(0, 0), io);
    submitAnswer(room, 's0', optionAt(0, 5), io);
    expect(room.stories[0]!.answers[0]).toBe(optionAt(0, 0));
  });

  it('ignores submissions outside the playing phase', () => {
    const room = makeRoom(3);
    const { io } = makeIo();
    startGame(room, io);
    room.phase = 'reveal';

    submitAnswer(room, 's0', optionAt(0, 0), io);
    expect(room.submittedThisRound.size).toBe(0);
  });

  it('broadcasts round:waiting only to players who have submitted', () => {
    const room = makeRoom(3);
    const { io, eventsFor } = makeIo();
    startGame(room, io);

    submitAnswer(room, 's0', optionAt(0, 0), io);
    const waiting = eventsFor('round:waiting');
    expect(waiting).toHaveLength(1);
    expect(waiting[0]).toMatchObject({ target: 's0' });
    expect(waiting[0]!.payload).toEqual({ submitted: 1, total: 3 });
  });
});

describe('auto-fill (FM-BOT-2)', () => {
  it('fills bot slots at the top of each round', () => {
    const room = makeRoom(3);
    room.players[2] = { ...room.players[2]!, isBot: true };
    const { io } = makeIo();
    startGame(room, io);

    expect(room.submittedThisRound.has('s2')).toBe(true);
    expect(room.stories[2]!.answers[0]).not.toBeNull();
  });

  it('gives every story a distinct option at a slot in a full bot room', () => {
    // Same-slot exclusion (design §6). Without it a 7-bot room routinely deals
    // the same "who" to several stories, which reads as a bug on reveal.
    const room = makeRoom(7);
    for (let i = 0; i < 7; i++) room.players[i] = { ...room.players[i]!, isBot: true };
    const { io } = makeIo();
    startGame(room, io);

    // A full bot room auto-completes all 7 rounds in one tick.
    expect(room.phase).toBe('reveal');
    for (let round = 0; round < ROUNDS; round++) {
      const picks = room.stories.map((s) => s.answers[round]);
      expect(picks.every((p) => p !== null)).toBe(true);
      expect(new Set(picks).size, `round ${round} should have 7 distinct options`).toBe(7);
    }
  });

  it('auto-fills the silent players when the round timer expires', () => {
    vi.useFakeTimers();
    const room = makeRoom(3);
    const { io } = makeIo();
    startGame(room, io);

    submitAnswer(room, 's0', optionAt(0, 0), io);
    expect(room.currentRound).toBe(0);

    vi.advanceTimersByTime(ROUND_DURATION_MS);

    expect(room.currentRound).toBe(1);
    for (const story of room.stories) expect(story.answers[0]).not.toBeNull();
    // The human's own pick survives the auto-fill sweep.
    expect(room.stories[0]!.answers[0]).toBe(optionAt(0, 0));
  });

  it('does not overwrite an answer already submitted', () => {
    const room = makeRoom(3);
    room.players[1] = { ...room.players[1]!, isBot: true };
    const { io } = makeIo();
    startGame(room, io);

    const botPick = room.stories[1]!.answers[0];
    submitAnswer(room, 's0', optionAt(0, 0), io);
    expect(room.stories[1]!.answers[0]).toBe(botPick);
  });
});

describe('full simulated games', () => {
  for (const playerCount of [3, 7]) {
    it(`completes a ${playerCount}-player game and reveals one story each`, () => {
      const room = makeRoom(playerCount);
      const { io, eventsFor } = makeIo();
      startGame(room, io);

      const picks: OptionId[][] = [];
      for (let round = 0; round < ROUNDS; round++) {
        const roundPicks: OptionId[] = [];
        for (let p = 0; p < playerCount; p++) {
          const id = optionAt(round, p);
          roundPicks.push(id);
          submitAnswer(room, `s${p}`, id, io);
        }
        picks.push(roundPicks);
      }

      expect(room.phase).toBe('reveal');
      expect(room.currentRound).toBe(ROUNDS);

      // Every slot of every story is filled, and filled by the right player.
      for (let round = 0; round < ROUNDS; round++) {
        for (let p = 0; p < playerCount; p++) {
          const target = storyIndex(p, round, playerCount);
          expect(room.stories[target]!.answers[round]).toBe(picks[round]![p]);
        }
      }

      const reveals = eventsFor('reveal:start');
      expect(reveals).toHaveLength(playerCount);
      for (const reveal of reveals) {
        const payload = reveal.payload as {
          answers: string[];
          prose: string;
          optionIds: (OptionId | null)[];
        };
        expect(payload.answers).toHaveLength(7);
        expect(payload.answers.every((a) => a.length > 0)).toBe(true);
        expect(payload.prose.length).toBeGreaterThan(0);
        // B-15: the player's own story's ids travel with its texts.
        const own = Number(reveal.target.slice(1));
        expect(payload.optionIds).toEqual(room.stories[own]!.answers);
      }
    });
  }

  it('sends each player their own story, not a shared one', () => {
    const room = makeRoom(3);
    const { io, eventsFor } = makeIo();
    startGame(room, io);
    for (let round = 0; round < ROUNDS; round++) {
      for (let p = 0; p < 3; p++) submitAnswer(room, `s${p}`, optionAt(round, p), io);
    }

    const proses = eventsFor('reveal:start').map((e) => (e.payload as { prose: string }).prose);
    expect(new Set(proses).size).toBe(3);
  });

  it('sends no reveal:start to bot slots', () => {
    const room = makeRoom(3);
    room.players[2] = { ...room.players[2]!, isBot: true };
    const { io, eventsFor } = makeIo();
    startGame(room, io);
    for (let round = 0; round < ROUNDS; round++) {
      for (const p of [0, 1]) submitAnswer(room, `s${p}`, optionAt(round, p), io);
    }

    const targets = eventsFor('reveal:start').map((e) => e.target);
    expect(targets.sort()).toEqual(['s0', 's1']);
  });
});

describe('reveal resolution (DD-1)', () => {
  it('resolves option ids to display texts in the room language', () => {
    const room = makeRoom(3, 'ru');
    const { io } = makeIo();
    startGame(room, io);
    for (let round = 0; round < ROUNDS; round++) {
      room.stories[0]!.answers[round] = optionAt(round, 0);
    }

    const answers = resolveAnswers(room, room.stories[0]);
    expect(answers).toEqual([
      'сердитый пират',
      'с проклятым тостером',
      'на сырном заводе',
      'во время небольшого землетрясения',
      'испекли огромный кривой торт',
      'по причинам, которые тогда казались разумными',
      'у всех появились сильные чувства к пасте',
    ]);
    // Ids must not leak to the client — the reveal screen prints these.
    expect(answers.some((a) => a.includes('.') && /^[a-z]+\.[a-z-]+$/.test(a))).toBe(false);
  });

  it('resolves the same ids differently per room language', () => {
    const ids = Array.from({ length: ROUNDS }, (_, r) => optionAt(r, 0));
    const en = ids.map((id) => POOL_TEXTS.en[id]);
    const ru = ids.map((id) => POOL_TEXTS.ru[id]);
    expect(en).not.toEqual(ru);
  });

  it('degrades an unfilled slot to an empty string rather than throwing', () => {
    const room = makeRoom(3);
    const { io } = makeIo();
    startGame(room, io);
    expect(resolveAnswers(room, room.stories[0])).toEqual(['', '', '', '', '', '', '']);
  });

  it('copies the ids for the wire, null for an unfilled slot (B-15)', () => {
    const room = makeRoom(3);
    const { io } = makeIo();
    startGame(room, io);
    const story = room.stories[0]!;
    story.answers[0] = optionAt(0, 0);

    const ids = storyOptionIds(story);
    expect(ids).toEqual([optionAt(0, 0), null, null, null, null, null, null]);
    // A copy: a later write to the room's story does not reach a sent payload.
    story.answers[1] = optionAt(1, 0);
    expect(ids[1]).toBeNull();
    expect(storyOptionIds(undefined)).toEqual([null, null, null, null, null, null, null]);
  });
});

describe('prose assembly', () => {
  function proseFor(language: 'en' | 'ru'): string {
    const room = makeRoom(3, language);
    const { io, eventsFor } = makeIo();
    startGame(room, io);
    for (let round = 0; round < ROUNDS; round++) {
      room.stories[0]!.answers[round] = optionAt(round, 0);
      room.stories[1]!.answers[round] = optionAt(round, 0);
      room.stories[2]!.answers[round] = optionAt(round, 0);
    }
    room.players[1] = { ...room.players[1]!, isBot: true };
    room.players[2] = { ...room.players[2]!, isBot: true };
    enterRevealPhase(room, io);
    return (eventsFor('reveal:start')[0]!.payload as { prose: string }).prose;
  }

  it('renders English prose with an opening capital (the T-1.5 carry-over)', () => {
    expect(proseFor('en')).toBe(
      'A grumpy pirate and a haunted toaster were inside a cheese factory during a small ' +
        'earthquake. They baked an enormous lopsided cake for reasons that made sense at the ' +
        'time. In the end, everybody had strong feelings about pasta.',
    );
  });

  it('renders Russian prose through the grammar polish', () => {
    expect(proseFor('ru')).toBe(
      'Сердитый пират с проклятым тостером во время небольшого землетрясения на сырном заводе ' +
        'испекли огромный кривой торт по причинам, которые тогда казались разумными. В итоге ' +
        'у всех появились сильные чувства к пасте.',
    );
  });

  for (const language of ['en', 'ru'] as const) {
    it(`contains every resolved ${language} answer verbatim, so client highlighting works`, () => {
      // client/src/prose.ts highlights answers by matching them inside the
      // prose. Only the sentence-opening capital may differ, which the client
      // absorbs with a case-insensitive fallback — so the match is tested
      // case-insensitively, and everything else must survive byte for byte.
      // This is what the polish pass could quietly break: a stray comma
      // inserted *inside* an answer would orphan its highlight.
      const room = makeRoom(3, language);
      const { io, eventsFor } = makeIo();
      startGame(room, io);
      for (let round = 0; round < ROUNDS; round++) {
        room.stories[0]!.answers[round] = optionAt(round, 3);
      }
      const answers = resolveAnswers(room, room.stories[0]);
      room.players[1] = { ...room.players[1]!, isBot: true };
      room.players[2] = { ...room.players[2]!, isBot: true };
      enterRevealPhase(room, io);

      const prose = (eventsFor('reveal:start')[0]!.payload as { prose: string }).prose;
      for (const answer of answers) {
        expect(answer.length).toBeGreaterThan(0);
        expect(
          prose.toLowerCase().includes(answer.toLowerCase()),
          `prose lost the answer "${answer}":\n${prose}`,
        ).toBe(true);
      }
    });
  }
});

describe('SRC render-time repairs are unreachable (justifies dropping them)', () => {
  // i18n/index.ts drops three transforms SRC applied at render time. They
  // existed to repair free-typed input; pool texts are authored to compose
  // directly. These re-derive SRC's own predicates and assert no shipped text
  // would trigger one — so the removal is a checked claim, not an assumption.

  const EN_SLOT5_LEADING_CONNECTIVE =
    /^\s*(?:for|to|because|so\s+that|in\s+order|in\s+exchange|out\s+of|since)\b/i;
  const RU_SLOT1_LEADING_CONNECTIVE = /^\s*(?:с|со|и)\s+/i;

  it('every English slot-5 text already opens with a connective', () => {
    for (const option of POOLS[5]) {
      const text = POOL_TEXTS.en[option.id]!;
      expect(EN_SLOT5_LEADING_CONNECTIVE.test(text), `"${text}" would get a "for " prefix`).toBe(
        true,
      );
    }
  });

  it('every Russian slot-1 text already opens with с/со', () => {
    for (const option of POOLS[1]) {
      const text = POOL_TEXTS.ru[option.id]!;
      expect(RU_SLOT1_LEADING_CONNECTIVE.test(text), `"${text}" would get an "и " prefix`).toBe(
        true,
      );
    }
  });

  it('no Russian slot-6 text is a bare noun', () => {
    for (const option of POOLS[6]) {
      const text = POOL_TEXTS.ru[option.id]!;
      expect(
        text.trim().split(/\s+/).length,
        `"${text}" would get "это закончилось" prepended`,
      ).toBeGreaterThan(2);
    }
  });
});

describe('end screen', () => {
  it('toggles readiness and broadcasts the ready set', () => {
    const room = makeRoom(3);
    const { io, eventsFor } = makeIo();
    room.phase = 'reveal';

    handleReadyToggle(room, 's0', true, io);
    expect(eventsFor('game:restartReady')[0]!.payload).toEqual({ readyIds: ['s0'] });

    handleReadyToggle(room, 's0', false, io);
    expect(eventsFor('game:restartReady')[1]!.payload).toEqual({ readyIds: [] });
  });

  it('refuses a restart from a non-host, and with fewer than 3 non-bots', () => {
    const room = makeRoom(3);
    room.phase = 'reveal';

    expect(prepareRestart(room, 's1')).toMatchObject({ ok: false });
    room.players[2] = { ...room.players[2]!, isBot: true };
    expect(prepareRestart(room, 's0')).toMatchObject({
      ok: false,
      error: { code: 'NOT_ENOUGH_PLAYERS' },
    });
  });

  it('drops bots and clears readiness on a valid restart', () => {
    const room = makeRoom(4);
    room.phase = 'reveal';
    room.players[3] = { ...room.players[3]!, isBot: true };
    room.readyForRestart.add('s0');

    expect(prepareRestart(room, 's0')).toEqual({ ok: true });
    expect(room.players.map((p) => p.id)).toEqual(['s0', 's1', 's2']);
    expect(room.readyForRestart.size).toBe(0);
  });
});
