// SPDX-License-Identifier: AGPL-3.0-only

// Hebrew — questions + prose template (design §9), promoted from
// apps/funny-multi-server/src/i18n/he.json (T-FO-2.1).
//
// needs-he-review — machine-translated stub awaiting native Hebrew review per CONTRIBUTING.md. Slot-1 stand-ins carry their own 'עם' connective, so the template joins slots 0 and 1 with a plain space.

import type { ServerI18n } from './types.js';
export const he: ServerI18n = {
  questions: ['מי?', 'ועם מי?', 'איפה?', 'מתי?', 'מה הם עשו?', 'בשביל מה?', 'איך זה נגמר?'],
  prose: '{0} {1} היו {2} {3}. הם {4} {5}. בסוף {6}.',
};
