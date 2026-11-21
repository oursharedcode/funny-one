// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — Brazilian Portuguese display texts (B-29),
// machine-drafted for Step 118 with B-29's brief.
// needs-pt-br-review — machine-translated stub awaiting native Portuguese (Brazil) review per CONTRIBUTING.md.
//
// Authored against the base Portuguese template and its per-slot rules, which
// pools/text/pt-br.ts sets out: "{0} com {1} {3} {2} {4} {5}. No final,
// terminou com {6}." — slot 1 with no "com", slots 2 and 3 with their own
// prepositions, slot 4 a pretérito perfeito in the 3rd person singular, slot 5
// with its own connective, slot 6 a noun phrase.
//
// A local gloss, not a translation (B-29): the presents come from Papai Noel,
// the feast is the ceia, the treat panetone, the lights a pisca-pisca. The
// pictures are snowy, so Brazil's summer Christmas waits for B-29a.

import type { PoolTextMap } from '../../../pools/schema.js';

export const ptBr: PoolTextMap = {
  // ── 0 · who ──────────────────────────────────────────────────────────────
  'who.chr26-reindeer': 'uma rena de suéter natalino',
  'who.chr26-snowman': 'um boneco de neve de cachecol listrado',
  'who.chr26-gingerbread-man': 'um bonequinho de gengibre',
  'who.chr26-polar-bear': 'um urso-polar de patins',
  'who.chr26-nutcracker': 'um quebra-nozes de madeira',

  // ── 1 · withWhom — no "com", the template supplies it ────────────────────
  'with.chr26-grumpy-cat': 'um gato rabugento de gorro com pompom',
  'with.chr26-sleeping-snow-maiden': 'uma Donzela da Neve adormecida',
  'with.chr26-winter-bird': 'um passarinho gorducho de peito vermelho',
  'with.chr26-gnome': 'um duende minúsculo sob um gorro enorme',
  'with.chr26-cocoa-mug': 'uma caneca gigante de chocolate quente',

  // ── 2 · where — its own preposition ──────────────────────────────────────
  'where.chr26-snowy-square': 'numa praça nevada cheia de barraquinhas',
  'where.chr26-living-room': 'numa sala aconchegante perto da lareira',
  'where.chr26-festive-table': 'diante da mesa farta das festas',
  'where.chr26-frozen-pond': 'num lago congelado no meio da floresta',
  'where.chr26-film-studio': 'num estúdio durante a gravação de um filme de Natal',

  // ── 3 · when — read before slot 2 ────────────────────────────────────────
  'when.chr26-waiting-for-presents': 'enquanto esperavam os presentes',
  'when.chr26-before-the-guests': 'uma hora antes de os convidados chegarem',
  'when.chr26-the-big-night': 'na noite de Natal',
  'when.chr26-midnight-bells': 'quando o relógio bateu meia-noite',
  'when.chr26-morning-after': 'na manhã seguinte entre as sobras da ceia',

  // ── 4 · did — pretérito perfeito, 3rd person singular ────────────────────
  'did.chr26-decorating-tree': 'pendurou bolinhas demais na árvore',
  'did.chr26-wrapping-presents': 'embrulhou um presente disforme com um rolo inteiro de fita',
  'did.chr26-snowball-fight': 'travou uma épica guerra de bolas de neve',
  'did.chr26-watching-tv': 'assistiu a um filme de Natal numa TV cheia de teias de aranha',
  'did.chr26-singing': 'cantou músicas de Natal a plenos pulmões',

  // ── 5 · why — its own connective ─────────────────────────────────────────
  'why.chr26-nice-list': 'para continuar na lista dos bonzinhos do Papai Noel',
  'why.chr26-one-more-treat': 'por mais uma fatia de panetone',
  'why.chr26-secret-wish': 'para que um desejo secreto se realizasse',
  'why.chr26-beat-the-neighbors': 'para ofuscar a decoração dos vizinhos',
  'why.chr26-family-tradition': 'porque a vovó dizia que era tradição de família',

  // ── 6 · ending — noun phrase after "terminou com" ────────────────────────
  'end.chr26-wrapping-paper': 'uma montanha de papel de presente que cobriu tudo',
  'end.chr26-tangled-lights': 'um pisca-pisca sem fim em que tudo se enroscou',
  'end.chr26-toppled-tree': 'uma árvore de Natal que caiu bem, bem devagar',
  'end.chr26-empty-sack': 'um saco vazio e uma cartinha educada do Papai Noel',
  'end.chr26-melted-snowman': 'uma cenoura numa poça, tudo o que sobrou do boneco de neve',
};
