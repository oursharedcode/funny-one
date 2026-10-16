// SPDX-License-Identifier: AGPL-3.0-only

// Step 74: a title word wider than the column shrinks the font until it fits.
// jsdom has no layout, so the column's width and the title's width are stubbed:
// the title is 10 px wide per px of font.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Wordmark from './Wordmark';

const ROOM = 272; // a 320 px screen less the column's 24 px padding each side
let perPx = 10;

beforeEach(() => {
  perPx = 10;
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(ROOM);
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.tagName === 'H1' ? parseFloat(getComputedStyle(this).fontSize) * perPx : 0;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderInColumn() {
  render(
    <div>
      <style>{'h1 { font-size: 48px }'}</style>
      <Wordmark />
    </div>,
  );
  return screen.getByRole('heading', { level: 1 });
}

describe('Wordmark', () => {
  it('keeps its own size when the title fits', () => {
    perPx = 5; // 240 px at 48 px
    expect(renderInColumn().style.fontSize).toBe('');
  });

  it('shrinks a title wider than the column until it fits', () => {
    // 480 px at 48 px → 27 px is the largest whole size within 272 px.
    expect(renderInColumn().style.fontSize).toBe('27px');
  });

  it('never shrinks below 24 px', () => {
    perPx = 40;
    expect(renderInColumn().style.fontSize).toBe('24px');
  });
});
