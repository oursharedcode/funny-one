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
//   - **A pack builds with the same skeleton** (DD-16, B-29). Its picture
//     options carry their own fragments under their own ids, so a pack story
//     is one more prompt of the same shape, and a free room's slice story,
//     whose picture slots stay on the base pools, builds exactly the base
//     prompt and gets the base library's picture. The four picture slots must
//     share one source, the base pools or one pack: a mix is a picture no
//     library holds. A pack's endings also get a second, character-free
//     picture, the aftermath, from `buildAftermathPrompt` below.
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
import { PACKS } from './packs/index.js';
import { PACK_IDS } from './packs/schema.js';
import type { PackId } from './packs/schema.js';
import { POOLS } from './pools/options.js';
import { VISUAL_SLOTS } from './pools/schema.js';
import type { OptionId, Pools, SlotIndex } from './pools/schema.js';

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
 * a real constraint when editing pools or this skeleton. A pack is held to the
 * same cap by the same test: chr26 leaves 19 (Step 103).
 */
export const MAX_PROMPT_LENGTH = 500;

/** Where an option was authored: the base pools, or a pack (DD-16). */
type Source = 'base' | PackId;

interface Fragment {
  readonly text: string;
  readonly source: Source;
}

/** The base pools and every pack's, each with where it came from. */
const SOURCES: readonly (readonly [Source, Pools])[] = [
  ['base', POOLS],
  ...PACK_IDS.map((id) => [id, PACKS[id].pools] as const),
];

/**
 * Every visual option's English fragment, by id, **kept per slot** and tagged
 * with its source. Built once at module load from the same pools the clients
 * render their options from (DD-2).
 *
 * Per slot rather than one flat map so an id can only ever be read in the slot
 * it belongs to. A flat map would happily render a companion as the lead if
 * something upstream wrote to the wrong index — a plausible-looking picture,
 * cached forever, for a story nobody played. Options whose `promptEn` is
 * missing are simply absent, so they fail in `fragmentFor` rather than
 * substituting an empty string into a cache key.
 */
const FRAGMENTS: ReadonlyMap<SlotIndex, ReadonlyMap<OptionId, Fragment>> = new Map(
  VISUAL_SLOTS.map((slot) => [
    slot,
    new Map(
      SOURCES.flatMap(([source, pools]) =>
        pools[slot].flatMap((option) =>
          option.promptEn ? [[option.id, { text: option.promptEn, source }] as const] : [],
        ),
      ),
    ),
  ]),
);

/**
 * Assembles the Workers AI prompt for a completed story.
 *
 * Throws when a visual slot is unfilled or carries an id with no fragment, or
 * when the visual slots mix the base pools with a pack. None is reachable in a
 * played game — `advanceRound` auto-fills every slot before reveal, and
 * `submitAnswer` rejects out-of-pool ids — so a throw here means an invariant
 * broke upstream. It is deliberately not softened into a fallback: a
 * placeholder fragment would generate and cache a real image under a prompt
 * describing a story nobody played. Funny Multi's caller (T-4.4, `game.ts`)
 * turns this into the reveal's error-with-retry path, which is where a missing
 * picture is already handled.
 */
export function buildPrompt(story: Story): string {
  const sources = new Set<Source>();
  const body = SKELETON.replace(/\{([0-6])\}/g, (_match, digit: string) => {
    const fragment = fragmentFor(story, Number(digit) as SlotIndex);
    sources.add(fragment.source);
    return fragment.text;
  });
  if (sources.size > 1) {
    throw new Error(
      `a story's picture options come from ${[...sources].sort().join(' and ')} — ` +
        'its visual slots must all come from the base pools or all from one pack',
    );
  }
  return body + STYLE_SUFFIX;
}

function fragmentFor(story: Story, slot: SlotIndex): Fragment {
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

/**
 * The skeleton of a pack ending's own picture, its **aftermath** (DD-16, design
 * §4.4, B-29): the place as the ending left it, with nobody in it. `{2}` is the
 * place's `promptEn`, read after "in" as in SKELETON; `{6}` is the ending's
 * `aftermathEn`.
 *
 * No character is named, on purpose. Flux draws every picture from its prompt
 * alone, so a second picture of the story's two characters would never match
 * the first, while an empty place cannot fail to. It also keeps the batch
 * small: an aftermath depends on the place and the ending only, 5 × 5 = 25
 * pictures for chr26, whoever the story was about.
 *
 * **Tuning window**, as SKELETON had: Step 104 draws five of these to see that
 * each reads as a punchline on its own, and may reword this string. Once the
 * pack's batch is drawn it is locked like STYLE_SUFFIX.
 */
export const AFTERMATH_SKELETON = '{6}, in {2}, an empty scene with nobody around';

/**
 * STYLE_SUFFIX less its four character anchors — googly eyes, exaggerated
 * expressions, separated subjects, unfused bodies — which on an empty place
 * would only invite the model to put someone in it. The same goofy-cartoon
 * look otherwise. In the tuning window with the skeleton above.
 */
export const AFTERMATH_STYLE_SUFFIX =
  ', in a goofy cartoon style, bright colors, hand-drawn doodle illustration, well-composed';

/**
 * Every pack ending's aftermath fragment, by id. Base endings have none: they
 * are never drawn.
 */
const AFTERMATHS: ReadonlyMap<OptionId, Fragment> = new Map(
  PACK_IDS.flatMap((id) =>
    PACKS[id].pools[6].flatMap((option) =>
      option.aftermathEn ? [[option.id, { text: option.aftermathEn, source: id }] as const] : [],
    ),
  ),
);

/**
 * Assembles the aftermath prompt for a pack story's ending, from its place
 * (slot 2) and its ending (slot 6) alone.
 *
 * Throws, as `buildPrompt` does, on an unfilled slot or an id with no
 * fragment, and when the place and the ending are not from the same pack. That
 * includes a base place with a pack ending — a free room's ordinary story,
 * whose ending is a text card (B-29), never a picture.
 */
export function buildAftermathPrompt(story: Story): string {
  const place = fragmentFor(story, 2);
  const ending = aftermathFor(story);
  if (place.source !== ending.source) {
    throw new Error(
      `an aftermath needs its place and its ending from one pack, ` +
        `got ${place.source} and ${ending.source}`,
    );
  }
  const body = AFTERMATH_SKELETON.replace(/\{([0-6])\}/g, (_match, digit: string) =>
    digit === '2' ? place.text : ending.text,
  );
  return body + AFTERMATH_STYLE_SUFFIX;
}

function aftermathFor(story: Story): Fragment {
  const id = story.answers[6];
  const fragment = id == null ? undefined : AFTERMATHS.get(id);
  if (!fragment) {
    throw new Error(
      `no aftermath fragment for slot 6 (${id ?? 'unanswered'}) — ` +
        "only a pack's endings are drawn",
    );
  }
  return fragment;
}
