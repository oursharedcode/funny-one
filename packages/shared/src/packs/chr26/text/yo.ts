// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — Yoruba display texts (B-29), machine-drafted for
// Step 118 with B-29's brief.
// needs-yo-review — machine-translated stub awaiting native Yoruba review per CONTRIBUTING.md.
//
// Authored against the base Yoruba template and its per-slot rules, which
// pools/text/yo.ts sets out: "{3}, {0} àti {1} wà {2}. Wọ́n {4} {5}.
// Níkẹyìn, {6}." — slot 2 with its own locative, slot 4 a bare verb phrase
// after «Wọ́n», slot 5 opening with láti / nítorí / kí, slot 6 a full clause.
// Every tone is marked, and every text is NFC: a toned ẹ or ọ is the
// precomposed dot-below letter plus a combining U+0301 or U+0300, so U+0323
// never appears, and «ń» «ǹ» are precomposed (packs.test.ts checks both).
//
// A local gloss, not a translation (B-29): the presents come from Bàbá
// Kérésìmesì.

import type { PoolTextMap } from '../../../pools/schema.js';

export const yo: PoolTextMap = {
  // ── 0 · who ──────────────────────────────────────────────────────────────
  'who.chr26-reindeer': 'àgbọ̀nrín kan tó wọ súwẹ́tà Kérésìmesì',
  'who.chr26-snowman': 'ọkùnrin yìnyín kan tó wé ìborùn onílà',
  'who.chr26-gingerbread-man': 'ọkùnrin búrẹ́dì jínjà kan',
  'who.chr26-polar-bear': 'bíà funfun kan tó wọ bàtà ìsáré orí yìnyín',
  'who.chr26-nutcracker': 'ọmọ ogun onígi kan tó ń fọ́ ẹ̀pà',

  // ── 1 · withWhom — the template supplies «àti» ───────────────────────────
  'with.chr26-grumpy-cat': 'ológbò oníkanra kan tó dé fìlà onírun',
  'with.chr26-sleeping-snow-maiden': 'Ọmọbìnrin Yìnyín kan tó ń sùn',
  'with.chr26-winter-bird': 'ẹyẹ kékeré kan tó sanra tí àyà rẹ̀ pupa',
  'with.chr26-gnome': 'ìwin kékeré kan tó dé fìlà gògòrò ńlá',
  'with.chr26-cocoa-mug': 'ife kòkó gbígbóná ńlá kan',

  // ── 2 · where — its own locative ─────────────────────────────────────────
  'where.chr26-snowy-square': 'ní gbàgede ìlú tí yìnyín bò',
  'where.chr26-living-room': 'nínú yàrá ìgbàlejò tó tura lẹ́gbẹ̀ẹ́ ààrò',
  'where.chr26-festive-table': 'níbi tábìlì àsè Kérésìmesì',
  'where.chr26-frozen-pond': 'lórí adágún omi tó dì nínú igbó',
  'where.chr26-film-studio': 'níbi tí wọ́n ti ń ya fíìmù Kérésìmesì',

  // ── 3 · when — opens the story ───────────────────────────────────────────
  'when.chr26-waiting-for-presents': 'nígbà tí wọ́n ń retí ẹ̀bùn',
  'when.chr26-before-the-guests': 'ní wákàtí kan kí àwọn àlejò tó dé',
  'when.chr26-the-big-night': 'ní alẹ́ ọjọ́ tó ṣáájú Kérésìmesì',
  'when.chr26-midnight-bells': 'gẹ́rẹ́ tí aago lu ọ̀gànjọ́ òru',
  'when.chr26-morning-after': 'ní òwúrọ̀ ọjọ́ kejì lẹ́yìn àsè',

  // ── 4 · did — bare verb phrase after «Wọ́n» ──────────────────────────────
  'did.chr26-decorating-tree': 'so bọ́ọ̀lù ọ̀ṣọ́ tó pọ̀ jù mọ́ igi',
  'did.chr26-wrapping-presents': 'fi odindi téèpù kan di ẹ̀bùn wúruwùru kan',
  'did.chr26-snowball-fight': 'ja ìjà bọ́ọ̀lù yìnyín ràbọ̀ràbọ̀',
  'did.chr26-watching-tv': 'wo fíìmù Kérésìmesì lórí tẹlifíṣọ̀n tí òwú aláǹtakùn bò',
  'did.chr26-singing': 'kọ orin Kérésìmesì ní ohùn rara',

  // ── 5 · why — opens with láti / nítorí / kí ──────────────────────────────
  'why.chr26-nice-list': 'kí Bàbá Kérésìmesì lè kà wọ́n sí ọmọ rere',
  'why.chr26-one-more-treat': 'nítorí ègé kéèkì kan sí i',
  'why.chr26-secret-wish': 'kí ìfẹ́ ọkàn àṣírí wọn lè ṣẹ',
  'why.chr26-beat-the-neighbors': 'láti borí ọ̀ṣọ́ àwọn aládùúgbò',
  'why.chr26-family-tradition': 'nítorí pé ìyá àgbà sọ pé àṣà ìdílé ni',

  // ── 6 · ending — full clause ─────────────────────────────────────────────
  'end.chr26-wrapping-paper': 'òkìtì ìwé ẹ̀bùn bo gbogbo nǹkan mọ́lẹ̀',
  'end.chr26-tangled-lights': 'gbogbo nǹkan há sínú okùn iná tí kò lópin',
  'end.chr26-toppled-tree': 'igi Kérésìmesì wó lulẹ̀ díẹ̀díẹ̀',
  'end.chr26-empty-sack': 'Bàbá Kérésìmesì fi àpò òfìfo àti lẹ́tà ọ̀wọ̀ kan sílẹ̀',
  'end.chr26-melted-snowman': 'kìkì kárọ́ọ̀tì nínú omi ló kù nínú ọkùnrin yìnyín',
};
