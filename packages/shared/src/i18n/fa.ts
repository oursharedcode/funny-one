// SPDX-License-Identifier: AGPL-3.0-only

// Persian (Farsi, Iran) — questions + prose template (design §9), Step 73.
//
// needs-fa-review — machine-translated stub awaiting native Persian (Iran) review per CONTRIBUTING.md.
//
// Persian is SOV, so the slots are reordered rather than translated in place:
//
//   {3}، {0} {1} {2} {4}، {5}. آخرش {6}.
//   when, who  with-whom  where  what-they-did, why. In the end, ending.
//
// - The time phrase opens the sentence, the way a told story starts
//   («روز آخر تابستان، …»); the Persian comma «،» closes it.
// - Slot 1 carries «با» ("with"). «X با Y … کردند» is the everyday way to make
//   two actors one plural subject, so slot 4 is always a plural past verb.
// - Slot 4 (object + verb) ends the main clause, as Persian requires.
// - Slot 5 follows the verb after a comma. Its «تا …» / «چون …» clauses read
//   naturally there; placed before the verb they would bury the object under a
//   long embedded clause.
// - «آخرش» ("in the end", warm and spoken rather than bookish «در پایان»)
//   introduces the closing sentence.
//
// The template ends with "." (the Persian full stop too), so polishProse adds
// nothing. The app sets dir="rtl"; no direction marks live in the strings.

import type { ServerI18n } from './types.js';

export const fa: ServerI18n = {
  questions: ['چه کسی؟', 'با چه کسی؟', 'کجا؟', 'چه موقع؟', 'چه کار کردند؟', 'چرا؟', 'آخرش چه شد؟'],
  prose: '{3}، {0} {1} {2} {4}، {5}. آخرش {6}.',
};
