// SPDX-License-Identifier: AGPL-3.0-only

// «Новый год 2027» — the Christmas 2026 edition's Russian display texts
// (B-29). A draft for the owner's edit (owner decision 2026-11-05), free to
// change: no display text is part of a cache key.
//
// A local gloss, not a translation (B-29): the Russian holiday is New Year's
// Eve, so the night is «новогодняя», midnight comes «под бой курантов», the
// presents come from Дед Мороз, the treat is a tangerine, and the morning after
// is leftover оливье. The same picture serves every language, so the gloss
// lives in the words alone.
//
// Authored against the base Russian template and its rules, which
// pools/text/ru.ts sets out: slot 0 nominative, slot 1 instrumental with
// «с/со» inline (enforced), slot 4 plural past, slot 6 at least three words
// (enforced). **Slots 0–4 carry no comma and no word polishRussianProse puts a
// comma before** (enforced here, by packs.test.ts), since the template joins
// them with nothing but spaces. Lowercase except proper nouns — capitals come
// from polishRussianProse at render time.

import type { PoolTextMap } from '../../../pools/schema.js';

export const ru: PoolTextMap = {
  // ── 0 · who — nominative ─────────────────────────────────────────────────
  'who.chr26-reindeer': 'северный олень в праздничном свитере',
  'who.chr26-snowman': 'снеговик в полосатом шарфе',
  'who.chr26-gingerbread-man': 'пряничный человечек',
  'who.chr26-polar-bear': 'белый медведь на коньках',
  'who.chr26-nutcracker': 'деревянный щелкунчик',

  // ── 1 · withWhom — instrumental, «с/со» inline ───────────────────────────
  'with.chr26-grumpy-cat': 'с ворчливым котом в шапке с помпоном',
  'with.chr26-sleeping-snow-maiden': 'со спящей Снегурочкой',
  'with.chr26-winter-bird': 'с пухлым снегирём',
  'with.chr26-gnome': 'с крошечным гномом в огромном колпаке',
  'with.chr26-cocoa-mug': 'с огромной кружкой какао',

  // ── 2 · where — prepositional, preposition inline ────────────────────────
  'where.chr26-snowy-square': 'на заснеженной городской площади',
  'where.chr26-living-room': 'в уютной гостиной у камина',
  'where.chr26-festive-table': 'за праздничным столом',
  'where.chr26-frozen-pond': 'на замёрзшем пруду в лесу',
  'where.chr26-film-studio': 'на киностудии во время съёмок новогоднего кино',

  // ── 3 · when — adverbial ─────────────────────────────────────────────────
  'when.chr26-waiting-for-presents': 'в ожидании подарков',
  'when.chr26-before-the-guests': 'за час до прихода гостей',
  'when.chr26-the-big-night': 'в новогоднюю ночь',
  'when.chr26-midnight-bells': 'под бой курантов',
  'when.chr26-morning-after': 'наутро за остатками оливье',

  // ── 4 · did — plural past ────────────────────────────────────────────────
  'did.chr26-decorating-tree': 'повесили на ёлку слишком много шаров',
  'did.chr26-wrapping-presents': 'упаковали один бесформенный подарок в целый рулон скотча',
  'did.chr26-snowball-fight': 'устроили грандиозную битву снежками',
  'did.chr26-watching-tv': 'смотрели новогодний фильм по покрытому паутиной телевизору',
  'did.chr26-singing': 'во весь голос пели новогодние песни',

  // ── 5 · why — «чтобы …» and «потому что …» collect their comma at render ──
  'why.chr26-nice-list': 'чтобы Дед Мороз точно пришёл',
  'why.chr26-one-more-treat': 'ради ещё одного мандарина',
  'why.chr26-secret-wish': 'чтобы загаданное желание сбылось',
  'why.chr26-beat-the-neighbors': 'чтобы украсить всё лучше соседей',
  'why.chr26-family-tradition': 'потому что бабушка назвала это семейной традицией',

  // ── 6 · ending — clause following «В итоге …» ────────────────────────────
  'end.chr26-wrapping-paper': 'всё скрылось под горой обёрточной бумаги',
  'end.chr26-tangled-lights': 'всё запуталось в одной бесконечной гирлянде',
  'end.chr26-toppled-tree': 'ёлка очень медленно упала',
  'end.chr26-empty-sack': 'Дед Мороз оставил только пустой мешок и вежливую записку',
  'end.chr26-melted-snowman': 'от снеговика осталась только морковка в луже',
};
