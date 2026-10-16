// SPDX-License-Identifier: AGPL-3.0-only

// Persian (Farsi, Iran) pool display texts, Step 73. Authored against the
// Persian prose template in ../../i18n/fa.ts:
//   "{3}، {0} {1} {2} {4}، {5}. آخرش {6}."
// e.g. «روز آخر تابستان، یک پنگوئن گیج با سه غاز عصبانی توی یک کارخانهٔ پنیر
// یک کوه اسپاگتی خوردند، تا گرم بمانند. آخرش شهردار یک سبد میوه فرستاد.»
//
// needs-fa-review — machine-translated stub awaiting native Persian (Iran) review per CONTRIBUTING.md.
//
// Per-slot grammar that falls out of that template (only spaces between slots):
//
//   0  bare noun phrase, the subject: «یک …», «کوچک‌ترین …». Nothing before it
//      but the time phrase and its comma.
//   1  opens with «با» ("with"). The companion joins the subject, and the verb
//      in slot 4 agrees with both, as in everyday «علی با مریم رفتند».
//   2  carries its own place word: «توی …» (spoken "in"), «در …», «ته …», «سر …».
//   3  a closed time phrase or «وقتی …» clause; it opens the sentence and the
//      template puts «،» after it.
//   4  object + simple past, 3rd person PLURAL (-ند): «پختند», «ساختند»,
//      «کردند». One form for all ten, because the actor is always two at least
//      (slot 0 with slot 1, and slot 0 may itself be plural: «سه گربه …»).
//   5  read after the verb and a comma, so it opens with its own connective:
//      «تا …» (so that, subjunctive plural), «چون …» (because), «برای / به خاطر /
//      در ازای / از سر …», or «بی هیچ …». Any verb inside is plural ("they").
//   6  a full clause read after «آخرش» ("in the end").
//
// Orthography: Persian ی and ک (never Arabic U+064A / U+0643), ZWNJ in می‌، ‌ها، ‌ای and
// compounds, ezafe after a silent h written «ـهٔ» as in Iranian school books,
// and the «X و Y» pairs spaced («کج و کوله»). Light cultural swaps where the
// joke survives: goldfish is the Nowruz «ماهی قرمز», soup is «آش», homework
// is «مشق», a stopped clock «خوابید».

import type { PoolTextMap } from '../schema.js';

export const fa: PoolTextMap = {
  // ── 0 · who ───────────────────────────────────────────────────────────────
  'who.grumpy-pirate': 'یک دزد دریایی بداخلاق',
  'who.sleepy-llama': 'یک لامای حسابی خواب‌آلود',
  'who.confused-penguin': 'یک پنگوئن گیج',
  'who.overconfident-raccoon': 'یک راکون زیادی از خود راضی',
  'who.tiny-dragon': 'کوچک‌ترین اژدهای دنیا',
  'who.cats-in-a-trench-coat': 'سه گربه زیر یک بارانی بلند',
  'who.retired-superhero': 'یک ابرقهرمان بازنشسته',
  'who.skating-grandma': 'یک مادربزرگ اسکیت‌سوار',
  'who.time-traveling-accountant': 'یک حسابدار مسافر زمان',
  'who.muddy-knight': 'یک شوالیهٔ حسابی گل‌آلود',

  // ── 1 · withWhom — opens with «با»; slot 4 agrees with both actors ────────
  'with.haunted-toaster': 'با یک توستر جن‌زده',
  'with.angry-geese': 'با سه غاز عصبانی',
  'with.philosophical-goldfish': 'با یک ماهی قرمز فیلسوف',
  'with.riddle-robot': 'با رباتی که فقط با چیستان حرف می‌زد',
  'with.professor-goat': 'با بزی به اسم پروفسور پنیر',
  'with.lost-tourist': 'با یک توریست که حسابی راهش را گم کرده بود',
  'with.giant-snail': 'با یک حلزون گندهٔ سرحال',
  'with.tuba-frog': 'با یک قورباغهٔ توبا به دست',
  'with.talking-mailbox': 'با یک صندوق پست سخنگو',
  'with.opera-walrus': 'با یک گراز دریایی اپراخوان',

  // ── 2 · where — carries its own place word ───────────────────────────────
  'where.cheese-factory': 'توی یک کارخانهٔ پنیر',
  'where.underwater-canyon': 'ته اقیانوس',
  'where.cookbook-library': 'در کتابخانه‌ای که فقط کتاب آشپزی داشت',
  'where.giant-sock-drawer': 'توی یک کشوی جوراب غول‌پیکر',
  'where.gloomy-birthday': 'در یک جشن تولد حسابی سوت و کور',
  'where.cramped-elevator': 'توی آسانسوری که جای سوزن انداختن نبود',
  'where.cloud-castle': 'در قصری از ابر',
  'where.messy-kitchen': 'توی آشپزخانه‌ای که حسابی شلم‌شوربا بود',
  'where.snowy-mountain': 'سر یک گردنهٔ کوهستانی پر از برف',
  'where.jungle-treehouse': 'در یک خانهٔ درختی وسط جنگل',

  // ── 3 · when — opens the sentence; the template adds «،» ─────────────────
  'when.small-earthquake': 'وسط یک زلزلهٔ کوچک',
  'when.solar-eclipse': 'درست همان لحظهٔ خورشیدگرفتگی',
  'when.after-breakfast': 'درست بعد از صبحانه ولی قبل از صبحانهٔ دوم',
  'when.someone-elses-wedding': 'وسط عروسی یک نفر دیگر',
  'when.wrong-feeling-tuesday': 'یک سه‌شنبه که انگار چهارشنبه بود',
  'when.clocks-stopped': 'همان لحظه که همهٔ ساعت‌ها با هم خوابیدند',
  'when.three-in-the-morning': 'ساعت سه نصفه‌شب، معلوم نیست چرا',
  'when.hat-festival': 'وسط جشنوارهٔ سالانهٔ کلاه',
  'when.internet-outage': 'وقتی اینترنت قطع بود',
  'when.seagull-decision': 'همان لحظه که یک مرغ دریایی تصمیمش را گرفت',
  'when.last-day-of-summer': 'روز آخر تابستان',
  'when.thunderstorm': 'وسط یک رعد و برق حسابی',
  'when.first-snow': 'صبح اولین برف',
  'when.school-holidays': 'درست وسط تعطیلات مدرسه',
  'when.full-moon': 'زیر ماهی که از همیشه کامل‌تر بود',
  'when.power-cut': 'وقتی برق کل شهر رفته بود',
  'when.just-before-dinner': 'پنج دقیقه قبل از شام',
  'when.longest-lesson': 'سر طولانی‌ترین کلاس سال',
  'when.day-before-birthday': 'روز قبل از تولد یک نفر',
  'when.rush-hour': 'در اوج ساعت شلوغی',
  'when.while-everyone-slept': 'وقتی بقیه همه خواب بودند',
  'when.exactly-noon': 'درست سر ساعت دوازده ظهر',

  // ── 4 · did — object + simple past, 3rd person plural (-ند) ───────────────
  'did.baking-giant-cake': 'یک کیک غول‌پیکر کج و کوله پختند',
  'did.juggling-pancakes': 'یک دسته پنکیک بلند را هی هوا انداختند و گرفتند',
  'did.painting-polka-dots': 'همهٔ دیوارها را خال‌خالی رنگ کردند',
  'did.sorting-clouds': 'ابرها را به ترتیب اندازه مرتب کردند',
  'did.dancing-tango': 'یک تانگوی پرسوز و گداز رقصیدند',
  'did.stacking-chairs': 'از صندلی‌ها یک برج لق‌لقو ساختند',
  'did.staring-contest': 'یک مسابقهٔ زل‌زدن نفس‌گیر راه انداختند',
  'did.flying-kites': 'بادبادک‌های غول‌پیکر با نخ‌های گره‌خورده هوا کردند',
  'did.eating-spaghetti': 'یک کوه اسپاگتی خوردند',
  'did.digging-with-spoons': 'با قاشق‌های ریزه‌میزه یک چالهٔ گنده کندند',

  // ── 5 · why — after the verb and «،»; opens with its own connective ──────
  'why.made-sense-then': 'به دلایلی که آن موقع منطقی به نظر می‌رسید',
  'why.impress-a-pigeon': 'تا جلوی یک کبوتر پز بدهند',
  'why.warranty-forbade-it': 'چون برگهٔ گارانتی گفته بود این کار ممنوع است',
  'why.one-grape': 'در ازای فقط یک دانه انگور',
  'why.never-back-down': 'چون سر هیچ شرطی جا نمی‌زنند',
  'why.pointless-point': 'تا چیزی را ثابت کنند که هیچ‌کس نپرسیده بود',
  'why.for-science': 'لابد برای علم',
  'why.pure-stubbornness': 'فقط از سر لج‌بازی',
  'why.horoscope-said-so': 'چون فال روزشان خیلی دقیق همین را گفته بود',
  'why.bet-with-themselves': 'تا شرطی را که با خودشان بسته بودند ببرند',
  'why.to-keep-warm': 'تا گرم بمانند',
  'why.because-tuesday': 'چون سه‌شنبه بود',
  'why.for-a-sticker': 'فقط به خاطر یک استیکر براق',
  'why.avoid-homework': 'تا مجبور نشوند مشق بنویسند',
  'why.everyone-else-did': 'چون بقیه هم داشتند همین کار را می‌کردند',
  'why.world-record': 'تا یک رکورد جهانی را بشکنند که هیچ‌کس اسمش را هم نشنیده بود',
  'why.simply-hungry': 'چون از گرسنگی داشتند ضعف می‌کردند',
  'why.impress-grandma': 'تا دل مادربزرگی را ببرند که هیچ تحویلشان نگرفت',
  'why.forgot-the-plan': 'چون نقشهٔ اصلی یادشان رفته بود',
  'why.instructions-said-so': 'چون دفترچهٔ راهنما اصرار داشت',
  'why.test-a-theory': 'تا یک نظریه دربارهٔ جاذبه را امتحان کنند',
  'why.no-reason': 'بی هیچ دلیلی',

  // ── 6 · ending — reads after «آخرش» ──────────────────────────────────────
  'end.feelings-about-pasta': 'همه دربارهٔ ماکارونی نظرهای خیلی جدی پیدا کردند',
  'end.duck-complaint': 'یک اردک شکایت‌نامهٔ رسمی نوشت',
  'end.nothing-made-sense': 'هیچ‌چیز معنی نداشت و همه هم از این بابت راضی بودند',
  'end.lost-receipts': 'رسیدها گم شدند که شاید همین بهتر بود',
  'end.pigeon-certificates': 'چند تا کبوتر لوح تقدیر گرفتند',
  'end.fruit-basket': 'شهردار یک سبد میوه فرستاد',
  'end.instant-sequel': 'همان دم اعلام شد که قسمت دومش در راه است',
  'end.three-country-holiday': 'آن روز در سه کشور تعطیل رسمی شد',
  'end.cloud-looked-away': 'ابری که از اول تماشا می‌کرد بالاخره رویش را برگرداند',
  'end.never-spoke-again': 'همه قول دادند دیگر هیچ‌وقت حرفش را هم نزنند',
  'end.ice-cream-for-all': 'به همه، بدون استثنا، بستنی رسید',
  'end.someone-had-to-mop': 'یک نفر مجبور شد کل زمین را تی بکشد',
  'end.museum-exhibit': 'ماجرا سر از ویترین یک موزهٔ کوچک درآورد',
  'end.a-song-about-it': 'دربارهٔ کل ماجرا یک ترانه ساختند',
  'end.neighbors-applauded': 'همسایه‌ها از پشت پنجره برایشان دست زدند',
  'end.smelled-like-lemons': 'تا یک هفته همه‌جا بوی ملایم لیمو می‌داد',
  'end.new-holiday-invented': 'درجا یک عید تازه اختراع شد',
  'end.cat-took-credit': 'یک گربهٔ رهگذر همهٔ افتخارش را به اسم خودش زد',
  'end.everyone-fell-asleep': 'همه روی هم کپه شدند و خوابشان برد',
  'end.indoor-rainbow': 'یک رنگین‌کمان توی خانه پیدا شد و حاضر نبود برود',
  'end.instructions-finally-clear': 'بالاخره معلوم شد دفترچهٔ راهنما چه می‌گفت',
  'end.home-for-soup': 'همه رفتند خانه که آش بخورند',
};
