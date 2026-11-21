// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — Latin American Spanish display texts (B-29),
// machine-drafted for Step 118 with B-29's brief.
// needs-es-419-review — machine-translated stub awaiting native Spanish (LatAm) review per CONTRIBUTING.md.
//
// Authored against the base Spanish template and its per-slot rules, which
// pools/text/es-419.ts sets out: "{0} con {1} {3} {2} {4} {5}. Al final,
// terminó con {6}." — slot 1 with no "con", slots 2 and 3 with their own
// prepositions, slot 4 a pretérito in the 3rd person singular, slot 5 with its
// own connective, slot 6 a noun phrase.
//
// A local gloss, not a translation (B-29), in neutral Latin American Spanish:
// the presents come from Santa Claus, the night is Nochebuena, the treat a
// buñuelo, the lights a guirnalda, the tree an arbolito; never «saco» for the
// sack (a jacket in much of the region), but «bolsa de regalos».

import type { PoolTextMap } from '../../../pools/schema.js';

export const es419: PoolTextMap = {
  // ── 0 · who ──────────────────────────────────────────────────────────────
  'who.chr26-reindeer': 'un reno de suéter navideño',
  'who.chr26-snowman': 'un muñeco de nieve de bufanda a rayas',
  'who.chr26-gingerbread-man': 'un hombrecito de jengibre',
  'who.chr26-polar-bear': 'un oso polar en patines',
  'who.chr26-nutcracker': 'un cascanueces de madera',

  // ── 1 · withWhom — no "con", the template supplies it ────────────────────
  'with.chr26-grumpy-cat': 'un gato gruñón de gorro con pompón',
  'with.chr26-sleeping-snow-maiden': 'una Doncella de las Nieves dormida',
  'with.chr26-winter-bird': 'un petirrojo gordito',
  'with.chr26-gnome': 'un duende chiquito bajo un gorro enorme',
  'with.chr26-cocoa-mug': 'una taza gigante de chocolate caliente',

  // ── 2 · where — its own preposition ──────────────────────────────────────
  'where.chr26-snowy-square': 'en una plaza nevada llena de puestos',
  'where.chr26-living-room': 'en una sala acogedora junto a la chimenea',
  'where.chr26-festive-table': 'frente a la mesa de la cena navideña',
  'where.chr26-frozen-pond': 'sobre una laguna congelada en el bosque',
  'where.chr26-film-studio': 'en el set de filmación de una película navideña',

  // ── 3 · when — read before slot 2 ────────────────────────────────────────
  'when.chr26-waiting-for-presents': 'mientras esperaban los regalos',
  'when.chr26-before-the-guests': 'una hora antes de que llegaran los invitados',
  'when.chr26-the-big-night': 'en Nochebuena',
  'when.chr26-midnight-bells': 'al dar las doce de la noche',
  'when.chr26-morning-after': 'la mañana después de la cena de Navidad',

  // ── 4 · did — pretérito, 3rd person singular ─────────────────────────────
  'did.chr26-decorating-tree': 'colgó demasiadas esferas en el árbol',
  'did.chr26-wrapping-presents': 'envolvió un regalo deforme con un rollo entero de cinta',
  'did.chr26-snowball-fight': 'armó una épica guerra de bolas de nieve',
  'did.chr26-watching-tv': 'vio una película navideña en una tele llena de telarañas',
  'did.chr26-singing': 'cantó villancicos a todo pulmón',

  // ── 5 · why — its own connective ─────────────────────────────────────────
  'why.chr26-nice-list': 'para seguir en la lista de los buenos de Santa Claus',
  'why.chr26-one-more-treat': 'por un buñuelo más',
  'why.chr26-secret-wish': 'para que se cumpliera un deseo secreto',
  'why.chr26-beat-the-neighbors': 'para opacar los adornos de los vecinos',
  'why.chr26-family-tradition': 'porque la abuela decía que era una tradición familiar',

  // ── 6 · ending — noun phrase after "terminó con" ─────────────────────────
  'end.chr26-wrapping-paper': 'una montaña de papel de regalo que lo tapó todo',
  'end.chr26-tangled-lights': 'una guirnalda de luces sin fin en la que se enredó todo',
  'end.chr26-toppled-tree': 'un arbolito de Navidad que se cayó muy, muy despacio',
  'end.chr26-empty-sack': 'una bolsa de regalos vacía y una carta muy educada de Santa',
  'end.chr26-melted-snowman': 'una zanahoria en un charco, lo único que quedó del muñeco',
};
