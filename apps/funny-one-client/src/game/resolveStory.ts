// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-4.3a: the first Funny One consumer of the prose rendering promoted
// into `@funny/shared` by T-FO-2.1 (FO-ARC-2). Adapted from
// `apps/funny-multi-server/src/game.ts`'s `resolveAnswers`/`revealProse` —
// same two-step resolve-then-render-then-polish, just called locally from
// `StoryGallery` instead of over a socket at `reveal:start`, and reading
// `SLOT_COUNT` (FO's canonical 7) rather than the server's `ROUNDS`.

import { POOL_TEXTS, SLOT_COUNT, polishProse, renderProse } from '@funny/shared';
import type { AuthoredLanguage, Story } from '@funny/shared';

export interface ResolvedStory {
  /** Length SLOT_COUNT; resolved display text per slot, '' where unanswered. */
  answers: string[];
  prose: string;
}

// An unfilled slot resolves to '' rather than throwing — every slot is filled
// by the time a story reaches the gallery, so a gap here would mean a bug
// upstream, and '' degrades to a slightly odd sentence rather than a crash.
export function resolveStory(language: AuthoredLanguage, story: Story): ResolvedStory {
  const texts = POOL_TEXTS[language];
  const answers = Array.from({ length: SLOT_COUNT }, (_, i) => {
    const id = story.answers[i];
    return id ? (texts[id] ?? '') : '';
  });
  const prose = polishProse(language, renderProse(language, answers));
  return { answers, prose };
}
