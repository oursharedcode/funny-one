// SPDX-License-Identifier: AGPL-3.0-only

// Answer-pool data model (FM-POOL-1, design §4.1). This is the defining change
// versus the source project: players never type: they pick one option per slot
// and the wire carries the option **id**, which the server validates against
// this configuration (FM-ANS-1/2).
//
// The seven slots follow the source question order (FM-CORE-5):
//   0 who        "Who?"                        visual
//   1 withWhom   "And who else?"               visual
//   2 where      "Where?"                      visual
//   3 when       "When?"                       prose only
//   4 did        "What did they do?"           visual
//   5 why        "What for?"                   prose only
//   6 ending     "What happened in the end?"   prose only
//
// Visual slots drive the picture and therefore carry an English prompt
// fragment; prose-only slots do their comedic work in the text alone. Slot 3
// ("When?") is deliberately out of the picture (DD-3): four visual slots give
// 9⁴–12⁴ ≈ 6.5k–20k distinct prompts, so the R2 cache converges quickly, where
// folding in a 20–30-option "when" would multiply the space ×25 and mostly
// defeat caching.
//
// Option texts are authored per language against that language's prose
// template, never translated word-for-word (FM-POOL-3). The English template is
//   "{0} and {1} were {2} {3}. They {4} {5}. In the end, {6}."
// and the Russian one reorders to
//   "{0} {1} {3} {2} {4} {5}. В итоге {6}."
// which is why RU slot-1 texts are authored with their «с/со» preposition
// already attached (design §9) — enforced by a regex in pools.test.ts.

import type { Language } from '../languages.js';

export type SlotIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Visual slots feed the image prompt; prose slots appear only in the story text. */
export type SlotKind = 'visual' | 'prose';

/**
 * Stable option identifier, `<slot prefix>.<kebab-slug>` (e.g. `who.grumpy-pirate`).
 * This is the wire format (FM-ANS-2, DD-1). Ids are permanent once shipped —
 * they reach the R2 image cache through the prompt fragments — while display
 * texts stay freely editable.
 */
export type OptionId = string;

export interface SlotConfig {
  readonly slot: SlotIndex;
  /** Developer-facing name. The player-visible question lives in the i18n catalogs. */
  readonly label: string;
  /** Id namespace for this slot; every option id starts `<prefix>.`. */
  readonly prefix: string;
  readonly kind: SlotKind;
  readonly minOptions: number;
  readonly maxOptions: number;
}

export interface AnswerOption {
  readonly id: OptionId;
  /**
   * English image-prompt fragment. Required on visual slots, absent on prose
   * slots. One fragment serves all 20 languages, which is what lets a single R2
   * cache cover the whole world (FM-POOL-2, DD-4).
   */
  readonly promptEn?: string;
}

/** All seven pools, indexed by slot. */
export type Pools = Readonly<Record<SlotIndex, readonly AnswerOption[]>>;

/** One language's display texts, keyed by option id across every slot. */
export type PoolTextMap = Readonly<Record<OptionId, string>>;

/** Slot sizes per FM-POOL-1. Asserted against this table in pools.test.ts. */
export const VISUAL_MIN_OPTIONS = 9;
export const VISUAL_MAX_OPTIONS = 12;
export const PROSE_MIN_OPTIONS = 20;
export const PROSE_MAX_OPTIONS = 30;

/** Display texts are capped at 70 characters in every language (FM-POOL-4). */
export const OPTION_TEXT_MAX_LENGTH = 70;

/** Prompt fragments stay short and ASCII so the assembled prompt stays stable (design §4.2). */
export const PROMPT_FRAGMENT_MAX_LENGTH = 120;

export const SLOTS = [
  {
    slot: 0,
    label: 'who',
    prefix: 'who',
    kind: 'visual',
    minOptions: VISUAL_MIN_OPTIONS,
    maxOptions: VISUAL_MAX_OPTIONS,
  },
  {
    slot: 1,
    label: 'withWhom',
    prefix: 'with',
    kind: 'visual',
    minOptions: VISUAL_MIN_OPTIONS,
    maxOptions: VISUAL_MAX_OPTIONS,
  },
  {
    slot: 2,
    label: 'where',
    prefix: 'where',
    kind: 'visual',
    minOptions: VISUAL_MIN_OPTIONS,
    maxOptions: VISUAL_MAX_OPTIONS,
  },
  {
    slot: 3,
    label: 'when',
    prefix: 'when',
    kind: 'prose',
    minOptions: PROSE_MIN_OPTIONS,
    maxOptions: PROSE_MAX_OPTIONS,
  },
  {
    slot: 4,
    label: 'did',
    prefix: 'did',
    kind: 'visual',
    minOptions: VISUAL_MIN_OPTIONS,
    maxOptions: VISUAL_MAX_OPTIONS,
  },
  {
    slot: 5,
    label: 'why',
    prefix: 'why',
    kind: 'prose',
    minOptions: PROSE_MIN_OPTIONS,
    maxOptions: PROSE_MAX_OPTIONS,
  },
  {
    slot: 6,
    label: 'ending',
    prefix: 'end',
    kind: 'prose',
    minOptions: PROSE_MIN_OPTIONS,
    maxOptions: PROSE_MAX_OPTIONS,
  },
] as const satisfies readonly SlotConfig[];

/** Number of slots, and therefore of rounds (FM-CORE-5). */
export const SLOT_COUNT = SLOTS.length;

/** Slots that feed the image prompt, in prompt order (FM-POOL-1, DD-3). */
export const VISUAL_SLOTS: readonly SlotIndex[] = SLOTS.filter((s) => s.kind === 'visual').map(
  (s) => s.slot,
);

/** Slots that appear only in the prose. */
export const PROSE_SLOTS: readonly SlotIndex[] = SLOTS.filter((s) => s.kind === 'prose').map(
  (s) => s.slot,
);

export function getSlotConfig(slot: SlotIndex): SlotConfig {
  const config = SLOTS[slot];
  if (!config) throw new RangeError(`slot must be 0..${SLOT_COUNT - 1}, got ${slot}`);
  return config;
}

export function isSlotIndex(value: number): value is SlotIndex {
  return Number.isInteger(value) && value >= 0 && value < SLOT_COUNT;
}

export function isVisualSlot(slot: SlotIndex): boolean {
  return getSlotConfig(slot).kind === 'visual';
}

/**
 * Russian slot-1 texts carry their instrumental preposition inline, so the RU
 * prose template needs no synthetic prefix (design §9, FM-POOL-3).
 */
export const RU_WITH_PREPOSITION = /^со? /u;

/**
 * A Russian slot-6 text of one or two words is read as a bare noun by
 * `renderProse`, which then prepends «это закончилось» (SRC i18n/index.ts,
 * `ruSlot6IsBareNoun`). Our endings are authored as full clauses and must stay
 * above that threshold or the prose grows a phrase nobody wrote.
 */
export const RU_ENDING_MIN_WORDS = 3;

/**
 * English slot-5 texts must open with one of these connectives. `renderProse`
 * prepends a literal `for ` to anything else (SRC i18n/index.ts,
 * `EN_SLOT5_LEADING_CONNECTIVE`) — a rule written for free-typed answers that
 * would render an authored option as "for out of pure stubbornness". This is
 * the English counterpart of {@link RU_WITH_PREPOSITION}: both encode "the pool
 * is authored to compose with the template, so the template needs no synthetic
 * glue" (design §9).
 */
export const EN_WHY_CONNECTIVE =
  /^(?:for|to|because|so\s+that|in\s+order|in\s+exchange|out\s+of|since)\b/iu;

/** Option ids are `<prefix>.<kebab-slug>` — lowercase, no underscores (FM-ANS-2). */
export const OPTION_ID_PATTERN = /^[a-z]+\.[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/** Prompt fragments must be printable ASCII (design §4.2). */
export const ASCII_PRINTABLE = /^[\x20-\x7E]+$/u;

/**
 * Languages whose pool texts are authored and therefore enforced by the
 * coverage matrix. T-1.5 shipped en + ru as hand-authored references; T-6.3
 * machine-drafted the remaining 13 (each flagged `needs-<code>-review`) and
 * widened this to the full `Language` union, so the matrix now covers all 15
 * (20 since Step 73 added yue, fa, hi, te and bn the same way)
 * (D-2, FM-POOL-2/5). Every consumer keyed off `AUTHORED_LANGUAGES` — the
 * server's i18n loader, `rooms.isValidLanguage`, this package's own coverage
 * tests — widened for free the moment this list did.
 */
export type AuthoredLanguage = Language;

export const AUTHORED_LANGUAGES: readonly AuthoredLanguage[] = [
  'en',
  'fr',
  'de',
  'ru',
  'id',
  'it',
  'zh',
  'yue',
  'ja',
  'ko',
  'pt-br',
  'es-419',
  'es-es',
  'uk',
  'he',
  'fa',
  'ta',
  'hi',
  'te',
  'bn',
];
