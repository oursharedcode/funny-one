// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — German display texts (B-29), machine-drafted for
// Step 118 with B-29's brief.
// needs-de-review — machine-translated stub awaiting native German review per CONTRIBUTING.md.
//
// Authored against the base German template and its per-slot rules, which
// pools/text/de.ts sets out: "{0} mit {1} {3} {2} {4} {5}. Am Ende endete es
// mit {6}." — slot 1 a bare dative (no "mit"), slots 2 and 3 with their own
// prepositions, slot 4 the only finite verb (past, plural), slot 5 with its own
// connective, slot 6 a dative noun phrase. That dative cannot open a sentence,
// so the ending card shows the whole last sentence (owner decision D1 A,
// Step 118; the client's `endingText`).
//
// A local gloss, not a translation (B-29): the presents come from the
// Weihnachtsmann (he carries the sack the ending draws), the evening is
// Heiligabend and its Bescherung, the square is a Weihnachtsmarkt, the gnome a
// Wichtel, the treat a Plätzchen. Slot 5 prefers "um … zu", "für" and "aus"
// to "weil" and "damit", which want a comma the template cannot give.

import type { PoolTextMap } from '../../../pools/schema.js';

export const de: PoolTextMap = {
  // ── 0 · who — nominative ─────────────────────────────────────────────────
  'who.chr26-reindeer': 'ein Rentier im Weihnachtspullover',
  'who.chr26-snowman': 'ein Schneemann im gestreiften Schal',
  'who.chr26-gingerbread-man': 'ein Lebkuchenmann',
  'who.chr26-polar-bear': 'ein Eisbär auf Schlittschuhen',
  'who.chr26-nutcracker': 'ein hölzerner Nussknacker',

  // ── 1 · withWhom — dative, the template supplies "mit" ───────────────────
  'with.chr26-grumpy-cat': 'einer mürrischen Katze mit Bommelmütze',
  'with.chr26-sleeping-snow-maiden': 'einem schlafenden Schneemädchen',
  'with.chr26-winter-bird': 'einem kugelrunden Rotkehlchen',
  'with.chr26-gnome': 'einem winzigen Wichtel mit riesiger Zipfelmütze',
  'with.chr26-cocoa-mug': 'einer riesigen Tasse heißem Kakao',

  // ── 2 · where — its own preposition ──────────────────────────────────────
  'where.chr26-snowy-square': 'auf einem verschneiten Weihnachtsmarkt',
  'where.chr26-living-room': 'in einem gemütlichen Wohnzimmer am Kamin',
  'where.chr26-festive-table': 'an der festlich gedeckten Tafel',
  'where.chr26-frozen-pond': 'auf einem zugefrorenen Waldteich',
  'where.chr26-film-studio': 'in einem Filmstudio beim Dreh eines Weihnachtsfilms',

  // ── 3 · when — its own preposition, read before slot 2 ───────────────────
  'when.chr26-waiting-for-presents': 'beim Warten auf die Bescherung',
  'when.chr26-before-the-guests': 'eine Stunde vor der Ankunft der Gäste',
  'when.chr26-the-big-night': 'am Heiligabend',
  'when.chr26-midnight-bells': 'beim Glockenschlag um Mitternacht',
  'when.chr26-morning-after': 'am Morgen nach dem Festessen',

  // ── 4 · did — finite, past, plural ───────────────────────────────────────
  'did.chr26-decorating-tree': 'hängten viel zu viele Kugeln an den Baum',
  'did.chr26-wrapping-presents': 'wickelten ein unförmiges Geschenk in eine ganze Rolle Klebeband',
  'did.chr26-snowball-fight': 'lieferten sich eine epische Schneeballschlacht',
  'did.chr26-watching-tv': 'schauten einen Weihnachtsfilm auf einem Fernseher voller Spinnweben',
  'did.chr26-singing': 'sangen aus voller Kehle Weihnachtslieder',

  // ── 5 · why — its own connective ─────────────────────────────────────────
  'why.chr26-nice-list': 'um beim Weihnachtsmann als artig zu gelten',
  'why.chr26-one-more-treat': 'für noch ein einziges Plätzchen',
  'why.chr26-secret-wish': 'für einen geheimen Weihnachtswunsch',
  'why.chr26-beat-the-neighbors': 'um die Deko der Nachbarn zu übertrumpfen',
  'why.chr26-family-tradition': 'aus Familientradition, wie Oma behauptet',

  // ── 6 · ending — dative noun phrase after "mit" ──────────────────────────
  'end.chr26-wrapping-paper': 'einem Berg Geschenkpapier, unter dem alles verschwand',
  'end.chr26-tangled-lights': 'einer endlosen Lichterkette, in der sich alles verhedderte',
  'end.chr26-toppled-tree': 'einem Weihnachtsbaum, der ganz langsam umkippte',
  'end.chr26-empty-sack': 'einem leeren Sack und einem höflichen Brief vom Weihnachtsmann',
  'end.chr26-melted-snowman': 'einer Pfütze, in der nur noch die Karotte des Schneemanns lag',
};
