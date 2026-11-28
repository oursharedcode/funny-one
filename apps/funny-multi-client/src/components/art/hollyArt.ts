// SPDX-License-Identifier: AGPL-3.0-only
//
// The festive ending card's pictures (Step 133, B-29 #9; the owner's pick of
// 2026-11-28, D2: card 1, "Holly"): the gold bell with its red bow over the
// ending, and a holly sprig on two of the card's corners. Path data in each
// picture's own units, drawn as SVG on the screen (StoryEnding.tsx) and with
// Path2D on the clip's canvas (videoFooter.ts `drawEndingCard`), so that the
// screen and the clip show the same card.

/** One shape of a picture. Its strokes have round joins and caps. */
export interface ArtPart {
  /** SVG path data. */
  d: string;
  fill?: string;
  stroke?: string;
  /** The stroke's width, in the picture's units. */
  width?: number;
  /**
   * Shifted this far along x, then turned this many degrees about the
   * picture's origin — SVG's `rotate(turn) translate(shift 0)`.
   */
  turn?: number;
  shift?: number;
}

export interface Art {
  /** The square the picture is drawn in: its left, its top and its side. */
  box: readonly [number, number, number];
  parts: readonly ArtPart[];
}

const round = (value: number): number => Math.round(value * 100) / 100;

/** A circle as path data, so that every part is a path. */
function circle(cx: number, cy: number, r: number): string {
  return `M${round(cx - r)} ${cy} a${r} ${r} 0 1 0 ${round(2 * r)} 0 a${r} ${r} 0 1 0 ${round(-2 * r)} 0 Z`;
}

/** The card's frame: Tailwind's green-700, as the screen's `border-green-700`. */
export const HOLLY_FRAME = '#15803d';

/** The gold bell with a red bow, in a 64-unit square. */
export const BELL: Art = {
  box: [0, 0, 64],
  parts: [
    {
      d: 'M32 15 C22.5 15 19 23 19 32 C19 40 16 44.5 12 48 L52 48 C48 44.5 45 40 45 32 C45 23 41.5 15 32 15 Z',
      fill: '#fbbf24',
      stroke: '#b45309',
      width: 2,
    },
    // Its shine.
    { d: 'M25 31 C25 26 27.5 22 31 21', stroke: '#fef9c3', width: 3 },
    // Its rim and its clapper.
    {
      d: 'M12 47 H52 A3 3 0 0 1 52 53 H12 A3 3 0 0 1 12 47 Z',
      fill: '#f59e0b',
      stroke: '#b45309',
      width: 2,
    },
    { d: circle(32, 57.5, 4), fill: '#b45309' },
    // The bow: two loops, two tails, the knot.
    {
      d: 'M32 13 C25 4 13 6 17 14 C19 19 27 17 32 13 Z',
      fill: '#dc2626',
      stroke: '#991b1b',
      width: 1.5,
    },
    {
      d: 'M32 13 C39 4 51 6 47 14 C45 19 37 17 32 13 Z',
      fill: '#dc2626',
      stroke: '#991b1b',
      width: 1.5,
    },
    { d: 'M30 14 L24 25 L28 24.5 L31.5 15 Z', fill: '#b91c1c' },
    { d: 'M34 14 L40 25 L36 24.5 L32.5 15 Z', fill: '#b91c1c' },
    { d: circle(32, 13, 3.4), fill: '#991b1b' },
  ],
};

/** One holly leaf, from its stem at the origin to its tip at x = 32. */
const LEAF =
  'M0 0 Q3 -1.5 6 -7 Q8 -4 11 -4.5 Q14 -5 17 -9.5 Q19 -5 22 -5 Q25 -5 27 -7.5 Q28 -3 32 0 ' +
  'Q28 3 27 7.5 Q25 5 22 5 Q19 5 17 9.5 Q14 5 11 4.5 Q8 4 6 7 Q3 1.5 0 0 Z';
const LEAF_LOOK = { fill: '#16a34a', stroke: '#14532d', width: 1.4 };
const BERRY_LOOK = { fill: '#dc2626', stroke: '#7f1d1d', width: 1 };
const GLINT_LOOK = { fill: '#fecaca' };

/**
 * A holly sprig for a card's corner: a leaf along each of the corner's two
 * edges, and three berries on the corner itself, at the origin. As drawn it
 * fits a top-left corner; turned half round, a bottom-right one.
 */
export const SPRIG: Art = {
  box: [-10, -10, 64],
  parts: [
    { d: LEAF, ...LEAF_LOOK, turn: 10, shift: 3 },
    { d: LEAF, ...LEAF_LOOK, turn: 80, shift: 3 },
    // The leaves' midribs.
    { d: 'M3 0.5 L33 6', stroke: '#14532d', width: 1 },
    { d: 'M0.5 3 L6 33', stroke: '#14532d', width: 1 },
    { d: circle(2, 7, 4.6), ...BERRY_LOOK },
    { d: circle(8, 1.5, 4.6), ...BERRY_LOOK },
    { d: circle(1, -1, 4.6), ...BERRY_LOOK },
    { d: circle(0.6, 5.6, 1.2), ...GLINT_LOOK },
    { d: circle(6.6, 0.1, 1.2), ...GLINT_LOOK },
    { d: circle(-0.4, -2.4, 1.2), ...GLINT_LOOK },
  ],
};
