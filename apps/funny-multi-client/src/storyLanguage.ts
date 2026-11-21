// SPDX-License-Identifier: AGPL-3.0-only

// B-15: a story in any language the client can render, not only the room's.
//
// The wire carries option ids (DD-1) and the client bundles the same
// `@funny/shared` build as the server (DD-2), so a story's texts in another
// language are a local computation, not a request. Adapted from the server's
// `resolveAnswers`/`revealProse` (game.ts) — the same resolve, render, polish
// steps Funny One's `resolveStory.ts` also takes — so a story rendered here in
// the room language reads exactly as the server sent it.

import {
  AUTHORED_LANGUAGES,
  LANGUAGES,
  PROSE_TEMPLATES,
  SLOT_COUNT,
  optionTexts,
  polishProse,
  renderProse,
} from '@funny/shared';
import type { AuthoredLanguage, OptionId } from '@funny/shared';

/**
 * The languages a story can be told in: the registry entries whose pools are
 * authored. Derived from `LANGUAGES` rather than rebuilt from
 * `AUTHORED_LANGUAGES` so flag artwork, display order and country labels stay
 * in one place. All 15 since T-6.3, so this is the start window's list.
 */
export const CONTENT_LANGUAGES = LANGUAGES.filter((opt) =>
  (AUTHORED_LANGUAGES as readonly string[]).includes(opt.code),
);

export function isAuthoredLanguage(value: string | null | undefined): value is AuthoredLanguage {
  return typeof value === 'string' && (AUTHORED_LANGUAGES as readonly string[]).includes(value);
}

export interface StoryText {
  /** Length SLOT_COUNT; display text per slot, '' where unanswered. */
  answers: string[];
  prose: string;
}

/** What `reveal:start` and every gallery entry carry about a story. */
export interface WireStory extends StoryText {
  optionIds: (OptionId | null)[];
}

// An unfilled slot resolves to '' rather than throwing, as on the server: the
// server fills every slot before reveal, so a gap here would mean a bug
// upstream, and '' degrades to a slightly odd sentence rather than a crash.
// A pack's option reads in `language` where the pack has its texts, in English
// otherwise (`optionTexts`, owner decision 4A): an ar player in an en
// Christmas room reads the Christmas words in English.
export function renderStory(
  language: AuthoredLanguage,
  optionIds: readonly (OptionId | null)[],
): StoryText {
  const texts = optionTexts(language);
  const answers = Array.from({ length: SLOT_COUNT }, (_, i) => {
    const id = optionIds[i];
    return id ? (texts[id] ?? '') : '';
  });
  return { answers, prose: polishProse(language, renderProse(language, answers)) };
}

/**
 * The story as shown in `language`: the server's own texts when that is the
 * room language, a local rendering otherwise.
 */
export function storyIn(
  story: WireStory,
  roomLanguage: AuthoredLanguage,
  language: AuthoredLanguage,
): StoryText {
  if (language === roomLanguage) return { answers: story.answers, prose: story.prose };
  return renderStory(language, story.optionIds);
}

// Languages whose ending slot cannot open a sentence of its own: German's is a
// dative after the template's "mit" («einem Berg Geschenkpapier …»), so its
// card reads the template's whole last sentence (owner decision D1 A, Step 118).
const SENTENCE_CARD_LANGUAGES: readonly AuthoredLanguage[] = ['de'];

/**
 * Step 117: a Christmas story's ending on its own, for the card that stands in
 * for an ending picture — the last slot's text, opening with a capital. The
 * prose reads it after "In the end, "; alone, it starts the sentence. In a
 * SENTENCE_CARD_LANGUAGES language, the template's last sentence around it
 * instead, without its full stop, like every other card.
 */
export function endingText(story: StoryText, language: AuthoredLanguage): string {
  const ending = story.answers[SLOT_COUNT - 1] ?? '';
  if (ending === '') return '';
  if (SENTENCE_CARD_LANGUAGES.includes(language)) {
    const template = PROSE_TEMPLATES[language];
    const lastSentence = template.slice(template.lastIndexOf('. ') + 2).replace(/\.$/, '');
    return lastSentence.replace(`{${SLOT_COUNT - 1}}`, ending);
  }
  const [first = '', ...rest] = ending;
  return first.toLocaleUpperCase(language) + rest.join('');
}
