// SPDX-License-Identifier: AGPL-3.0-only

// Pack validation suite (DD-16, FM-PACK-1..5, design §4.4): pools.test.ts's
// rules held against every pack, plus the pack's own — five options a slot, ids
// in the pack's namespace and never a base id, an aftermath on every ending, a
// slice that never touches the picture. Then the Christmas 2026 edition's
// drafted texts against the base templates' rules, and `optionsFor`.
//
// Then the rules that bring a pack into a room (Step 117): the dates
// (FM-PACK-6), which room is offered it, the golden story, and the
// display texts with the English fallback (owner decision 4A).
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
import {
  CHR26_LANGUAGES,
  PACKS,
  PACK_TEXTS,
  cutoffOf,
  freeGameContents,
  isGolden,
  isPackFree,
  optionTexts,
  optionsFor,
  packForRoom,
} from './index.js';
import { GOLDEN_STORIES, PACK_IDS, PACK_OPTIONS_PER_SLOT } from './schema.js';
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

  it("has the Christmas 2026 edition's texts in every one of its languages (Step 118)", () => {
    expect(Object.keys(CHR26_TEXTS).sort()).toEqual([...CHR26_LANGUAGES].sort());
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

  it.each(drafted)('%s texts are NFC and end in no punctuation of their own', (language) => {
    // The template closes every sentence itself, so a text's own full stop
    // would double it; NFC keeps a Yoruba ọ̀ from counting 3 code points.
    for (const [id, text] of Object.entries(CHR26_TEXTS[language])) {
      expect(text, `${language}/${id} is not NFC`).toBe(text.normalize('NFC'));
      expect(text, `${language}/${id}`).not.toMatch(/[.!?…。！？।]$/u);
    }
  });

  it('writes no Yoruba dot below as a combining U+0323', () => {
    for (const [id, text] of Object.entries(CHR26_TEXTS.yo)) {
      expect(text, `yo/${id}`).not.toContain('̣');
    }
  });

  // The base templates' mechanical rules, as each pools/text/<language>.ts
  // header sets them out: the word a slot must open or close with so that the
  // template's own glue words read (Step 118). The grammar beyond is B-3's
  // native review.
  const SHAPES: readonly (readonly [Chr26DraftedLanguage, SlotIndex, string, RegExp])[] = [
    ['de', 1, 'leaves «mit» to the template', /^(?!mit )/],
    ['fr', 1, 'leaves «avec» to the template', /^(?!avec )/],
    ['it', 1, 'leaves «con» to the template', /^(?!con )/],
    ['es-es', 1, 'leaves «con» to the template', /^(?!con )/],
    ['es-419', 1, 'leaves «con» to the template', /^(?!con )/],
    ['pt-br', 1, 'leaves «com» to the template', /^(?!com )/],
    ['id', 1, 'leaves «bersama» to the template', /^(?!bersama )/],
    ['id', 5, 'opens with its own connective', /^(untuk|karena|demi|supaya|agar) /],
    ['sw', 1, 'leaves «na» to the template', /^(?!(pamoja )?na )/],
    ['sw', 4, 'is a wali- verb', /^wali/],
    ['sw', 5, 'opens with its own connective', /^(ili|kwa sababu|kwa ajili ya) /],
    ['yo', 5, 'opens with its own connective', /^(láti|nítorí|kí) /],
    ['uk', 1, 'opens with «з», «із» or «зі»', /^(з|із|зі) /],
    ['uk', 6, 'is a clause of three words or more', /^\S+\s+\S+\s+\S+/],
    ['ko', 2, 'leaves «에서» to the template', /(?<!에서)$/],
    ['ko', 4, 'is a connective «-고» form', /고$/],
    ['ja', 2, 'leaves «で» to the template', /(?<!で)$/],
    ['ja', 4, 'is a て-form', /[てで]$/],
    ['zh', 1, 'opens with «和» or «跟»', /^[和跟]/],
    ['zh', 2, 'leaves «在» to the template', /^(?!在)/],
    ['zh', 4, 'carries «了»', /了/],
    ['zh', 5, 'opens with «为了» or «因为»', /^(为了|因为)/],
    ['yue', 1, 'opens with «同»', /^同/],
    ['yue', 2, 'leaves «喺» to the template', /^(?!喺)/],
    ['yue', 4, 'is completed with «咗» or «晒»', /[咗晒]/],
    ['yue', 5, 'opens with «為咗» or «因為»', /^(為咗|因為)/],
    ['hi', 0, 'closes with «ने»', / ने$/],
    ['hi', 1, 'closes with «के साथ»', / के साथ$/],
    ['hi', 5, 'closes with «के लिए» or «के नाते»', / के (लिए|नाते)$/],
    ['ta', 1, 'closes with «-உடன்»', /டன்$/],
    ['ta', 4, 'closes with «-ார்கள்»', /ார்கள்$/],
    ['te', 1, 'closes with «-తో కలిసి»', /తో కలిసి$/],
    ['te', 4, 'closes with «-ఆరు»', /ారు$/],
    ['bn', 1, 'closes with «সাথে»', / সাথে$/],
    ['bn', 4, 'is a simple past in «-ল»', /ল$/],
  ];

  it.each(SHAPES)('%s slot %i %s', (language, slot, _rule, pattern) => {
    for (const option of pools[slot]) {
      expect(CHR26_TEXTS[language][option.id], `${language}/${option.id}`).toMatch(pattern);
    }
  });

  it('leaves no comma in Ukrainian slots 0–4, where the template joins with spaces alone', () => {
    for (const slot of [0, 1, 2, 3, 4] as const) {
      for (const option of pools[slot]) {
        expect(CHR26_TEXTS.uk[option.id], `uk/${option.id}`).not.toContain(',');
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

// ---------------------------------------------------------------------------
// Packs in rooms (Step 117) — dates, offer, golden stories, texts
// ---------------------------------------------------------------------------

describe('the dates (FM-PACK-6)', () => {
  it('ends a last day at noon UTC the next day, when it has ended everywhere on Earth', () => {
    expect(new Date(cutoffOf('2027-07-01')).toISOString()).toBe('2027-07-02T12:00:00.000Z');
    expect(new Date(cutoffOf('2027-08-01')).toISOString()).toBe('2027-08-02T12:00:00.000Z');
  });

  it("dates chr26's free part to 1 July 2027 and its paid codes to 1 August 2027", () => {
    expect(PACKS.chr26.freeUntil).toBe('2027-07-01');
    expect(PACKS.chr26.paidUntil).toBe('2027-08-01');
  });

  it('refuses anything but a YYYY-MM-DD day', () => {
    expect(() => cutoffOf('2027-7-1')).toThrow();
    expect(() => cutoffOf('not a day')).toThrow();
  });

  it('keeps the free part on to the last millisecond before the cut-off, and off from it', () => {
    const cutoff = Date.parse('2027-07-02T12:00:00Z');
    expect(isPackFree('chr26', Date.parse('2026-11-29T00:00:00Z'))).toBe(true);
    expect(isPackFree('chr26', cutoff - 1)).toBe(true);
    expect(isPackFree('chr26', cutoff)).toBe(false);
  });
});

describe('packForRoom (owner decisions 3A and 4A)', () => {
  const now = Date.parse('2026-11-29T00:00:00Z');

  it('offers chr26 to a room in every language with its texts', () => {
    for (const language of Object.keys(PACK_TEXTS.chr26) as Chr26DraftedLanguage[]) {
      expect(packForRoom(language, now), language).toBe('chr26');
    }
  });

  it('offers no pack to ar, he and fa, nor to a language whose texts are not drafted yet', () => {
    for (const language of AUTHORED_LANGUAGES) {
      const drafted = (PACK_TEXTS.chr26 as Record<string, unknown>)[language] !== undefined;
      expect(packForRoom(language, now), language).toBe(drafted ? 'chr26' : null);
    }
    for (const language of ['ar', 'he', 'fa'] as const) {
      expect(packForRoom(language, now)).toBeNull();
    }
  });

  it('offers it no longer once the free part has ended', () => {
    expect(packForRoom('en', Date.parse('2027-07-02T11:59:59Z'))).toBe('chr26');
    expect(packForRoom('en', Date.parse('2027-07-02T12:00:00Z'))).toBeNull();
  });
});

describe('freeGameContents (FM-PACK-4, owner decision 1C)', () => {
  it.each([3, 4, 5, 6, 7])('makes one golden story in a game of %i, the rest the slice', (n) => {
    expect(GOLDEN_STORIES).toBe(1);
    for (let run = 0; run < 50; run++) {
      const contents = freeGameContents('chr26', n);
      expect(contents).toHaveLength(n);
      expect(contents.filter(isGolden)).toHaveLength(GOLDEN_STORIES);
      for (const content of contents) {
        expect(content).toEqual({ kind: isGolden(content) ? 'full' : 'slice', pack: 'chr26' });
      }
    }
  });

  it('can make any story golden', () => {
    const seen = new Set<number>();
    for (let run = 0; run < 400; run++) {
      freeGameContents('chr26', 7).forEach((content, i) => {
        if (isGolden(content)) seen.add(i);
      });
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('ends whatever the random source returns', () => {
    expect(freeGameContents('chr26', 5, () => 0).filter(isGolden)).toHaveLength(1);
    expect(freeGameContents('chr26', 5, () => 0.999999).filter(isGolden)).toHaveLength(1);
    expect(freeGameContents('chr26', 5, () => 1).filter(isGolden)).toHaveLength(1);
  });

  it('marks only a full story golden', () => {
    expect(isGolden({ kind: 'base' })).toBe(false);
    expect(isGolden({ kind: 'slice', pack: 'chr26' })).toBe(false);
    expect(isGolden({ kind: 'full', pack: 'chr26' })).toBe(true);
  });
});

describe('optionTexts (owner decision 4A)', () => {
  const packIds = Object.values(PACKS.chr26.pools).flatMap((options) => options.map((o) => o.id));

  it("resolves every base id to the language's own text", () => {
    for (const language of AUTHORED_LANGUAGES) {
      for (const id of ALL_OPTION_IDS) {
        expect(optionTexts(language)[id]).toBe(POOL_TEXTS[language][id]);
      }
    }
  });

  it("resolves every pack id to the language's own text where it has one", () => {
    for (const language of Object.keys(CHR26_TEXTS) as Chr26DraftedLanguage[]) {
      for (const id of packIds) expect(optionTexts(language)[id]).toBe(CHR26_TEXTS[language][id]);
    }
  });

  it('resolves every pack id to English in a language without its texts', () => {
    for (const language of ['ar', 'he', 'fa'] as const) {
      for (const id of packIds) expect(optionTexts(language)[id]).toBe(CHR26_TEXTS.en[id]);
    }
  });
});
