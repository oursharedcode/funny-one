// SPDX-License-Identifier: AGPL-3.0-only

// Russian — questions + prose template (design §9), promoted from
// apps/funny-multi-server/src/i18n/ru.json (T-FO-2.1).

import type { ServerI18n } from './types.js';
export const ru: ServerI18n = {
  questions: [
    'Кто?',
    'Кто ещё?',
    'Где?',
    'Когда?',
    'Что они делали?',
    'Зачем?',
    'Чем всё закончилось?',
  ],
  prose: '{0} {1} {3} {2} {4} {5}. В итоге {6}.',
};
