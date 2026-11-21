// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — French display texts (B-29), machine-drafted for
// Step 118 with B-29's brief.
// needs-fr-review — machine-translated stub awaiting native French review per CONTRIBUTING.md.
//
// Authored against the base French template and its per-slot rules, which
// pools/text/fr.ts sets out: "{0} avec {1} {3} {2} a {4} {5}. Finalement, ça
// s'est terminé par {6}." — slot 1 with no "avec", slots 2 and 3 with their
// own prepositions, slot 4 a bare past participle after the template's "a"
// (so never a verb taking "être"), slot 5 with its own connective, slot 6 a
// noun phrase.
//
// A local gloss, not a translation (B-29): the presents come from the Père
// Noël, the evening is the réveillon, the square a marché de Noël, the gnome
// a lutin, the treat a papillote, the morning after the last of the bûche.

import type { PoolTextMap } from '../../../pools/schema.js';

export const fr: PoolTextMap = {
  // ── 0 · who ──────────────────────────────────────────────────────────────
  'who.chr26-reindeer': 'un renne en pull de Noël',
  'who.chr26-snowman': 'un bonhomme de neige en écharpe rayée',
  'who.chr26-gingerbread-man': "un bonhomme en pain d'épices",
  'who.chr26-polar-bear': 'un ours polaire en patins à glace',
  'who.chr26-nutcracker': 'un casse-noisette en bois',

  // ── 1 · withWhom — no "avec", the template supplies it ───────────────────
  'with.chr26-grumpy-cat': 'un chat grincheux en bonnet à pompon',
  'with.chr26-sleeping-snow-maiden': 'une Fille des neiges endormie',
  'with.chr26-winter-bird': 'un petit rouge-gorge tout rond',
  'with.chr26-gnome': 'un lutin minuscule sous un énorme bonnet',
  'with.chr26-cocoa-mug': 'une tasse géante de chocolat chaud',

  // ── 2 · where — its own preposition ──────────────────────────────────────
  'where.chr26-snowy-square': 'dans un marché de Noël enneigé',
  'where.chr26-living-room': 'dans un salon douillet près de la cheminée',
  'where.chr26-festive-table': 'à la grande table du repas de fête',
  'where.chr26-frozen-pond': 'sur un étang gelé au fond des bois',
  'where.chr26-film-studio': "dans un studio pendant le tournage d'un film de Noël",

  // ── 3 · when — read before slot 2 ────────────────────────────────────────
  'when.chr26-waiting-for-presents': 'en attendant les cadeaux',
  'when.chr26-before-the-guests': "une heure avant l'arrivée des invités",
  'when.chr26-the-big-night': 'pendant le réveillon de Noël',
  'when.chr26-midnight-bells': 'aux douze coups de minuit',
  'when.chr26-morning-after': 'le lendemain matin devant les restes de la bûche',

  // ── 4 · did — past participle after "a" ──────────────────────────────────
  'did.chr26-decorating-tree': 'accroché beaucoup trop de boules au sapin',
  'did.chr26-wrapping-presents': 'emballé un cadeau difforme avec un rouleau entier de scotch',
  'did.chr26-snowball-fight': 'livré une bataille de boules de neige épique',
  'did.chr26-watching-tv': "regardé un film de Noël sur une télé pleine de toiles d'araignée",
  'did.chr26-singing': 'chanté des chants de Noël à tue-tête',

  // ── 5 · why — its own connective ─────────────────────────────────────────
  'why.chr26-nice-list': 'pour rester sur la liste des sages du Père Noël',
  'why.chr26-one-more-treat': 'pour une papillote de plus',
  'why.chr26-secret-wish': "pour qu'un vœu secret se réalise",
  'why.chr26-beat-the-neighbors': 'pour éclipser les décorations des voisins',
  'why.chr26-family-tradition': "parce que mamie disait que c'était une tradition familiale",

  // ── 6 · ending — noun phrase after "terminé par" ─────────────────────────
  'end.chr26-wrapping-paper': 'une montagne de papier cadeau qui a tout englouti',
  'end.chr26-tangled-lights': "une guirlande lumineuse sans fin où tout s'est emmêlé",
  'end.chr26-toppled-tree': 'un sapin qui est tombé très, très lentement',
  'end.chr26-empty-sack': 'un sac vide et une lettre très polie du Père Noël',
  'end.chr26-melted-snowman': 'une carotte dans une flaque, tout ce qui restait du bonhomme',
};
