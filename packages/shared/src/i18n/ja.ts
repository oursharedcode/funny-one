// SPDX-License-Identifier: AGPL-3.0-only

// Japanese — questions + prose template (design §9), promoted from
// apps/funny-multi-server/src/i18n/ja.json (T-FO-2.1).
//
// needs-ja-review — machine-translated stub awaiting native Japanese review per CONTRIBUTING.md.

import type { ServerI18n } from './types.js';
export const ja: ServerI18n = {
  questions: ['誰?', '誰と?', 'どこで?', 'いつ?', '何をした?', '何のために?', '最後はどうなった?'],
  prose: '{3}{2}で{0}は{1}と{4}{5}。最終的に、{6}で終わった。',
};
