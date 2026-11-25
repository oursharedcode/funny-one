// SPDX-License-Identifier: AGPL-3.0-only

// Pack data model (DD-16, FM-PACK-1..5, design §4.4). A pack is a second set of
// the seven pools that a room can play with; the first is the Christmas 2026
// edition, `chr26` (B-29), Funny Multi's first paid pack.
//
// A pack reuses everything the base pools stand on: the same slots, the same
// wire format (an option id, DD-1), the same display-text rules (FM-POOL-3/4/6)
// and the same locked scene skeleton and style suffix. It adds three things:
//
//   - **Its own id namespace inside the slug**, `who.chr26-reindeer`, so
//     `OPTION_ID_PATTERN` and the wire are unchanged and no pack id can ever
//     equal a base id.
//   - **A story's content**, decided per story rather than per room: a free
//     room's ordinary stories take only the pack's prose slots (the *slice*),
//     its one golden story (owner decision 1C, 2026-11-21; one since 2026-11-25) and every story
//     of a paid game (Step 122) take the whole pack.
//   - **An ending drawn as an aftermath** (slot 6's `aftermathEn`): the place
//     and what is left there, no characters. The model draws every picture
//     from its prompt alone, so a second picture of the same characters would
//     never match the first; an empty place cannot fail to match.

import type { AnswerOption, AuthoredLanguage, SlotIndex } from '../pools/schema.js';

export type PackId = 'chr26';

export const PACK_IDS: readonly PackId[] = ['chr26'];

/**
 * How a pack is paid for (B-29, owner decisions 2026-11-22): PayID inside
 * Australia, a one-time GitHub Sponsors tier everywhere else.
 */
export type PayRail = 'payid' | 'sponsors';

export const PAY_RAILS: readonly PayRail[] = ['payid', 'sponsors'];

export interface PackOption extends AnswerOption {
  /**
   * Slot 6 only: the ending as an English aftermath fragment — the objects left
   * in the place, no characters — read by `buildAftermathPrompt`, never by the
   * scene's `buildPrompt`. Printable ASCII, ≤ 120 characters, like `promptEn`.
   */
  readonly aftermathEn?: string;
}

/** A pack's seven pools, indexed by slot. */
export type PackPools = Readonly<Record<SlotIndex, readonly PackOption[]>>;

export interface PackConfig {
  readonly id: PackId;
  /** The languages the pack is offered in; a room in any other plays the base pools. */
  readonly languages: readonly AuthoredLanguage[];
  /** The slots a free room's ordinary story takes from the pack. */
  readonly sliceSlots: readonly SlotIndex[];
  readonly pools: PackPools;
  /**
   * The last day of the pack's free part, `YYYY-MM-DD` (FM-PACK-6): the slice
   * and the golden stories. Honoured through the whole of that day anywhere on
   * Earth, so the server's cut-off is noon UTC the next day (`cutoffOf`).
   * After it a new room is not offered the pack, a game starting plays the
   * base pools, and the pack is no longer sold.
   */
  readonly freeUntil: string;
  /** The last day a paid code works, `YYYY-MM-DD`, honoured the same way. */
  readonly paidUntil: string;
  /**
   * The price on each rail, written the same in every language (Step 123,
   * owner decision D3 A): what the buyer is charged and never a conversion —
   * Australian dollars by PayID, and the US dollars GitHub charges for the
   * Sponsors tier, which the buyer's bank converts.
   */
  readonly prices: Readonly<Record<PayRail, string>>;
}

/**
 * Where one story's options come from (DD-16, FM-PACK-4):
 *
 *   base  — the base pools in every slot: a room without a pack;
 *   slice — the base pools on the picture slots and the pack's on when, why
 *           and the ending: every story of a free room except its golden
 *           one. Its picture is therefore one the library already holds, and
 *           its ending is a text card;
 *   full  — the pack's options in every slot: a free game's golden
 *           story. Its ending is drawn too, as an aftermath;
 *   paid  — the same options and the same drawn ending, in every story of a
 *           game a code has paid for (Step 122). Not golden: a golden story is
 *           the free game's sample, and its downloads carry the edition's
 *           address; a paid story's carry the buyer's thank-you line.
 *
 * So a client reads "golden" off the content alone (`isGolden`), and "drawn
 * ending" off `drawsEnding`.
 */
export type StoryContent =
  { readonly kind: 'base' } | { readonly kind: 'slice' | 'full' | 'paid'; readonly pack: PackId };

/**
 * Options per slot in every pack slot. B-29 sized the picture batch to it:
 * 5⁴ = 625 scenes and 5 places × 5 endings = 25 aftermaths. "When" and "why"
 * are never drawn and could grow at no picture cost; the other five cannot
 * grow without another batch.
 */
export const PACK_OPTIONS_PER_SLOT = 5;

/**
 * Golden stories in every free game, at every room size (owner decision 1C,
 * 2026-11-21): picked at random, revealed last, the pack's in every slot. Two
 * until the owner made it one, whatever the number of players (2026-11-25).
 */
export const GOLDEN_STORIES = 1;

/** The slots an aftermath draws: the place (2) and the ending (6). */
export const AFTERMATH_SLOTS: readonly SlotIndex[] = [2, 6];
