// SPDX-License-Identifier: AGPL-3.0-only

// Chinese (Simplified) pool display texts — machine-drafted for T-6.3 (FM-POOL-2/5).
// needs-zh-review — machine-translated stub awaiting native Chinese review per CONTRIBUTING.md.
//
// Authored against the Chinese prose template:
//   "{3}，{0}{1}在{2}{4}{5}。最后，{6}。"
// i.e. "{3}, {0}{1} at {2} {4}{5}. Finally, {6}."
//
// Chinese has no tense conjugation, gender marking, or plural marking on
// verbs — grammatically the simplest of the pool languages — but the
// template concatenates several slots directly, with no separators, so word
// boundaries have to be built into the text itself:
//
//   0  who      — bare noun phrase, e.g. "一个暴躁的海盗"
//   1  withWhom — concatenated directly onto slot 0 ("{0}{1}"), so it MUST
//                 open with its own connector, "和" or "跟", e.g.
//                 "和一台闹鬼的烤面包机"
//   2  where    — the template hardcodes a leading "在", so slot 2 is a bare
//                 location noun phrase with no "在" of its own, e.g. "奶酪工厂"
//   3  when     — stands alone before the first comma; a complete,
//                 self-contained temporal phrase, e.g. "在一次小地震中"
//   4  did      — concatenated directly onto slot 5 ("{4}{5}"), so it must be
//                 a complete verb phrase (using 了 for completed aspect) that
//                 reads cleanly into slot 5, e.g. "烤了一个东倒西歪的大蛋糕"
//   5  why      — carries its own leading connector ("为了"/"因为"/"由于"),
//                 e.g. "为了给一只鸽子留下深刻印象"
//   6  ending   — a full clause following "最后，", e.g. "大家都对意面有了强烈的看法"

import type { PoolTextMap } from '../schema.js';

export const zh: PoolTextMap = {
  // ── 0 · who ───────────────────────────────────────────────────────────────
  'who.grumpy-pirate': '一个暴躁的海盗',
  'who.sleepy-llama': '一只非常瞌睡的羊驼',
  'who.confused-penguin': '一只困惑的企鹅',
  'who.overconfident-raccoon': '一只过度自信的浣熊',
  'who.tiny-dragon': '世界上最小的龙',
  'who.cats-in-a-trench-coat': '三只穿风衣的猫',
  'who.retired-superhero': '一位退休的超级英雄',
  'who.skating-grandma': '一位穿轮滑鞋的奶奶',
  'who.time-traveling-accountant': '一位穿越时空的会计',
  'who.muddy-knight': '一位浑身泥巴的骑士',

  // ── 1 · withWhom — leading 和/跟 (and/with) attached inline ─────────────────
  'with.haunted-toaster': '和一台闹鬼的烤面包机',
  'with.angry-geese': '和三只愤怒的鹅',
  'with.philosophical-goldfish': '和一条爱思考人生的金鱼',
  'with.riddle-robot': '和一个只会说谜语的机器人',
  'with.professor-goat': '和一只名叫芝士教授的山羊',
  'with.lost-tourist': '和一个迷路很久的游客',
  'with.giant-snail': '和一只巨大又开朗的蜗牛',
  'with.tuba-frog': '和一只吹大号的青蛙',
  'with.talking-mailbox': '和一个会说话的邮筒',
  'with.opera-walrus': '和一只会唱歌剧的海象',

  // ── 2 · where — bare noun, no "在" (template supplies it) ───────────────────
  'where.cheese-factory': '一家奶酪工厂里',
  'where.underwater-canyon': '海底最深处',
  'where.cookbook-library': '一家只收藏食谱的图书馆里',
  'where.giant-sock-drawer': '一个巨大的袜子抽屉里',
  'where.gloomy-birthday': '一场气氛低落的生日派对上',
  'where.cramped-elevator': '一部极其拥挤的电梯里',
  'where.cloud-castle': '一座云朵城堡里',
  'where.messy-kitchen': '一间乱得惊人的厨房里',
  'where.snowy-mountain': '一条积雪的山路上',
  'where.jungle-treehouse': '丛林里的一座树屋中',

  // ── 3 · when — standalone temporal phrase ────────────────────────────────────
  'when.small-earthquake': '在一次小地震中',
  'when.solar-eclipse': '在日全食发生的那一刻',
  'when.after-breakfast': '在吃完早饭、还没吃第二顿早饭之间',
  'when.someone-elses-wedding': '在别人的婚礼上',
  'when.wrong-feeling-tuesday': '在一个感觉像星期三的星期二',
  'when.clocks-stopped': '在所有时钟同时停摆的那一刻',
  'when.three-in-the-morning': '在凌晨三点、毫无缘由地',
  'when.hat-festival': '在一年一度的帽子节上',
  'when.internet-outage': '在网络中断的时候',
  'when.seagull-decision': '在一只海鸥做出重大决定的那一瞬间',
  'when.last-day-of-summer': '在夏天的最后一天',
  'when.thunderstorm': '在一场雷雨正猛的时候',
  'when.first-snow': '在初雪降下的那个早晨',
  'when.school-holidays': '在学校假期过了一半的时候',
  'when.full-moon': '在一轮满月之下',
  'when.power-cut': '在全城停电期间',
  'when.just-before-dinner': '在晚饭前五分钟',
  'when.longest-lesson': '在一年中最漫长的一堂课上',
  'when.day-before-birthday': '在某人生日的前一天',
  'when.rush-hour': '在交通高峰最拥堵的时候',
  'when.while-everyone-slept': '在所有人都睡着的时候',
  'when.exactly-noon': '在正午十二点整',

  // ── 4 · did — verb phrase flowing into slot 5 ─────────────────────────────────
  'did.baking-giant-cake': '烤了一个东倒西歪的大蛋糕',
  'did.juggling-pancakes': '玩起了一叠高高的煎饼杂耍',
  'did.painting-polka-dots': '把每面墙都画满了圆点',
  'did.sorting-clouds': '按大小重新整理了云朵',
  'did.dancing-tango': '跳了一支非常戏剧化的探戈',
  'did.stacking-chairs': '搭起了一座摇摇欲坠的椅子塔',
  'did.staring-contest': '进行了一场激烈的瞪眼比赛',
  'did.flying-kites': '放飞了几只线绕成一团的大风筝',
  'did.eating-spaghetti': '吃掉了一大堆意大利面',
  'did.digging-with-spoons': '用几把小勺子挖了一个大坑',

  // ── 5 · why — own leading connector ──────────────────────────────────────────
  'why.made-sense-then': '为了当时看起来合理的理由',
  'why.impress-a-pigeon': '为了给一只鸽子留下深刻印象',
  'why.warranty-forbade-it': '因为保修条款明令禁止',
  'why.one-grape': '为了换取一颗葡萄',
  'why.never-back-down': '因为他们从不认输',
  'why.pointless-point': '为了证明一个没人在意的观点',
  'why.for-science': '为了科学，大概吧',
  'why.pure-stubbornness': '纯粹出于固执',
  'why.horoscope-said-so': '因为星座运势说得非常具体',
  'why.bet-with-themselves': '为了赢下自己跟自己的赌注',
  'why.to-keep-warm': '为了取暖',
  'why.because-tuesday': '因为那天是星期二',
  'why.for-a-sticker': '为了一张闪亮的贴纸',
  'why.avoid-homework': '为了逃避写作业',
  'why.everyone-else-did': '因为其他人都这么做',
  'why.world-record': '为了打破一项没人听说过的世界纪录',
  'why.simply-hungry': '因为实在是饿坏了',
  'why.impress-grandma': '为了讨好一位始终不为所动的奶奶',
  'why.forgot-the-plan': '因为忘记了原本的计划',
  'why.instructions-said-so': '因为说明书就是这么写的',
  'why.test-a-theory': '为了验证一个关于重力的理论',
  'why.no-reason': '完全没有理由',

  // ── 6 · ending — full clause after "最后，" ──────────────────────────────────────
  'end.feelings-about-pasta': '大家都对意面有了强烈的看法',
  'end.duck-complaint': '一只鸭子正式提出了投诉',
  'end.nothing-made-sense': '一切都毫无道理，但大家都很开心',
  'end.lost-receipts': '收据全丢了，这或许是件好事',
  'end.pigeon-certificates': '好几只鸽子获得了荣誉证书',
  'end.fruit-basket': '市长送来了一篮水果',
  'end.instant-sequel': '续集立刻就被宣布了',
  'end.three-country-holiday': '这件事成了三个国家的法定假日',
  'end.cloud-looked-away': '一直在旁观的云朵终于转开了视线',
  'end.never-spoke-again': '大家都同意再也不提这件事',
  'end.ice-cream-for-all': '所有人都分到了冰淇淋',
  'end.someone-had-to-mop': '总得有人来拖干净整个地板',
  'end.museum-exhibit': '这东西最后被摆进了一家小博物馆的玻璃柜里',
  'end.a-song-about-it': '有人为这件事写了一首歌',
  'end.neighbors-applauded': '邻居们都在窗边鼓起了掌',
  'end.smelled-like-lemons': '接下来一整周到处都是柠檬味',
  'end.new-holiday-invented': '大家当场发明了一个新节日',
  'end.cat-took-credit': '一只路过的猫抢走了所有功劳',
  'end.everyone-fell-asleep': '所有人都挤成一堆睡着了',
  'end.indoor-rainbow': '屋里出现了一道彩虹，怎么都不肯离开',
  'end.instructions-finally-clear': '说明书终于说得通了',
  'end.home-for-soup': '大家都回家喝汤去了',
};
