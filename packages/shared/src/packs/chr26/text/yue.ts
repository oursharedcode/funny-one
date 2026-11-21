// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — Cantonese display texts (B-29), machine-drafted for
// Step 118 with B-29's brief.
// needs-yue-review — machine-translated stub awaiting native Cantonese review per CONTRIBUTING.md.
//
// Authored against the base Cantonese template and its per-slot rules, which
// pools/text/yue.ts sets out: "{3}，{0}{1}喺{2}{4}，{5}。最後，{6}。" — slot 1
// opening with 同, slot 2 a bare place closed by its own locative (入面/度/
// 上面; the template adds 喺), slot 4 a completed verb (咗/晒), slot 5 opening
// with 為咗/因為, slot 6 a full clause; no text ends in punctuation.
//
// A local gloss, not a translation (B-29), in written Hong Kong Cantonese: the
// presents come from 聖誕老人, the night is 平安夜, the cocoa 熱朱古力, the
// baubles 波波, the gingerbread man a 薑餅人.

import type { PoolTextMap } from '../../../pools/schema.js';

export const yue: PoolTextMap = {
  // ── 0 · who ──────────────────────────────────────────────────────────────
  'who.chr26-reindeer': '一隻著住聖誕冷衫嘅馴鹿',
  'who.chr26-snowman': '一個攬住間條頸巾嘅雪人',
  'who.chr26-gingerbread-man': '一個薑餅人',
  'who.chr26-polar-bear': '一隻著住雪屐嘅北極熊',
  'who.chr26-nutcracker': '一個木頭胡桃夾子',

  // ── 1 · withWhom — opens with 同 ─────────────────────────────────────────
  'with.chr26-grumpy-cat': '同一隻戴住絨球帽嘅臭脾氣貓',
  'with.chr26-sleeping-snow-maiden': '同一個瞓著咗嘅雪姑娘',
  'with.chr26-winter-bird': '同一隻肥嘟嘟嘅知更鳥',
  'with.chr26-gnome': '同一個戴住巨型尖帽嘅小精靈',
  'with.chr26-cocoa-mug': '同一大杯熱朱古力',

  // ── 2 · where — bare place, the template adds 喺 ────────────────────────
  'where.chr26-snowy-square': '白雪蓋住嘅聖誕市集度',
  'where.chr26-living-room': '有壁爐嘅溫暖客廳入面',
  'where.chr26-festive-table': '擺滿蛋糕生果嘅節日餐枱邊',
  'where.chr26-frozen-pond': '樹林入面結咗冰嘅池塘上面',
  'where.chr26-film-studio': '拍緊聖誕電影嘅片場入面',

  // ── 3 · when ─────────────────────────────────────────────────────────────
  'when.chr26-waiting-for-presents': '等緊拆禮物嗰陣',
  'when.chr26-before-the-guests': '啲客人嚟到之前一個鐘頭',
  'when.chr26-the-big-night': '平安夜嗰晚',
  'when.chr26-midnight-bells': '午夜鐘聲響起嗰一刻',
  'when.chr26-morning-after': '食完大餐第二朝早',

  // ── 4 · did — completed (咗/晒) ──────────────────────────────────────────
  'did.chr26-decorating-tree': '幫聖誕樹掛咗太多波波',
  'did.chr26-wrapping-presents': '用成卷膠紙包咗份凹凹凸凸嘅禮物',
  'did.chr26-snowball-fight': '打咗場好激烈嘅雪仗',
  'did.chr26-watching-tv': '用部爆晒蜘蛛網嘅電視睇咗套聖誕片',
  'did.chr26-singing': '大大聲唱咗成晚聖誕歌',

  // ── 5 · why — opens with 為咗/因為 ──────────────────────────────────────
  'why.chr26-nice-list': '為咗留喺聖誕老人嘅乖仔名單上面',
  'why.chr26-one-more-treat': '為咗多食一件聖誕蛋糕',
  'why.chr26-secret-wish': '為咗個秘密願望成真',
  'why.chr26-beat-the-neighbors': '為咗啲裝飾要贏晒隔籬鄰舍',
  'why.chr26-family-tradition': '因為嫲嫲話呢個係家族傳統',

  // ── 6 · ending — full clause ─────────────────────────────────────────────
  'end.chr26-wrapping-paper': '所有嘢都埋咗喺一大堆包裝紙下面',
  'end.chr26-tangled-lights': '成條冇盡頭嘅燈串將所有嘢纏埋晒',
  'end.chr26-toppled-tree': '聖誕樹好慢好慢噉跌咗落嚟',
  'end.chr26-empty-sack': '聖誕老人淨係留低個空袋同一封好有禮貌嘅信',
  'end.chr26-melted-snowman': '雪人淨返水氹入面一條紅蘿蔔',
};
