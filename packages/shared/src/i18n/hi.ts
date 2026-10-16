// SPDX-License-Identifier: AGPL-3.0-only

// Hindi — questions + prose template (design §9), Step 73.
//
// needs-hi-review — machine-translated stub awaiting native Hindi review per CONTRIBUTING.md.
//
// Hindi is verb-final (SOV) with postpositions, like Tamil, so the template
// follows Tamil's order: time, place, subject, companion, reason, then the
// action closes the sentence. A comma after the time slot {3} keeps the long
// opening adverbial readable (several slot-3 texts are «जब …» clauses, which
// want a comma before the main clause anyway). The sentence ends with the
// पूर्ण विराम «।», and the ending slot {6} follows «आख़िर में» (in the end).
//
// The action slot {4} is an ergative perfective: slot 0 carries «ने» and the
// verb agrees with its own object, never with the subject — see the header of
// pools/text/hi.ts. That is why question 1 is «किसने?» (who [did it]?), whose
// natural answer is «… ने», and question 2 is «और किसके साथ?» (and with whom?),
// whose answer carries «के साथ».

import type { ServerI18n } from './types.js';
export const hi: ServerI18n = {
  questions: [
    'किसने?',
    'और किसके साथ?',
    'कहाँ?',
    'कब?',
    'उन्होंने क्या किया?',
    'क्यों?',
    'आख़िर में क्या हुआ?',
  ],
  prose: '{3}, {2} {0} {1} {5} {4}। आख़िर में {6}।',
};
