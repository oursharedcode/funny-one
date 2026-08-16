// SPDX-License-Identifier: AGPL-3.0-only

// Japanese pool display texts — machine-drafted for T-6.3 (FM-POOL-2/5).
// needs-ja-review — machine-translated stub awaiting native Japanese review per CONTRIBUTING.md.
//
// Authored against the Japanese prose template:
//   "{3}{2}で{0}は{1}と{4}{5}。最終的に、{6}で終わった。"
//
// Per-slot authoring rules that fall out of that template:
//
//   0  bare noun phrase — the template appends は (topic particle) directly
//      after it, e.g. "気難しい海賊" + は.
//   1  bare noun phrase — the template appends と (with) directly after it,
//      e.g. "呪われたトースター" + と.
//   2  bare location noun phrase — the template appends で (at/in) directly
//      after it. No leading preposition of its own.
//   3  a short temporal phrase that is concatenated with NO separator
//      directly in front of slot 2 (then で follows slot 2). Kept short and
//      ending in a noun/に/中/間/頃 form so it doesn't grammatically clash
//      when immediately followed by the slot-2 noun, e.g.
//      "小さな地震が起きている間" + "チーズ工場" + で.
//   4  conjunctive/て-form verb phrase that flows directly (no separator)
//      into slot 5 and on into "。最終的に", e.g. "巨大な傾いたケーキを焼いて".
//   5  ends the sentence in plain past/だ form, directly appended after
//      slot 4 with no separator, e.g. "鳩に感銘を与えようとした".
//   6  a NOUN PHRASE (not a full clause) — the template appends で終わった
//      ("ended with/in ...") directly after it.
//
// Machine-draft quality: reasonable, understandable Japanese per slot is the
// bar; perfect natural fusion across slot boundaries is left to native review.

import type { PoolTextMap } from '../schema.js';

export const ja: PoolTextMap = {
  // ── 0 · who — bare noun, は supplied by template ─────────────────────────
  'who.grumpy-pirate': '気難しい海賊',
  'who.sleepy-llama': 'とても眠そうなラマ',
  'who.confused-penguin': '困惑したペンギン',
  'who.overconfident-raccoon': '自信過剰なアライグマ',
  'who.tiny-dragon': '世界最小のドラゴン',
  'who.cats-in-a-trench-coat': 'トレンチコートを着た三匹の猫',
  'who.retired-superhero': '引退したスーパーヒーロー',
  'who.skating-grandma': 'ローラースケートに乗ったおばあちゃん',
  'who.time-traveling-accountant': 'タイムトラベルする会計士',
  'who.muddy-knight': '泥だらけの騎士',

  // ── 1 · withWhom — bare noun, と supplied by template ────────────────────
  'with.haunted-toaster': '呪われたトースター',
  'with.angry-geese': '三羽の怒ったガチョウ',
  'with.philosophical-goldfish': '哲学的な金魚',
  'with.riddle-robot': 'なぞなぞしか話さないロボット',
  'with.professor-goat': '「チーズ教授」という名のヤギ',
  'with.lost-tourist': 'とても道に迷った観光客',
  'with.giant-snail': '陽気な巨大カタツムリ',
  'with.tuba-frog': 'チューバを持つカエル',
  'with.talking-mailbox': 'しゃべる郵便受け',
  'with.opera-walrus': 'オペラを歌うセイウチ',

  // ── 2 · where — bare noun, で supplied by template ───────────────────────
  'where.cheese-factory': 'チーズ工場',
  'where.underwater-canyon': '海の底',
  'where.cookbook-library': '料理本しかない図書館',
  'where.giant-sock-drawer': '巨大な靴下の引き出しの中',
  'where.gloomy-birthday': 'とても陰気な誕生日パーティー',
  'where.cramped-elevator': '極めて狭いエレベーターの中',
  'where.cloud-castle': '雲でできた城',
  'where.messy-kitchen': '驚くほど散らかったキッチン',
  'where.snowy-mountain': '雪山の峠',
  'where.jungle-treehouse': 'ジャングルのツリーハウス',

  // ── 3 · when — flows directly into slot 2 (see header) ───────────────────
  'when.small-earthquake': '小さな地震が起きている間',
  'when.solar-eclipse': '皆既日食のまさにその瞬間',
  'when.after-breakfast': '朝食のすぐ後、二度目の朝食の前',
  'when.someone-elses-wedding': '他人の結婚式の最中',
  'when.wrong-feeling-tuesday': 'まるで水曜日のように感じられた火曜日',
  'when.clocks-stopped': 'すべての時計が止まった瞬間',
  'when.three-in-the-morning': '特に理由もなく朝の三時',
  'when.hat-festival': '毎年恒例の帽子祭りの最中',
  'when.internet-outage': 'インターネットが止まっている間',
  'when.seagull-decision': 'カモメが決断を下した瞬間',
  'when.last-day-of-summer': '夏の最終日',
  'when.thunderstorm': '雷雨の真っ最中',
  'when.first-snow': '初雪の降った朝',
  'when.school-holidays': '学校の休みの真ん中頃',
  'when.full-moon': '満月の下',
  'when.power-cut': '街全体の停電中',
  'when.just-before-dinner': '夕食の五分前',
  'when.longest-lesson': '一年で一番長い授業中',
  'when.day-before-birthday': '誰かの誕生日の前日',
  'when.rush-hour': 'ラッシュアワーの真っ只中',
  'when.while-everyone-slept': 'みんなが眠っている間',
  'when.exactly-noon': 'ちょうど正午',

  // ── 4 · did — conjunctive/て-form, flows into slot 5 ─────────────────────
  'did.baking-giant-cake': '巨大な傾いたケーキを焼いて',
  'did.juggling-pancakes': '高く積まれたパンケーキをジャグリングして',
  'did.painting-polka-dots': 'すべての壁に水玉模様を描いて',
  'did.sorting-clouds': '雲を大きさ順に並べ替えて',
  'did.dancing-tango': 'とても劇的なタンゴを踊って',
  'did.stacking-chairs': 'ぐらぐらの椅子の塔を作って',
  'did.staring-contest': '白熱したにらめっこ大会を開いて',
  'did.flying-kites': '絡まった糸で巨大な凧を揚げて',
  'did.eating-spaghetti': '山盛りのスパゲッティを食べて',
  'did.digging-with-spoons': '小さなスプーンで巨大な穴を掘って',

  // ── 5 · why — ends the sentence in plain past ────────────────────────────
  'why.made-sense-then': '当時はそれで筋が通っていると思った',
  'why.impress-a-pigeon': '鳩に感銘を与えようとした',
  'why.warranty-forbade-it': '保証書がそれを禁止していたからだ',
  'why.one-grape': 'ブドウ一粒と引き換えにそうした',
  'why.never-back-down': '挑戦から絶対に引き下がらない性格だったからだ',
  'why.pointless-point': '誰も聞いていない主張を証明しようとした',
  'why.for-science': 'おそらく科学のためだった',
  'why.pure-stubbornness': '純粋な意地からそうした',
  'why.horoscope-said-so': '星占いがとても具体的だったからだ',
  'why.bet-with-themselves': '自分自身との賭けに決着をつけようとした',
  'why.to-keep-warm': '暖を取るためだった',
  'why.because-tuesday': 'その日が火曜日だったからだ',
  'why.for-a-sticker': 'ぴかぴかのシール一枚のためだった',
  'why.avoid-homework': '宿題を避けようとした',
  'why.everyone-else-did': 'みんながやっていたからだ',
  'why.world-record': '誰も聞いたことのない世界記録を破ろうとした',
  'why.simply-hungry': 'とてもお腹が空いていたからだ',
  'why.impress-grandma': '全く感心しなかった祖母を感心させようとした',
  'why.forgot-the-plan': '元々の計画を忘れてしまったからだ',
  'why.instructions-said-so': '説明書がそう主張していたからだ',
  'why.test-a-theory': '重力についての仮説を試そうとした',
  'why.no-reason': '特に理由もなくそうした',

  // ── 6 · ending — noun phrase, で終わった supplied by template ────────────
  'end.feelings-about-pasta': 'パスタに対する熱い思い入れ',
  'end.duck-complaint': 'アヒルによる正式な苦情',
  'end.nothing-made-sense': '意味不明でもみんなが満足している状況',
  'end.lost-receipts': 'おそらく好都合だった領収書の紛失',
  'end.pigeon-certificates': '数羽の鳩への表彰状授与',
  'end.fruit-basket': '市長からのフルーツバスケット',
  'end.instant-sequel': '続編の即時発表',
  'end.three-country-holiday': '三か国での祝日認定',
  'end.cloud-looked-away': 'ずっと見ていた雲がついに目をそらす瞬間',
  'end.never-spoke-again': '二度とその話をしないという全員の合意',
  'end.ice-cream-for-all': '全員分のアイスクリーム',
  'end.someone-had-to-mop': '床全体のモップ掛け',
  'end.museum-exhibit': '小さな博物館のガラスケースの中',
  'end.a-song-about-it': 'その出来事についての一曲',
  'end.neighbors-applauded': '窓から拍手する近所の人々',
  'end.smelled-like-lemons': '一週間続いたほのかなレモンの香り',
  'end.new-holiday-invented': 'その場で作られた新しい祝日',
  'end.cat-took-credit': 'すべての手柄を持っていった通りすがりの猫',
  'end.everyone-fell-asleep': '折り重なって眠る全員',
  'end.indoor-rainbow': '室内に現れて消えない虹',
  'end.instructions-finally-clear': 'ついに完全に理解できた説明書',
  'end.home-for-soup': 'スープを食べに帰る全員',
};
