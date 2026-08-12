// SPDX-License-Identifier: AGPL-3.0-only

// Pool validation suite (FM-POOL-4, design §4.2). This is the gate for every
// pool-authoring task: T-1.4 (ids + prompt fragments), T-1.5 (en + ru texts),
// T-6.3 (the remaining 13 languages).
//
// It is RED on arrival by design (T-1.3 in the task plan): options.ts and the
// text files are empty scaffolds, so every slot reports 0 options against its
// minimum. The failures are the authoring to-do list, and Gate 1 is the point
// at which they must all be green for en + ru.
//
// What no test here can check: FM-POOL-6 (family-friendly, absurd, no real
// people or brands). That stays a human review obligation on T-1.4/T-1.5.

import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '../languages.js';
import {
  ASCII_PRINTABLE,
  AUTHORED_LANGUAGES,
  OPTION_ID_PATTERN,
  OPTION_TEXT_MAX_LENGTH,
  PROMPT_FRAGMENT_MAX_LENGTH,
  PROSE_MAX_OPTIONS,
  PROSE_MIN_OPTIONS,
  PROSE_SLOTS,
  RU_WITH_PREPOSITION,
  SLOT_COUNT,
  SLOTS,
  VISUAL_MAX_OPTIONS,
  VISUAL_MIN_OPTIONS,
  VISUAL_SLOTS,
} from './schema.js';
import { ALL_OPTION_IDS, POOLS } from './options.js';
import { POOL_TEXTS } from './text/index.js';

// ---------------------------------------------------------------------------
// Slot configuration — guards the table itself against edits that would drift
// from FM-POOL-1 / DD-3.
// ---------------------------------------------------------------------------

describe('slot configuration (FM-POOL-1)', () => {
  it('has exactly 7 slots, one per question (FM-CORE-5)', () => {
    expect(SLOT_COUNT).toBe(7);
    expect(SLOTS.map((s) => s.slot)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('marks slots 0, 1, 2 and 4 visual and 3, 5, 6 prose-only (DD-3)', () => {
    expect(VISUAL_SLOTS).toEqual([0, 1, 2, 4]);
    expect(PROSE_SLOTS).toEqual([3, 5, 6]);
  });

  it('sizes visual slots 9–12 and prose slots 20–30', () => {
    for (const config of SLOTS) {
      const [min, max] =
        config.kind === 'visual'
          ? [VISUAL_MIN_OPTIONS, VISUAL_MAX_OPTIONS]
          : [PROSE_MIN_OPTIONS, PROSE_MAX_OPTIONS];
      expect(config.minOptions, `slot ${config.slot} (${config.label}) min`).toBe(min);
      expect(config.maxOptions, `slot ${config.slot} (${config.label}) max`).toBe(max);
    }
  });

  it('gives every slot a distinct id prefix', () => {
    const prefixes = SLOTS.map((s) => s.prefix);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });
});

// ---------------------------------------------------------------------------
// Option ids and prompt fragments (T-1.4 gate)
// ---------------------------------------------------------------------------

describe('option ids and prompt fragments (FM-POOL-1, FM-IMG-2)', () => {
  // Written as a loop rather than it.each: vitest renders a `$slot` of 0 as "+0".
  for (const config of SLOTS) {
    it(`slot ${config.slot} (${config.label}) holds ${config.minOptions}–${config.maxOptions} options`, () => {
      const count = POOLS[config.slot].length;
      expect(
        count,
        `slot ${config.slot} (${config.label}) has ${count} options; author ${config.minOptions}–${config.maxOptions} of them`,
      ).toBeGreaterThanOrEqual(config.minOptions);
      expect(count).toBeLessThanOrEqual(config.maxOptions);
    });
  }

  it('gives every option an id in its own slot namespace', () => {
    for (const config of SLOTS) {
      for (const option of POOLS[config.slot]) {
        expect(option.id, `"${option.id}" must match <prefix>.<kebab-slug>`).toMatch(
          OPTION_ID_PATTERN,
        );
        expect(
          option.id.startsWith(`${config.prefix}.`),
          `"${option.id}" sits in slot ${config.slot} (${config.label}) so it must start "${config.prefix}."`,
        ).toBe(true);
      }
    }
  });

  it('keeps every option id unique across all slots', () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const id of ALL_OPTION_IDS) {
      if (seen.has(id)) duplicates.push(id);
      seen.add(id);
    }
    expect(duplicates).toEqual([]);
  });

  it('gives every visual-slot option a printable-ASCII promptEn within the length cap', () => {
    for (const slot of VISUAL_SLOTS) {
      for (const option of POOLS[slot]) {
        const fragment = option.promptEn;
        expect(fragment, `${option.id} is on a visual slot and needs a promptEn`).toBeTruthy();
        expect(fragment?.trim(), `${option.id} promptEn must not be blank`).not.toBe('');
        expect(fragment, `${option.id} promptEn must not be padded`).toBe(fragment?.trim());
        expect(
          fragment?.length,
          `${option.id} promptEn exceeds the length cap`,
        ).toBeLessThanOrEqual(PROMPT_FRAGMENT_MAX_LENGTH);
        expect(fragment, `${option.id} promptEn must be printable ASCII`).toMatch(ASCII_PRINTABLE);
      }
    }
  });

  it('leaves prose-slot options without a promptEn', () => {
    for (const slot of PROSE_SLOTS) {
      for (const option of POOLS[slot]) {
        expect(
          option.promptEn,
          `${option.id} is prose-only (slot ${slot}) and must not carry a prompt fragment`,
        ).toBeUndefined();
      }
    }
  });

  it('keeps prompt fragments distinct within a slot, so picks stay visually distinguishable', () => {
    for (const slot of VISUAL_SLOTS) {
      const fragments = POOLS[slot].map((o) => o.promptEn);
      expect(new Set(fragments).size, `slot ${slot} repeats a prompt fragment`).toBe(
        fragments.length,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Display texts (T-1.5 gate for en + ru; T-6.3 widens to all 15)
// ---------------------------------------------------------------------------

describe('display texts (FM-POOL-2/4)', () => {
  it('registers a text map for every authored language', () => {
    for (const language of AUTHORED_LANGUAGES) {
      expect(POOL_TEXTS[language], `no text map registered for "${language}"`).toBeDefined();
    }
  });

  it('names only real languages in the authored set', () => {
    const codes = new Set<string>(LANGUAGES.map((l) => l.code));
    for (const language of AUTHORED_LANGUAGES) {
      expect(codes.has(language), `"${language}" is not in the language registry`).toBe(true);
    }
  });

  it.each(AUTHORED_LANGUAGES)('%s covers exactly the canonical id set', (language) => {
    const texts = POOL_TEXTS[language];
    const authored = new Set(Object.keys(texts));
    const canonical = new Set(ALL_OPTION_IDS);

    const missing = ALL_OPTION_IDS.filter((id) => !authored.has(id));
    const extra = [...authored].filter((id) => !canonical.has(id));

    expect(missing, `${language} is missing ${missing.length} text(s)`).toEqual([]);
    expect(extra, `${language} has ${extra.length} text(s) for unknown ids`).toEqual([]);
  });

  it.each(AUTHORED_LANGUAGES)('%s texts are non-empty, trimmed and within 70 chars', (language) => {
    const texts = POOL_TEXTS[language];
    for (const [id, text] of Object.entries(texts)) {
      expect(text.trim(), `${language}/${id} must not be blank`).not.toBe('');
      expect(text, `${language}/${id} must not be padded with whitespace`).toBe(text.trim());
      expect(
        [...text].length,
        `${language}/${id} is ${[...text].length} chars, cap is ${OPTION_TEXT_MAX_LENGTH}`,
      ).toBeLessThanOrEqual(OPTION_TEXT_MAX_LENGTH);
    }
  });

  it.each(AUTHORED_LANGUAGES)('%s texts are unique within each slot', (language) => {
    const texts = POOL_TEXTS[language];
    for (const config of SLOTS) {
      const rendered = POOLS[config.slot]
        .map((option) => texts[option.id])
        .filter((text): text is string => text !== undefined);
      const duplicates = rendered.filter((text, i) => rendered.indexOf(text) !== i);
      expect(
        [...new Set(duplicates)],
        `${language} slot ${config.slot} (${config.label}) repeats a display text`,
      ).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------
// Language-specific authoring rules (FM-POOL-3)
// ---------------------------------------------------------------------------

describe('Russian authoring rules (FM-POOL-3, design §9)', () => {
  it('starts every slot-1 text with «с » or «со », so the prose template needs no prefix', () => {
    const ru = POOL_TEXTS.ru;
    for (const option of POOLS[1]) {
      const text = ru[option.id];
      if (text === undefined) continue; // coverage is asserted above
      expect(
        text,
        `ru/${option.id} must be instrumental with its preposition inline, e.g. «с большой обезьяной»`,
      ).toMatch(RU_WITH_PREPOSITION);
    }
  });
});
