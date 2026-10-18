// SPDX-License-Identifier: AGPL-3.0-only

// Arabic (Modern Standard Arabic) pool display texts, Step 81. Authored against the
// Arabic prose template in ../../i18n/ar.ts:
//   "{3}، {2}، اجتمع فريق عجيب: {0} و{1}. فانهمك الفريق في {4}، {5}. وفي النهاية، {6}."
// e.g. «في آخر يوم من الصيف، داخل مصنع جبن، اجتمع فريق عجيب: بطريق حائر وثلاث إوزات
// غاضبة. فانهمك الفريق في التهام جبل من السباغيتي، طلبا للدفء. وفي النهاية، أرسل عمدة
// المدينة سلة فواكه.»
//
// needs-ar-review — machine-translated stub awaiting native Arabic review per CONTRIBUTING.md.
//
// Per-slot grammar that falls out of that template. Arabic verbs and adjectives agree in
// gender and number (singular, dual, plural), and the actors vary («قرصان» m., «جدة» f.,
// «ثلاث قطط» pl.), so no word outside the slots refers to them: the masculine singular
// «فريق» ("team") is the subject of every verb in the template.
//
//   0  bare indefinite noun phrase, nominative: the first half of the apposition after
//      «اجتمع فريق عجيب:». «أصغر تنين في العالم» is the one superlative.
//   1  bare indefinite noun phrase; the template writes «و» ("and") onto it, as Arabic
//      spells it. «و» never joins the next letter, so the highlighted answer keeps its
//      own letter shapes.
//   2  carries its own place word: «في …», «داخل …». It follows slot 3 and «،».
//   3  a time phrase or a «حين / بينما …» clause; it opens the story and the template
//      puts «،» after it.
//   4  a verbal noun (masdar) with its object, read after «فانهمك الفريق في» ("so the
//      team threw itself into"): «خبز كعكة …», «التهام جبل …». No verb, so nothing in it
//      agrees with the actors.
//   5  read after a comma, so it opens with its own connective: «لإبهار …» (to),
//      «لأن …» (because), «مقابل / من أجل / من شدة / بلا …», or an adverbial accusative
//      («عنادا», «طلبا للدفء», «هربا من …»). A pronoun in it can only mean «الفريق»
//      (masculine singular: «مع نفسه»).
//   6  a full clause read after «وفي النهاية،» ("and in the end,"), with its own
//      subject («الجميع», «عمدة المدينة», «قط عابر», «الفريق»), never "they".
//
// Orthography: Arabic ي and ك (U+064A, U+0643), never the Persian forms; no tatweel, no
// direction marks and no tashkeel, so tanween fath shows only as its alif («عنادا»,
// «فجرا»). Numbers inside texts are words («ثلاث قطط», «في الثالثة فجرا»). A word that
// reads two ways without vowels gets a partner that settles it: «محمصة خبز» (not a
// coffee roastery), «طيور حمام» (not bathrooms), «رفعت … شكوى». The walrus is
// «فقمة بنابين طويلين», since «فظ» also means "rude".
//
// Cultural swaps: none of substance. Where MSA offers a choice, the word also reads
// naturally in the Maghreb: «عرس» (wedding), «الفطور» (breakfast), «حصة دراسية»
// (lesson), «العطلة المدرسية» (school holidays), «الحساء» (soup).

import type { PoolTextMap } from '../schema.js';

export const ar: PoolTextMap = {
  // ── 0 · who — nominative, first half of the apposition after the colon ────
  'who.grumpy-pirate': 'قرصان متذمر',
  'who.sleepy-llama': 'لاما يغلبه النعاس',
  'who.confused-penguin': 'بطريق حائر',
  'who.overconfident-raccoon': 'راكون واثق من نفسه أكثر من اللازم',
  'who.tiny-dragon': 'أصغر تنين في العالم',
  'who.cats-in-a-trench-coat': 'ثلاث قطط متنكرة في معطف طويل',
  'who.retired-superhero': 'بطل خارق متقاعد',
  'who.skating-grandma': 'جدة تتزلج على عجلات',
  'who.time-traveling-accountant': 'محاسب يسافر عبر الزمن',
  'who.muddy-knight': 'فارس ملطخ بالوحل من رأسه إلى أخمص قدميه',

  // ── 1 · withWhom — bare noun phrase; the template writes «و» onto it ──────
  'with.haunted-toaster': 'محمصة خبز مسكونة',
  'with.angry-geese': 'ثلاث إوزات غاضبة',
  'with.philosophical-goldfish': 'سمكة ذهبية تتفلسف',
  'with.riddle-robot': 'روبوت لا يتكلم إلا بالألغاز',
  'with.professor-goat': 'عنزة تدعى الأستاذة جبنة',
  'with.lost-tourist': 'سائح ضل طريقه تماما',
  'with.giant-snail': 'حلزون عملاق مرح',
  'with.tuba-frog': 'ضفدع يعزف على التوبا',
  'with.talking-mailbox': 'صندوق بريد يتكلم',
  'with.opera-walrus': 'فقمة بنابين طويلين تغني الأوبرا',

  // ── 2 · where — carries its own place word ───────────────────────────────
  'where.cheese-factory': 'داخل مصنع جبن',
  'where.underwater-canyon': 'في قاع المحيط',
  'where.cookbook-library': 'في مكتبة لا تضم إلا كتب الطبخ',
  'where.giant-sock-drawer': 'داخل درج جوارب عملاق',
  'where.gloomy-birthday': 'في حفلة عيد ميلاد بالغة الكآبة',
  'where.cramped-elevator': 'في مصعد ضيق لا يكاد يتسع لأحد',
  'where.cloud-castle': 'في قلعة من الغيوم',
  'where.messy-kitchen': 'في مطبخ غارق في فوضى عارمة',
  'where.snowy-mountain': 'في ممر جبلي تكسوه الثلوج',
  'where.jungle-treehouse': 'في كوخ فوق شجرة وسط الأدغال',

  // ── 3 · when — opens the story; the template adds «،» ────────────────────
  'when.small-earthquake': 'أثناء زلزال صغير',
  'when.solar-eclipse': 'في لحظة كسوف الشمس بالضبط',
  'when.after-breakfast': 'بعد الفطور مباشرة وقبل الفطور الثاني',
  'when.someone-elses-wedding': 'أثناء عرس شخص آخر',
  'when.wrong-feeling-tuesday': 'في يوم ثلاثاء بدا كأنه أربعاء',
  'when.clocks-stopped': 'لحظة توقفت كل الساعات معا',
  'when.three-in-the-morning': 'في الثالثة فجرا دون سبب وجيه',
  'when.hat-festival': 'خلال مهرجان القبعات السنوي',
  'when.internet-outage': 'حين انقطع الإنترنت',
  'when.seagull-decision': 'في اللحظة التي حسم فيها نورس أمره',
  'when.last-day-of-summer': 'في آخر يوم من الصيف',
  'when.thunderstorm': 'وسط عاصفة رعدية',
  'when.first-snow': 'في صباح أول ثلج',
  'when.school-holidays': 'في منتصف العطلة المدرسية',
  'when.full-moon': 'تحت قمر مكتمل للغاية',
  'when.power-cut': 'خلال انقطاع الكهرباء عن المدينة كلها',
  'when.just-before-dinner': 'قبل العشاء بخمس دقائق',
  'when.longest-lesson': 'خلال أطول حصة دراسية في السنة',
  'when.day-before-birthday': 'قبل عيد ميلاد أحدهم بيوم',
  'when.rush-hour': 'في ذروة ساعة الزحام',
  'when.while-everyone-slept': 'بينما كان العالم كله نائما',
  'when.exactly-noon': 'عند منتصف النهار بالضبط',

  // ── 4 · did — a masdar with its object, after «فانهمك الفريق في» ─────────
  'did.baking-giant-cake': 'خبز كعكة عملاقة مائلة',
  'did.juggling-pancakes': 'تقاذف كومة عالية من الفطائر في الهواء',
  'did.painting-polka-dots': 'رسم نقاط ملونة على كل الجدران',
  'did.sorting-clouds': 'ترتيب الغيوم حسب الحجم',
  'did.dancing-tango': 'رقص التانغو بحماس مسرحي مبالغ فيه',
  'did.stacking-chairs': 'بناء برج متمايل من الكراسي',
  'did.staring-contest': 'خوض مسابقة تحديق حامية الوطيس',
  'did.flying-kites': 'تطيير طائرات ورقية عملاقة بخيوط متشابكة',
  'did.eating-spaghetti': 'التهام جبل من السباغيتي',
  'did.digging-with-spoons': 'حفر حفرة عملاقة بملاعق صغيرة',

  // ── 5 · why — opens with its own connective ──────────────────────────────
  'why.made-sense-then': 'لأسباب بدت منطقية وقتها',
  'why.impress-a-pigeon': 'لإبهار حمامة',
  'why.warranty-forbade-it': 'لأن شروط الضمان تمنع ذلك صراحة',
  'why.one-grape': 'مقابل حبة عنب واحدة',
  'why.never-back-down': 'لأن التراجع أمام التحدي غير وارد',
  'why.pointless-point': 'لإثبات فكرة لم يسأل عنها أحد',
  'why.for-science': 'خدمة للعلم على الأرجح',
  'why.pure-stubbornness': 'عنادا لا أكثر',
  'why.horoscope-said-so': 'لأن توقعات الأبراج كانت دقيقة بشكل مريب',
  'why.bet-with-themselves': 'لحسم رهان قديم مع نفسه',
  'why.to-keep-warm': 'طلبا للدفء',
  'why.because-tuesday': 'لأنه كان يوم ثلاثاء',
  'why.for-a-sticker': 'من أجل ملصق لامع واحد',
  'why.avoid-homework': 'هربا من الواجبات المدرسية',
  'why.everyone-else-did': 'لأن الجميع كانوا يفعلون ذلك',
  'why.world-record': 'لتحطيم رقم قياسي عالمي لم يسمع به أحد',
  'why.simply-hungry': 'من شدة الجوع',
  'why.impress-grandma': 'لإبهار جدة لا يبهرها شيء',
  'why.forgot-the-plan': 'لأن الخطة الأصلية طارت من الذاكرة',
  'why.instructions-said-so': 'لأن التعليمات أصرت على ذلك',
  'why.test-a-theory': 'لاختبار نظرية عن الجاذبية',
  'why.no-reason': 'بلا أي سبب على الإطلاق',

  // ── 6 · ending — a full clause after «وفي النهاية،» ──────────────────────
  'end.feelings-about-pasta': 'صارت لدى الجميع مشاعر جياشة تجاه المعكرونة',
  'end.duck-complaint': 'رفعت بطة شكوى رسمية',
  'end.nothing-made-sense': 'لم يعد لأي شيء معنى، ولم يزعج ذلك أحدا',
  'end.lost-receipts': 'ضاعت كل الفواتير، وربما كان ذلك للأفضل',
  'end.pigeon-certificates': 'حصلت عدة طيور حمام على شهادات تقدير',
  'end.fruit-basket': 'أرسل عمدة المدينة سلة فواكه',
  'end.instant-sequel': 'أعلن الفريق فورا عن الجزء الثاني',
  'end.three-country-holiday': 'صار ذلك اليوم عطلة رسمية في ثلاث دول',
  'end.cloud-looked-away': 'أشاحت السحابة المتفرجة بوجهها أخيرا',
  'end.never-spoke-again': 'اتفق الجميع على ألا يذكروا الأمر أبدا',
  'end.ice-cream-for-all': 'كانت هناك مثلجات للجميع بلا استثناء',
  'end.someone-had-to-mop': 'اضطر أحدهم إلى مسح الأرضية كلها',
  'end.museum-exhibit': 'صار كل شيء معروضا خلف زجاج في متحف صغير',
  'end.a-song-about-it': 'كتب أحدهم أغنية عن كل ما جرى',
  'end.neighbors-applauded': 'صفق الجيران من نوافذهم',
  'end.smelled-like-lemons': 'ظلت رائحة ليمون خفيفة تفوح من كل شيء طوال أسبوع',
  'end.new-holiday-invented': 'اخترع الحاضرون عيدا جديدا تماما في الحال',
  'end.cat-took-credit': 'نسب قط عابر الفضل كله إلى نفسه',
  'end.everyone-fell-asleep': 'نام الجميع بعضهم فوق بعض',
  'end.indoor-rainbow': 'ظهر قوس قزح داخل البيت ورفض أن يغادر',
  'end.instructions-finally-clear': 'صارت التعليمات أخيرا مفهومة تماما',
  'end.home-for-soup': 'عاد الجميع إلى البيت لتناول الحساء',
};
