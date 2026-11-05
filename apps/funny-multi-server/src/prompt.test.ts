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
//
// Step 103 added the packs (DD-16, B-29): the same properties over a pack's
// 625 scenes and its 25 aftermaths, the length cap for both, and the refusals
// that keep every picture inside one library — base or one pack, never a mix.

import { describe, expect, it } from 'vitest';
import {
  AFTERMATH_SLOTS,
  PACKS,
  PACK_IDS,
  POOLS,
  VISUAL_SLOTS,
  PROSE_SLOTS,
  SLOT_COUNT,
} from '@funny/shared';
import type { OptionId, PackId, Pools, SlotIndex, Story } from '@funny/shared';
import {
  AFTERMATH_SKELETON,
  AFTERMATH_STYLE_SUFFIX,
  MAX_PROMPT_LENGTH,
  SKELETON,
  STYLE_SUFFIX,
  buildAftermathPrompt,
  buildPrompt,
} from './prompt.js';

/** A complete, playable story: the first option of every slot. */
function story(overrides: Partial<Record<SlotIndex, OptionId | null>> = {}): Story {
  return storyFrom(POOLS, overrides);
}

/** A complete story of a pack (DD-16): the first option of every pack slot. */
function packStory(
  overrides: Partial<Record<SlotIndex, OptionId | null>> = {},
  pack: PackId = 'chr26',
): Story {
  return storyFrom(PACKS[pack].pools, overrides);
}

function storyFrom(pools: Pools, overrides: Partial<Record<SlotIndex, OptionId | null>>): Story {
  const answers = Array.from({ length: SLOT_COUNT }, (_, i) => {
    const slot = i as SlotIndex;
    return slot in overrides ? (overrides[slot] ?? null) : (pools[slot][0]?.id ?? null);
  });
  return { answers, picture: null };
}

function optionAt(slot: SlotIndex, index: number): OptionId {
  return optionOf(POOLS, slot, index);
}

function packOptionAt(slot: SlotIndex, index: number, pack: PackId = 'chr26'): OptionId {
  return optionOf(PACKS[pack].pools, slot, index);
}

function optionOf(pools: Pools, slot: SlotIndex, index: number): OptionId {
  const id = pools[slot][index]?.id;
  if (!id) throw new Error(`no option ${index} in slot ${slot}`);
  return id;
}

/** Every scene prompt a set of pools can produce: one per combination of its picture options. */
function scenePrompts(
  pools: Pools,
  build: (overrides: Partial<Record<SlotIndex, OptionId>>) => Story,
): string[] {
  const [s0, s1, s2, s4] = VISUAL_SLOTS as [SlotIndex, SlotIndex, SlotIndex, SlotIndex];
  const prompts: string[] = [];
  for (const a of pools[s0]) {
    for (const b of pools[s1]) {
      for (const c of pools[s2]) {
        for (const d of pools[s4]) {
          prompts.push(buildPrompt(build({ [s0]: a.id, [s1]: b.id, [s2]: c.id, [s4]: d.id })));
        }
      }
    }
  }
  return prompts;
}

/** Every aftermath prompt a pack can produce: one per place and ending. */
function aftermathPrompts(pack: PackId): string[] {
  const pools = PACKS[pack].pools;
  return pools[2].flatMap((place) =>
    pools[6].map((ending) => buildAftermathPrompt(packStory({ 2: place.id, 6: ending.id }, pack))),
  );
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
    // which is exactly what DD-4's one-cache-for-every-language depends on not
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

describe('pack scenes (DD-16, B-29)', () => {
  it("gives every combination of a pack's picture options its own prompt, none a base one", () => {
    // Exhaustive again: 5⁴ = 625 for chr26. A pack prompt equal to a base one
    // would hand a pack story a picture of the base pools, or the reverse.
    const base = new Set(scenePrompts(POOLS, story));
    for (const pack of PACK_IDS) {
      const prompts = scenePrompts(PACKS[pack].pools, (overrides) => packStory(overrides, pack));
      for (const prompt of prompts) {
        expect(prompt).toMatch(/^[\x20-\x7E]+$/);
        expect(base.has(prompt), prompt).toBe(false);
      }
      expect(new Set(prompts).size).toBe(prompts.length);
    }
    expect(scenePrompts(PACKS.chr26.pools, packStory)).toHaveLength(625);
  });

  it('cannot exceed the cap, for any story a pack can produce', () => {
    for (const pack of PACK_IDS) {
      const pools = PACKS[pack].pools;
      const longest = VISUAL_SLOTS.map((slot) =>
        Math.max(...pools[slot].map((option) => (option.promptEn ?? '').length)),
      );
      const worstCase =
        SKELETON.replace(/\{[0-6]\}/g, '').length +
        longest.reduce((sum, n) => sum + n, 0) +
        STYLE_SUFFIX.length;
      expect(worstCase, pack).toBeLessThanOrEqual(MAX_PROMPT_LENGTH);
      // Measured at Step 103, when chr26's fragments froze. Like the base
      // pools' 19, a change here means a fragment changed and its pictures
      // were orphaned.
      if (pack === 'chr26') expect(MAX_PROMPT_LENGTH - worstCase).toBe(19);
    }
  });

  it("builds a slice story's prompt from the base pools alone, so its picture is in the library", () => {
    // A free room's ordinary story (B-29, 2026-11-05): today's characters,
    // place and action, the pack's when, why and ending.
    for (let i = 0; i < PACKS.chr26.pools[6].length; i++) {
      const slice = story({ 3: packOptionAt(3, i), 5: packOptionAt(5, i), 6: packOptionAt(6, i) });
      expect(buildPrompt(slice)).toBe(buildPrompt(story()));
    }
  });

  it('ignores the prose slots of a pack story too, the ending included', () => {
    const scene = buildPrompt(packStory());
    for (const slot of PROSE_SLOTS) {
      expect(buildPrompt(packStory({ [slot]: packOptionAt(slot, 3) }))).toBe(scene);
      expect(buildPrompt(packStory({ [slot]: null }))).toBe(scene);
    }
  });

  it('refuses a story whose picture slots mix the base pools and a pack', () => {
    // Each id is real and in its right slot; only the mix is wrong, and it
    // describes a picture that no library holds.
    for (const slot of VISUAL_SLOTS) {
      expect(() => buildPrompt(story({ [slot]: packOptionAt(slot, 0) }))).toThrow(/base and chr26/);
      expect(() => buildPrompt(packStory({ [slot]: optionAt(slot, 0) }))).toThrow(/base and chr26/);
    }
  });

  it('refuses a pack option filed under the wrong visual slot', () => {
    expect(() => buildPrompt(packStory({ 0: packOptionAt(1, 0) }))).toThrow(/slot 0/);
  });
});

describe('the aftermath prompt (DD-16, B-29)', () => {
  it('reads as the sentence its skeleton promises', () => {
    // Pinned like the scene prompt. In its tuning window until the pack's
    // batch is drawn: Step 104's five test pictures may reword it, and
    // updating this literal is how.
    expect(
      buildAftermathPrompt(
        packStory({ 2: 'where.chr26-living-room', 6: 'end.chr26-toppled-tree' }),
      ),
    ).toBe(
      'a decorated Christmas tree toppled on its side, baubles rolling away, ' +
        'in a cozy living room with a crackling fireplace, an empty scene with nobody around' +
        ', in a goofy cartoon style, bright colors, hand-drawn doodle illustration, ' +
        'well-composed',
    );
  });

  it('references exactly the place and the ending', () => {
    const referenced = [...AFTERMATH_SKELETON.matchAll(/\{([0-6])\}/g)].map((m) => Number(m[1]));
    expect(referenced.sort((a, b) => a - b)).toEqual([...AFTERMATH_SLOTS]);
  });

  it('styles like the scenes, less the four anchors that draw characters', () => {
    const anchors = [
      'googly eyes',
      'exaggerated expressions',
      'distinct and clearly separated subjects',
      'no merged or fused bodies',
    ];
    expect(AFTERMATH_STYLE_SUFFIX.split(', ')).toEqual(
      STYLE_SUFFIX.split(', ').filter((phrase) => !anchors.includes(phrase)),
    );
  });

  it('depends on the place and the ending alone', () => {
    // 25 pictures, not 25 × 625: who was in the story, what they did, when
    // and why never reach it.
    const aftermath = buildAftermathPrompt(packStory());
    for (const slot of [0, 1, 3, 4, 5] as const) {
      expect(buildAftermathPrompt(packStory({ [slot]: packOptionAt(slot, 2) }))).toBe(aftermath);
      expect(buildAftermathPrompt(packStory({ [slot]: null }))).toBe(aftermath);
    }
  });

  it('gives every place and ending of a pack its own prompt, within the cap', () => {
    for (const pack of PACK_IDS) {
      const prompts = aftermathPrompts(pack);
      for (const prompt of prompts) {
        expect(prompt).toMatch(/^[\x20-\x7E]+$/);
        expect(prompt.length).toBeLessThanOrEqual(MAX_PROMPT_LENGTH);
      }
      expect(new Set(prompts).size).toBe(prompts.length);
    }
  });

  it("draws B-29's batch: 625 scenes and 25 aftermaths, 650 distinct prompts", () => {
    const batch = new Set([
      ...scenePrompts(PACKS.chr26.pools, packStory),
      ...aftermathPrompts('chr26'),
    ]);
    expect(batch.size).toBe(650);
  });
});

describe('aftermaths it refuses to build', () => {
  // As with the scenes, none of these is reachable in a played game, and the
  // alternative to throwing is a picture of a story nobody played.

  it('refuses an unfilled place or ending', () => {
    expect(() => buildAftermathPrompt(packStory({ 2: null }))).toThrow(/slot 2 \(unanswered\)/);
    expect(() => buildAftermathPrompt(packStory({ 6: null }))).toThrow(/slot 6 \(unanswered\)/);
  });

  it('refuses a base ending, which is never drawn', () => {
    expect(() => buildAftermathPrompt(packStory({ 6: optionAt(6, 0) }))).toThrow(/slot 6/);
  });

  it("refuses a base place: that is a free room's ordinary story, its ending a text card", () => {
    expect(() => buildAftermathPrompt(packStory({ 2: optionAt(2, 0) }))).toThrow(/base and chr26/);
    expect(() => buildAftermathPrompt(story({ 6: packOptionAt(6, 0) }))).toThrow(/base and chr26/);
  });

  it('refuses an option filed under the wrong slot', () => {
    expect(() => buildAftermathPrompt(packStory({ 2: packOptionAt(6, 0) }))).toThrow(/slot 2/);
    expect(() => buildAftermathPrompt(packStory({ 6: packOptionAt(2, 0) }))).toThrow(/slot 6/);
  });
});
