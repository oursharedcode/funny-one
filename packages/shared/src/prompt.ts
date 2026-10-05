// SPDX-License-Identifier: AGPL-3.0-only

// Deterministic image-prompt builder (design §7.1, FM-IMG-2, DD-3/DD-4).
//
// Lives in the shared package since 2026-10-05 (D-10): the string is the
// picture library's cache key, so both products must build it with the same
// function — Funny Multi's server to ask the Worker for a story's picture,
// Funny One's client to address the same picture by its hash. Moved here
// byte for byte from `apps/funny-multi-server/src/prompt.ts`, which re-exports
// it; the tests stayed there (`prompt.test.ts`).
//
// Adapted from SRC/server/src/prompt.ts, of which only STYLE_SUFFIX survives.
// SRC assembled its prompt from free-typed answers, which meant translating
// them to English, running an English profanity pass over the translation,
// synthesising connectives per language, detecting whether slots 0 and 1 had
// collided into one subject, and truncating the result. All of that was work to
// make unpredictable text safe and grammatical.
//
// Here the four visual slots are chosen from curated pools, so the fragments
// are English, family-friendly and phrased to compose (FM-ANS-1) before this
// module ever sees them. What is left is a lookup and a substitution:
//
//   - **Pure.** The prompt is a function of four option ids and nothing else —
//     no language, no clock, no randomness. Two rooms that pick the same four
//     options anywhere in the world produce the same string, hence the same
//     sha256, hence one image in R2 for all of them (DD-4, design §7.2).
//   - **Language-independent by construction**, not by convention: there is no
//     language parameter to pass wrongly. Only `promptEn` fragments are read;
//     the player-facing display texts never reach here.
//   - **Slot 3 ("When?") is not in the picture** (DD-3, design §4.3). Four
//     visual slots give 10⁴ = 10,000 distinct prompts, which a shared cache
//     converges on quickly; folding in a 22-option "when" would multiply that
//     ×22 and mostly defeat caching. The prose still uses it.
//
// Not ported from SRC, and each absence is load-bearing rather than an
// oversight: `translateToEnglish` (DD-8 deletes the translate stack — fragments
// are authored in English), the English profanity re-check (FM-ANS: no
// untrusted text remains), the RU/EN slot-1 connective synthesis (fragments are
// authored to compose with this one skeleton), `ruActionHint` (slot 4 fragments
// are already English), and `looksLikeSameSubject` with its "two of them"
// chimera anchor — slots 0 and 1 draw from disjoint kinds, leads versus
// companions (T-1.4), so a duplicate pair is unreachable by construction.

import type { Story } from './events.js';
import { POOLS } from './pools/options.js';
import { VISUAL_SLOTS } from './pools/schema.js';
import type { OptionId, SlotIndex } from './pools/schema.js';

/**
 * Locked style suffix — verbatim from SRC (spec §22 lock). Appended to every
 * prompt so Workers AI renders a consistent goofy-cartoon look.
 *
 * English-only on purpose: Flux's CLIP text encoder is trained primarily on
 * English captions, so the stylistic anchors (`goofy cartoon`, `googly eyes`,
 * `hand-drawn doodle`) only land when written in English — translating them
 * made the model default to a generic painterly look. That finding is SRC's,
 * and it is the same reason the skeleton below is English while the story a
 * player reads is not.
 *
 * **Never edit.** Every character here is part of every cache key.
 */
export const STYLE_SUFFIX =
  ', in a goofy cartoon style, googly eyes, exaggerated expressions, ' +
  'bright colors, hand-drawn doodle illustration, ' +
  'distinct and clearly separated subjects, no merged or fused bodies, ' +
  'well-composed';

/**
 * The one image-prompt skeleton, for every language and every story.
 *
 * `{n}` is the visual slot n, substituted with that option's `promptEn`. The
 * two-subject anchoring is SRC's lesson, kept: CLIP does not reliably bind
 * adjacent nouns to separate entities, so "on the left"/"on the right" is what
 * stops a pirate and a toaster rendering as one pirate-toaster. Slot 4's
 * fragments are authored as `are` + gerund to complete "They {4}" (T-1.4).
 *
 * **Tuning window.** Design §7.1 locks this string once v0.1.0 ships, on the
 * same terms as STYLE_SUFFIX: an edit changes every prompt, so every hash, so
 * every image already in R2 is orphaned. Until then the cache is empty and the
 * wording is free to change — which is the whole point of tuning it against
 * real Flux output before the lock (T-4.2, still outstanding: see
 * `apps/funny-multi-server/scripts/samplePrompts.mjs`).
 */
export const SKELETON =
  'two distinct subjects: {0} on the left and {1} on the right, in {2}. They {4}';

/**
 * The cap SRC enforced by truncation. Kept as a bound the pools are held to in
 * the server's `prompt.test.ts`, **not** as a runtime truncation.
 *
 * SRC could not know its worst case: answers were typed. Ours is static data in
 * this repo — the longest fragment in each visual slot, plus the skeleton, plus
 * the suffix — so the test computes it exactly and fails the day an authored
 * fragment pushes past it. A runtime truncation would instead let a too-long
 * prompt through as a *different, silently shortened* prompt, which is a cache
 * key nobody intended. T-1.4 measured 19 characters of headroom; treat that as
 * a real constraint when editing pools or this skeleton.
 */
export const MAX_PROMPT_LENGTH = 500;

/**
 * Every visual option's English fragment, by id, **kept per slot**. Built once
 * at module load from the same pools the clients render their options from
 * (DD-2).
 *
 * Per slot rather than one flat map so an id can only ever be read in the slot
 * it belongs to. A flat map would happily render a companion as the lead if
 * something upstream wrote to the wrong index — a plausible-looking picture,
 * cached forever, for a story nobody played. Options whose `promptEn` is
 * missing are simply absent, so they fail in `fragmentFor` rather than
 * substituting an empty string into a cache key.
 */
const FRAGMENTS: ReadonlyMap<SlotIndex, ReadonlyMap<OptionId, string>> = new Map(
  VISUAL_SLOTS.map((slot) => [
    slot,
    new Map(
      POOLS[slot].flatMap((option) =>
        option.promptEn ? [[option.id, option.promptEn] as const] : [],
      ),
    ),
  ]),
);

/**
 * Assembles the Workers AI prompt for a completed story.
 *
 * Throws when a visual slot is unfilled or carries an id with no fragment.
 * Neither is reachable in a played game — `advanceRound` auto-fills every slot
 * before reveal, and `submitAnswer` rejects out-of-pool ids — so a throw here
 * means an invariant broke upstream. It is deliberately not softened into a
 * fallback: a placeholder fragment would generate and cache a real image under
 * a prompt describing a story nobody played. Funny Multi's caller (T-4.4,
 * `game.ts`) turns this into the reveal's error-with-retry path, which is where a
 * missing picture is already handled.
 */
export function buildPrompt(story: Story): string {
  const body = SKELETON.replace(/\{([0-6])\}/g, (_match, digit: string) =>
    fragmentFor(story, Number(digit) as SlotIndex),
  );
  return body + STYLE_SUFFIX;
}

function fragmentFor(story: Story, slot: SlotIndex): string {
  const id = story.answers[slot];
  const fragment = id == null ? undefined : FRAGMENTS.get(slot)?.get(id);
  if (!fragment) {
    throw new Error(
      `no image-prompt fragment for slot ${slot} (${id ?? 'unanswered'}) — ` +
        'a story reaching the prompt builder must have every visual slot filled ' +
        "with an option from that slot's pool",
    );
  }
  return fragment;
}
