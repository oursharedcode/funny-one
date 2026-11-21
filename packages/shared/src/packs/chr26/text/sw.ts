// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — Swahili display texts (B-29), machine-drafted for
// Step 118 with B-29's brief.
// needs-sw-review — machine-translated stub awaiting native Swahili review per CONTRIBUTING.md.
//
// Authored against the base Swahili template and its per-slot rules, which
// pools/text/sw.ts sets out: "{0} na {1} walikuwa {2} {3}. Kisha {4} {5}.
// Mwishowe, {6}." — slot 0's modifiers in class 1/2 agreement, slot 1 with no
// "pamoja na", slot 2 with its own locative, slot 3 a time phrase, slot 4 a
// wali- verb, slot 5 opening with ili / kwa sababu / kwa ajili ya, slot 6 a
// full clause.
//
// A local gloss, not a translation (B-29): the presents come from Baba
// Krismasi, the night is the mkesha wa Krismasi.

import type { PoolTextMap } from '../../../pools/schema.js';

export const sw: PoolTextMap = {
  // ── 0 · who — class 1/2 agreement ────────────────────────────────────────
  'who.chr26-reindeer': 'kulungu mwenye sweta ya Krismasi',
  'who.chr26-snowman': 'mtu wa theluji mwenye skafu ya mistari',
  'who.chr26-gingerbread-man': 'mtu mdogo wa mkate wa tangawizi',
  'who.chr26-polar-bear': 'dubu mweupe aliyevaa viatu vya kuteleza',
  'who.chr26-nutcracker': 'askari wa mbao wa kuvunja karanga',

  // ── 1 · withWhom — the template supplies "na" ────────────────────────────
  'with.chr26-grumpy-cat': 'paka mwenye hasira aliyevaa kofia ya pamba',
  'with.chr26-sleeping-snow-maiden': 'Msichana wa Theluji aliyelala',
  'with.chr26-winter-bird': 'ndege mnene mwenye kifua chekundu',
  'with.chr26-gnome': 'kibete mdogo chini ya kofia kubwa iliyochongoka',
  'with.chr26-cocoa-mug': 'kikombe kikubwa cha kakao ya moto',

  // ── 2 · where — its own locative ─────────────────────────────────────────
  'where.chr26-snowy-square': 'kwenye uwanja wa mji uliojaa theluji',
  'where.chr26-living-room': 'katika sebule yenye joto karibu na meko',
  'where.chr26-festive-table': 'kwenye meza ya karamu ya Krismasi',
  'where.chr26-frozen-pond': 'juu ya bwawa lililoganda msituni',
  'where.chr26-film-studio': 'katika studio ya kurekodi filamu ya Krismasi',

  // ── 3 · when — after slot 2 ──────────────────────────────────────────────
  'when.chr26-waiting-for-presents': 'wakati wa kusubiri zawadi',
  'when.chr26-before-the-guests': 'saa moja kabla wageni hawajafika',
  'when.chr26-the-big-night': 'usiku wa mkesha wa Krismasi',
  'when.chr26-midnight-bells': 'kengele zilipolia saa sita usiku',
  'when.chr26-morning-after': 'asubuhi baada ya karamu ya Krismasi',

  // ── 4 · did — wali- + verb ───────────────────────────────────────────────
  'did.chr26-decorating-tree': 'walitundika mapambo mengi mno kwenye mti',
  'did.chr26-wrapping-presents': 'walifunga zawadi moja iliyopinda kwa roli nzima ya selotepu',
  'did.chr26-snowball-fight': 'walipigana vita vikali vya mipira ya theluji',
  'did.chr26-watching-tv': 'walitazama filamu ya Krismasi kwenye TV iliyojaa utando',
  'did.chr26-singing': 'waliimba nyimbo za Krismasi kwa sauti kubwa',

  // ── 5 · why — opens with ili / kwa sababu / kwa ajili ya ─────────────────
  'why.chr26-nice-list': 'ili Baba Krismasi awaone kuwa wema',
  'why.chr26-one-more-treat': 'kwa ajili ya kipande kimoja zaidi cha keki',
  'why.chr26-secret-wish': 'ili matakwa yao ya siri yatimie',
  'why.chr26-beat-the-neighbors': 'ili wawashinde majirani kwa mapambo',
  'why.chr26-family-tradition': 'kwa sababu bibi alisema ni desturi ya familia',

  // ── 6 · ending — full clause ─────────────────────────────────────────────
  'end.chr26-wrapping-paper': 'kila kitu kilifunikwa na mlima wa karatasi za zawadi',
  'end.chr26-tangled-lights': 'kila kitu kilinaswa kwenye mlolongo wa taa usio na mwisho',
  'end.chr26-toppled-tree': 'mti wa Krismasi ulianguka polepole sana',
  'end.chr26-empty-sack': 'Baba Krismasi aliacha gunia tupu na barua ya heshima tu',
  'end.chr26-melted-snowman': 'kilichobaki cha mtu wa theluji ni karoti ndani ya dimbwi',
};
