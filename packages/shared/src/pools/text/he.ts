// SPDX-License-Identifier: AGPL-3.0-only

// Hebrew pool display texts — machine-drafted for T-6.3 (FM-POOL-2/5).
// needs-he-review — machine-translated stub awaiting native Hebrew review per
// CONTRIBUTING.md.
//
// Authored against the Hebrew prose template:
//   "{0} {1} היו {2} {3}. הם {4} {5}. בסוף {6}."
//
// Per-slot authoring rules that fall out of that template:
//
//   0  bare subject noun phrase — the template supplies nothing before it
//   1  MUST carry the bound conjunction prefix ו ("and") attached to its
//      first word inline — Hebrew has no standalone "and", so unlike EN's
//      hardcoded "and" the template joins slots 0 and 1 with a plain space
//      and relies on slot 1 supplying its own leading ו, e.g.
//      "וטוסטר רדוף רוחות" ("and a haunted toaster").
//   2  predicate/location phrase with its own preposition, following the
//      hardcoded "היו" (were) — e.g. "בתוך מפעל גבינות"
//   3  a temporal phrase that continues the "were ... ..." clause
//   4  3rd-person PLURAL past-tense verb phrase, following the hardcoded
//      "הם" (they) — plural avoids any gender agreement with slot 0
//   5  no hardcoded connective follows slot 4, so slot 5 supplies its own
//      leading connective (כדי, כי, בגלל, מתוך, ...)
//   6  a full clause, following the hardcoded "בסוף" (in the end)
//
// Right-to-left text: texts are authored as natural Hebrew with no manual
// directional marks; the runtime handles RTL rendering.

import type { PoolTextMap } from '../schema.js';

export const he: PoolTextMap = {
  // ── 0 · who ───────────────────────────────────────────────────────────────
  'who.grumpy-pirate': 'פיראט זועף',
  'who.sleepy-llama': 'לאמה מנומנמת מאוד',
  'who.confused-penguin': 'פינגווין מבולבל',
  'who.overconfident-raccoon': 'רקון בטוח בעצמו יתר על המידה',
  'who.tiny-dragon': 'הדרקון הכי קטן בעולם',
  'who.cats-in-a-trench-coat': 'שלושה חתולים במעיל גשם אחד',
  'who.retired-superhero': 'גיבור-על בגמלאות',
  'who.skating-grandma': 'סבתא על גלגיליות',
  'who.time-traveling-accountant': 'רואה חשבון שנוסע בזמן',
  'who.muddy-knight': 'אביר מלוכלך מאוד',

  // ── 1 · withWhom — leading ו (and) attached inline ─────────────────────────
  'with.haunted-toaster': 'וטוסטר רדוף רוחות',
  'with.angry-geese': 'ושלוש אווזות כועסות',
  'with.philosophical-goldfish': 'ודג זהב פילוסופי',
  'with.riddle-robot': 'ורובוט שמדבר רק בחידות',
  'with.professor-goat': 'ועז בשם פרופסור גבינה',
  'with.lost-tourist': 'ותייר שהלך לגמרי לאיבוד',
  'with.giant-snail': 'וחילזון ענק ועליז',
  'with.tuba-frog': 'וצפרדע עם טובה',
  'with.talking-mailbox': 'ותיבת דואר מדברת',
  'with.opera-walrus': 'ונברן ששר אופרה',

  // ── 2 · where — after "היו" ─────────────────────────────────────────────
  'where.cheese-factory': 'בתוך מפעל גבינות',
  'where.underwater-canyon': 'בקרקעית האוקיינוס',
  'where.cookbook-library': 'בספרייה עם ספרי בישול בלבד',
  'where.giant-sock-drawer': 'בתוך מגירת גרביים ענקית',
  'where.gloomy-birthday': 'במסיבת יום הולדת עגומה מאוד',
  'where.cramped-elevator': 'במעלית צפופה בטירוף',
  'where.cloud-castle': 'בטירה עשויה עננים',
  'where.messy-kitchen': 'במטבח מבולגן להפליא',
  'where.snowy-mountain': 'במעבר הרים מושלג',
  'where.jungle-treehouse': 'בבית עץ בג׳ונגל',

  // ── 3 · when ─────────────────────────────────────────────────────────────
  'when.small-earthquake': 'במהלך רעידת אדמה קטנה',
  'when.solar-eclipse': 'ברגע המדויק של ליקוי חמה',
  'when.after-breakfast': 'מיד אחרי ארוחת בוקר אך לפני הארוחה השנייה',
  'when.someone-elses-wedding': 'בחתונה של מישהו אחר',
  'when.wrong-feeling-tuesday': 'ביום שלישי שהרגיש כמו יום רביעי',
  'when.clocks-stopped': 'ברגע שבו כל השעונים נעצרו',
  'when.three-in-the-morning': 'בשלוש לפנות בוקר בלי שום סיבה טובה',
  'when.hat-festival': 'במהלך פסטיבל הכובעים השנתי',
  'when.internet-outage': 'בזמן שהאינטרנט קרס',
  'when.seagull-decision': 'ברגע שבו שחף קיבל החלטה',
  'when.last-day-of-summer': 'ביום האחרון של הקיץ',
  'when.thunderstorm': 'באמצע סופת רעמים',
  'when.first-snow': 'בבוקר השלג הראשון',
  'when.school-holidays': 'באמצע חופשת בית הספר',
  'when.full-moon': 'תחת ירח מלא מאוד',
  'when.power-cut': 'במהלך הפסקת חשמל עירונית',
  'when.just-before-dinner': 'חמש דקות לפני ארוחת הערב',
  'when.longest-lesson': 'במהלך השיעור הארוך בשנה',
  'when.day-before-birthday': 'יום לפני יום ההולדת של מישהו',
  'when.rush-hour': 'בשיא שעת העומס',
  'when.while-everyone-slept': 'בזמן שכולם האחרים ישנו',
  'when.exactly-noon': 'בדיוק בחצות היום',

  // ── 4 · did — plural past verb phrase, after "הם" ───────────────────────────
  'did.baking-giant-cake': 'אפו עוגה ענקית ועקומה',
  'did.juggling-pancakes': 'עשו להטוטים עם ערימת פנקייקים גבוהה',
  'did.painting-polka-dots': 'צבעו כל קיר בנקודות',
  'did.sorting-clouds': 'סידרו מחדש את העננים לפי גודל',
  'did.dancing-tango': 'רקדו טנגו דרמטי מאוד',
  'did.stacking-chairs': 'בנו מגדל כיסאות מתנדנד',
  'did.staring-contest': 'ערכו תחרות בהייה עצומה',
  'did.flying-kites': 'שיגרו עפיפונים ענקיים עם חוטים סבוכים',
  'did.eating-spaghetti': 'אכלו הר של ספגטי',
  'did.digging-with-spoons': 'חפרו בור ענק בכפיות קטנות',

  // ── 5 · why — own leading connective ────────────────────────────────────────
  'why.made-sense-then': 'מסיבות שנשמעו הגיוניות באותו רגע',
  'why.impress-a-pigeon': 'כדי להרשים יונה',
  'why.warranty-forbade-it': 'כי האחריות אסרה על כך',
  'why.one-grape': 'תמורת ענבה בודדת',
  'why.never-back-down': 'כי הם אף פעם לא נסוגים מאתגר',
  'why.pointless-point': 'כדי להוכיח נקודה שאף אחד לא שאל עליה',
  'why.for-science': 'למען המדע, כנראה',
  'why.pure-stubbornness': 'מתוך עקשנות טהורה',
  'why.horoscope-said-so': 'כי ההורוסקופ היה מאוד ספציפי',
  'why.bet-with-themselves': 'כדי להכריע בהתערבות עם עצמם',
  'why.to-keep-warm': 'כדי להתחמם',
  'why.because-tuesday': 'כי זה היה יום שלישי',
  'why.for-a-sticker': 'בשביל מדבקה נוצצת אחת',
  'why.avoid-homework': 'כדי להתחמק משיעורי בית',
  'why.everyone-else-did': 'כי כולם האחרים עשו את זה',
  'why.world-record': 'כדי לשבור שיא עולמי שאף אחד לא שמע עליו',
  'why.simply-hungry': 'כי הם היו רעבים מאוד',
  'why.impress-grandma': 'כדי להרשים סבתא שנשארה אדישה לגמרי',
  'why.forgot-the-plan': 'כי הם שכחו את התוכנית המקורית',
  'why.instructions-said-so': 'כי ההוראות התעקשו על כך',
  'why.test-a-theory': 'כדי לבדוק תיאוריה על כוח הכבידה',
  'why.no-reason': 'בלי שום סיבה בכלל',

  // ── 6 · ending — full clause, after "בסוף" ────────────────────────────────
  'end.feelings-about-pasta': 'לכולם היו רגשות עזים כלפי פסטה',
  'end.duck-complaint': 'ברווז הגיש תלונה רשמית',
  'end.nothing-made-sense': 'שום דבר לא היה הגיוני וכולם הרגישו בסדר עם זה',
  'end.lost-receipts': 'הקבלות אבדו, וזה כנראה היה לטובה',
  'end.pigeon-certificates': 'כמה יונים קיבלו תעודות הוקרה',
  'end.fruit-basket': 'ראש העיר שלח סל פירות',
  'end.instant-sequel': 'הכריזו מיד על המשך',
  'end.three-country-holiday': 'זה הפך לחג רשמי בשלוש מדינות',
  'end.cloud-looked-away': 'הענן שצפה בכל הזמן הזה סוף סוף הסתובב הצידה',
  'end.never-spoke-again': 'כולם הסכימו לא לדבר על זה שוב לעולם',
  'end.ice-cream-for-all': 'היתה גלידה לגמרי לכולם',
  'end.someone-had-to-mop': 'מישהו היה צריך לשטוף את כל הרצפה',
  'end.museum-exhibit': 'זה הסתיים מאחורי זכוכית במוזיאון קטן',
  'end.a-song-about-it': 'חיברו שיר על כל הסיפור',
  'end.neighbors-applauded': 'השכנים מחאו כפיים מהחלונות',
  'end.smelled-like-lemons': 'הכל הדיף ריח לימונים במשך שבוע שלם',
  'end.new-holiday-invented': 'המציאו חג חדש לגמרי במקום',
  'end.cat-took-credit': 'חתול שעבר בסביבה קיבל את כל הקרדיט',
  'end.everyone-fell-asleep': 'כולם נרדמו בערימה אחת',
  'end.indoor-rainbow': 'קשת הופיעה בתוך הבית וסירבה לעזוב',
  'end.instructions-finally-clear': 'ההוראות סוף סוף היו ברורות לגמרי',
  'end.home-for-soup': 'כולם הלכו הביתה לאכול מרק',
};
