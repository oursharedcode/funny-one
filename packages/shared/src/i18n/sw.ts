// SPDX-License-Identifier: AGPL-3.0-only

// Swahili — questions + prose template (design §9), Step 81.
//
// needs-sw-review — machine-translated stub awaiting native Swahili review per CONTRIBUTING.md.
//
// Standard Swahili (Kiswahili sanifu) with vocabulary Kenya and Tanzania share.
// The English slot order is also the natural Swahili one, so nothing moves:
//
//   {0} na {1} walikuwa {2} {3}. Kisha {4} {5}. Mwishowe, {6}.
//   who and with-whom were where when. Then what-they-did why. In the end, ending.
//
// - «na» ("and") joins the two actors into one subject, and «walikuwa» ("they
//   were") takes the class 2 prefix wa-. Slot 0 is always an animate being, and
//   animals take class 1/2 agreement whatever their noun class; when slot 1 is
//   an object (the haunted toaster, the talking mailbox) it is a personified
//   character, and a pair with a human-like member still takes wa-.
// - Place before time («jikoni … saa sita kamili mchana») is the usual Swahili
//   order after «walikuwa».
// - polishProse capitalises only the story's first letter, so each later
//   sentence opens with a template word: «Kisha» ("then") before slot 4, which
//   carries its own subject prefix (wali-, simple past), and «Mwishowe,» ("in
//   the end") before the closing clause of slot 6.
// - Slot 5 follows the verb phrase with its own connective (ili …, kwa sababu …,
//   kwa ajili ya …, bila …), so the template adds none.
//
// The template ends with "." so polishProse adds nothing.

import type { ServerI18n } from './types.js';

export const sw: ServerI18n = {
  questions: [
    'Nani?',
    'Na nani mwingine?',
    'Wapi?',
    'Lini?',
    'Walifanya nini?',
    'Kwa nini?',
    'Mwishowe kulitokea nini?',
  ],
  prose: '{0} na {1} walikuwa {2} {3}. Kisha {4} {5}. Mwishowe, {6}.',
};
