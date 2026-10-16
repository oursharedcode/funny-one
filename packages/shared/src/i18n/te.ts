// SPDX-License-Identifier: AGPL-3.0-only

// Telugu — questions + prose template (design §9), added in Step 73 beside
// Tamil, the closest model (both Dravidian, agglutinative, verb-final).
//
// needs-te-review — machine-translated stub awaiting native Telugu review per CONTRIBUTING.md.
//
// Prose template: '{3} {2} {0} {1} {5} {4}. చివరికి {6}.' — the same order as
// Tamil's, which is plain Telugu narrative order: time, place, subject,
// companion, purpose, verb. Telugu is verb-final, so the action slot {4}
// closes the first sentence; slot-1 texts carry '-తో కలిసి' (together with),
// slot-2 texts their locative '-లో', slot-5 texts their own purpose or
// reason ending (-డానికి, -కోసం, కాబట్టి), so the template needs no glue words
// between slots. The second sentence opens with 'చివరికి' (in the end).
//
// Question 1 asks 'ఎవరితో కలిసి?' (together with whom?) rather than a literal
// "who else?", so the question has the same shape as its answers.

import type { ServerI18n } from './types.js';
export const te: ServerI18n = {
  questions: [
    'ఎవరు?',
    'ఎవరితో కలిసి?',
    'ఎక్కడ?',
    'ఎప్పుడు?',
    'వాళ్ళు ఏం చేశారు?',
    'ఎందుకు?',
    'చివరికి ఏమైంది?',
  ],
  prose: '{3} {2} {0} {1} {5} {4}. చివరికి {6}.',
};
