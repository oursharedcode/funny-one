// SPDX-License-Identifier: AGPL-3.0-only

// Indonesian pool display texts — machine-drafted for T-6.3 (FM-POOL-2/5).
// needs-id-review — machine-translated stub awaiting native Indonesian review per CONTRIBUTING.md.
//
// Authored against the Indonesian prose template:
//   "{0} bersama {1} {3} {2} {4} {5}. Akhirnya, semuanya berakhir dengan {6}."
//
// Indonesian is grammatically forgiving (no tense conjugation, no gender, no
// plural marking), so most of the per-slot rules here are about word order
// and glue words rather than agreement:
//
//   0  bare subject noun phrase — the template supplies nothing before it
//   1  bare noun phrase, NOT "bersama ..." — the template hardcodes "bersama".
//   3  then 2  slot 3 (when) renders before slot 2 (where), back-to-back with
//      no glue word between them, so each MUST carry its own leading
//      preposition/adverbial: slot3 "saat gempa kecil terjadi", slot2
//      "di dalam pabrik keju".
//   4  active verb phrase (typically meN- prefix); no tense marking needed
//   5  no hardcoded connective follows slot 4, so slot 5 must supply its own
//      leading connective (untuk / karena / demi / supaya / agar / sebagai).
//   6  reads after "...berakhir dengan " ("...ended with "), so it MUST be a
//      noun phrase, never a full clause.
//
// Everything is lowercase; capitalization is presentation, not content.

import type { PoolTextMap } from '../schema.js';

export const id: PoolTextMap = {
  // ── 0 · who ───────────────────────────────────────────────────────────────
  'who.grumpy-pirate': 'seorang bajak laut pemarah',
  'who.sleepy-llama': 'seekor llama yang sangat mengantuk',
  'who.confused-penguin': 'seekor pinguin kebingungan',
  'who.overconfident-raccoon': 'seekor rakun yang terlalu percaya diri',
  'who.tiny-dragon': 'naga terkecil di dunia',
  'who.cats-in-a-trench-coat': 'tiga ekor kucing dalam satu mantel panjang',
  'who.retired-superhero': 'seorang pahlawan super yang sudah pensiun',
  'who.skating-grandma': 'seorang nenek bersepatu roda',
  'who.time-traveling-accountant': 'seorang akuntan penjelajah waktu',
  'who.muddy-knight': 'seorang ksatria yang penuh lumpur',

  // ── 1 · withWhom — bare noun, no "bersama" (template supplies it) ─────────
  'with.haunted-toaster': 'pemanggang roti berhantu',
  'with.angry-geese': 'tiga ekor angsa yang marah',
  'with.philosophical-goldfish': 'seekor ikan mas yang gemar berfilsafat',
  'with.riddle-robot': 'robot yang hanya bicara dalam teka-teki',
  'with.professor-goat': 'seekor kambing bernama profesor keju',
  'with.lost-tourist': 'seorang turis yang sangat tersesat',
  'with.giant-snail': 'seekor siput raksasa yang riang',
  'with.tuba-frog': 'seekor katak pemain tuba',
  'with.talking-mailbox': 'kotak surat yang bisa bicara',
  'with.opera-walrus': 'seekor walrus penyanyi opera',

  // ── 2 · where — own preposition ────────────────────────────────────────────
  'where.cheese-factory': 'di dalam pabrik keju',
  'where.underwater-canyon': 'di dasar laut',
  'where.cookbook-library': 'di perpustakaan yang hanya berisi buku resep',
  'where.giant-sock-drawer': 'di dalam laci kaus kaki raksasa',
  'where.gloomy-birthday': 'di pesta ulang tahun yang sangat suram',
  'where.cramped-elevator': 'di dalam lift yang sangat sempit',
  'where.cloud-castle': 'di istana yang terbuat dari awan',
  'where.messy-kitchen': 'di dapur yang sangat berantakan',
  'where.snowy-mountain': 'di jalur gunung bersalju',
  'where.jungle-treehouse': 'di rumah pohon di tengah hutan',

  // ── 3 · when — own preposition/adverbial ───────────────────────────────────
  'when.small-earthquake': 'saat gempa kecil terjadi',
  'when.solar-eclipse': 'tepat pada saat gerhana matahari',
  'when.after-breakfast': 'tepat setelah sarapan tapi sebelum sarapan kedua',
  'when.someone-elses-wedding': 'saat pernikahan orang lain berlangsung',
  'when.wrong-feeling-tuesday': 'pada hari selasa yang terasa seperti rabu',
  'when.clocks-stopped': 'pada saat semua jam berhenti berdetak',
  'when.three-in-the-morning': 'pada pukul tiga pagi tanpa alasan jelas',
  'when.hat-festival': 'saat festival topi tahunan berlangsung',
  'when.internet-outage': 'saat internet sedang mati',
  'when.seagull-decision': 'saat seekor camar mengambil keputusan',
  'when.last-day-of-summer': 'pada hari terakhir musim panas',
  'when.thunderstorm': 'di tengah badai petir',
  'when.first-snow': 'pada pagi turunnya salju pertama',
  'when.school-holidays': 'di pertengahan libur sekolah',
  'when.full-moon': 'di bawah purnama yang sangat terang',
  'when.power-cut': 'saat listrik seluruh kota padam',
  'when.just-before-dinner': 'lima menit sebelum makan malam',
  'when.longest-lesson': 'saat pelajaran terpanjang tahun itu',
  'when.day-before-birthday': 'sehari sebelum ulang tahun seseorang',
  'when.rush-hour': 'pada puncak jam sibuk',
  'when.while-everyone-slept': 'saat semua orang lain sedang tidur',
  'when.exactly-noon': 'tepat pada tengah hari',

  // ── 4 · did — active verb phrase ─────────────────────────────────────────────
  'did.baking-giant-cake': 'memanggang kue raksasa yang miring',
  'did.juggling-pancakes': 'menyulap setumpuk tinggi panekuk',
  'did.painting-polka-dots': 'melukis motif polkadot di setiap dinding',
  'did.sorting-clouds': 'menyusun ulang awan berdasarkan ukurannya',
  'did.dancing-tango': 'menari tango yang sangat dramatis',
  'did.stacking-chairs': 'membangun menara kursi yang goyah',
  'did.staring-contest': 'mengadakan lomba saling menatap tanpa berkedip',
  'did.flying-kites': 'menerbangkan layang-layang raksasa dengan benang kusut',
  'did.eating-spaghetti': 'memakan setumpuk besar spageti',
  'did.digging-with-spoons': 'menggali lubang raksasa dengan sendok kecil',

  // ── 5 · why — own leading connective ────────────────────────────────────────
  'why.made-sense-then': 'karena alasan yang saat itu terasa masuk akal',
  'why.impress-a-pigeon': 'untuk membuat seekor merpati terkesan',
  'why.warranty-forbade-it': 'karena kartu garansinya melarang',
  'why.one-grape': 'demi sebutir anggur',
  'why.never-back-down': 'karena mereka tidak pernah mundur dari tantangan',
  'why.pointless-point': 'untuk membuktikan hal yang tak ada yang tanya',
  'why.for-science': 'demi ilmu pengetahuan, mungkin',
  'why.pure-stubbornness': 'karena kekeras-kepalaan semata',
  'why.horoscope-said-so': 'karena ramalan bintangnya sangat spesifik',
  'why.bet-with-themselves': 'untuk menyelesaikan taruhan dengan diri sendiri',
  'why.to-keep-warm': 'untuk tetap hangat',
  'why.because-tuesday': 'karena hari itu hari selasa',
  'why.for-a-sticker': 'demi sebuah stiker mengkilap',
  'why.avoid-homework': 'untuk menghindari mengerjakan pekerjaan rumah',
  'why.everyone-else-did': 'karena semua orang lain melakukannya',
  'why.world-record': 'untuk memecahkan rekor dunia yang tak seorang pun tahu',
  'why.simply-hungry': 'karena mereka sangat lapar',
  'why.impress-grandma': 'untuk membuat seorang nenek terkesan, sia-sia',
  'why.forgot-the-plan': 'karena mereka lupa rencana semula',
  'why.instructions-said-so': 'karena begitulah yang tertulis di petunjuk',
  'why.test-a-theory': 'untuk menguji sebuah teori tentang gravitasi',
  'why.no-reason': 'tanpa alasan sama sekali',

  // ── 6 · ending — noun phrase after "berakhir dengan" ──────────────────────────
  'end.feelings-about-pasta': 'perasaan mendalam semua orang tentang pasta',
  'end.duck-complaint': 'sepucuk surat keluhan resmi dari seekor bebek',
  'end.nothing-made-sense': 'kebingungan total yang justru membuat semua orang senang',
  'end.lost-receipts': 'hilangnya semua struk, yang mungkin lebih baik begitu',
  'end.pigeon-certificates': 'sertifikat penghargaan untuk beberapa ekor merpati',
  'end.fruit-basket': 'sekeranjang buah kiriman wali kota',
  'end.instant-sequel': 'pengumuman sekuel yang langsung menyusul',
  'end.three-country-holiday': 'status hari libur nasional di tiga negara',
  'end.cloud-looked-away': 'sebuah awan pengawas yang akhirnya berpaling',
  'end.never-spoke-again': 'kesepakatan diam-diam untuk tak pernah membahasnya lagi',
  'end.ice-cream-for-all': 'es krim untuk benar-benar semua orang',
  'end.someone-had-to-mop': 'tugas mengepel seluruh lantai untuk seseorang',
  'end.museum-exhibit': 'sebuah pajangan di balik kaca museum kecil',
  'end.a-song-about-it': 'sebuah lagu yang diciptakan tentang kejadian itu',
  'end.neighbors-applauded': 'tepuk tangan para tetangga dari jendela mereka',
  'end.smelled-like-lemons': 'aroma lemon samar selama seminggu penuh',
  'end.new-holiday-invented': 'sebuah hari libur baru yang diciptakan seketika',
  'end.cat-took-credit': 'seekor kucing lewat yang mengambil semua pujian',
  'end.everyone-fell-asleep': 'tidur bersama semua orang dalam satu tumpukan',
  'end.indoor-rainbow': 'sebuah pelangi dalam ruangan yang enggan pergi',
  'end.instructions-finally-clear': 'petunjuk yang akhirnya masuk akal sepenuhnya',
  'end.home-for-soup': 'kepulangan semua orang untuk makan sup',
};
