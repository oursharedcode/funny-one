// SPDX-License-Identifier: AGPL-3.0-only

// Korean pool display texts — machine-drafted for T-6.3 (FM-POOL-2/5).
// needs-ko-review — machine-translated stub awaiting native Korean review per CONTRIBUTING.md.
//
// Authored against the Korean prose template:
//   "{3} {2}에서 {0}이(가) {1}와(과) {4} {5}. 결국, {6}(으)로 끝났다."
//
// Per-slot authoring rules that fall out of that template:
//
//   0  bare noun — the template appends the subject particle 이(가) (both
//      forms are hardcoded together since the template can't pick the right
//      one for a given noun; that's a known limitation of the source
//      template, not fixed here), e.g. "심술궂은 해적".
//   1  bare noun — the template appends 와(과) ("with", both forms
//      hardcoded the same way), e.g. "저주받은 토스터".
//   2  bare location noun — the template appends 에서 ("at/in"), so no
//      postposition belongs in the text itself, e.g. "치즈 공장".
//   3  stands alone before slot 2, its own complete temporal phrase.
//   4  and 5 are joined by a single space, but Korean is verb-final: slot 4
//      must be a connective form (-하고/-며/etc. or a noun-object phrase)
//      that leads into slot 5, and slot 5 is the sentence's real predicate,
//      closing in plain past tense (-았다/-었다). e.g. slot 4
//      "거대하고 비뚤어진 케이크를 굽고", slot 5
//      "비둘기에게 깊은 인상을 주려고 했다".
//   6  bare noun phrase — the template appends (으)로 끝났다
//      ("ended as/with"), e.g. "파스타에 대한 뜨거운 논쟁".
//
// This is machine-draft quality: reasonable, understandable Korean per slot
// is the bar, not perfect natural fusion across slot boundaries.

import type { PoolTextMap } from '../schema.js';

export const ko: PoolTextMap = {
  // ── 0 · who — bare noun, 이(가) supplied by template ──────────────────────
  'who.grumpy-pirate': '심술궂은 해적',
  'who.sleepy-llama': '아주 졸린 라마',
  'who.confused-penguin': '혼란스러운 펭귄',
  'who.overconfident-raccoon': '자신만만한 너구리',
  'who.tiny-dragon': '세상에서 가장 작은 용',
  'who.cats-in-a-trench-coat': '트렌치코트를 입은 고양이 세 마리',
  'who.retired-superhero': '은퇴한 슈퍼히어로',
  'who.skating-grandma': '롤러스케이트를 탄 할머니',
  'who.time-traveling-accountant': '시간여행을 하는 회계사',
  'who.muddy-knight': '온몸이 진흙투성이인 기사',

  // ── 1 · withWhom — bare noun, 와(과) supplied by template ─────────────────
  'with.haunted-toaster': '저주받은 토스터',
  'with.angry-geese': '화난 거위 세 마리',
  'with.philosophical-goldfish': '철학적인 금붕어',
  'with.riddle-robot': '수수께끼로만 말하는 로봇',
  'with.professor-goat': '치즈 교수라는 이름의 염소',
  'with.lost-tourist': '완전히 길을 잃은 관광객',
  'with.giant-snail': '거대하고 유쾌한 달팽이',
  'with.tuba-frog': '튜바를 부는 개구리',
  'with.talking-mailbox': '말하는 우편함',
  'with.opera-walrus': '오페라를 부르는 바다코끼리',

  // ── 2 · where — bare noun, 에서 supplied by template ───────────────────────
  'where.cheese-factory': '치즈 공장',
  'where.underwater-canyon': '깊은 바다 밑바닥',
  'where.cookbook-library': '요리책만 있는 도서관',
  'where.giant-sock-drawer': '거대한 양말 서랍',
  'where.gloomy-birthday': '아주 우울한 생일 파티',
  'where.cramped-elevator': '몹시 비좁은 엘리베이터',
  'where.cloud-castle': '구름으로 된 성',
  'where.messy-kitchen': '엄청나게 어질러진 주방',
  'where.snowy-mountain': '눈 덮인 산길',
  'where.jungle-treehouse': '정글의 나무 위 오두막',

  // ── 3 · when — standalone temporal phrase ─────────────────────────────────
  'when.small-earthquake': '작은 지진이 일어나는 동안',
  'when.solar-eclipse': '일식이 일어나던 바로 그 순간',
  'when.after-breakfast': '아침 식사 직후, 두 번째 아침 식사 전에',
  'when.someone-elses-wedding': '남의 결혼식이 열리는 도중에',
  'when.wrong-feeling-tuesday': '수요일처럼 느껴지던 화요일에',
  'when.clocks-stopped': '모든 시계가 멈춘 바로 그 순간',
  'when.three-in-the-morning': '딱히 이유 없이 새벽 세 시에',
  'when.hat-festival': '연례 모자 축제 기간에',
  'when.internet-outage': '인터넷이 끊긴 동안',
  'when.seagull-decision': '갈매기가 결정을 내린 그 순간',
  'when.last-day-of-summer': '여름의 마지막 날에',
  'when.thunderstorm': '천둥번개가 몰아치는 한가운데',
  'when.first-snow': '첫눈이 내린 아침에',
  'when.school-holidays': '방학이 한창일 때',
  'when.full-moon': '보름달이 아주 환하게 뜬 밤에',
  'when.power-cut': '도시 전체에 정전이 일어난 동안',
  'when.just-before-dinner': '저녁 식사 오 분 전에',
  'when.longest-lesson': '그해 가장 긴 수업 시간에',
  'when.day-before-birthday': '누군가의 생일 하루 전날에',
  'when.rush-hour': '러시아워가 절정일 때',
  'when.while-everyone-slept': '다들 잠들어 있는 동안',
  'when.exactly-noon': '정확히 정오에',

  // ── 4 · did — connective form, flows into slot 5 ───────────────────────────
  'did.baking-giant-cake': '거대하고 비뚤어진 케이크를 굽고',
  'did.juggling-pancakes': '높이 쌓은 팬케이크로 저글링을 하고',
  'did.painting-polka-dots': '벽마다 물방울무늬를 그리고',
  'did.sorting-clouds': '구름을 크기별로 정리하고',
  'did.dancing-tango': '아주 격정적인 탱고를 추고',
  'did.stacking-chairs': '의자로 흔들거리는 탑을 쌓고',
  'did.staring-contest': '진지하게 눈싸움 대결을 벌이고',
  'did.flying-kites': '줄이 잔뜩 엉킨 커다란 연들을 날리고',
  'did.eating-spaghetti': '스파게티를 산더미처럼 먹고',
  'did.digging-with-spoons': '작은 숟가락으로 커다란 구덩이를 파고',

  // ── 5 · why — ends the sentence in plain past ──────────────────────────────
  'why.made-sense-then': '그때는 그것이 이치에 맞다고 생각했다',
  'why.impress-a-pigeon': '비둘기에게 깊은 인상을 주려고 했다',
  'why.warranty-forbade-it': '보증서에 하지 말라고 적혀 있었기 때문이다',
  'why.one-grape': '포도 한 알을 받기로 하고 그렇게 했다',
  'why.never-back-down': '내기에서 절대 물러서지 않기 때문이다',
  'why.pointless-point': '아무도 궁금해하지 않는 것을 증명하려고 했다',
  'why.for-science': '아마도 과학을 위해서였다',
  'why.pure-stubbornness': '순전한 고집 때문이었다',
  'why.horoscope-said-so': '운세가 아주 구체적으로 그렇게 말했기 때문이다',
  'why.bet-with-themselves': '스스로와 한 내기를 해결하려고 했다',
  'why.to-keep-warm': '몸을 따뜻하게 하려고 했다',
  'why.because-tuesday': '화요일이었기 때문이다',
  'why.for-a-sticker': '반짝이는 스티커 하나를 얻으려고 했다',
  'why.avoid-homework': '숙제를 피하려고 했다',
  'why.everyone-else-did': '다른 모두가 그렇게 하고 있었기 때문이다',
  'why.world-record': '아무도 들어본 적 없는 세계 기록을 세우려고 했다',
  'why.simply-hungry': '그저 몹시 배가 고팠기 때문이다',
  'why.impress-grandma': '할머니에게 감동을 주려 했지만 소용없었다',
  'why.forgot-the-plan': '원래 계획을 잊어버렸기 때문이다',
  'why.instructions-said-so': '설명서가 그렇게 하라고 고집했기 때문이다',
  'why.test-a-theory': '중력에 관한 이론을 시험해 보려고 했다',
  'why.no-reason': '아무 이유 없이 그렇게 했다',

  // ── 6 · ending — bare noun phrase, (으)로 끝났다 supplied by template ─────────
  'end.feelings-about-pasta': '파스타에 대한 뜨거운 논쟁',
  'end.duck-complaint': '오리의 정식 항의',
  'end.nothing-made-sense': '아무것도 말이 안 됐지만 모두가 만족한 결말',
  'end.lost-receipts': '영수증 분실, 어쩌면 다행인 일',
  'end.pigeon-certificates': '비둘기들에게 수여된 상장',
  'end.fruit-basket': '시장이 보낸 과일 바구니',
  'end.instant-sequel': '곧바로 발표된 속편 소식',
  'end.three-country-holiday': '세 나라의 공휴일 지정',
  'end.cloud-looked-away': '지켜보던 구름이 마침내 고개를 돌린 순간',
  'end.never-spoke-again': '다시는 그 얘기를 하지 않기로 한 약속',
  'end.ice-cream-for-all': '모두를 위한 아이스크림 잔치',
  'end.someone-had-to-mop': '누군가가 바닥 전체를 닦아야 했던 일',
  'end.museum-exhibit': '작은 박물관 유리 진열장 속 전시품',
  'end.a-song-about-it': '그 일에 관해 만들어진 노래',
  'end.neighbors-applauded': '창문 너머로 박수를 보낸 이웃들',
  'end.smelled-like-lemons': '일주일간 레몬 향이 은은하게 남은 동네',
  'end.new-holiday-invented': '그 자리에서 만들어진 새로운 기념일',
  'end.cat-took-credit': '지나가던 고양이가 모든 공을 가져간 일',
  'end.everyone-fell-asleep': '다 함께 쓰러져 잠든 무더기',
  'end.indoor-rainbow': '실내에 나타나 떠나지 않는 무지개',
  'end.instructions-finally-clear': '드디어 완벽하게 이해된 설명서',
  'end.home-for-soup': '수프를 먹으러 다 함께 돌아간 집',
};
