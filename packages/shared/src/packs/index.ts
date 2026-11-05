// SPDX-License-Identifier: AGPL-3.0-only

// The pack registry (DD-16, design §4.4): each pack's configuration and display
// texts, and the one function that says which options a story offers.

import { POOLS } from '../pools/options.js';
import { PROSE_SLOTS } from '../pools/schema.js';
import type { AnswerOption, AuthoredLanguage, PoolTextMap, SlotIndex } from '../pools/schema.js';
import { CHR26_POOLS } from './chr26/options.js';
import { CHR26_TEXTS } from './chr26/text/index.js';
import type { PackConfig, PackId, StoryContent } from './schema.js';

/**
 * The Christmas 2026 edition's 20 languages, in B-29's order: every authored
 * language but ar, he and fa, where Christmas is not the winter festival (B-29
 * names Hanukkah for he, Yalda for fa) — a winter edition of their own later,
 * if ever.
 */
export const CHR26_LANGUAGES: readonly AuthoredLanguage[] = [
  'en',
  'de',
  'fr',
  'it',
  'es-es',
  'es-419',
  'pt-br',
  'uk',
  'ko',
  'yue',
  'id',
  'sw',
  'yo',
  'ja',
  'zh',
  'hi',
  'ta',
  'te',
  'bn',
  'ru',
];

export const PACKS: Readonly<Record<PackId, PackConfig>> = {
  chr26: {
    id: 'chr26',
    languages: CHR26_LANGUAGES,
    // A free room's ordinary story keeps every picture slot on the base pools,
    // so its picture is one the library already holds (B-29, 2026-11-05).
    sliceSlots: PROSE_SLOTS,
    pools: CHR26_POOLS,
  },
};

/** Each pack's display texts, in the languages drafted so far. */
export const PACK_TEXTS: Readonly<
  Record<PackId, Partial<Readonly<Record<AuthoredLanguage, PoolTextMap>>>>
> = {
  chr26: CHR26_TEXTS,
};

/**
 * The options one slot of one story offers (DD-16, FM-PACK-4): the base pool or
 * the pack's, by the story's content. This is what the game wiring will check a
 * pick against, where today it checks `POOLS[slot]`.
 */
export function optionsFor(slot: SlotIndex, content: StoryContent): readonly AnswerOption[] {
  if (content.kind === 'base') return POOLS[slot];
  const pack = PACKS[content.pack];
  if (content.kind === 'slice' && !pack.sliceSlots.includes(slot)) return POOLS[slot];
  return pack.pools[slot];
}
