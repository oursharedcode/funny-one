// SPDX-License-Identifier: AGPL-3.0-only

// Shape of one language's catalog: the 7 round questions and the locked prose
// template (design §9). Shared by every `<code>.ts` file in this directory
// and by `index.ts`'s `QUESTIONS`/`PROSE_TEMPLATES` projection.
export type ServerI18n = { questions: readonly string[]; prose: string };
