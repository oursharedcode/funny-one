// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — Indonesian display texts (B-29), machine-drafted
// for Step 118 with B-29's brief.
// needs-id-review — machine-translated stub awaiting native Indonesian review per CONTRIBUTING.md.
//
// Authored against the base Indonesian template and its per-slot rules, which
// pools/text/id.ts sets out: "{0} bersama {1} {3} {2} {4} {5}. Akhirnya,
// semuanya berakhir dengan {6}." — slot 1 with no "bersama", slots 2 and 3
// with their own prepositions, slot 4 an active verb, slot 5 opening with
// untuk/karena/demi/supaya/agar, slot 6 a noun phrase.
//
// A local gloss, not a translation (B-29): the presents come from Sinterklas,
// the treat is a kue nastar, the lights lampu kelap-kelip.

import type { PoolTextMap } from '../../../pools/schema.js';

export const id: PoolTextMap = {
  // ── 0 · who ──────────────────────────────────────────────────────────────
  'who.chr26-reindeer': 'seekor rusa kutub bersweter Natal',
  'who.chr26-snowman': 'seorang manusia salju bersyal belang',
  'who.chr26-gingerbread-man': 'seorang manusia roti jahe',
  'who.chr26-polar-bear': 'seekor beruang kutub bersepatu seluncur',
  'who.chr26-nutcracker': 'seorang prajurit kayu pemecah kenari',

  // ── 1 · withWhom — no "bersama", the template supplies it ────────────────
  'with.chr26-grumpy-cat': 'seekor kucing pemarah bertopi kupluk',
  'with.chr26-sleeping-snow-maiden': 'Gadis Salju yang sedang tidur',
  'with.chr26-winter-bird': 'seekor burung kecil gemuk berdada merah',
  'with.chr26-gnome': 'seorang kurcaci mungil bertopi kerucut raksasa',
  'with.chr26-cocoa-mug': 'secangkir besar cokelat panas',

  // ── 2 · where — its own preposition ──────────────────────────────────────
  'where.chr26-snowy-square': 'di alun-alun bersalju yang penuh kios',
  'where.chr26-living-room': 'di ruang keluarga yang hangat dekat perapian',
  'where.chr26-festive-table': 'di meja makan pesta yang penuh kue',
  'where.chr26-frozen-pond': 'di atas kolam beku di tengah hutan',
  'where.chr26-film-studio': 'di studio film saat syuting film Natal',

  // ── 3 · when — its own preposition, read before slot 2 ───────────────────
  'when.chr26-waiting-for-presents': 'sambil menunggu hadiah',
  'when.chr26-before-the-guests': 'sejam sebelum para tamu datang',
  'when.chr26-the-big-night': 'pada malam Natal',
  'when.chr26-midnight-bells': 'saat lonceng tengah malam berbunyi',
  'when.chr26-morning-after': 'pada pagi setelah pesta Natal',

  // ── 4 · did ──────────────────────────────────────────────────────────────
  'did.chr26-decorating-tree': 'memasang terlalu banyak bola hias di pohon',
  'did.chr26-wrapping-presents': 'membungkus satu kado penyok dengan segulung selotip',
  'did.chr26-snowball-fight': 'berperang bola salju habis-habisan',
  'did.chr26-watching-tv': 'menonton film Natal di TV penuh sarang laba-laba',
  'did.chr26-singing': 'menyanyikan lagu Natal sekeras-kerasnya',

  // ── 5 · why — opens with untuk/karena/demi/supaya/agar ───────────────────
  'why.chr26-nice-list': 'supaya tetap masuk daftar anak baik Sinterklas',
  'why.chr26-one-more-treat': 'demi satu kue nastar lagi',
  'why.chr26-secret-wish': 'agar keinginan rahasia terkabul',
  'why.chr26-beat-the-neighbors': 'untuk mengalahkan dekorasi tetangga',
  'why.chr26-family-tradition': 'karena kata nenek ini tradisi keluarga',

  // ── 6 · ending — noun phrase after "berakhir dengan" ─────────────────────
  'end.chr26-wrapping-paper': 'gunungan kertas kado yang mengubur segalanya',
  'end.chr26-tangled-lights': 'seuntai lampu kelap-kelip tanpa ujung yang membelit semuanya',
  'end.chr26-toppled-tree': 'pohon Natal yang roboh dengan sangat pelan',
  'end.chr26-empty-sack': 'karung kosong dan sepucuk surat sopan dari Sinterklas',
  'end.chr26-melted-snowman': 'sebatang wortel di genangan air, sisa manusia salju',
};
