// SPDX-License-Identifier: AGPL-3.0-only

// Korean — questions + prose template (design §9), promoted from
// apps/funny-multi-server/src/i18n/ko.json (T-FO-2.1).
//
// needs-ko-review — machine-translated stub awaiting native Korean review per CONTRIBUTING.md.

import type { ServerI18n } from './types.js';
export const ko: ServerI18n = {
  questions: [
    '누가?',
    '누구와?',
    '어디서?',
    '언제?',
    '무엇을 했나?',
    '무엇 때문에?',
    '어떻게 끝났나?',
  ],
  prose: '{3} {2}에서 {0}이(가) {1}와(과) {4} {5}. 결국, {6}(으)로 끝났다.',
};
