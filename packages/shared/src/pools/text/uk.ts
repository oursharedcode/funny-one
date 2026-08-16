// SPDX-License-Identifier: AGPL-3.0-only

// Ukrainian pool display texts — machine-drafted for T-6.3 (FM-POOL-2/5).
// needs-uk-review — machine-translated stub awaiting native Ukrainian review per CONTRIBUTING.md.
//
// Authored against the Ukrainian prose template:
//   "{0} {1} {3} {2} {4} {5}. Зрештою {6}."
// (structurally identical to the Russian template — see ru.ts for the shared
// reasoning behind these per-slot rules, adapted here to Ukrainian.)
//
//   slot 0 who      — nominative              «сердитий пірат»
//   slot 1 withWhom — instrumental with «з/із/зі» inline, so the template
//                     needs no synthetic prefix  «з зачарованим тостером»
//   slot 2 where    — locative with its own preposition  «на кухні»
//   slot 3 when     — adverbial                «вчора»
//   slot 4 did      — plural past-tense verb phrase  «варили суп»
//   slot 5 why      — purpose/reason clause    «щоб зігрітися»
//   slot 6 ending   — clause following «Зрештою …»
//
// Three authoring decisions carried over from Russian (see ru.ts, T-1.5):
//
// **Slot 4 is plural past, always.** The template joins the two subjects with
// the comitative "X {withWhom}", and Ukrainian agrees that construction with
// a plural verb («пірат з тостером спекли …»), which is idiomatic and —
// crucially — gender-free, so it never misgenders whichever slot-0 option was
// picked.
//
// **Slots 0–4 never leave a clause open.** The template joins those five
// slots with nothing but spaces, so a text ending in an unclosed subordinate
// or participial phrase would run straight into the next slot. Each slot 0–4
// text here is kept a single self-contained noun/verb phrase. Slots 5 and 6
// are each followed by a period, so they may carry internal commas, and some
// do.
//
// **Every slot-6 text is at least three words**, so it reads as a full clause
// after «Зрештою» rather than a bare noun. Enforced by pools.test.ts.
//
// Capitalization is a rendering concern, not a data concern — every text
// here is lowercase, matching en.ts/ru.ts convention.

import type { PoolTextMap } from '../schema.js';

export const uk: PoolTextMap = {
  // ── 0 · who — nominative ─────────────────────────────────────────────────
  'who.grumpy-pirate': 'сердитий пірат',
  'who.sleepy-llama': 'дуже сонна лама',
  'who.confused-penguin': 'спантеличений пінгвін',
  'who.overconfident-raccoon': 'самовпевнений єнот',
  'who.tiny-dragon': 'найменший дракон у світі',
  'who.cats-in-a-trench-coat': 'три коти в одному плащі',
  'who.retired-superhero': 'супергерой на пенсії',
  'who.skating-grandma': 'бабуся на роликах',
  'who.time-traveling-accountant': 'бухгалтер-мандрівник у часі',
  'who.muddy-knight': 'дуже брудний лицар',

  // ── 1 · withWhom — instrumental, «з/із/зі» inline ────────────────────────
  'with.haunted-toaster': 'з зачарованим тостером',
  'with.angry-geese': 'із трьома лютими гусьми',
  'with.philosophical-goldfish': 'з філософською золотою рибкою',
  'with.riddle-robot': 'з роботом, що говорить лише загадками',
  'with.professor-goat': "з козою на ім'я Професор Сир",
  'with.lost-tourist': 'з дуже заблукалим туристом',
  'with.giant-snail': 'з величезним життєрадісним равликом',
  'with.tuba-frog': 'з жабою-тубісткою',
  'with.talking-mailbox': 'з балакучою поштовою скринькою',
  'with.opera-walrus': 'з моржем-оперним співаком',

  // ── 2 · where — locative, own preposition ────────────────────────────────
  'where.cheese-factory': 'на сирній фабриці',
  'where.underwater-canyon': 'на дні океану',
  'where.cookbook-library': 'у бібліотеці, де лише кулінарні книжки',
  'where.giant-sock-drawer': 'у велетенській шухляді з шкарпетками',
  'where.gloomy-birthday': 'на дуже сумному дні народження',
  'where.cramped-elevator': 'у надзвичайно тісному ліфті',
  'where.cloud-castle': 'у замку з хмар',
  'where.messy-kitchen': 'на неймовірно захаращеній кухні',
  'where.snowy-mountain': 'на засніженому гірському перевалі',
  'where.jungle-treehouse': 'у будиночку на дереві в джунглях',

  // ── 3 · when — adverbial ──────────────────────────────────────────────────
  'when.small-earthquake': 'під час невеликого землетрусу',
  'when.solar-eclipse': 'саме в момент сонячного затемнення',
  'when.after-breakfast': 'одразу після сніданку, але до другого сніданку',
  'when.someone-elses-wedding': 'на чужому весіллі',
  'when.wrong-feeling-tuesday': 'у вівторок, схожий на середу',
  'when.clocks-stopped': 'тієї миті, коли зупинилися всі годинники',
  'when.three-in-the-morning': 'о третій ночі без жодної причини',
  'when.hat-festival': 'під час щорічного фестивалю капелюхів',
  'when.internet-outage': 'під час відключення інтернету',
  'when.seagull-decision': 'тієї миті, коли чайка щось вирішила',
  'when.last-day-of-summer': 'в останній день літа',
  'when.thunderstorm': 'у розпал грози',
  'when.first-snow': 'вранці першого снігу',
  'when.school-holidays': 'посеред шкільних канікул',
  'when.full-moon': 'під час повного місяця',
  'when.power-cut': 'під час відключення електрики в усьому місті',
  'when.just-before-dinner': "за п'ять хвилин до вечері",
  'when.longest-lesson': 'на найдовшому уроці за весь рік',
  'when.day-before-birthday': 'за день до чийогось дня народження',
  'when.rush-hour': 'у самий розпал години пік',
  'when.while-everyone-slept': 'поки всі спали',
  'when.exactly-noon': 'рівно опівдні',

  // ── 4 · did — plural past verb phrase ────────────────────────────────────
  'did.baking-giant-cake': 'спекли величезний перекошений торт',
  'did.juggling-pancakes': 'жонглювали високою стопкою млинців',
  'did.painting-polka-dots': 'розмалювали всі стіни горошком',
  'did.sorting-clouds': 'розсортували хмари за розміром',
  'did.dancing-tango': 'станцювали дуже драматичне танго',
  'did.stacking-chairs': 'збудували хитку вежу зі стільців',
  'did.staring-contest': 'влаштували запеклий конкурс гляділок',
  'did.flying-kites': 'запускали велетенських повітряних зміїв',
  'did.eating-spaghetti': "з'їли цілу гору спагеті",
  'did.digging-with-spoons': 'викопали величезну яму маленькими ложками',

  // ── 5 · why — own leading connective ─────────────────────────────────────
  'why.made-sense-then': 'з причин, які тоді здавалися розумними',
  'why.impress-a-pigeon': 'щоб вразити голуба',
  'why.warranty-forbade-it': 'тому що гарантія це забороняла',
  'why.one-grape': 'в обмін на одну виноградину',
  'why.never-back-down': 'бо вони ніколи не відступають',
  'why.pointless-point': 'щоб довести думку, яку ніхто не питав',
  'why.for-science': 'заради науки, напевно',
  'why.pure-stubbornness': 'із чистої впертості',
  'why.horoscope-said-so': 'бо гороскоп був дуже конкретний',
  'why.bet-with-themselves': 'щоб виграти суперечку із самими собою',
  'why.to-keep-warm': 'щоб зігрітися',
  'why.because-tuesday': 'тому що був вівторок',
  'why.for-a-sticker': 'заради однієї блискучої наліпки',
  'why.avoid-homework': 'щоб не робити домашнє завдання',
  'why.everyone-else-did': 'бо всі інші теж так робили',
  'why.world-record': 'щоб побити нікому не відомий рекорд',
  'why.simply-hungry': 'бо дуже зголодніли',
  'why.impress-grandma': 'щоб вразити бабусю, яка лишилася незворушною',
  'why.forgot-the-plan': 'бо забули початковий план',
  'why.instructions-said-so': 'бо так наполягала інструкція',
  'why.test-a-theory': 'щоб перевірити одну теорію про гравітацію',
  'why.no-reason': 'просто так, без жодної причини',

  // ── 6 · ending — full clause, 3+ words ───────────────────────────────────
  'end.feelings-about-pasta': 'усі мали сильні почуття щодо пасти',
  'end.duck-complaint': 'качка подала офіційну скаргу',
  'end.nothing-made-sense': 'нічого не мало сенсу, але всім було добре',
  'end.lost-receipts': 'чеки загубилися, і це було на краще',
  'end.pigeon-certificates': 'кілька голубів отримали грамоти',
  'end.fruit-basket': 'мер надіслав кошик фруктів',
  'end.instant-sequel': 'продовження оголосили негайно',
  'end.three-country-holiday': 'це стало святом одразу в трьох країнах',
  'end.cloud-looked-away': 'хмара, що весь час спостерігала, нарешті відвернулася',
  'end.never-spoke-again': 'усі домовилися більше про це не згадувати',
  'end.ice-cream-for-all': 'морозива вистачило абсолютно всім',
  'end.someone-had-to-mop': 'комусь довелося мити всю підлогу',
  'end.museum-exhibit': 'це опинилося під склом у маленькому музеї',
  'end.a-song-about-it': 'про це написали пісню',
  'end.neighbors-applauded': 'сусіди аплодували зі своїх вікон',
  'end.smelled-like-lemons': 'усе довкола ще тиждень пахло лимонами',
  'end.new-holiday-invented': 'на місці придумали цілком нове свято',
  'end.cat-took-credit': 'усі лаври дісталися котові, що проходив повз',
  'end.everyone-fell-asleep': 'усі заснули однією великою купою',
  'end.indoor-rainbow': "у кімнаті з'явилася веселка і не схотіла зникати",
  'end.instructions-finally-clear': 'інструкція нарешті стала цілком зрозумілою',
  'end.home-for-soup': 'усі розійшлися по домівках їсти суп',
};
