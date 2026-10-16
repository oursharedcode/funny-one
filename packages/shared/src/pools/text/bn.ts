// SPDX-License-Identifier: AGPL-3.0-only

// Bengali (Bangladesh) pool display texts — machine-drafted for Step 73
// (FM-POOL-2/5).
// needs-bn-review — machine-translated stub awaiting native Bengali review per CONTRIBUTING.md.
//
// Register: standard colloquial Bengali (চলিত ভাষা, never সাধু ভাষা) as
// written in Bangladesh — «সাথে», «কবুতর», «নাশতা», «দাদি», «রংধনু», «সুতা»,
// «লোডশেডিং», the classifier «-টা» in counts («তিনটা»). Bangla Academy
// spelling, so simple-past verbs end in plain «-ল» («বানাল», not «বানালো»);
// «হলো» keeps its «ো» as the usual exception, to stay distinct from «হল» (hall).
//
// Authored against the Bengali prose template (SOV word order, like Tamil):
//   "{3} {2} {0} {1} {5} {4}। শেষমেশ {6}।"
//
//   slot 3 when     — own postposition or locative, first in the sentence
//                     «এক ছোট্ট ভূমিকম্পের সময়» (during a small earthquake);
//                     a clause is nominalised («ঘড়ি থেমে যাওয়ার মুহূর্তে») or
//                     closed with its correlative («যখন … তখন»)
//   slot 2 where    — locative «-এ/-তে/-য়» or «ভেতরে/তলায়» attached, right
//                     after slot 3 with no glue word  «এক পনির কারখানার ভেতরে»
//   slot 0 who      — bare nominative noun phrase, usually with the
//                     storytelling article «এক»  «এক খিটখিটে জলদস্যু»
//   slot 1 withWhom — genitive + «সাথে» (with) attached; the template has no
//                     connector between slot 0 and slot 1
//                     «একটা ভূতুড়ে টোস্টারের সাথে»
//   slot 5 why      — purpose infinitive «-তে» («তাক লাগিয়ে দিতে»), «-এর
//                     জন্য/বিনিময়ে/খাতিরে», or a finite cause clause closed
//                     by «বলে» («সেদিন মঙ্গলবার ছিল বলে»); no connector
//                     before slot 4 either
//   slot 4 did      — the sentence's final finite verb, ordinary 3rd person
//                     simple past («-ল»: বানাল, করল, আঁকল, নাচল, ওড়াল,
//                     খুঁড়ল). Bengali verbs mark person and honorific, not
//                     number or gender, so this one form fits a lone pirate,
//                     a grandmother, three cats and the "who + with whom"
//                     pair alike. Ordinary rather than honorific («-লেন»)
//                     because it is the storyteller's register («এক যে ছিল
//                     রাজা…») and no subject in the pool needs deference.
//   slot 6 ending   — a full past-tense clause following «শেষমেশ» (in the
//                     end)  «একটা হাঁস আনুষ্ঠানিক অভিযোগ দায়ের করল»
//
// Slots 0–5 never end in an open subordinate clause, since the template joins
// them with nothing but spaces; each text is a closed phrase carrying its own
// postposition or case ending where Bengali grammar requires one. Both
// sentences end with the dari «।», supplied by the template.

import type { PoolTextMap } from '../schema.js';

export const bn: PoolTextMap = {
  // ── 0 · who ───────────────────────────────────────────────────────────────
  'who.grumpy-pirate': 'এক খিটখিটে জলদস্যু',
  'who.sleepy-llama': 'ভীষণ ঘুমকাতুরে এক লামা',
  'who.confused-penguin': 'এক হতভম্ব পেঙ্গুইন',
  'who.overconfident-raccoon': 'অতি আত্মবিশ্বাসী এক র‍্যাকুন',
  'who.tiny-dragon': 'দুনিয়ার সবচেয়ে ছোট্ট ড্রাগন',
  'who.cats-in-a-trench-coat': 'একটা লম্বা কোটের ভেতরে তিনটা বিড়াল',
  'who.retired-superhero': 'অবসরপ্রাপ্ত এক সুপারহিরো',
  'who.skating-grandma': 'রোলার স্কেট পরা এক দাদি',
  'who.time-traveling-accountant': 'টাইম মেশিনে চড়া এক হিসাবরক্ষক',
  'who.muddy-knight': 'কাদায় মাখামাখি এক নাইট',

  // ── 1 · withWhom — genitive + «সাথে» attached ──────────────────────────────
  'with.haunted-toaster': 'একটা ভূতুড়ে টোস্টারের সাথে',
  'with.angry-geese': 'তিনটা রাগী রাজহাঁসের সাথে',
  'with.philosophical-goldfish': 'দার্শনিক এক গোল্ডফিশের সাথে',
  'with.riddle-robot': 'শুধু ধাঁধায় কথা বলা এক রোবটের সাথে',
  'with.professor-goat': '“প্রফেসর পনির” নামের এক ছাগলের সাথে',
  'with.lost-tourist': 'একদম পথ হারানো এক পর্যটকের সাথে',
  'with.giant-snail': 'হাসিখুশি এক বিশাল শামুকের সাথে',
  'with.tuba-frog': 'টুবা বাজানো এক ব্যাঙের সাথে',
  'with.talking-mailbox': 'কথা বলা এক ডাকবাক্সের সাথে',
  'with.opera-walrus': 'অপেরা গাওয়া এক সিন্ধুঘোটকের সাথে',

  // ── 2 · where — locative attached ─────────────────────────────────────────
  'where.cheese-factory': 'এক পনির কারখানার ভেতরে',
  'where.underwater-canyon': 'সমুদ্রের একেবারে তলায়',
  'where.cookbook-library': 'শুধু রান্নার বইয়ে ঠাসা এক লাইব্রেরিতে',
  'where.giant-sock-drawer': 'মোজা রাখার এক বিশাল ড্রয়ারের ভেতরে',
  'where.gloomy-birthday': 'ভীষণ মনমরা এক জন্মদিনের পার্টিতে',
  'where.cramped-elevator': 'গাদাগাদি ভিড়ের এক লিফটের ভেতরে',
  'where.cloud-castle': 'মেঘ দিয়ে বানানো এক দুর্গে',
  'where.messy-kitchen': 'একদম লন্ডভন্ড এক রান্নাঘরে',
  'where.snowy-mountain': 'বরফে ঢাকা এক পাহাড়ি গিরিপথে',
  'where.jungle-treehouse': 'জঙ্গলের মধ্যে এক গাছবাড়িতে',

  // ── 3 · when — own postposition, first in the sentence ─────────────────────
  'when.small-earthquake': 'এক ছোট্ট ভূমিকম্পের সময়',
  'when.solar-eclipse': 'ঠিক সূর্যগ্রহণের মুহূর্তে',
  'when.after-breakfast': 'সকালের নাশতার পরে কিন্তু দ্বিতীয় নাশতার আগে',
  'when.someone-elses-wedding': 'অন্য কারও বিয়ের অনুষ্ঠানের মাঝখানে',
  'when.wrong-feeling-tuesday': 'বুধবারের মতো লাগা এক মঙ্গলবারে',
  'when.clocks-stopped': 'সব ঘড়ি থেমে যাওয়ার মুহূর্তে',
  'when.three-in-the-morning': 'অকারণেই রাত তিনটায়',
  'when.hat-festival': 'বার্ষিক টুপি উৎসবের সময়',
  'when.internet-outage': 'ইন্টারনেট বন্ধ থাকার সময়',
  'when.seagull-decision': 'একটা গাংচিলের মন ঠিক করার মুহূর্তে',
  'when.last-day-of-summer': 'গ্রীষ্মের শেষ দিনে',
  'when.thunderstorm': 'তুমুল বজ্রঝড়ের মাঝখানে',
  'when.first-snow': 'প্রথম তুষারপাতের সকালে',
  'when.school-holidays': 'স্কুলের ছুটির মাঝামাঝি সময়ে',
  'when.full-moon': 'ভরা পূর্ণিমার রাতে',
  'when.power-cut': 'শহরজুড়ে লোডশেডিংয়ের সময়',
  'when.just-before-dinner': 'রাতের খাবারের পাঁচ মিনিট আগে',
  'when.longest-lesson': 'বছরের সবচেয়ে লম্বা ক্লাসের সময়',
  'when.day-before-birthday': 'কারও জন্মদিনের আগের দিন',
  'when.rush-hour': 'যানজটের একেবারে চরম সময়ে',
  'when.while-everyone-slept': 'বাকি সবাই যখন ঘুমে কাদা তখন',
  'when.exactly-noon': 'ঠিক দুপুর বারোটায়',

  // ── 4 · did — final finite verb, ordinary 3rd-person simple past «-ল» ──────
  'did.baking-giant-cake': 'বিশাল এক বাঁকাচোরা কেক বানাল',
  'did.juggling-pancakes': 'উঁচু এক গাদা প্যানকেক লোফালুফি করল',
  'did.painting-polka-dots': 'সব দেয়ালে রঙিন ফুটকি আঁকল',
  'did.sorting-clouds': 'মেঘগুলোকে আকার অনুযায়ী নতুন করে সাজাল',
  'did.dancing-tango': 'ভীষণ নাটুকে এক ট্যাঙ্গো নাচল',
  'did.stacking-chairs': 'চেয়ার দিয়ে নড়বড়ে এক টাওয়ার বানাল',
  'did.staring-contest': 'পলক না ফেলার তুমুল এক প্রতিযোগিতা করল',
  'did.flying-kites': 'জট পাকানো সুতায় বিশাল বিশাল ঘুড়ি ওড়াল',
  'did.eating-spaghetti': 'পাহাড়সমান স্প্যাগেটি সাবাড় করল',
  'did.digging-with-spoons': 'ছোট্ট চামচ দিয়ে বিশাল এক গর্ত খুঁড়ল',

  // ── 5 · why — purpose «-তে», «-এর জন্য», or a cause clause closed by «বলে» ──
  'why.made-sense-then': 'তখন বেশ যুক্তিসংগত মনে হওয়া কিছু কারণে',
  'why.impress-a-pigeon': 'এক কবুতরকে তাক লাগিয়ে দিতে',
  'why.warranty-forbade-it': 'ওয়ারেন্টি কার্ডে নিষেধ করা ছিল বলে',
  'why.one-grape': 'মাত্র একটা আঙুরের বিনিময়ে',
  'why.never-back-down': 'চ্যালেঞ্জ পেলে কখনো পিছু হটে না বলে',
  'why.pointless-point': 'কেউ জানতে চায়নি এমন এক কথা প্রমাণ করতে',
  'why.for-science': 'সম্ভবত বিজ্ঞানের খাতিরেই',
  'why.pure-stubbornness': 'নিছক জেদের বশে',
  'why.horoscope-said-so': 'রাশিফলে একদম স্পষ্ট করে লেখা ছিল বলে',
  'why.bet-with-themselves': 'নিজেদের সাথেই ধরা এক বাজি মেটাতে',
  'why.to-keep-warm': 'শরীর গরম রাখতে',
  'why.because-tuesday': 'সেদিন মঙ্গলবার ছিল বলে',
  'why.for-a-sticker': 'মাত্র একটা চকচকে স্টিকারের জন্য',
  'why.avoid-homework': 'হোমওয়ার্ক ফাঁকি দিতে',
  'why.everyone-else-did': 'বাকি সবাই তা-ই করছিল বলে',
  'why.world-record': 'কেউ নামই শোনেনি এমন এক বিশ্বরেকর্ড ভাঙতে',
  'why.simply-hungry': 'পেটে ভীষণ খিদে ছিল বলে',
  'why.impress-grandma': 'কিছুতেই মুগ্ধ না হওয়া এক দাদিকে মুগ্ধ করতে',
  'why.forgot-the-plan': 'আসল প্ল্যানটা ভুলে গিয়েছিল বলে',
  'why.instructions-said-so': 'নির্দেশিকার কড়া হুকুম ছিল বলে',
  'why.test-a-theory': 'মাধ্যাকর্ষণ নিয়ে এক তত্ত্ব যাচাই করতে',
  'why.no-reason': 'একেবারে কোনো কারণ ছাড়াই',

  // ── 6 · ending — full clause after «শেষমেশ» ───────────────────────────────
  'end.feelings-about-pasta': 'পাস্তা নিয়ে সবার মনে জোরালো মতামত তৈরি হলো',
  'end.duck-complaint': 'একটা হাঁস আনুষ্ঠানিক অভিযোগ দায়ের করল',
  'end.nothing-made-sense': 'কিছুরই মাথামুণ্ডু বোঝা গেল না, তবু সবাই দিব্যি খুশি',
  'end.lost-receipts': 'রসিদগুলো হারিয়ে গেল, যা সম্ভবত ভালোই হলো',
  'end.pigeon-certificates': 'বেশ কয়েকটা কবুতর সার্টিফিকেট পেল',
  'end.fruit-basket': 'মেয়র এক ঝুড়ি ফল পাঠালেন',
  'end.instant-sequel': 'সাথে সাথে এর দ্বিতীয় পর্বের ঘোষণা এল',
  'end.three-country-holiday': 'দিনটা তিনটা দেশে সরকারি ছুটি হয়ে গেল',
  'end.cloud-looked-away': 'এতক্ষণ তাকিয়ে থাকা মেঘটা অবশেষে মুখ ফিরিয়ে নিল',
  'end.never-spoke-again': 'সবাই ঠিক করল, এ নিয়ে আর কখনো কথা হবে না',
  'end.ice-cream-for-all': 'একদম সবার ভাগে আইসক্রিম জুটল',
  'end.someone-had-to-mop': 'কাউকে না কাউকে পুরো মেঝে মুছতে হলো',
  'end.museum-exhibit': 'সেটা এক ছোট্ট জাদুঘরে কাচের বাক্সে জায়গা পেল',
  'end.a-song-about-it': 'পুরো ব্যাপারটা নিয়ে একটা গান লেখা হলো',
  'end.neighbors-applauded': 'প্রতিবেশীরা জানালা থেকে হাততালি দিল',
  'end.smelled-like-lemons': 'এক সপ্তাহ ধরে সবকিছুতে হালকা লেবুর গন্ধ রইল',
  'end.new-holiday-invented': 'তখনই একদম নতুন এক ছুটির দিন আবিষ্কার হলো',
  'end.cat-took-credit': 'পাশ দিয়ে যাওয়া এক বিড়াল সব কৃতিত্ব নিয়ে নিল',
  'end.everyone-fell-asleep': 'সবাই একসাথে গাদা হয়ে ঘুমিয়ে পড়ল',
  'end.indoor-rainbow': 'ঘরের ভেতরে এক রংধনু উঠল আর যেতেই চাইল না',
  'end.instructions-finally-clear': 'নির্দেশিকাটা অবশেষে পুরোপুরি বোঝা গেল',
  'end.home-for-soup': 'সবাই স্যুপ খেতে বাড়ি ফিরে গেল',
};
