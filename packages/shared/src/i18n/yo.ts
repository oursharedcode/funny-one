// SPDX-License-Identifier: AGPL-3.0-only

// Yoruba (Nigeria) — questions + prose template (design §9), Step 81.
//
// needs-yo-review — machine-translated stub awaiting native Yoruba review per CONTRIBUTING.md.
//
// Yoruba is SVO and its verbs never inflect, so the English order mostly
// holds; only the time phrase moves to the front:
//
//   {3}, {0} àti {1} wà {2}. Wọ́n {4} {5}. Níkẹyìn, {6}.
//   when, who and with-whom were where. They did, why. In the end, ending.
//
// - The time phrase opens the story («Nígbà tí …,», «Ní òwúrọ̀ …,»), the way
//   «Ní ìgbà kan, …» ("once upon a time") opens a told tale; a comma closes it.
// - «àti» ("and") joins the two actors, so slot 1 is a bare noun phrase.
//   Nothing agrees with them in number: «wà» and every verb in slot 4 have one
//   form, and «Wọ́n» ("they") fits every pair, «ológbò mẹ́ta …» included.
// - «wà» is the locative "be"; slot 2 brings its own place word (nínú, ní
//   ìsàlẹ̀, lórí, níbi …). Without an aspect marker it reads as past here.
// - Slot 4 is a bare verb phrase after «Wọ́n»: an action verb with no aspect
//   marker reads as completed. Slot 5 follows it with its own connective
//   (láti, nítorí pé, fún, kí … má bàa …), as Yoruba puts purpose and reason
//   after the verb.
// - «Níkẹyìn,» ("at last, in the end") introduces the closing clause.
//
// Orthography: full tone marks and the dot-below letters ẹ ọ ṣ, in NFC (see
// the pool file). The template ends with an ASCII ".", so polishProse adds
// nothing; it upper-cases the first letter, which is always slot 3's.

import type { ServerI18n } from './types.js';

export const yo: ServerI18n = {
  questions: [
    'Ta ni?',
    'Pẹ̀lú ta ni?',
    'Níbo?',
    'Nígbà wo?',
    'Kí ni wọ́n ṣe?',
    'Kí nìdí?',
    'Kí ló ṣẹlẹ̀ níkẹyìn?',
  ],
  prose: '{3}, {0} àti {1} wà {2}. Wọ́n {4} {5}. Níkẹyìn, {6}.',
};
