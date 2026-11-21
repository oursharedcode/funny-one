// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — Ukrainian display texts (B-29), machine-drafted for
// Step 118 with B-29's brief.
// needs-uk-review — machine-translated stub awaiting native Ukrainian review per CONTRIBUTING.md.
//
// Authored against the base Ukrainian template and its per-slot rules, which
// pools/text/uk.ts sets out: "{0} {1} {3} {2} {4} {5}. Зрештою {6}." — slot 1
// instrumental with «з/із/зі» inline, slot 4 plural past, slots 0–4 never
// leaving a clause open (the template joins them with spaces alone, so no
// comma and no «коли …»), slot 6 a clause of at least three words. All four
// are enforced by packs.test.ts.
//
// A local gloss, not a translation (B-29): the presents come from Святий
// Миколай and never Дід Мороз; nor does his Soviet companion Снігурочка
// appear — the snow maiden is «Сніжинка», the snowflake girl of every
// Ukrainian children's matinee (owner decision D2 A, Step 118). The evening is
// Святвечір, the songs колядки, the square a різдвяний ярмарок, the morning
// after the last of the кутя, the treat a медяник.

import type { PoolTextMap } from '../../../pools/schema.js';

export const uk: PoolTextMap = {
  // ── 0 · who — nominative ─────────────────────────────────────────────────
  'who.chr26-reindeer': 'північний олень у святковому светрі',
  'who.chr26-snowman': 'сніговик у смугастому шарфі',
  'who.chr26-gingerbread-man': 'імбирний чоловічок',
  'who.chr26-polar-bear': 'білий ведмідь на ковзанах',
  'who.chr26-nutcracker': "дерев'яний лускунчик",

  // ── 1 · withWhom — instrumental, «з/із/зі» inline ────────────────────────
  'with.chr26-grumpy-cat': 'з буркотливим котом у шапці з помпоном',
  'with.chr26-sleeping-snow-maiden': 'зі сплячою Сніжинкою',
  'with.chr26-winter-bird': 'з пухким снігурем',
  'with.chr26-gnome': 'з крихітним гномом у величезному ковпаку',
  'with.chr26-cocoa-mug': 'з величезною чашкою какао',

  // ── 2 · where — locative, preposition inline ─────────────────────────────
  'where.chr26-snowy-square': 'на засніженому різдвяному ярмарку',
  'where.chr26-living-room': 'у затишній вітальні біля каміна',
  'where.chr26-festive-table': 'за святковим столом',
  'where.chr26-frozen-pond': 'на замерзлому ставку в лісі',
  'where.chr26-film-studio': 'на кіностудії під час зйомок різдвяного фільму',

  // ── 3 · when — adverbial ─────────────────────────────────────────────────
  'when.chr26-waiting-for-presents': 'в очікуванні подарунків',
  'when.chr26-before-the-guests': 'за годину до приходу гостей',
  'when.chr26-the-big-night': 'на Святвечір',
  'when.chr26-midnight-bells': 'опівночі під бій годинника',
  'when.chr26-morning-after': 'наступного ранку над залишками куті',

  // ── 4 · did — plural past ────────────────────────────────────────────────
  'did.chr26-decorating-tree': 'повісили на ялинку забагато кульок',
  'did.chr26-wrapping-presents': 'запакували один безформний подарунок у цілий рулон скотчу',
  'did.chr26-snowball-fight': 'влаштували грандіозну битву сніжками',
  'did.chr26-watching-tv': 'дивилися різдвяний фільм на телевізорі в павутинні',
  'did.chr26-singing': 'на весь голос співали колядки',

  // ── 5 · why ──────────────────────────────────────────────────────────────
  'why.chr26-nice-list': 'щоб Святий Миколай неодмінно прийшов',
  'why.chr26-one-more-treat': 'заради ще одного медяника',
  'why.chr26-secret-wish': 'щоб загадане бажання збулося',
  'why.chr26-beat-the-neighbors': 'щоб прикрасити все краще за сусідів',
  'why.chr26-family-tradition': 'бо бабуся назвала це сімейною традицією',

  // ── 6 · ending — clause following «Зрештою …» ────────────────────────────
  'end.chr26-wrapping-paper': 'усе зникло під горою обгорткового паперу',
  'end.chr26-tangled-lights': 'усе заплуталося в одній нескінченній гірлянді',
  'end.chr26-toppled-tree': 'ялинка дуже повільно впала',
  'end.chr26-empty-sack': 'Святий Миколай залишив тільки порожній мішок і чемний лист',
  'end.chr26-melted-snowman': 'від сніговика лишилася тільки морквина в калюжі',
};
