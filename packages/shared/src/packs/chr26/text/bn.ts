// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — Bengali display texts (B-29), machine-drafted for
// Step 118 with B-29's brief.
// needs-bn-review — machine-translated stub awaiting native Bengali review per CONTRIBUTING.md.
//
// Authored against the base Bengali template and its per-slot rules, which
// pools/text/bn.ts sets out: "{3} {2} {0} {1} {5} {4}। শেষমেশ {6}।" — slot 1
// a genitive closed by «সাথে», slot 4 the final verb in ordinary simple past
// («-ল»), slot 6 a past clause; standard colloquial Bengali as written in
// Bangladesh («সাথে», «দাদি»).
//
// A local gloss, not a translation (B-29): Christmas is বড়দিন, the presents
// come from সান্তা ক্লজ.

import type { PoolTextMap } from '../../../pools/schema.js';

export const bn: PoolTextMap = {
  // ── 0 · who ──────────────────────────────────────────────────────────────
  'who.chr26-reindeer': 'বড়দিনের সোয়েটার পরা এক বলগা হরিণ',
  'who.chr26-snowman': 'ডোরাকাটা মাফলার জড়ানো এক তুষারমানব',
  'who.chr26-gingerbread-man': 'এক জিঞ্জারব্রেড মানুষ',
  'who.chr26-polar-bear': 'স্কেট পরা এক মেরু ভালুক',
  'who.chr26-nutcracker': 'কাঠের এক নাটক্র্যাকার সেপাই',

  // ── 1 · withWhom — genitive closed by «সাথে» ────────────────────────────
  'with.chr26-grumpy-cat': 'ঝুঁটিওয়ালা টুপি পরা এক খিটখিটে বিড়ালের সাথে',
  'with.chr26-sleeping-snow-maiden': 'এক ঘুমন্ত তুষারকন্যার সাথে',
  'with.chr26-winter-bird': 'লাল বুকের এক গোলগাল পাখির সাথে',
  'with.chr26-gnome': 'বিশাল চোখা টুপি পরা এক পুঁচকে বামনের সাথে',
  'with.chr26-cocoa-mug': 'গরম কোকোর এক বিশাল মগের সাথে',

  // ── 2 · where ────────────────────────────────────────────────────────────
  'where.chr26-snowy-square': 'বরফে ঢাকা এক বড়দিনের মেলায়',
  'where.chr26-living-room': 'আগুন-চুল্লির পাশে এক আরামদায়ক বসার ঘরে',
  'where.chr26-festive-table': 'কেক আর মিষ্টিতে সাজানো ভোজের টেবিলে',
  'where.chr26-frozen-pond': 'বনের মাঝে জমে যাওয়া এক পুকুরের ওপর',
  'where.chr26-film-studio': 'বড়দিনের সিনেমার শুটিং চলা এক স্টুডিওতে',

  // ── 3 · when — opens the story ───────────────────────────────────────────
  'when.chr26-waiting-for-presents': 'উপহারের অপেক্ষায় থাকার সময়',
  'when.chr26-before-the-guests': 'অতিথিরা আসার এক ঘণ্টা আগে',
  'when.chr26-the-big-night': 'বড়দিনের আগের রাতে',
  'when.chr26-midnight-bells': 'মাঝরাতের ঘণ্টা বাজার মুহূর্তে',
  'when.chr26-morning-after': 'ভোজের পরদিন সকালে',

  // ── 4 · did — simple past «-ল» ───────────────────────────────────────────
  'did.chr26-decorating-tree': 'গাছে বড্ড বেশি বল ঝোলাল',
  'did.chr26-wrapping-presents': 'পুরো এক রোল টেপ দিয়ে এক বেঢপ উপহার মোড়াল',
  'did.chr26-snowball-fight': 'জমজমাট তুষার-বল লড়াই করল',
  'did.chr26-watching-tv': 'মাকড়সার জালে ঢাকা টিভিতে বড়দিনের সিনেমা দেখল',
  'did.chr26-singing': 'গলা ফাটিয়ে বড়দিনের গান গাইল',

  // ── 5 · why ──────────────────────────────────────────────────────────────
  'why.chr26-nice-list': 'সান্তা ক্লজের ভালো বাচ্চাদের তালিকায় থাকতে',
  'why.chr26-one-more-treat': 'আরেক টুকরো বড়দিনের কেকের জন্য',
  'why.chr26-secret-wish': 'এক গোপন ইচ্ছা পূরণ করতে',
  'why.chr26-beat-the-neighbors': 'প্রতিবেশীদের সাজসজ্জাকে হারাতে',
  'why.chr26-family-tradition': 'দাদি এটাকে পারিবারিক রীতি বলেছিল বলে',

  // ── 6 · ending — past clause ─────────────────────────────────────────────
  'end.chr26-wrapping-paper': 'সবকিছু উপহারের কাগজের পাহাড়ের নিচে হারিয়ে গেল',
  'end.chr26-tangled-lights': 'সবকিছু এক অফুরান আলোর মালায় জট পাকিয়ে গেল',
  'end.chr26-toppled-tree': 'বড়দিনের গাছটা খুব, খুব ধীরে উল্টে পড়ল',
  'end.chr26-empty-sack': 'সান্তা ক্লজ শুধু একটা খালি থলে আর একটা ভদ্র চিঠি রেখে গেল',
  'end.chr26-melted-snowman': 'তুষারমানবের বাকি রইল শুধু ডোবায় একটা গাজর',
};
