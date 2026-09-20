// SPDX-License-Identifier: AGPL-3.0-only

// Ukrainian — questions + prose template (design §9), promoted from
// apps/funny-multi-server/src/i18n/uk.json (T-FO-2.1).
//
// needs-uk-review — machine-translated stub awaiting native Ukrainian review per CONTRIBUTING.md. Slot order mirrors Russian (time before place); slot-1 stand-ins carry their own 'з/зі' connective.

import type { ServerI18n } from './types.js';
export const uk: ServerI18n = {
  questions: [
    'Хто?',
    'Хто ще?',
    'Де?',
    'Коли?',
    'Що вони робили?',
    'Навіщо?',
    'Чим усе закінчилося?',
  ],
  prose: '{0} {1} {3} {2} {4} {5}. Зрештою {6}.',
};
