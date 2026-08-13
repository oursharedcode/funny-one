// SPDX-License-Identifier: AGPL-3.0-only

// T-2.5 — i18n coverage (design §9, FM-POOL-4).
//
// SRC's `i18n/index.test.ts` is not adapted: every one of its cases exercises
// one of the three render-time repair transforms, and `i18n/index.ts` documents
// why all three are gone (they repaired free-typed input; answers are now
// authored pool texts). `game.test.ts` already re-derives SRC's own predicates
// and proves no shipped text would trigger a repair — that is the *pool* side of
// the claim. This file is the *module* side: what the loader and `renderProse`
// guarantee on their own, for any answers at all.
//
// The theme throughout is coverage. A language the server offers must be a
// language it can fully render — questions, prose template and pool texts —
// and every one of the 7 answers a player worked for must reach the screen.

import { describe, expect, it } from 'vitest';
import { AUTHORED_LANGUAGES, LANGUAGES, POOL_TEXTS, type AuthoredLanguage } from '@funny/shared';
import { PROSE_TEMPLATES, QUESTIONS, renderProse, requireAuthoredLanguage } from './index.js';

/** Seven identifiable answers, so a lost or duplicated slot is obvious. */
const ANSWERS = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'];

describe('language coverage', () => {
  it('loads questions and a prose template for exactly the authored languages', () => {
    // Not `toContain` per language: extra keys matter too. The loader skips
    // `<code>.json` files whose code is not authored, and this is what proves
    // it — a stray half-translated file must not quietly become renderable.
    const expected = [...AUTHORED_LANGUAGES].sort();
    expect(Object.keys(QUESTIONS).sort()).toEqual(expected);
    expect(Object.keys(PROSE_TEMPLATES).sort()).toEqual(expected);
  });

  it('has pool texts for every language it has questions for', () => {
    // The three sources are loaded independently — server JSON, server JSON,
    // shared TS module — so nothing but a test ties them together. A language
    // with questions but no pool texts renders a story of "undefined".
    expect(Object.keys(POOL_TEXTS).sort()).toEqual(Object.keys(QUESTIONS).sort());
  });

  it('offers only languages the registry knows', () => {
    const codes = LANGUAGES.map((l) => l.code as string);
    for (const code of AUTHORED_LANGUAGES) expect(codes).toContain(code);
  });

  for (const language of AUTHORED_LANGUAGES) {
    describe(language, () => {
      it('asks exactly the 7 questions of a round', () => {
        // 7 questions, 7 slots, 7 rounds — the number is structural, not a
        // content choice. An eighth question would strand a slot with no round.
        expect(QUESTIONS[language]).toHaveLength(7);
      });

      it('has no blank or duplicated question', () => {
        const questions = QUESTIONS[language];
        for (const [i, q] of questions.entries()) {
          expect(q.trim(), `question ${i} is blank`).not.toBe('');
        }
        expect(new Set(questions).size, 'two rounds would ask the same thing').toBe(7);
      });

      it('places every slot in the prose template exactly once', () => {
        // The Russian template reorders the slots, so their positions cannot be
        // asserted — but each must appear, and appear once. A missing `{n}`
        // silently discards a player's answer; a repeated one prints it twice.
        const placeholders = PROSE_TEMPLATES[language].match(/\{[0-6]\}/g) ?? [];
        expect([...placeholders].sort()).toEqual(['{0}', '{1}', '{2}', '{3}', '{4}', '{5}', '{6}']);
      });
    });
  }
});

describe('renderProse', () => {
  for (const language of AUTHORED_LANGUAGES) {
    it(`substitutes all 7 answers and leaves no placeholder behind (${language})`, () => {
      const prose = renderProse(language, ANSWERS);
      for (const answer of ANSWERS) expect(prose).toContain(answer);
      expect(prose, 'an unfilled slot would ship "{4}" to the screen').not.toMatch(/\{\d\}/);
    });
  }

  it('maps each slot to its own answer', () => {
    // Off-by-one in the digit parse would still fill every slot and still
    // contain every answer — it would just attribute them to the wrong
    // questions. Only order catches it.
    const prose = renderProse('en', ANSWERS);
    expect(prose).toBe('A0 and A1 were A2 A3. They A4 A5. In the end, A6.');
  });

  it('honours the Russian slot reordering', () => {
    // «Когда?» (slot 3) precedes «Где?» (slot 2) in Russian, from the same
    // indices. One substitution pass serves both templates precisely because
    // the index, not the position, carries the meaning.
    const prose = renderProse('ru', ANSWERS);
    expect(prose).toBe('A0 A1 A3 A2 A4 A5. В итоге A6.');
  });

  it('inserts answers verbatim, applying none of SRC’s repairs', () => {
    // The module-level half of the claim in `game.test.ts`: even an answer that
    // *would* have tripped every SRC transform passes through untouched. If a
    // repair were ever reintroduced, this fails whatever the pools contain.
    const prose = renderProse('en', ['mouse', 'kangaroo', 'here', 'now', 'skiing', 'money', 'joy']);
    expect(prose).toContain('They skiing money.');
    expect(prose, 'SRC prepended "for " to a bare-noun slot 5').not.toContain('for money');

    const ru = renderProse('ru', ['кот', 'кот', 'там', 'тогда', 'пели', 'зачем-то', 'отдыхом']);
    expect(ru).toContain('кот кот');
    expect(ru, 'SRC prepended "и " to a bare-noun slot 1').not.toContain('кот и кот');
    expect(ru, 'SRC prepended «это закончилось» to a bare-noun slot 6').toContain(
      'В итоге отдыхом.',
    );
  });

  it('does not re-substitute a placeholder that appears inside an answer', () => {
    // Pool texts never contain braces, but the replace callback is what makes
    // that irrelevant — a loop of `.replace('{n}', answers[n])` would expand
    // the literal below into A1 and shift every later slot.
    const prose = renderProse('en', ['{1}', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6']);
    expect(prose.startsWith('{1} and A1')).toBe(true);
  });

  it('renders a blank for a missing answer rather than throwing', () => {
    // Defence in depth. `assembleStories` always passes 7, but a story cut
    // short by a mid-game drop must still reveal — a half-empty sentence is
    // recoverable, a throw inside the reveal broadcast is not.
    const prose = renderProse('en', ['A0', 'A1']);
    expect(prose).toBe('A0 and A1 were  . They  . In the end, .');
    expect(prose).not.toMatch(/\{\d\}|undefined/);
  });
});

describe('requireAuthoredLanguage', () => {
  for (const language of AUTHORED_LANGUAGES) {
    it(`accepts ${language}`, () => {
      expect(requireAuthoredLanguage(language)).toBe(language);
    });
  }

  it('rejects a registered language that has no texts yet', () => {
    // `fr` is a real `Language` and will pass `isValidLanguage` at room
    // creation from T-6.2 onward. Until its texts land, reaching the renderer
    // with it must fail loudly here rather than emit "undefined and undefined".
    expect(() => requireAuthoredLanguage('fr')).toThrow(/no authored texts yet/);
  });

  it('rejects a code that is not a language at all', () => {
    expect(() => requireAuthoredLanguage('klingon')).toThrow(/\[i18n\]/);
  });

  it('names the offending language so the log identifies the room', () => {
    expect(() => requireAuthoredLanguage('ja')).toThrow(/"ja"/);
  });

  it('narrows to AuthoredLanguage for the renderer', () => {
    // The point of the function is the type, which no runtime assertion can
    // check — so this line is the test: it does not compile if the return type
    // widens back to `string`.
    const narrowed: AuthoredLanguage = requireAuthoredLanguage('en');
    expect(renderProse(narrowed, ANSWERS)).toContain('A0');
  });
});
