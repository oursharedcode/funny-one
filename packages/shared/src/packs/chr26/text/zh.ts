// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — Simplified Chinese display texts (B-29),
// machine-drafted for Step 118 with B-29's brief.
// needs-zh-review — machine-translated stub awaiting native Chinese review per CONTRIBUTING.md.
//
// Authored against the base Chinese template and its per-slot rules, which
// pools/text/zh.ts sets out: "{3}，{0}{1}在{2}{4}{5}。最后，{6}。" — slot 1
// opening with 和/跟, slot 2 a bare place with its own locative (the template
// adds 在), slot 4 a verb with 了 running straight into slot 5, slot 5 opening
// with 为了/因为, slot 6 a full clause; no text ends in punctuation.
//
// A local gloss, not a translation (B-29): the presents come from 圣诞老人,
// the night is 平安夜, and the treat a 平安果, the Christmas Eve apple.

import type { PoolTextMap } from '../../../pools/schema.js';

export const zh: PoolTextMap = {
  // ── 0 · who ──────────────────────────────────────────────────────────────
  'who.chr26-reindeer': '一头穿着圣诞毛衣的驯鹿',
  'who.chr26-snowman': '一个围着条纹围巾的雪人',
  'who.chr26-gingerbread-man': '一个姜饼人',
  'who.chr26-polar-bear': '一头穿着溜冰鞋的北极熊',
  'who.chr26-nutcracker': '一个木头胡桃夹子',

  // ── 1 · withWhom — opens with 和/跟 ────────────────────────────────────
  'with.chr26-grumpy-cat': '和一只戴绒球帽的暴躁猫咪',
  'with.chr26-sleeping-snow-maiden': '和一位熟睡的雪姑娘',
  'with.chr26-winter-bird': '和一只圆滚滚的知更鸟',
  'with.chr26-gnome': '和一个戴着巨大尖帽的小精灵',
  'with.chr26-cocoa-mug': '和一大杯热可可',

  // ── 2 · where — bare place, the template adds 在 ────────────────────────
  'where.chr26-snowy-square': '白雪覆盖的圣诞集市上',
  'where.chr26-living-room': '有壁炉的温馨客厅里',
  'where.chr26-festive-table': '摆满蛋糕和水果的节日餐桌旁',
  'where.chr26-frozen-pond': '林中结冰的池塘上',
  'where.chr26-film-studio': '正在拍圣诞电影的片场里',

  // ── 3 · when ─────────────────────────────────────────────────────────────
  'when.chr26-waiting-for-presents': '在等待礼物的时候',
  'when.chr26-before-the-guests': '在客人到来的一小时前',
  'when.chr26-the-big-night': '在平安夜',
  'when.chr26-midnight-bells': '在午夜钟声敲响时',
  'when.chr26-morning-after': '在大餐后的第二天早上',

  // ── 4 · did — with 了 ────────────────────────────────────────────────────
  'did.chr26-decorating-tree': '给圣诞树挂了太多彩球',
  'did.chr26-wrapping-presents': '用一整卷胶带包了一个歪歪扭扭的礼物',
  'did.chr26-snowball-fight': '打了一场激烈的雪仗',
  'did.chr26-watching-tv': '用布满蜘蛛网的电视看了一部圣诞电影',
  'did.chr26-singing': '扯着嗓子唱了圣诞歌',

  // ── 5 · why — opens with 为了/因为 ──────────────────────────────────────
  'why.chr26-nice-list': '为了留在圣诞老人的好孩子名单上',
  'why.chr26-one-more-treat': '为了再吃一个平安果',
  'why.chr26-secret-wish': '为了让秘密心愿成真',
  'why.chr26-beat-the-neighbors': '为了比邻居的装饰更漂亮',
  'why.chr26-family-tradition': '因为奶奶说这是家族传统',

  // ── 6 · ending — full clause ─────────────────────────────────────────────
  'end.chr26-wrapping-paper': '一切都消失在一大堆包装纸下面',
  'end.chr26-tangled-lights': '一切都缠进了一串没完没了的彩灯里',
  'end.chr26-toppled-tree': '圣诞树非常非常慢地倒下了',
  'end.chr26-empty-sack': '圣诞老人只留下一个空袋子和一封礼貌的信',
  'end.chr26-melted-snowman': '雪人只剩下水坑里的一根胡萝卜',
};
