// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — English display texts (B-29). A draft for the
// owner's edit (owner decision 2026-11-05: the agent drafts en and ru, the
// owner edits): a display text is not part of any cache key, so changing one
// costs nothing, unlike the ids and fragments in ../options.ts.
//
// Authored against the base English template and its per-slot rules, which
// pools/text/en.ts sets out: slot 1 a bare noun phrase, slot 2 with its own
// preposition, slot 3 a time expression, slot 4 simple past plural, slot 5
// opening with a connective (enforced), slot 6 a clause after "In the end, ".
// Lowercase except proper nouns; US spelling.
//
// A local gloss, not a translation (B-29): the presents come from Santa. Every
// text also has to read in a free room's ordinary story, where when, why and
// the ending join today's characters, places and actions.

import type { PoolTextMap } from '../../../pools/schema.js';

export const en: PoolTextMap = {
  // ── 0 · who ───────────────────────────────────────────────────────────────
  'who.chr26-reindeer': 'a reindeer in a Christmas sweater',
  'who.chr26-snowman': 'a snowman in a striped scarf',
  'who.chr26-gingerbread-man': 'a gingerbread man',
  'who.chr26-polar-bear': 'a polar bear on ice skates',
  'who.chr26-nutcracker': 'a nutcracker soldier',

  // ── 1 · withWhom — bare noun phrase; the template supplies "and" ──────────
  'with.chr26-grumpy-cat': 'a grumpy cat in a bobble hat',
  'with.chr26-sleeping-snow-maiden': 'a sleeping Snow Maiden',
  'with.chr26-winter-bird': 'a round little robin',
  'with.chr26-gnome': 'a tiny gnome in an enormous hat',
  'with.chr26-cocoa-mug': 'a giant mug of hot cocoa',

  // ── 2 · where — carries its own preposition ──────────────────────────────
  'where.chr26-snowy-square': 'in a snowy town square',
  'where.chr26-living-room': 'in a cozy living room by the fireplace',
  'where.chr26-festive-table': 'at the festive dinner table',
  'where.chr26-frozen-pond': 'on a frozen pond in the woods',
  'where.chr26-film-studio': 'at a film studio shooting a Christmas movie',

  // ── 3 · when ─────────────────────────────────────────────────────────────
  'when.chr26-waiting-for-presents': 'while everybody was waiting for presents',
  'when.chr26-before-the-guests': 'an hour before the guests arrived',
  'when.chr26-the-big-night': 'on Christmas Eve',
  'when.chr26-midnight-bells': 'as the bells struck midnight',
  'when.chr26-morning-after': 'the morning after the feast',

  // ── 4 · did — simple past, plural ────────────────────────────────────────
  'did.chr26-decorating-tree': 'hung far too many baubles on the tree',
  'did.chr26-wrapping-presents': 'wrapped one lumpy present in a whole roll of tape',
  'did.chr26-snowball-fight': 'had an epic snowball fight',
  'did.chr26-watching-tv': 'watched a Christmas movie on a TV covered in cobwebs',
  'did.chr26-singing': 'sang festive songs at the top of their lungs',

  // ── 5 · why — opens with a connective ────────────────────────────────────
  'why.chr26-nice-list': "to stay on Santa's nice list",
  'why.chr26-one-more-treat': 'for one more candy cane',
  'why.chr26-secret-wish': 'so that a secret wish would come true',
  'why.chr26-beat-the-neighbors': "to outshine the neighbors' decorations",
  'why.chr26-family-tradition': 'because grandma said it was a family tradition',

  // ── 6 · ending — reads after "In the end, " ──────────────────────────────
  'end.chr26-wrapping-paper': 'everything vanished under a mountain of wrapping paper',
  'end.chr26-tangled-lights': 'everything got tangled in one endless string of lights',
  'end.chr26-toppled-tree': 'the Christmas tree fell over, very slowly',
  'end.chr26-empty-sack': 'Santa left nothing but an empty sack and a polite note',
  'end.chr26-melted-snowman': 'all that was left of the snowman was a carrot in a puddle',
};
