// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — Spain Spanish display texts (B-29), machine-drafted
// for Step 118 with B-29's brief.
// needs-es-es-review — machine-translated stub awaiting native Spanish (Spain)
// review per CONTRIBUTING.md.
//
// Authored against the base Spanish template and its per-slot rules, which
// pools/text/es-es.ts sets out: "{0} con {1} {3} {2} {4} {5}. Al final,
// terminó con {6}." — slot 1 with no "con", slots 2 and 3 with their own
// prepositions, slot 4 a pretérito in the 3rd person singular, slot 5 with its
// own connective, slot 6 a noun phrase. Slot 0 says what a character wears
// with "de" («un reno de jersey»), so no "con" comes before the template's.
//
// A local gloss, not a translation (B-29): the presents come from the Reyes
// Magos, who bring coal to the naughty; the night is Nochebuena, midnight the
// doce campanadas, the square a mercadillo, the songs villancicos, the treats
// polvorones and turrón; Peninsular words (jersey, celo, tele, plató).

import type { PoolTextMap } from '../../../pools/schema.js';

export const esEs: PoolTextMap = {
  // ── 0 · who ──────────────────────────────────────────────────────────────
  'who.chr26-reindeer': 'un reno de jersey navideño',
  'who.chr26-snowman': 'un muñeco de nieve de bufanda a rayas',
  'who.chr26-gingerbread-man': 'un hombrecillo de jengibre',
  'who.chr26-polar-bear': 'un oso polar sobre patines',
  'who.chr26-nutcracker': 'un cascanueces de madera',

  // ── 1 · withWhom — no "con", the template supplies it ────────────────────
  'with.chr26-grumpy-cat': 'un gato gruñón de gorro con pompón',
  'with.chr26-sleeping-snow-maiden': 'una Doncella de las Nieves dormida',
  'with.chr26-winter-bird': 'un petirrojo regordete',
  'with.chr26-gnome': 'un duende diminuto bajo un gorro enorme',
  'with.chr26-cocoa-mug': 'una taza gigante de chocolate caliente',

  // ── 2 · where — its own preposition ──────────────────────────────────────
  'where.chr26-snowy-square': 'en un mercadillo navideño nevado',
  'where.chr26-living-room': 'en un salón acogedor junto a la chimenea',
  'where.chr26-festive-table': 'ante la mesa de la cena de Navidad',
  'where.chr26-frozen-pond': 'sobre un estanque helado en el bosque',
  'where.chr26-film-studio': 'en un plató durante el rodaje de una película navideña',

  // ── 3 · when — read before slot 2 ────────────────────────────────────────
  'when.chr26-waiting-for-presents': 'mientras esperaban a los Reyes',
  'when.chr26-before-the-guests': 'una hora antes de que llegaran los invitados',
  'when.chr26-the-big-night': 'en Nochebuena',
  'when.chr26-midnight-bells': 'con las doce campanadas',
  'when.chr26-morning-after': 'a la mañana siguiente entre restos de turrón',

  // ── 4 · did — pretérito, 3rd person singular ─────────────────────────────
  'did.chr26-decorating-tree': 'colgó demasiadas bolas en el árbol',
  'did.chr26-wrapping-presents': 'envolvió un regalo deforme con un rollo entero de celo',
  'did.chr26-snowball-fight': 'montó una épica guerra de bolas de nieve',
  'did.chr26-watching-tv': 'vio una peli navideña en una tele llena de telarañas',
  'did.chr26-singing': 'cantó villancicos a pleno pulmón',

  // ── 5 · why — its own connective ─────────────────────────────────────────
  'why.chr26-nice-list': 'para que los Reyes Magos no trajeran carbón',
  'why.chr26-one-more-treat': 'por un polvorón más',
  'why.chr26-secret-wish': 'para que se cumpliera un deseo secreto',
  'why.chr26-beat-the-neighbors': 'para eclipsar los adornos de los vecinos',
  'why.chr26-family-tradition': 'porque la abuela decía que era una tradición familiar',

  // ── 6 · ending — noun phrase after "terminó con" ─────────────────────────
  'end.chr26-wrapping-paper': 'una montaña de papel de regalo que lo sepultó todo',
  'end.chr26-tangled-lights': 'una tira de luces infinita en la que se enredó todo',
  'end.chr26-toppled-tree': 'un árbol de Navidad que se cayó muy, muy despacio',
  'end.chr26-empty-sack': 'un saco vacío y una carta muy educada de los Reyes Magos',
  'end.chr26-melted-snowman': 'una zanahoria en un charco, lo único que quedó del muñeco',
};
