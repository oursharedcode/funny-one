// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — Italian display texts (B-29), machine-drafted for
// Step 118 with B-29's brief.
// needs-it-review — machine-translated stub awaiting native Italian review per CONTRIBUTING.md.
//
// Authored against the base Italian template and its per-slot rules, which
// pools/text/it.ts sets out: "{0} con {1} {3} {2} {4} {5}. Alla fine, è finita
// con {6}." — slot 1 with no "con", slots 2 and 3 with their own prepositions,
// slot 4 a passato remoto in the 3rd person singular, slot 5 with its own
// connective, slot 6 a noun phrase.
//
// A local gloss, not a translation (B-29): the presents come from the Befana,
// who leaves coal for the naughty, the gnome is a folletto, the treat a slice
// of panettone, the morning after follows the cenone.

import type { PoolTextMap } from '../../../pools/schema.js';

export const it: PoolTextMap = {
  // ── 0 · who ──────────────────────────────────────────────────────────────
  'who.chr26-reindeer': 'una renna in maglione natalizio',
  'who.chr26-snowman': 'un pupazzo di neve dalla sciarpa a righe',
  'who.chr26-gingerbread-man': 'un omino di pan di zenzero',
  'who.chr26-polar-bear': 'un orso polare sui pattini',
  'who.chr26-nutcracker': 'uno schiaccianoci di legno',

  // ── 1 · withWhom — no "con", the template supplies it ────────────────────
  'with.chr26-grumpy-cat': 'un gatto brontolone col berretto a pompon',
  'with.chr26-sleeping-snow-maiden': 'una Fanciulla di neve addormentata',
  'with.chr26-winter-bird': 'un pettirosso paffuto',
  'with.chr26-gnome': 'un folletto minuscolo sotto un enorme cappello',
  'with.chr26-cocoa-mug': 'una tazza gigante di cioccolata calda',

  // ── 2 · where — its own preposition ──────────────────────────────────────
  'where.chr26-snowy-square': 'in una piazza innevata piena di bancarelle',
  'where.chr26-living-room': 'in un salotto accogliente davanti al camino',
  'where.chr26-festive-table': 'alla tavola imbandita delle feste',
  'where.chr26-frozen-pond': 'su uno stagno ghiacciato nel bosco',
  'where.chr26-film-studio': 'sul set di un film di Natale',

  // ── 3 · when — read before slot 2 ────────────────────────────────────────
  'when.chr26-waiting-for-presents': 'in attesa dei regali',
  'when.chr26-before-the-guests': "un'ora prima dell'arrivo degli ospiti",
  'when.chr26-the-big-night': 'la notte della Vigilia',
  'when.chr26-midnight-bells': 'allo scoccare della mezzanotte',
  'when.chr26-morning-after': 'la mattina dopo il cenone',

  // ── 4 · did — passato remoto, 3rd person singular ────────────────────────
  'did.chr26-decorating-tree': "appese troppe palline all'albero",
  'did.chr26-wrapping-presents': 'incartò un pacco bitorzoluto con un intero rotolo di scotch',
  'did.chr26-snowball-fight': 'fece una battaglia epica a palle di neve',
  'did.chr26-watching-tv': 'guardò un film di Natale su una TV piena di ragnatele',
  'did.chr26-singing': 'cantò canzoni natalizie a squarciagola',

  // ── 5 · why — its own connective ─────────────────────────────────────────
  'why.chr26-nice-list': 'perché la Befana non portasse il carbone',
  'why.chr26-one-more-treat': "per un'altra fetta di panettone",
  'why.chr26-secret-wish': 'perché si avverasse un desiderio segreto',
  'why.chr26-beat-the-neighbors': 'per battere le decorazioni dei vicini',
  'why.chr26-family-tradition': 'perché la nonna diceva che era una tradizione di famiglia',

  // ── 6 · ending — noun phrase after "è finita con" ────────────────────────
  'end.chr26-wrapping-paper': 'una montagna di carta da regalo che ha sommerso tutto',
  'end.chr26-tangled-lights': 'un groviglio infinito di lucine in cui si è impigliato tutto',
  'end.chr26-toppled-tree': "l'albero di Natale caduto molto, molto lentamente",
  'end.chr26-empty-sack': 'un sacco vuoto e una letterina gentile della Befana',
  'end.chr26-melted-snowman': 'una carota in una pozzanghera, unico resto del pupazzo di neve',
};
