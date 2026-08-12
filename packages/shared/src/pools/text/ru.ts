// SPDX-License-Identifier: AGPL-3.0-only

// Russian pool display texts — the second hand-authored reference language
// (FM-POOL-5). Authored **pre-declined for each slot's grammatical case**
// (FM-POOL-3, ONE-12; non-negotiable), against the Russian prose template:
//   "{0} {1} {3} {2} {4} {5}. В итоге {6}."
//
//   slot 0 who      — nominative              «сердитый пират»
//   slot 1 withWhom — instrumental with «с/со» inline, so the template needs no
//                     synthetic prefix (design §9)  «с большой обезьяной»
//   slot 2 where    — prepositional with its preposition  «на кухне»
//   slot 3 when     — adverbial                «вчера»
//   slot 4 did      — past-tense verb phrase   «варили суп»
//   slot 5 why      — purpose clause           «чтобы согреться»
//   slot 6 ending   — clause following «В итоге …»
//
// Three authoring decisions specific to Russian (T-1.5):
//
// **Slot 4 is plural past, always.** The template joins the two subjects with
// the comitative «X с Y», and Russian agrees that construction with a plural
// verb («пират с тостером испекли …»), which is both idiomatic and — crucially
// — gender-free. SRC's stand-ins used masculine singular («придумал»), which
// silently misgendered every feminine slot-0 answer («сонная лама придумал»).
// A curated pool can just not have that problem; the cost is that slot 4 may
// never use a singular verb form.
//
// **Slots 0–4 never leave a clause open.** The template joins those five slots
// with nothing but spaces, so a text ending in an unclosed subordinate or
// participial phrase runs straight into the next slot: «с роботом, говорящим
// загадками» + «в момент, когда остановились все часы» + «на сырном заводе»
// rendered as one comma-spattered run-on with no phrase ever closed. Those
// texts became «с говорящим загадками роботом» and «в момент остановки всех
// часов» — same joke, no dangling clause. Slots 5 and 6 are each followed by a
// period, so they may carry internal commas («по причинам, которые тогда
// казались разумными»), and they do.
//
// A related trap in the same slots: polishRussianProse (SRC grammar.ts) inserts
// a comma *before* «когда» / «если» / «но» / «а» / «который…», which opens a
// clause it never closes if the trigger is a slot's first word. Avoiding
// subordinate clauses in slots 0–4 sidesteps this too. In slot 5 the same rule
// is doing exactly what we want, so «чтобы …» and «потому что …» are left bare
// and collect their comma at render time.
//
// **Every slot-6 text is at least three words.** renderProse treats a one- or
// two-word slot 6 as a bare noun and prepends «это закончилось» (SRC i18n
// index.ts, ruSlot6IsBareNoun). Our texts are full clauses and must stay that
// way. Enforced by pools.test.ts.
//
// Capitalization is left to polishRussianProse, which capitalizes the story's
// opening word at render time — so every text here is lowercase.

import type { PoolTextMap } from '../schema.js';

export const ru: PoolTextMap = {
  // ── 0 · who — nominative ─────────────────────────────────────────────────
  'who.grumpy-pirate': 'сердитый пират',
  'who.sleepy-llama': 'сонная лама',
  'who.confused-penguin': 'растерянный пингвин',
  'who.overconfident-raccoon': 'самоуверенный енот',
  'who.tiny-dragon': 'самый маленький дракон в мире',
  'who.cats-in-a-trench-coat': 'три кота в одном плаще',
  'who.retired-superhero': 'супергерой на пенсии',
  'who.skating-grandma': 'бабушка на роликах',
  'who.time-traveling-accountant': 'бухгалтер-путешественник во времени',
  'who.muddy-knight': 'очень грязный рыцарь',

  // ── 1 · withWhom — instrumental, «с/со» inline (FM-POOL-3) ───────────────
  'with.haunted-toaster': 'с проклятым тостером',
  'with.angry-geese': 'с тремя злыми гусями',
  'with.philosophical-goldfish': 'с философской золотой рыбкой',
  'with.riddle-robot': 'с говорящим загадками роботом',
  'with.professor-goat': 'с козой по имени Профессор Сыр',
  'with.lost-tourist': 'с очень заблудившимся туристом',
  'with.giant-snail': 'с огромной весёлой улиткой',
  'with.tuba-frog': 'с лягушкой-тубистом',
  'with.talking-mailbox': 'с говорящим почтовым ящиком',
  'with.opera-walrus': 'с поющим оперным моржом',

  // ── 2 · where — prepositional, preposition inline ────────────────────────
  'where.cheese-factory': 'на сырном заводе',
  'where.underwater-canyon': 'на дне океана',
  'where.cookbook-library': 'в библиотеке с одними поваренными книгами',
  'where.giant-sock-drawer': 'в огромном ящике с носками',
  'where.gloomy-birthday': 'на очень грустном дне рождения',
  'where.cramped-elevator': 'в самом тесном лифте на свете',
  'where.cloud-castle': 'в замке из облаков',
  'where.messy-kitchen': 'на невероятно грязной кухне',
  'where.snowy-mountain': 'на снежном горном перевале',
  'where.jungle-treehouse': 'в домике на дереве в джунглях',

  // ── 3 · when — adverbial; «когда» only behind its own comma ──────────────
  'when.small-earthquake': 'во время небольшого землетрясения',
  'when.solar-eclipse': 'в момент солнечного затмения',
  'when.after-breakfast': 'сразу после завтрака, но до второго завтрака',
  'when.someone-elses-wedding': 'на чужой свадьбе',
  'when.wrong-feeling-tuesday': 'в похожий на среду вторник',
  'when.clocks-stopped': 'в момент остановки всех часов',
  'when.three-in-the-morning': 'в три часа ночи без всякой причины',
  'when.hat-festival': 'во время ежегодного фестиваля шляп',
  'when.internet-outage': 'во время отключения интернета',
  'when.seagull-decision': 'в момент важного решения одной чайки',
  'when.last-day-of-summer': 'в последний день лета',
  'when.thunderstorm': 'в самый разгар грозы',
  'when.first-snow': 'утром первого снега',
  'when.school-holidays': 'в середине школьных каникул',
  'when.full-moon': 'при полной луне',
  'when.power-cut': 'во время отключения электричества',
  'when.just-before-dinner': 'за пять минут до ужина',
  'when.longest-lesson': 'на самом длинном уроке в году',
  'when.day-before-birthday': 'за день до чьего-то дня рождения',
  'when.rush-hour': 'в самый час пик',
  'when.while-everyone-slept': 'пока все спали',
  'when.exactly-noon': 'ровно в полдень',

  // ── 4 · did — plural past (see header) ───────────────────────────────────
  'did.baking-giant-cake': 'испекли огромный кривой торт',
  'did.juggling-pancakes': 'жонглировали стопкой блинов',
  'did.painting-polka-dots': 'разрисовали все стены горошком',
  'did.sorting-clouds': 'рассортировали облака по размеру',
  'did.dancing-tango': 'станцевали очень драматичное танго',
  'did.stacking-chairs': 'построили шаткую башню из стульев',
  'did.staring-contest': 'устроили состязание в гляделки',
  'did.flying-kites': 'запускали огромных воздушных змеев',
  'did.eating-spaghetti': 'съели гору спагетти',
  'did.digging-with-spoons': 'выкопали огромную яму чайными ложками',

  // ── 5 · why — purpose clause; «чтобы»/«потому что» take their comma from
  //      polishRussianProse, so they stay bare here ──────────────────────────
  'why.made-sense-then': 'по причинам, которые тогда казались разумными',
  'why.impress-a-pigeon': 'чтобы впечатлить голубя',
  'why.warranty-forbade-it': 'потому что гарантия это запрещала',
  'why.one-grape': 'в обмен на одну виноградину',
  'why.never-back-down': 'потому что они никогда не отступают',
  'why.pointless-point': 'чтобы доказать никому не нужную мысль',
  'why.for-science': 'во имя науки (не подтверждено)',
  'why.pure-stubbornness': 'из чистого упрямства',
  'why.horoscope-said-so': 'потому что гороскоп был очень конкретен',
  'why.bet-with-themselves': 'чтобы выиграть спор с самими собой',
  'why.to-keep-warm': 'чтобы согреться',
  'why.because-tuesday': 'потому что был вторник',
  'why.for-a-sticker': 'ради одной блестящей наклейки',
  'why.avoid-homework': 'чтобы не делать уроки',
  'why.everyone-else-did': 'потому что все остальные так делали',
  'why.world-record': 'чтобы побить никому не известный рекорд',
  'why.simply-hungry': 'потому что очень проголодались',
  'why.impress-grandma': 'чтобы впечатлить одну строгую бабушку',
  'why.forgot-the-plan': 'потому что забыли первоначальный план',
  'why.instructions-said-so': 'потому что так было в инструкции',
  'why.test-a-theory': 'чтобы проверить одну теорию',
  'why.no-reason': 'просто так, без всякой причины',

  // ── 6 · ending — full clause after «В итоге », never under three words ───
  'end.feelings-about-pasta': 'у всех появились сильные чувства к пасте',
  'end.duck-complaint': 'утка подала официальную жалобу',
  'end.nothing-made-sense': 'ничего не имело смысла, но всем было хорошо',
  'end.lost-receipts': 'все чеки потерялись, и это было к лучшему',
  'end.pigeon-certificates': 'несколько голубей получили грамоты',
  'end.fruit-basket': 'мэр прислал корзину фруктов',
  'end.instant-sequel': 'сразу объявили о продолжении',
  'end.three-country-holiday': 'это объявили праздником в трёх странах',
  'end.cloud-looked-away': 'облако, которое всё видело, наконец отвернулось',
  'end.never-spoke-again': 'все согласились больше об этом не говорить',
  'end.ice-cream-for-all': 'мороженого хватило абсолютно всем',
  'end.someone-had-to-mop': 'кому-то пришлось мыть весь пол',
  'end.museum-exhibit': 'это попало под стекло в маленьком музее',
  'end.a-song-about-it': 'об этом написали песню',
  'end.neighbors-applauded': 'соседи аплодировали из своих окон',
  'end.smelled-like-lemons': 'неделю всё пахло лимонами',
  'end.new-holiday-invented': 'на месте придумали новый праздник',
  'end.cat-took-credit': 'все лавры достались проходившему мимо коту',
  'end.everyone-fell-asleep': 'все уснули одной большой кучей',
  'end.indoor-rainbow': 'в комнате появилась радуга и осталась',
  'end.instructions-finally-clear': 'инструкция наконец обрела смысл',
  'end.home-for-soup': 'все разошлись по домам есть суп',
};
