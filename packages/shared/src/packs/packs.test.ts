// SPDX-License-Identifier: AGPL-3.0-only

// Pack validation suite (DD-16, FM-PACK-1..5, design §4.4): pools.test.ts's
// rules held against every pack, plus the pack's own — five options a slot, ids
// in the pack's namespace and never a base id, an aftermath on every ending, a
// slice that never touches the picture. Then the Christmas 2026 edition's
// drafted texts against the base templates' rules, and `optionsFor`.
//
// The prompts — 625 scenes, 25 aftermaths, the length cap, the refusals — are
// tested with the rest of the prompt builder, in the server's prompt.test.ts.
//
// What no test can check: FM-POOL-6 and B-29's content brief (secular, local
// glosses, no brands, no real people), and whether a costume reads in the
// picture — that is what Step 104's test drawing is for.

import { describe, expect, it } from 'vitest';
import { polishProse, polishRussianProse } from '../i18n/grammar.js';
import { renderProse } from '../i18n/index.js';
import { ALL_OPTION_IDS, POOLS } from '../pools/options.js';
import {
  ASCII_PRINTABLE,
  AUTHORED_LANGUAGES,
  EN_WHY_CONNECTIVE,
  OPTION_ID_PATTERN,
  OPTION_TEXT_MAX_LENGTH,
  PROMPT_FRAGMENT_MAX_LENGTH,
  RU_ENDING_MIN_WORDS,
  RU_WITH_PREPOSITION,
  SLOTS,
  VISUAL_SLOTS,
} from '../pools/schema.js';
import type { OptionId, SlotIndex } from '../pools/schema.js';
import { POOL_TEXTS } from '../pools/text/index.js';
import { CHR26_TEXTS } from './chr26/text/index.js';
import type { Chr26DraftedLanguage } from './chr26/text/index.js';
import { CHR26_LANGUAGES, PACKS, PACK_TEXTS, optionsFor } from './index.js';
import { PACK_IDS, PACK_OPTIONS_PER_SLOT } from './schema.js';
import type { StoryContent } from './schema.js';

function expectFragment(id: OptionId, fragment: string | undefined): void {
  expect(fragment, `${id} needs a fragment`).toBeTruthy();
  expect(fragment, `${id}'s fragment must not be padded`).toBe(fragment?.trim());
  expect(fragment?.length, `${id}'s fragment exceeds the length cap`).toBeLessThanOrEqual(
    PROMPT_FRAGMENT_MAX_LENGTH,
  );
  expect(fragment, `${id}'s fragment must be printable ASCII`).toMatch(ASCII_PRINTABLE);
}

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

describe('the pack registry (DD-16)', () => {
  it('registers every pack under its own id', () => {
    expect(Object.keys(PACKS).sort()).toEqual([...PACK_IDS].sort());
    for (const id of PACK_IDS) expect(PACKS[id].id).toBe(id);
  });

  it('keeps every slice off the picture slots, so a free story gets a library picture', () => {
    for (const id of PACK_IDS) {
      const pictured = PACKS[id].sliceSlots.filter((slot) => VISUAL_SLOTS.includes(slot));
      expect(pictured, `${id} slices a picture slot`).toEqual([]);
    }
    expect(PACKS.chr26.sliceSlots).toEqual([3, 5, 6]);
  });

  it("offers the Christmas 2026 edition in B-29's 20 languages: all but ar, he and fa", () => {
    expect(new Set(CHR26_LANGUAGES).size).toBe(CHR26_LANGUAGES.length);
    expect([...CHR26_LANGUAGES].sort()).toEqual(
      AUTHORED_LANGUAGES.filter((language) => !['ar', 'he', 'fa'].includes(language)).sort(),
    );
    expect(CHR26_LANGUAGES).toHaveLength(20);
  });

  it('has texts only in languages the pack is offered in', () => {
    for (const id of PACK_IDS) {
      for (const language of Object.keys(PACK_TEXTS[id])) {
        expect(PACKS[id].languages as readonly string[], `${id} has ${language} texts`).toContain(
          language,
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Ids and fragments — frozen at Step 103 (DD-1, DD-4)
// ---------------------------------------------------------------------------

describe.each(PACK_IDS)('%s ids and fragments (FM-PACK-1..3)', (packId) => {
  const pools = PACKS[packId].pools;
  const ids = SLOTS.flatMap((config) => pools[config.slot].map((option) => option.id));

  it(`holds ${PACK_OPTIONS_PER_SLOT} options in every slot`, () => {
    for (const config of SLOTS) {
      expect(pools[config.slot], `slot ${config.slot} (${config.label})`).toHaveLength(
        PACK_OPTIONS_PER_SLOT,
      );
    }
  });

  it('gives every option an id in its slot namespace, its slug opening with the pack id', () => {
    for (const config of SLOTS) {
      for (const option of pools[config.slot]) {
        expect(option.id).toMatch(OPTION_ID_PATTERN);
        expect(
          option.id.startsWith(`${config.prefix}.${packId}-`),
          `"${option.id}" sits in slot ${config.slot} so it must start "${config.prefix}.${packId}-"`,
        ).toBe(true);
      }
    }
  });

  it('keeps every id unique, and apart from every base id', () => {
    expect(new Set(ids).size).toBe(ids.length);
    const base = new Set(ALL_OPTION_IDS);
    expect(ids.filter((id) => base.has(id))).toEqual([]);
  });

  it('gives a promptEn to every visual option and to nothing else', () => {
    for (const config of SLOTS) {
      for (const option of pools[config.slot]) {
        if (config.kind === 'visual') expectFragment(option.id, option.promptEn);
        else expect(option.promptEn, `${option.id} is prose-only`).toBeUndefined();
      }
    }
  });

  it('gives an aftermathEn to every ending and to nothing else', () => {
    for (const config of SLOTS) {
      for (const option of pools[config.slot]) {
        if (config.slot === 6) expectFragment(option.id, option.aftermathEn);
        else expect(option.aftermathEn, `${option.id} is not an ending`).toBeUndefined();
      }
    }
  });

  it('keeps fragments distinct within a slot', () => {
    for (const slot of [...VISUAL_SLOTS, 6] as const) {
      const fragments = pools[slot].map((option) => option.promptEn ?? option.aftermathEn);
      expect(new Set(fragments).size, `slot ${slot} repeats a fragment`).toBe(fragments.length);
    }
  });

  it('keeps the leads and the companions apart by head noun, so no scene draws a chimera', () => {
    // The head is the slug's last word (who.chr26-polar-bear → bear): the rule
    // pools/options.ts sets for the base pools, here made checkable.
    const head = (id: OptionId): string => id.slice(id.lastIndexOf('-') + 1);
    const words = (slot: SlotIndex): Set<string> =>
      new Set(
        pools[slot].flatMap((option) => (option.promptEn ?? '').toLowerCase().split(/[^a-z]+/)),
      );
    for (const [from, to] of [
      [0, 1],
      [1, 0],
    ] as const) {
      const other = words(to);
      for (const option of pools[from]) {
        expect(
          other.has(head(option.id)),
          `${option.id}'s "${head(option.id)}" is also a word of a slot-${to} fragment`,
        ).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// The Christmas 2026 edition's display texts — drafts for the owner's edit
// ---------------------------------------------------------------------------

describe("the Christmas 2026 edition's texts (FM-POOL-3/4, B-29)", () => {
  const pools = PACKS.chr26.pools;
  const ids = SLOTS.flatMap((config) => pools[config.slot].map((option) => option.id));
  const drafted = Object.keys(CHR26_TEXTS) as Chr26DraftedLanguage[];

  it.each(drafted)("%s covers exactly the pack's ids", (language) => {
    const authored = new Set(Object.keys(CHR26_TEXTS[language]));
    const missing = ids.filter((id) => !authored.has(id));
    const extra = [...authored].filter((id) => !ids.includes(id));
    expect(missing, `${language} is missing ${missing.length} text(s)`).toEqual([]);
    expect(extra, `${language} has ${extra.length} text(s) for unknown ids`).toEqual([]);
  });

  it.each(drafted)('%s texts are non-empty, trimmed and within 70 chars', (language) => {
    for (const [id, text] of Object.entries(CHR26_TEXTS[language])) {
      expect(text.trim(), `${language}/${id} must not be blank`).not.toBe('');
      expect(text, `${language}/${id} must not be padded with whitespace`).toBe(text.trim());
      expect(
        [...text].length,
        `${language}/${id} is ${[...text].length} chars, cap is ${OPTION_TEXT_MAX_LENGTH}`,
      ).toBeLessThanOrEqual(OPTION_TEXT_MAX_LENGTH);
    }
  });

  it.each(drafted)('%s texts are unique within each slot', (language) => {
    for (const config of SLOTS) {
      const rendered = pools[config.slot].map((option) => CHR26_TEXTS[language][option.id]);
      expect(new Set(rendered).size, `${language} slot ${config.slot} repeats a text`).toBe(
        rendered.length,
      );
    }
  });

  it('opens every English slot-5 text with a connective, so renderProse adds no "for "', () => {
    for (const option of pools[5]) {
      expect(CHR26_TEXTS.en[option.id], `en/${option.id}`).toMatch(EN_WHY_CONNECTIVE);
    }
  });

  it('starts every Russian slot-1 text with «с » or «со »', () => {
    for (const option of pools[1]) {
      expect(CHR26_TEXTS.ru[option.id], `ru/${option.id}`).toMatch(RU_WITH_PREPOSITION);
    }
  });

  it('keeps every Russian slot-6 text above the bare-noun threshold', () => {
    for (const option of pools[6]) {
      const text = CHR26_TEXTS.ru[option.id] ?? '';
      expect(text.split(/\s+/).length, `ru/${option.id}`).toBeGreaterThanOrEqual(
        RU_ENDING_MIN_WORDS,
      );
    }
  });

  it('leaves no comma in Russian slots 0–4, written or added by polishRussianProse', () => {
    // The template joins slots 0–4 with spaces alone, so a comma there opens a
    // clause nothing closes (pools/text/ru.ts). Wrapping the text in words
    // catches a trigger word in any position, the first included.
    for (const slot of [0, 1, 2, 3, 4] as const) {
      for (const option of pools[slot]) {
        const text = CHR26_TEXTS.ru[option.id] ?? '';
        expect(polishRussianProse(`я ${text} я`), `ru/${option.id}`).not.toContain(',');
      }
    }
  });

  it.each(drafted)('%s tells full and slice stories with nothing left over', (language) => {
    // Option i of every slot, for each i: a full story (the pack in every slot)
    // and a slice story (today's characters, place and action, the pack's when,
    // why and ending). A smoke test, not a pin — the texts are the owner's to
    // edit.
    const texts = { ...POOL_TEXTS[language], ...CHR26_TEXTS[language] };
    const contents: StoryContent[] = [
      { kind: 'full', pack: 'chr26' },
      { kind: 'slice', pack: 'chr26' },
    ];
    for (const content of contents) {
      for (let i = 0; i < PACK_OPTIONS_PER_SLOT; i++) {
        const answers = SLOTS.map((config) => {
          const id = optionsFor(config.slot, content)[i]?.id ?? 'none';
          return texts[id] ?? `<no text for ${id}>`;
        });
        const prose = polishProse(language, renderProse(language, answers));
        expect(prose, `${content.kind} story ${i}`).not.toMatch(/\{[0-6]\}|<no text| {2}| ,/);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// optionsFor — which pool a story's slot draws from
// ---------------------------------------------------------------------------

describe('optionsFor (FM-PACK-4)', () => {
  const pack = PACKS.chr26.pools;

  it('offers the base pools in every slot of a base story', () => {
    for (const config of SLOTS) {
      expect(optionsFor(config.slot, { kind: 'base' })).toBe(POOLS[config.slot]);
    }
  });

  it("offers the pack's when, why and ending in a slice story, the base pools elsewhere", () => {
    for (const config of SLOTS) {
      const expected = [3, 5, 6].includes(config.slot) ? pack[config.slot] : POOLS[config.slot];
      expect(optionsFor(config.slot, { kind: 'slice', pack: 'chr26' })).toBe(expected);
    }
  });

  it('offers the pack in every slot of a full story', () => {
    for (const config of SLOTS) {
      expect(optionsFor(config.slot, { kind: 'full', pack: 'chr26' })).toBe(pack[config.slot]);
    }
  });
});
