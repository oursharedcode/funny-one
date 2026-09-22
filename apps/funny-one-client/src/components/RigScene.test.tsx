// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import type { Story } from '@funny/shared';
import RigScene from './RigScene';

function storyWith(answers: (string | null)[]): Story {
  const full = new Array<string | null>(7).fill(null);
  answers.forEach((a, i) => {
    full[i] = a;
  });
  return { answers: full, picture: null };
}

const FULL_STORY = storyWith([
  'who.grumpy-pirate',
  'with.angry-geese',
  'where.messy-kitchen',
  'when.hat-festival',
  'did.juggling-pancakes',
  'why.impress-a-pigeon',
  'end.duck-complaint',
]);

describe('RigScene', () => {
  it('renders all 7 drawn layers in background-to-foreground z-order', () => {
    const { container } = render(<RigScene story={FULL_STORY} />);
    const layers = Array.from(container.querySelectorAll('[style*="z-index"]')) as HTMLElement[];
    expect(layers).toHaveLength(7);
    const zIndexes = layers.map((el) => Number(el.style.zIndex));
    expect(zIndexes).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('keeps the z-order of the layers it does draw when a story has gaps', () => {
    const gappy = storyWith([
      'who.grumpy-pirate',
      null,
      null,
      null,
      null,
      null,
      'end.duck-complaint',
    ]);
    const { container } = render(<RigScene story={gappy} />);
    const layers = Array.from(container.querySelectorAll('[style*="z-index"]')) as HTMLElement[];
    expect(layers.map((el) => Number(el.style.zIndex))).toEqual([1, 6]);
  });

  it('renders only the layers that have an answer for a partial story', () => {
    const partial = storyWith(['who.grumpy-pirate']);
    const { container } = render(<RigScene story={partial} />);
    expect(container.querySelectorAll('[style*="z-index"]')).toHaveLength(1);
  });

  it('renders nothing for an unanswered story', () => {
    const empty = storyWith([]);
    const { container } = render(<RigScene story={empty} />);
    expect(container.querySelectorAll('[style*="z-index"]')).toHaveLength(0);
  });

  it('renders the settled scene whether or not reveal is requested', () => {
    const revealed = render(<RigScene story={FULL_STORY} reveal />);
    const settled = render(<RigScene story={FULL_STORY} reveal={false} />);
    expect(revealed.container.querySelectorAll('svg')).toHaveLength(7);
    expect(settled.container.querySelectorAll('svg')).toHaveLength(7);
  });
});
