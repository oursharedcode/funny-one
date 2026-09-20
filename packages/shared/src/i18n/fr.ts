// SPDX-License-Identifier: AGPL-3.0-only

// French — questions + prose template (design §9), promoted from
// apps/funny-multi-server/src/i18n/fr.json (T-FO-2.1).
//
// needs-fr-review — machine-translated stub awaiting native French review per CONTRIBUTING.md.

import type { ServerI18n } from './types.js';
export const fr: ServerI18n = {
  questions: [
    'Qui ?',
    'Avec qui ?',
    'Où ?',
    'Quand ?',
    "Qu'ont-ils fait ?",
    'Pourquoi ?',
    "Comment ça s'est terminé ?",
  ],
  prose: "{0} avec {1} {3} {2} a/ont {4} {5}. Finalement, ça s'est terminé par {6}.",
};
