// SPDX-License-Identifier: AGPL-3.0-only

// Mandarin Chinese — questions + prose template (design §9), promoted from
// apps/funny-multi-server/src/i18n/zh.json (T-FO-2.1).
//
// needs-zh-review — machine-translated stub awaiting native Mandarin Chinese review per CONTRIBUTING.md.

import type { ServerI18n } from './types.js';
export const zh: ServerI18n = {
  questions: [
    '谁?',
    '还有谁?',
    '在哪里?',
    '什么时候?',
    '他们做了什么?',
    '为了什么?',
    '最后怎么样了?',
  ],
  prose: '{3}，{0}{1}在{2}{4}{5}。最后，{6}。',
};
