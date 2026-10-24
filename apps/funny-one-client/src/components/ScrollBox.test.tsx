// SPDX-License-Identifier: AGPL-3.0-only

// Step 91. A list that opens with one row pressed shows that row. jsdom has no
// layout, so the rects are stubbed: a 160 px viewport at y 100, rows 40 px tall.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScrollBox from './ScrollBox';

function rect(top: number, height: number): DOMRect {
  return {
    top,
    bottom: top + height,
    height,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: top,
    toJSON() {},
  };
}

// Row i sits at 100 + 40 * i - scrollTop of the viewport it is in.
function stubLayout(): void {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.getAttribute('role') === 'group') return rect(100, 160);
    const view = this.closest<HTMLElement>('[role="group"]');
    const i = Number(this.dataset.i ?? 0);
    return rect(100 + 40 * i - (view?.scrollTop ?? 0), 40);
  });
}

function renderList(pressed: number) {
  render(
    <ScrollBox role="group" aria-label="list" className="h-40">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <button key={i} data-i={i} aria-pressed={i === pressed}>
          {`row ${i}`}
        </button>
      ))}
    </ScrollBox>,
  );
  return screen.getByRole('group', { name: 'list' });
}

afterEach(() => vi.restoreAllMocks());

describe('ScrollBox', () => {
  it('centres a pressed row that starts below the fold', () => {
    stubLayout();
    // row 6: top 340, viewport 100–260 → scroll by 340 - 100 - (160 - 40) / 2 = 180
    expect(renderList(6).scrollTop).toBe(180);
  });

  it('leaves the list alone when the pressed row is already visible', () => {
    stubLayout();
    expect(renderList(1).scrollTop).toBe(0);
  });

  it('leaves the list alone when nothing is pressed', () => {
    stubLayout();
    expect(renderList(-1).scrollTop).toBe(0);
  });
});
