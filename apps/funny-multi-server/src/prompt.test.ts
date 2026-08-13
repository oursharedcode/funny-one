// SPDX-License-Identifier: AGPL-3.0-only

// T-4.2 — the deterministic image-prompt builder (design §7.1).
//
// What is worth asserting here is unusual: the builder is twelve lines, and
// none of the risk is in whether it substitutes correctly. The risk is that the
// string it produces is a **cache key** (design §7.2), shared by every room in
// every language, and permanent from v0.1.0 — so the properties that matter are
// determinism, uniqueness, and the exact bytes of the output.
//
// Hence a pinned prompt, an exhaustive pass over all 10 000 combinations, and a
// test that a prose slot cannot reach the picture (DD-3). The last one is the
// only guard against the cache quietly gaining a ×22 factor.

import { describe, expect, it } from 'vitest';
import { POOLS, VISUAL_SLOTS, PROSE_SLOTS, SLOT_COUNT } from '@funny/shared';
import type { OptionId, SlotIndex, Story } from '@funny/shared';
import { MAX_PROMPT_LENGTH, SKELETON, STYLE_SUFFIX, buildPrompt } from './prompt.js';

/** A complete, playable story: the first option of every slot. */
function story(overrides: Partial<Record<SlotIndex, OptionId | null>> = {}): Story {
  const answers = Array.from({ length: SLOT_COUNT }, (_, i) => {
    const slot = i as SlotIndex;
    return slot in overrides ? (overrides[slot] ?? null) : (POOLS[slot][0]?.id ?? null);
  });
  return { answers, picture: null };
}

function optionAt(slot: SlotIndex, index: number): OptionId {
  const id = POOLS[slot][index]?.id;
  if (!id) throw new Error(`no option ${index} in slot ${slot}`);
  return id;
}

describe('determinism', () => {
  it('returns the same string for the same ids', () => {
    // Two independently built stories, so nothing is memoised on the object.
    expect(buildPrompt(story())).toBe(buildPrompt(story()));
  });

  it('depends only on the ids, not on the order they were filled in', () => {
    const a = story();
    const b = story();
    b.answers.reverse();
    b.answers.reverse();
    expect(buildPrompt(b)).toBe(buildPrompt(a));
  });

  it('changes when any visual slot changes', () => {
    // If two different stories could share a prompt they would share a picture,
    // and one room would see the other's cartoon.
    const base = buildPrompt(story());
    for (const slot of VISUAL_SLOTS) {
      expect(buildPrompt(story({ [slot]: optionAt(slot, 1) }))).not.toBe(base);
    }
  });

  it('ignores the prose slots entirely (DD-3)', () => {
    // "When?", "What for?" and "How did it end?" do their work in the text.
    // Folding them in would multiply the prompt space by 22 each and mostly
    // defeat the shared cache — this is the test that keeps them out.
    const base = buildPrompt(story());
    for (const slot of PROSE_SLOTS) {
      expect(buildPrompt(story({ [slot]: optionAt(slot, 5) }))).toBe(base);
      expect(buildPrompt(story({ [slot]: null }))).toBe(base);
    }
  });

  it('gives every combination of visual options its own prompt', () => {
    // Exhaustive: 10⁴ = 10 000 stories, and no two may collide. Also the
    // cheapest place to assert every prompt is printable ASCII — a non-ASCII
    // character here would mean a display text had leaked into the picture,
    // which is exactly what DD-4's one-cache-for-15-languages depends on not
    // happening.
    const seen = new Set<string>();
    const [s0, s1, s2, s4] = VISUAL_SLOTS as [SlotIndex, SlotIndex, SlotIndex, SlotIndex];
    for (const a of POOLS[s0]) {
      for (const b of POOLS[s1]) {
        for (const c of POOLS[s2]) {
          for (const d of POOLS[s4]) {
            const prompt = buildPrompt(story({ [s0]: a.id, [s1]: b.id, [s2]: c.id, [s4]: d.id }));
            expect(prompt).toMatch(/^[\x20-\x7E]+$/);
            seen.add(prompt);
          }
        }
      }
    }
    const combinations = VISUAL_SLOTS.reduce<number>((n, slot) => n * POOLS[slot].length, 1);
    expect(seen.size).toBe(combinations);
    expect(combinations).toBe(10_000);
  });
});

describe('the assembled prompt', () => {
  it('reads as the sentence the skeleton promises', () => {
    // Pinned in full, deliberately. This is the cache key: any edit to the
    // skeleton, the suffix or a fragment orphans every image already in R2, so
    // it should never change quietly — and until v0.1.0 ships, updating this
    // literal is the conscious act of re-tuning (design §7.1).
    expect(
      buildPrompt(
        story({
          0: 'who.grumpy-pirate',
          1: 'with.haunted-toaster',
          2: 'where.cheese-factory',
          4: 'did.baking-giant-cake',
        }),
      ),
    ).toBe(
      'two distinct subjects: a grumpy pirate in an enormous feathered hat on the left ' +
        'and a battered toaster with glowing eyes on the right, in a cheese factory ' +
        'stacked with giant cheese wheels. They are baking an enormous lopsided cake' +
        ', in a goofy cartoon style, googly eyes, exaggerated expressions, ' +
        'bright colors, hand-drawn doodle illustration, ' +
        'distinct and clearly separated subjects, no merged or fused bodies, ' +
        'well-composed',
    );
  });

  it('always ends with the locked style suffix', () => {
    expect(buildPrompt(story()).endsWith(STYLE_SUFFIX)).toBe(true);
  });

  it('keeps the style suffix exactly as SRC wrote it (spec §22)', () => {
    expect(STYLE_SUFFIX).toBe(
      ', in a goofy cartoon style, googly eyes, exaggerated expressions, ' +
        'bright colors, hand-drawn doodle illustration, ' +
        'distinct and clearly separated subjects, no merged or fused bodies, ' +
        'well-composed',
    );
  });

  it('leaves no placeholder unsubstituted', () => {
    expect(buildPrompt(story())).not.toMatch(/\{[0-6]\}/);
  });

  it('references exactly the visual slots', () => {
    // The skeleton and VISUAL_SLOTS are two statements of the same decision
    // (DD-3), sitting in different packages. This is what stops them drifting:
    // adding `{3}` here would silently multiply the cache space.
    const referenced = [...SKELETON.matchAll(/\{([0-6])\}/g)].map((m) => Number(m[1]));
    expect(referenced).toEqual([...VISUAL_SLOTS]);
  });
});

describe('length', () => {
  it('cannot exceed the cap, for any story the pools can produce', () => {
    // Computed from the longest fragment in each slot rather than sampled: the
    // slots are independent, so their maxima combine into the true worst case.
    // SRC truncated at this cap because its answers were typed; ours are static
    // data in this repo, so the bound is checkable — and checking beats
    // truncating, which would turn a too-long prompt into a different one and
    // cache the picture under a key nobody meant.
    const longest = VISUAL_SLOTS.map((slot) =>
      Math.max(...POOLS[slot].map((option) => (option.promptEn ?? '').length)),
    );
    const worstCase =
      SKELETON.replace(/\{[0-6]\}/g, '').length +
      longest.reduce((sum, n) => sum + n, 0) +
      STYLE_SUFFIX.length;

    expect(worstCase).toBeLessThanOrEqual(MAX_PROMPT_LENGTH);
    // T-1.4 measured 19 characters of headroom and this is where that number
    // lives now. If this ever reads much larger, someone shortened a fragment
    // and orphaned that fragment's images.
    expect(MAX_PROMPT_LENGTH - worstCase).toBe(19);
  });

  it('never truncates what it is given', () => {
    const prompt = buildPrompt(story());
    expect(prompt.length).toBeLessThanOrEqual(MAX_PROMPT_LENGTH);
    expect(prompt.endsWith('well-composed')).toBe(true);
  });
});

describe('stories it refuses to build', () => {
  // Every case here is unreachable in a played game: advanceRound fills every
  // slot before reveal and submitAnswer rejects out-of-pool ids. They are
  // asserted because the alternative to throwing is generating and permanently
  // caching a real picture of a story nobody played.

  it('refuses an unfilled visual slot', () => {
    for (const slot of VISUAL_SLOTS) {
      expect(() => buildPrompt(story({ [slot]: null }))).toThrow(/slot \d+ \(unanswered\)/);
    }
  });

  it('refuses an id that is in no pool', () => {
    expect(() => buildPrompt(story({ 0: 'who.definitely-not-real' }))).toThrow(
      /who\.definitely-not-real/,
    );
  });

  it('refuses a prose option in a visual slot', () => {
    // A prose option has no fragment at all, so this would otherwise substitute
    // an empty string and describe a subject that is not there.
    expect(() => buildPrompt(story({ 0: optionAt(3, 0) }))).toThrow();
  });

  it('refuses a visual option filed under the wrong visual slot', () => {
    // Both ids resolve to real fragments; only the slot is wrong. A flat
    // id→fragment map would render this happily, as a companion standing in
    // for the lead, and cache it.
    expect(() => buildPrompt(story({ 0: optionAt(1, 0) }))).toThrow(/slot 0/);
  });

  it('builds when only the prose slots are unfilled', () => {
    // The complement of the rule: prose slots are not the picture's business.
    const bare = story({ 3: null, 5: null, 6: null });
    expect(() => buildPrompt(bare)).not.toThrow();
  });
});
