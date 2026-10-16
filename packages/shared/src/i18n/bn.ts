// SPDX-License-Identifier: AGPL-3.0-only

// Bengali (Bangladesh) — questions + prose template (design §9), authored for
// Step 73 alongside the pool texts in pools/text/bn.ts.
//
// needs-bn-review — machine-translated stub awaiting native Bengali review per CONTRIBUTING.md. Standard colloquial Bengali (চলিত ভাষা) as written in Bangladesh. Bengali is verb-final like Tamil, so the template follows Tamil's slot order: time {3}, place {2}, subject {0}, companion {1}, reason {5}, and the action verb {4} closes the first sentence. Slot-1 texts carry '-এর সাথে' (with); the ending sentence opens with «শেষমেশ» (in the end). Both sentences close with the dari «।», the Bengali full stop, not a Latin period.

import type { ServerI18n } from './types.js';
export const bn: ServerI18n = {
  questions: ['কে?', 'আর কে?', 'কোথায়?', 'কখন?', 'ওরা কী করল?', 'কেন?', 'শেষমেশ কী হলো?'],
  prose: '{3} {2} {0} {1} {5} {4}। শেষমেশ {6}।',
};
