// SPDX-License-Identifier: AGPL-3.0-only

// Tamil — questions + prose template (design §9), promoted from
// apps/funny-multi-server/src/i18n/ta.json (T-FO-2.1).
//
// needs-ta-review — machine-translated stub awaiting native Tamil review per CONTRIBUTING.md. Tamil is verb-final, so the action slot {4} closes the first sentence; slot-1 stand-ins carry the '-உடன்' (with) suffix.

import type { ServerI18n } from './types.js';
export const ta: ServerI18n = {
  questions: [
    'யார்?',
    'வேறு யார்?',
    'எங்கே?',
    'எப்போது?',
    'அவர்கள் என்ன செய்தார்கள்?',
    'எதற்காக?',
    'கடைசியில் என்ன ஆனது?',
  ],
  prose: '{3} {2} {0} {1} {5} {4}. கடைசியில் {6}.',
};
