// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — Japanese display texts (B-29), machine-drafted for
// Step 118 with B-29's brief.
// needs-ja-review — machine-translated stub awaiting native Japanese review per CONTRIBUTING.md.
//
// Authored against the base Japanese template and its per-slot rules, which
// pools/text/ja.ts sets out: "{3}{2}で{0}は{1}と{4}{5}。最終的に、{6}で終わった。"
// — slot 3 joined straight onto slot 2, slot 2 a bare place (the template
// adds で), slot 4 a て-form, slot 5 ending the sentence, slot 6 a noun phrase.
//
// A local gloss, not a translation (B-29): the presents come from サンタさん,
// the night is クリスマスイブ, the treat a slice of クリスマスケーキ.

import type { PoolTextMap } from '../../../pools/schema.js';

export const ja: PoolTextMap = {
  // ── 0 · who ──────────────────────────────────────────────────────────────
  'who.chr26-reindeer': 'クリスマスセーターを着たトナカイ',
  'who.chr26-snowman': 'しましまのマフラーをした雪だるま',
  'who.chr26-gingerbread-man': 'ジンジャーブレッドマン',
  'who.chr26-polar-bear': 'スケート靴をはいたシロクマ',
  'who.chr26-nutcracker': '木のくるみ割り人形',

  // ── 1 · withWhom — the template adds と ─────────────────────────────────
  'with.chr26-grumpy-cat': 'ボンボン帽子をかぶった不機嫌な猫',
  'with.chr26-sleeping-snow-maiden': '眠っている雪娘',
  'with.chr26-winter-bird': 'まるまるとしたコマドリ',
  'with.chr26-gnome': '大きなとんがり帽子の小人',
  'with.chr26-cocoa-mug': 'マシュマロ山盛りの特大ココア',

  // ── 2 · where — bare place, the template adds で ────────────────────────
  'where.chr26-snowy-square': '雪のクリスマスマーケット',
  'where.chr26-living-room': '暖炉のある居心地のいいリビング',
  'where.chr26-festive-table': 'ごちそうの並んだテーブル',
  'where.chr26-frozen-pond': '森の凍った池',
  'where.chr26-film-studio': 'クリスマス映画の撮影スタジオ',

  // ── 3 · when — joined straight onto slot 2 ──────────────────────────────
  'when.chr26-waiting-for-presents': 'プレゼントを待つ間',
  'when.chr26-before-the-guests': 'お客さんが来る一時間前に',
  'when.chr26-the-big-night': 'クリスマスイブの夜に',
  'when.chr26-midnight-bells': '真夜中の鐘が鳴る頃',
  'when.chr26-morning-after': 'ごちそうの翌朝に',

  // ── 4 · did — て-form ────────────────────────────────────────────────────
  'did.chr26-decorating-tree': 'ツリーにオーナメントを飾りすぎて',
  'did.chr26-wrapping-presents': 'でこぼこのプレゼントをテープ一巻きで包んで',
  'did.chr26-snowball-fight': '激しい雪合戦をして',
  'did.chr26-watching-tv': 'クモの巣だらけのテレビでクリスマス映画を見て',
  'did.chr26-singing': '大声でクリスマスソングを歌って',

  // ── 5 · why — ends the sentence ─────────────────────────────────────────
  'why.chr26-nice-list': 'サンタさんのいい子リストに残ろうとした',
  'why.chr26-one-more-treat': 'クリスマスケーキをもう一切れ食べたかったからだ',
  'why.chr26-secret-wish': '秘密の願いをかなえようとした',
  'why.chr26-beat-the-neighbors': 'お隣さんの飾りに勝とうとした',
  'why.chr26-family-tradition': 'おばあちゃんが家族の伝統だと言ったからだ',

  // ── 6 · ending — noun phrase before «で終わった» ────────────────────────
  'end.chr26-wrapping-paper': '何もかもを埋め尽くした包み紙の山',
  'end.chr26-tangled-lights': '何もかもが絡まった果てしない電飾',
  'end.chr26-toppled-tree': 'ものすごくゆっくり倒れたツリー',
  'end.chr26-empty-sack': '空っぽの袋とサンタさんの丁寧な手紙',
  'end.chr26-melted-snowman': '水たまりに残った雪だるまのニンジン',
};
