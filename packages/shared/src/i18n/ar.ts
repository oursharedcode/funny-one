// SPDX-License-Identifier: AGPL-3.0-only

// Arabic (Modern Standard Arabic) — questions + prose template (design §9), Step 81.
//
// needs-ar-review — machine-translated stub awaiting native Arabic review per CONTRIBUTING.md.
//
// Arabic verbs and adjectives agree with their subject in gender and number (singular,
// dual, plural), and the actors vary: «قرصان» (m.), «جدة» (f.), «ثلاث قطط» (pl.), in any
// pairing. So the template never makes a word agree with them:
//
//   {3}، {2}، اجتمع فريق عجيب: {0} و{1}. فانهمك الفريق في {4}، {5}. وفي النهاية، {6}.
//   when, where, a strange team gathered: who and with-whom. So the team threw itself
//   into what-they-did, why. And in the end, ending.
//
// - The time and the place open the story, the way a told tale sets its scene
//   («في آخر يوم من الصيف، داخل مصنع جبن، …»); «،» closes each.
// - «فريق» ("team", masculine singular) is the subject of both verbs. The two actors
//   stand after the colon as its apposition, so nothing has to agree with them.
// - Slot 4 is a verbal noun (masdar) after «انهمك … في» ("got absorbed in"): one form
//   for every pairing, with no verb ending to choose.
// - Slot 5 follows a comma and brings its own connective («لأن …», «لإبهار …»).
// - «وفي النهاية،» ("and in the end,") opens the closing sentence; slot 6 is a full
//   clause with its own subject.
// - «و» is written onto slot 1, as Arabic spells "and". It never joins the letter after
//   it, so highlighting the answer cannot break a letter join.
//
// Arabic punctuation «،» «؟»; the template ends with "." so polishProse adds nothing.
// The app sets dir="rtl"; no direction marks live in the strings.

import type { ServerI18n } from './types.js';

export const ar: ServerI18n = {
  questions: ['من؟', 'ومن أيضا؟', 'أين؟', 'متى؟', 'ماذا فعلوا؟', 'لماذا؟', 'ماذا حدث في النهاية؟'],
  prose: '{3}، {2}، اجتمع فريق عجيب: {0} و{1}. فانهمك الفريق في {4}، {5}. وفي النهاية، {6}.',
};
