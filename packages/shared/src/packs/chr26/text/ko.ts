// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — Korean display texts (B-29), machine-drafted for
// Step 118 with B-29's brief.
// needs-ko-review — machine-translated stub awaiting native Korean review per CONTRIBUTING.md.
//
// Authored against the base Korean template and its per-slot rules, which
// pools/text/ko.ts sets out: "{3} {2}에서 {0}이(가) {1}와(과) {4} {5}. 결국,
// {6}(으)로 끝났다." — slots 0, 1 and 2 bare nouns (the template adds the
// particles), slot 4 a connective «-고» form, slot 5 the closing predicate
// («-려고 했다», «-기 때문이다»), slot 6 a noun phrase.
//
// A local gloss, not a translation (B-29): the presents come from 산타
// 할아버지, the night is 크리스마스이브, the songs 캐럴, the treat a slice
// of Christmas cake.

import type { PoolTextMap } from '../../../pools/schema.js';

export const ko: PoolTextMap = {
  // ── 0 · who — bare noun ──────────────────────────────────────────────────
  'who.chr26-reindeer': '크리스마스 스웨터를 입은 순록',
  'who.chr26-snowman': '줄무늬 목도리를 두른 눈사람',
  'who.chr26-gingerbread-man': '진저브레드맨',
  'who.chr26-polar-bear': '스케이트를 신은 북극곰',
  'who.chr26-nutcracker': '나무로 된 호두까기 인형',

  // ── 1 · withWhom — bare noun ─────────────────────────────────────────────
  'with.chr26-grumpy-cat': '방울 모자를 쓴 심술궂은 고양이',
  'with.chr26-sleeping-snow-maiden': '잠든 눈 아가씨',
  'with.chr26-winter-bird': '통통한 울새',
  'with.chr26-gnome': '커다란 고깔모자를 쓴 꼬마 요정',
  'with.chr26-cocoa-mug': '핫코코아가 담긴 거대한 머그잔',

  // ── 2 · where — bare noun, the template adds 에서 ─────────────────────────
  'where.chr26-snowy-square': '눈 덮인 크리스마스 마켓',
  'where.chr26-living-room': '벽난로가 있는 아늑한 거실',
  'where.chr26-festive-table': '케이크와 과일이 가득한 파티 식탁',
  'where.chr26-frozen-pond': '숲속의 꽁꽁 언 연못',
  'where.chr26-film-studio': '크리스마스 영화를 찍는 촬영장',

  // ── 3 · when ─────────────────────────────────────────────────────────────
  'when.chr26-waiting-for-presents': '선물을 기다리는 동안',
  'when.chr26-before-the-guests': '손님들이 오기 한 시간 전',
  'when.chr26-the-big-night': '크리스마스이브 밤에',
  'when.chr26-midnight-bells': '자정을 알리는 종이 울릴 때',
  'when.chr26-morning-after': '파티가 끝난 다음 날 아침',

  // ── 4 · did — connective «-고» ───────────────────────────────────────────
  'did.chr26-decorating-tree': '트리에 장식 공을 너무 많이 달고',
  'did.chr26-wrapping-presents': '울퉁불퉁한 선물 하나를 테이프 한 롤로 다 감고',
  'did.chr26-snowball-fight': '엄청난 눈싸움을 벌이고',
  'did.chr26-watching-tv': '거미줄투성이 TV로 크리스마스 영화를 보고',
  'did.chr26-singing': '목청껏 캐럴을 부르고',

  // ── 5 · why — closing predicate ──────────────────────────────────────────
  'why.chr26-nice-list': '산타 할아버지의 착한 아이 명단에 남으려고 했다',
  'why.chr26-one-more-treat': '크리스마스 케이크 한 조각을 더 먹으려고 했다',
  'why.chr26-secret-wish': '비밀 소원이 이루어지길 바랐다',
  'why.chr26-beat-the-neighbors': '이웃집 장식을 이기려고 했다',
  'why.chr26-family-tradition': '할머니가 가족 전통이라고 했기 때문이다',

  // ── 6 · ending — noun phrase before «(으)로 끝났다» ──────────────────────
  'end.chr26-wrapping-paper': '모든 것을 덮어 버린 포장지 산',
  'end.chr26-tangled-lights': '모든 것이 뒤엉킨 끝없는 전구 줄',
  'end.chr26-toppled-tree': '아주 천천히 쓰러진 크리스마스트리',
  'end.chr26-empty-sack': '빈 자루와 산타 할아버지의 정중한 편지',
  'end.chr26-melted-snowman': '웅덩이에 남은 눈사람의 당근',
};
