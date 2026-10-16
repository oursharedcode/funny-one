// SPDX-License-Identifier: AGPL-3.0-only

// Cantonese (Hong Kong) pool display texts — machine-drafted for Step 73
// (FM-POOL-2/5), the same way T-6.3 drafted the other 13.
// needs-yue-review — machine-translated stub awaiting native Cantonese (Hong Kong) review per CONTRIBUTING.md.
//
// Written Cantonese (粵語白話文) in Traditional characters with Hong Kong
// vocabulary: 嘅/咗/唔/喺/冇/啲/畀, 𨋢 (lift), 多士爐, 班戟, 提子, 雪屐,
// 乾濕褸, 櫃桶, 匙羹, 生果, 雪糕, 街坊. Not standard written Chinese, and not
// a transliteration of zh.ts: every text is re-voiced in Cantonese.
//
// Authored against the Cantonese prose template:
//   "{3}，{0}{1}喺{2}{4}，{5}。最後，{6}。"
// i.e. "{3}, {0}{1} at {2} {4}, {5}. In the end, {6}."
//
// Like Mandarin, Cantonese marks no tense, gender or plural on the verb, and
// the template joins its slots with no spaces, so word boundaries and
// connectors live in the texts themselves:
//
//   0  who      — bare noun phrase with its measure word, e.g.
//                 "一個成日黑口黑面嘅海盜"
//   1  withWhom — concatenated straight onto slot 0 ("{0}{1}"), so it MUST open
//                 with its own "同" (with/and), e.g. "同一部猛鬼多士爐"
//   2  where    — the template hardcodes "喺" before it, so slot 2 is a bare
//                 place noun phrase with no "喺" of its own, closed by a
//                 locative (入面 / 度 / 上面 / 嗰度) so the verb in slot 4 can
//                 follow it directly, e.g. "一間芝士廠入面"
//   3  when     — opens the sentence and stands alone before the first "，";
//                 a self-contained time phrase, usually closed by 嗰陣 / 嗰一刻 /
//                 嗰日, e.g. "一場細細嘅地震嗰陣"
//   4  did      — completed verb phrase (咗 / 晒 / 過) running straight on from
//                 slot 2, ending before the template's "，", e.g.
//                 "焗咗個大大個、歪歪哋嘅蛋糕"
//   5  why      — follows that "，" as an afterthought and carries its own
//                 connector (為咗 / 因為 / 純粹因為 / 正正因為), e.g.
//                 "為咗博一隻白鴿歡心"
//   6  ending   — a full clause after "最後，", with no closing "。" (the
//                 template adds it), e.g. "個個都對意粉有好強烈嘅睇法"
//
// The subject is always two parties, so slot 5 and 6 texts say 佢哋 / 大家 /
// 個個, never a singular pronoun.

import type { PoolTextMap } from '../schema.js';

export const yue: PoolTextMap = {
  // ── 0 · who ───────────────────────────────────────────────────────────────
  'who.grumpy-pirate': '一個成日黑口黑面嘅海盜',
  'who.sleepy-llama': '一隻超級眼瞓嘅羊駝',
  'who.confused-penguin': '一隻一頭霧水嘅企鵝',
  'who.overconfident-raccoon': '一隻自信爆棚嘅浣熊',
  'who.tiny-dragon': '全世界最細隻嘅龍',
  'who.cats-in-a-trench-coat': '三隻一齊擠入一件乾濕褸嘅貓',
  'who.retired-superhero': '一個退咗休嘅超級英雄',
  'who.skating-grandma': '一個踩緊雪屐嘅婆婆',
  'who.time-traveling-accountant': '一個識穿越時空嘅會計師',
  'who.muddy-knight': '一個周身泥嘅騎士',

  // ── 1 · withWhom — opens with 同 (with/and) ──────────────────────────────────
  'with.haunted-toaster': '同一部猛鬼多士爐',
  'with.angry-geese': '同三隻嬲爆爆嘅鵝',
  'with.philosophical-goldfish': '同一條成日諗人生嘅金魚',
  'with.riddle-robot': '同一個淨係識講謎語嘅機械人',
  'with.professor-goat': '同一隻叫「芝士教授」嘅山羊',
  'with.lost-tourist': '同一個蕩失咗路好耐嘅遊客',
  'with.giant-snail': '同一隻超大隻又笑口常開嘅蝸牛',
  'with.tuba-frog': '同一隻吹緊大號嘅田雞',
  'with.talking-mailbox': '同一個識講嘢嘅郵筒',
  'with.opera-walrus': '同一隻識唱歌劇嘅海象',

  // ── 2 · where — bare place + locative, no 喺 (template supplies it) ──────────
  'where.cheese-factory': '一間芝士廠入面',
  'where.underwater-canyon': '海底最深嗰度',
  'where.cookbook-library': '一間淨係放食譜嘅圖書館入面',
  'where.giant-sock-drawer': '一個大到離譜嘅襪櫃桶入面',
  'where.gloomy-birthday': '一個死氣沉沉嘅生日派對度',
  'where.cramped-elevator': '一部迫到爆嘅𨋢入面',
  'where.cloud-castle': '一座用雲砌成嘅城堡入面',
  'where.messy-kitchen': '一間亂到七彩嘅廚房入面',
  'where.snowy-mountain': '一條積滿雪嘅山路上面',
  'where.jungle-treehouse': '熱帶雨林入面一間樹屋度',

  // ── 3 · when — self-contained time phrase, opens the sentence ────────────────
  'when.small-earthquake': '一場細細嘅地震嗰陣',
  'when.solar-eclipse': '日全食正正發生嗰一刻',
  'when.after-breakfast': '啱啱食完早餐、未食第二餐早餐之前',
  'when.someone-elses-wedding': '飲緊人哋喜酒嗰陣',
  'when.wrong-feeling-tuesday': '一個感覺好似禮拜三嘅禮拜二',
  'when.clocks-stopped': '所有鐘一齊停咗嗰一刻',
  'when.three-in-the-morning': '無啦啦喺凌晨三點',
  'when.hat-festival': '一年一度帽子節嗰日',
  'when.internet-outage': '全部人上唔到網嗰陣',
  'when.seagull-decision': '一隻海鷗做咗重大決定嗰一刻',
  'when.last-day-of-summer': '夏天最後一日',
  'when.thunderstorm': '行雷閃電落大雨嗰陣',
  'when.first-snow': '落第一場雪嗰朝',
  'when.school-holidays': '學校假期放到一半',
  'when.full-moon': '一個好圓好圓嘅月光底下',
  'when.power-cut': '全城停電嗰陣',
  'when.just-before-dinner': '食晚飯之前五分鐘',
  'when.longest-lesson': '上緊全年最長嗰一堂',
  'when.day-before-birthday': '某人生日嘅前一日',
  'when.rush-hour': '繁忙時間最迫嗰陣',
  'when.while-everyone-slept': '其他人個個瞓晒覺嗰陣',
  'when.exactly-noon': '中午十二點正',

  // ── 4 · did — completed verb phrase, straight on from slot 2 ─────────────────
  'did.baking-giant-cake': '焗咗個大大個、歪歪哋嘅蛋糕',
  'did.juggling-pancakes': '將一大疊班戟拋嚟拋去',
  'did.painting-polka-dots': '將每幅牆都畫滿晒波點',
  'did.sorting-clouds': '將啲雲由大到細重新排過',
  'did.dancing-tango': '跳咗一場超級誇張嘅探戈',
  'did.stacking-chairs': '用櫈疊咗座搖搖欲墜嘅高塔',
  'did.staring-contest': '玩咗場超緊張嘅瞪眼比賽',
  'did.flying-kites': '放咗幾隻線纏埋一嚿嘅大風箏',
  'did.eating-spaghetti': '食咗成座山咁多嘅意粉',
  'did.digging-with-spoons': '用幾隻細細嘅匙羹掘咗個大窿',

  // ── 5 · why — own connector, after the template's "，" ──────────────────────
  'why.made-sense-then': '因為嗰陣覺得好合理',
  'why.impress-a-pigeon': '為咗博一隻白鴿歡心',
  'why.warranty-forbade-it': '正正因為保用證寫明唔准',
  'why.one-grape': '為咗換一粒提子',
  'why.never-back-down': '因為有人話佢哋唔夠膽',
  'why.pointless-point': '為咗證明一樣冇人問過嘅嘢',
  'why.for-science': '為咗科學，大概啩',
  'why.pure-stubbornness': '純粹因為硬頸',
  'why.horoscope-said-so': '因為星座運程講得好仔細',
  'why.bet-with-themselves': '為咗贏返自己同自己打嘅賭',
  'why.to-keep-warm': '為咗取吓暖',
  'why.because-tuesday': '因為嗰日係禮拜二',
  'why.for-a-sticker': '為咗一張閃令令嘅貼紙',
  'why.avoid-homework': '為咗唔使做功課',
  'why.everyone-else-did': '因為個個都係噉做',
  'why.world-record': '為咗打破一個冇人聽過嘅世界紀錄',
  'why.simply-hungry': '因為佢哋實在餓到扁晒',
  'why.impress-grandma': '為咗討好一個點都唔收貨嘅婆婆',
  'why.forgot-the-plan': '因為佢哋唔記得咗原本嘅計劃',
  'why.instructions-said-so': '因為說明書堅持要噉做',
  'why.test-a-theory': '為咗驗證一個關於地心吸力嘅理論',
  'why.no-reason': '其實完全冇原因',

  // ── 6 · ending — full clause after "最後，" ──────────────────────────────────
  'end.feelings-about-pasta': '個個都對意粉有好強烈嘅睇法',
  'end.duck-complaint': '有隻鴨仔正式入咗投訴',
  'end.nothing-made-sense': '樣樣都唔合理，但係大家都覺得冇所謂',
  'end.lost-receipts': '啲收據唔見晒，可能仲好添',
  'end.pigeon-certificates': '好幾隻白鴿攞咗獎狀',
  'end.fruit-basket': '市長送咗個生果籃嚟',
  'end.instant-sequel': '續集即刻宣佈開拍',
  'end.three-country-holiday': '嗰日變咗三個國家嘅公眾假期',
  'end.cloud-looked-away': '一直睇住佢哋嗰嚿雲終於望咗去第二度',
  'end.never-spoke-again': '大家講好以後都唔好再提',
  'end.ice-cream-for-all': '個個都有雪糕食',
  'end.someone-had-to-mop': '始終要有人嚟拖成個地下',
  'end.museum-exhibit': '呢樣嘢畀人擺咗入一間細博物館嘅玻璃櫃',
  'end.a-song-about-it': '有人為成件事作咗首歌',
  'end.neighbors-applauded': '啲街坊喺窗口度拍晒手',
  'end.smelled-like-lemons': '成個禮拜周圍都有陣檸檬味',
  'end.new-holiday-invented': '大家即場發明咗個新節日',
  'end.cat-took-credit': '一隻路過嘅貓搶晒所有功勞',
  'end.everyone-fell-asleep': '個個擠埋一堆瞓晒覺',
  'end.indoor-rainbow': '屋入面出咗條彩虹，點趕都唔走',
  'end.instructions-finally-clear': '說明書終於講得通晒',
  'end.home-for-soup': '大家都返屋企飲湯',
};
