// SPDX-License-Identifier: AGPL-3.0-only

// Step 133 (B-29 #9): a Christmas story's ending — its picture when it came,
// the holly card otherwise (the owner's pick of 2026-11-28, D2: card 1).

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import StoryEnding from './StoryEnding';
import { BELL, SPRIG } from './art/hollyArt';

const PICTURE = { url: 'https://img.example/i/end.png', width: 512, height: 512 };

describe('StoryEnding', () => {
  it('shows the ending picture when it came', () => {
    render(<StoryEnding ending={PICTURE} text="They sang." language="en" alt="How it ended" />);
    expect(screen.getByAltText<HTMLImageElement>('How it ended').src).toBe(PICTURE.url);
    expect(screen.queryByTestId('ending-card')).toBeNull();
  });

  it('shows the ending as the holly card otherwise: the bell and a sprig on two corners', () => {
    render(<StoryEnding ending={null} text="They sang." language="en" alt="How it ended" />);
    const card = screen.getByTestId('ending-card');
    expect(card.textContent).toBe('They sang.');
    expect(card.getAttribute('lang')).toBe('en');
    expect(card.getAttribute('dir')).toBe('ltr');
    const pictures = [...card.querySelectorAll('svg')];
    expect(pictures).toHaveLength(3);
    // Decoration: hidden from screen readers, the words alone read out.
    for (const svg of pictures) expect(svg.getAttribute('aria-hidden')).toBe('true');
    const drawn = (d: string | undefined) => card.querySelectorAll(`path[d="${d ?? ''}"]`).length;
    expect(drawn(BELL.parts[0]?.d)).toBe(1);
    // Two leaves on each sprig.
    expect(drawn(SPRIG.parts[0]?.d)).toBe(4);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('writes a right-to-left ending in its direction', () => {
    render(<StoryEnding ending={null} text="כולם שרו." language="he" alt="" />);
    expect(screen.getByTestId('ending-card').getAttribute('dir')).toBe('rtl');
  });
});
