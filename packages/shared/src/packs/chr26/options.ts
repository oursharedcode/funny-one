// SPDX-License-Identifier: AGPL-3.0-only

// The Christmas 2026 edition's option ids and English fragments (B-29, DD-16,
// FM-PACK-1..3). Frozen at Step 103, before any display text (owner decision
// 2026-11-05): an id is the wire format (DD-1) and a fragment is part of a
// picture's cache key (DD-4), so neither may change once the 650 pictures are
// drawn. The display texts in text/ stay free to edit.
//
// Every rule of the base pools holds here (pools/options.ts): ids
// `<prefix>.<slug>`, the slug opening with the pack id; fragments printable
// ASCII and ≤ 120 characters; slot 2 reading after "in"; slot 4 as "are" + a
// gerund; slots 0 and 1 disjoint by head noun, leads versus companions. Three
// more are the pack's own, the first two on the author:
//
// **A costume on every character.** Each lead and companion has a signature
// colour, prop or shape — the reindeer's green sweater and belled antlers, the
// gnome's teal hat — so the two subjects of a scene never merge into one, and a
// pick looks like itself in every picture it is in (B-29: "one colour, one
// prop, one shape").
//
// **No Christmas tree in any place.** The tree belongs to an ending ("the
// Christmas tree fell over"); a place that already had one would draw that
// aftermath with a tree still standing in it.
//
// **Every ending has an aftermath.** Slot 6 carries `aftermathEn`, the place as
// it looks afterwards with nobody in it, which `buildAftermathPrompt` draws:
// 5 places × 5 endings = 25 pictures, the same one whoever was in the story.
//
// Secular, no brands, no real people (B-29, FM-POOL-6). Whoever brings the
// presents is named in each language's text (Santa, Дед Мороз, Святий Миколай),
// never in a fragment, so one picture serves every language.
//
// The worst-case scene prompt is 481 characters of the 500 cap, 19 of headroom,
// pinned in the server's prompt.test.ts.

import type { PackPools } from '../schema.js';

export const CHR26_POOLS: PackPools = {
  // ── 0 · who — the leads ───────────────────────────────────────────────────
  0: [
    {
      id: 'who.chr26-reindeer',
      promptEn: 'a reindeer in a green knitted sweater with bells on its antlers',
    },
    {
      id: 'who.chr26-snowman',
      promptEn: 'a round snowman with a carrot nose and a red striped scarf',
    },
    {
      id: 'who.chr26-gingerbread-man',
      promptEn: 'a gingerbread man with white icing buttons and a candy cane',
    },
    { id: 'who.chr26-polar-bear', promptEn: 'a polar bear in purple earmuffs on shiny ice skates' },
    {
      id: 'who.chr26-nutcracker',
      promptEn: 'a wooden nutcracker soldier in a blue coat and a tall black hat',
    },
  ],

  // ── 1 · withWhom — the companions ────────────────────────────────────────
  1: [
    { id: 'with.chr26-grumpy-cat', promptEn: 'a grumpy orange cat in a yellow bobble hat' },
    {
      id: 'with.chr26-sleeping-snow-maiden',
      promptEn: 'a sleeping snow maiden in sky blue with a long braid',
    },
    {
      id: 'with.chr26-winter-bird',
      promptEn: 'a plump red-breasted bird with red berries in its beak',
    },
    { id: 'with.chr26-gnome', promptEn: 'a tiny bearded gnome under a giant teal pointy hat' },
    {
      id: 'with.chr26-cocoa-mug',
      promptEn: 'a giant mug of hot cocoa piled high with marshmallows',
    },
  ],

  // ── 2 · where — reads after "in"; no Christmas tree ──────────────────────
  2: [
    {
      id: 'where.chr26-snowy-square',
      promptEn: 'a snowy town square lined with little market stalls',
    },
    { id: 'where.chr26-living-room', promptEn: 'a cozy living room with a crackling fireplace' },
    {
      id: 'where.chr26-festive-table',
      promptEn: 'a dining room with a long table laid for a feast',
    },
    { id: 'where.chr26-frozen-pond', promptEn: 'a snowy forest clearing around a frozen pond' },
    {
      id: 'where.chr26-film-studio',
      promptEn: 'a film studio with cameras filming a holiday movie',
    },
  ],

  // ── 3 · when — prose only ────────────────────────────────────────────────
  3: [
    { id: 'when.chr26-waiting-for-presents' },
    { id: 'when.chr26-before-the-guests' },
    { id: 'when.chr26-the-big-night' },
    { id: 'when.chr26-midnight-bells' },
    { id: 'when.chr26-morning-after' },
  ],

  // ── 4 · did — "are" + gerund ─────────────────────────────────────────────
  4: [
    {
      id: 'did.chr26-decorating-tree',
      promptEn: 'are hanging far too many baubles on a wobbly tree',
    },
    {
      id: 'did.chr26-wrapping-presents',
      promptEn: 'are wrapping a lumpy present in a whole roll of tape',
    },
    { id: 'did.chr26-snowball-fight', promptEn: 'are having a wild snowball fight' },
    {
      id: 'did.chr26-watching-tv',
      promptEn: 'are watching a holiday film on a TV covered in cobwebs',
    },
    {
      id: 'did.chr26-singing',
      promptEn: 'are singing loudly from a songbook, mouths wide open',
    },
  ],

  // ── 5 · why — prose only ─────────────────────────────────────────────────
  5: [
    { id: 'why.chr26-nice-list' },
    { id: 'why.chr26-one-more-treat' },
    { id: 'why.chr26-secret-wish' },
    { id: 'why.chr26-beat-the-neighbors' },
    { id: 'why.chr26-family-tradition' },
  ],

  // ── 6 · ending — prose, and drawn as an aftermath ────────────────────────
  6: [
    {
      id: 'end.chr26-wrapping-paper',
      aftermathEn: 'a mountain of torn wrapping paper and curly ribbons burying everything',
    },
    {
      id: 'end.chr26-tangled-lights',
      aftermathEn: 'everything tangled up in one endless string of glowing fairy lights',
    },
    {
      id: 'end.chr26-toppled-tree',
      aftermathEn: 'a decorated Christmas tree toppled on its side, baubles rolling away',
    },
    {
      id: 'end.chr26-empty-sack',
      aftermathEn: 'an empty gift sack slumped on the ground beside a folded handwritten note',
    },
    {
      id: 'end.chr26-melted-snowman',
      aftermathEn:
        'a puddle of melted snow with a carrot, three lumps of coal and a striped scarf in it',
    },
  ],
};
