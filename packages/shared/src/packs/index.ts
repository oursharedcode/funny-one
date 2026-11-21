// SPDX-License-Identifier: AGPL-3.0-only

// The pack registry (DD-16, design §4.4): each pack's configuration and display
// texts, the one function that says which options a story offers, and the
// rules that bring a pack into a room (Step 117): which room is offered one,
// until when, and which of its stories are golden.

import { POOLS } from '../pools/options.js';
import { PROSE_SLOTS } from '../pools/schema.js';
import type { AnswerOption, AuthoredLanguage, PoolTextMap, SlotIndex } from '../pools/schema.js';
import { POOL_TEXTS } from '../pools/text/index.js';
import { CHR26_POOLS } from './chr26/options.js';
import { CHR26_TEXTS } from './chr26/text/index.js';
import { GOLDEN_STORIES, PACK_IDS } from './schema.js';
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
    // FM-PACK-6 (owner decisions 2026-11-21): the free part's last day, then
    // a month more for a paid code, for Australia's Christmas-in-July parties.
    freeUntil: '2027-07-01',
    paidUntil: '2027-08-01',
  },
};

/**
 * One pack's display texts: English always — the fallback a player reads the
 * pack's words in when their own language has none (owner decision 4A) — and
 * the other languages as they are drafted.
 */
export type PackTexts = Readonly<
  { en: PoolTextMap } & Partial<Record<AuthoredLanguage, PoolTextMap>>
>;

/** Each pack's display texts, in the languages drafted so far. */
export const PACK_TEXTS: Readonly<Record<PackId, PackTexts>> = {
  chr26: CHR26_TEXTS,
};

/**
 * The options one slot of one story offers (DD-16, FM-PACK-4): the base pool or
 * the pack's, by the story's content. What the server checks a pick against and
 * what the round screen offers.
 */
export function optionsFor(slot: SlotIndex, content: StoryContent): readonly AnswerOption[] {
  if (content.kind === 'base') return POOLS[slot];
  const pack = PACKS[content.pack];
  if (content.kind === 'slice' && !pack.sliceSlots.includes(slot)) return POOLS[slot];
  return pack.pools[slot];
}

/** A base story's content, the one every room without a pack plays. */
export const BASE_CONTENT: StoryContent = { kind: 'base' };

/**
 * A golden story (FM-PACK-4): the pack in every slot, its ending drawn. Until
 * the paid half there is no paid room, so every `full` story is golden.
 */
export function isGolden(content: StoryContent): boolean {
  return content.kind === 'full';
}

// ---------------------------------------------------------------------------
// Dates (FM-PACK-6)
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The moment a last day `YYYY-MM-DD` ends everywhere on Earth: noon UTC the next
 * day. The last time zone, UTC−12, ends its day then, so a day honoured until
 * this moment is honoured through the whole of it wherever the player is.
 */
export function cutoffOf(lastDay: string): number {
  const start = Date.parse(`${lastDay}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(lastDay) || Number.isNaN(start)) {
    throw new Error(`not a last day: ${lastDay}`);
  }
  return start + DAY_MS + DAY_MS / 2;
}

/** True while a pack's free part is on: the slice and the golden stories. */
export function isPackFree(id: PackId, now: number): boolean {
  return now < cutoffOf(PACKS[id].freeUntil);
}

/**
 * The pack a new room in `language` is offered, or null (FM-PACK-5/6, owner
 * decisions 3A and 4A, 2026-11-21): the first pack that names the language,
 * has its texts in it and is still free. The room's language alone decides; a
 * player of another language in a multi-language room reads the pack's words
 * in English where their own has none (`optionTexts`).
 *
 * A language the pack names but whose texts are not drafted yet is not offered
 * it: its room would read the pack's words in English, which the owner chose
 * for ar, he and fa players only, never for a German room.
 */
export function packForRoom(language: AuthoredLanguage, now: number): PackId | null {
  for (const id of PACK_IDS) {
    if (!PACKS[id].languages.includes(language)) continue;
    if (!PACK_TEXTS[id][language]) continue;
    if (!isPackFree(id, now)) continue;
    return id;
  }
  return null;
}

/**
 * The stories of a free game with a pack (FM-PACK-4, owner decision 1C): two
 * golden stories at random, `full`, the rest the `slice`. At fewer than two
 * stories every one is golden, which no game reaches (three players at least).
 *
 * A partial Fisher–Yates over the story indices, so it ends whatever `random`
 * returns — a stubbed one included.
 */
export function freeGameContents(
  pack: PackId,
  storyCount: number,
  random: () => number = Math.random,
): StoryContent[] {
  const order = Array.from({ length: storyCount }, (_, i) => i);
  const golden = Math.min(GOLDEN_STORIES, storyCount);
  for (let i = 0; i < golden; i++) {
    const j = i + Math.min(Math.floor(random() * (storyCount - i)), storyCount - i - 1);
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  const goldenSet = new Set(order.slice(0, golden));
  return Array.from({ length: storyCount }, (_, i): StoryContent => ({
    kind: goldenSet.has(i) ? 'full' : 'slice',
    pack,
  }));
}

// ---------------------------------------------------------------------------
// Display texts
// ---------------------------------------------------------------------------

const TEXTS_BY_LANGUAGE = new Map<AuthoredLanguage, PoolTextMap>();

/**
 * Every option's display text in `language`, by id: the base pools' and every
 * pack's, a pack's in English where `language` has none of its own (owner
 * decision 4A, 2026-11-21). The one lookup the server's reveal and the
 * client's round screen and story re-rendering share, so a pack id resolves
 * the same on both sides of the wire (DD-2). Built once per language.
 */
export function optionTexts(language: AuthoredLanguage): PoolTextMap {
  let texts = TEXTS_BY_LANGUAGE.get(language);
  if (!texts) {
    const merged: Record<string, string> = { ...POOL_TEXTS[language] };
    for (const id of PACK_IDS) {
      Object.assign(merged, PACK_TEXTS[id][language] ?? PACK_TEXTS[id].en);
    }
    texts = merged;
    TEXTS_BY_LANGUAGE.set(language, texts);
  }
  return texts;
}
