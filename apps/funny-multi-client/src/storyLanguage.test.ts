// SPDX-License-Identifier: AGPL-3.0-only

// B-15. A story told in a language other than the room's is rendered on the
// client from its option ids, with the same resolve, render and polish steps
// the server takes (game.ts `resolveAnswers`/`revealProse`); in the room
// language the server's own texts are shown as they came.

import { describe, expect, it } from 'vitest';
import { AUTHORED_LANGUAGES, LANGUAGES, PACKS, POOLS, POOL_TEXTS, SLOT_COUNT } from '@funny/shared';
import type { SlotIndex } from '@funny/shared';
import {
  CONTENT_LANGUAGES,
  endingText,
  isAuthoredLanguage,
  renderStory,
  storyIn,
} from './storyLanguage';

const IDS = Array.from({ length: SLOT_COUNT }, (_, i) => POOLS[i as SlotIndex][0]!.id);

describe('CONTENT_LANGUAGES', () => {
  it("is the start window's list: every registry language, in registry order", () => {
    expect(CONTENT_LANGUAGES.map((l) => l.code)).toEqual(LANGUAGES.map((l) => l.code));
    expect(CONTENT_LANGUAGES).toHaveLength(23);
  });
});

describe('isAuthoredLanguage', () => {
  it.each([...AUTHORED_LANGUAGES])('accepts %s', (code) => {
    expect(isAuthoredLanguage(code)).toBe(true);
  });

  it.each([null, undefined, '', 'xx', 'EN', 'en-US'])('rejects %j', (value) => {
    expect(isAuthoredLanguage(value)).toBe(false);
  });
});

describe('renderStory', () => {
  it('resolves each id to its text in the language asked for', () => {
    expect(renderStory('fr', IDS).answers).toEqual(IDS.map((id) => POOL_TEXTS.fr[id]));
  });

  it('leaves an unanswered slot empty rather than throwing', () => {
    const { answers } = renderStory('en', [null, ...IDS.slice(1)]);
    expect(answers[0]).toBe('');
    expect(answers.slice(1)).toEqual(IDS.slice(1).map((id) => POOL_TEXTS.en[id]));
  });

  it('always gives one answer per slot', () => {
    expect(renderStory('en', [])).toMatchObject({ answers: Array(SLOT_COUNT).fill('') });
  });

  it.each([...AUTHORED_LANGUAGES])(
    'tells a whole story in %s, with no placeholder left',
    (language) => {
      const { prose } = renderStory(language, IDS);
      expect(prose.trim().length).toBeGreaterThan(0);
      expect(prose).not.toMatch(/\{\d\}/);
    },
  );
});

describe('storyIn', () => {
  const WIRE = { answers: ['as sent'], prose: 'As the server sent it.', optionIds: IDS };

  it("shows the server's own texts in the room language", () => {
    expect(storyIn(WIRE, 'ru', 'ru')).toEqual({
      answers: ['as sent'],
      prose: 'As the server sent it.',
    });
  });

  it('renders the story locally in any other language', () => {
    expect(storyIn(WIRE, 'ru', 'ja')).toEqual(renderStory('ja', IDS));
  });
});

describe('endingText', () => {
  // A full Christmas story: the pack's first option in every slot.
  const FULL = Array.from(
    { length: SLOT_COUNT },
    (_, i) => PACKS.chr26.pools[i as SlotIndex][0]!.id,
  );

  it('opens the ending slot with a capital, as the card starts the sentence', () => {
    expect(endingText(renderStory('en', FULL), 'en')).toBe(
      'Everything vanished under a mountain of wrapping paper',
    );
    expect(endingText(renderStory('uk', FULL), 'uk')).toBe(
      'Усе зникло під горою обгорткового паперу',
    );
  });

  it("reads German's whole last sentence, its ending a dative after «mit» (D1 A)", () => {
    expect(endingText(renderStory('de', FULL), 'de')).toBe(
      'Am Ende endete es mit einem Berg Geschenkpapier, unter dem alles verschwand',
    );
  });

  it('is empty for a story with no ending', () => {
    expect(endingText(renderStory('de', FULL.slice(0, -1)), 'de')).toBe('');
    expect(endingText(renderStory('en', FULL.slice(0, -1)), 'en')).toBe('');
  });
});
