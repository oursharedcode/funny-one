// SPDX-License-Identifier: AGPL-3.0-only

// Cantonese (Hong Kong) — questions + prose template (design §9), Step 73.
// Written Cantonese (粵語白話文) in Traditional characters, Hong Kong usage,
// not standard written Chinese: 嘅/咗/唔/喺/冇, never 的/了/不/在.
//
// needs-yue-review — machine-translated stub awaiting native Cantonese (Hong Kong) review per CONTRIBUTING.md.
//
// Prose template: "{3}，{0}{1}喺{2}{4}，{5}。最後，{6}。"
//   i.e. "{3}, {0}{1} at {2} {4}, {5}. In the end, {6}."
//
// Adapted from zh's template (zh.ts: same slot order, 在 before slot 2, {4}{5}
// run together) with two changes:
//   - 喺 replaces Mandarin 在 as the hardcoded locative before slot 2;
//   - a comma now sits between {4} and {5}. Cantonese tacks the purpose or
//     reason (為咗… / 因為…) onto the action as an afterthought,
//     "焗咗個蛋糕，為咗博一隻白鴿歡心"; run together without the pause, as zh
//     does, it reads as one breathless clause.
// Time first, then the who-with-whom subject, then where and what: the usual
// Cantonese topic order. Like zh, the template holds no spaces. Chinese does
// not separate words, so each slot carries its own connector (slot 1 opens
// with 同) and the slots butt straight together; polishProse finds nothing to
// collapse, and the closing 。 already counts as a terminal stop.

import type { ServerI18n } from './types.js';
export const yue: ServerI18n = {
  questions: [
    '邊個？',
    '仲有邊個？',
    '喺邊度？',
    '幾時？',
    '佢哋做咗乜嘢？',
    '為咗乜嘢？',
    '最後點收場？',
  ],
  prose: '{3}，{0}{1}喺{2}{4}，{5}。最後，{6}。',
};
