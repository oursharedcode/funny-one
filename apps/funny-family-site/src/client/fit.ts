// SPDX-License-Identifier: AGPL-3.0-only

// Step 76: a word wider than its line on a narrow phone — German's one-word
// name in the header, Tamil's long words there and on a game's card — makes
// its font shrink until the word fits, as the games' home titles do (Step 74,
// Wordmark.tsx), rather than run under the language picker or widen the page.
// The stylesheet keeps each box to its share of the line; here the font steps
// down until no word sticks out of the box, never below FLOOR_PX. A word too
// wide even then breaks inside (the page's overflow-wrap: break-word), which
// is also what a visitor without this script sees.

/** What may shrink: the family's name in the header, a game's name on its card. */
const FITTED = '.brand span, .game h3';

/** The smallest a fitted text gets; below it a word breaks instead. */
const FLOOR_PX = 12;

/**
 * Steps `el`'s font down until no word sticks out of its box. Returns the size
 * it set, or 0 when the stylesheet's size fits (or the box is not laid out).
 */
export function fitText(el: HTMLElement, floor = FLOOR_PX): number {
  el.style.fontSize = '';
  // Measured with words kept whole: break-word would hide the overflow.
  el.style.overflowWrap = 'normal';
  const room = el.clientWidth;
  let size = parseFloat(getComputedStyle(el).fontSize);
  let fitted = 0;
  while (room > 0 && el.scrollWidth > room && size > floor) {
    size = Math.max(floor, Math.min(size - 1, Math.floor((size * room) / el.scrollWidth)));
    el.style.fontSize = `${size}px`;
    fitted = size;
  }
  el.style.overflowWrap = '';
  return fitted;
}

/** Fits the page's texts now, again once the web fonts are in (a fallback font
 *  measures differently), and whenever the window's width changes. */
export function initFit(win: Window): void {
  const doc = win.document;
  const fitted = [...doc.querySelectorAll<HTMLElement>(FITTED)];
  if (fitted.length === 0) return;
  let width = -1;
  const fitAll = (force: boolean) => {
    if (!force && win.innerWidth === width) return; // a height change only
    width = win.innerWidth;
    for (const el of fitted) fitText(el);
  };
  fitAll(true);
  void doc.fonts?.ready.then(() => fitAll(true));
  win.addEventListener('resize', () => fitAll(false));
}
