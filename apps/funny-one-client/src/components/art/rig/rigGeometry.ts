// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-4.3b: pulled out of `RigScene.tsx` (previously a table of Tailwind
// position classes, e.g. `bottom-0 left-0 h-2/3 w-1/3`) into numeric
// percentages of the RIG_ART.md 4:3 stage. `RigScene` reads this for its own
// absolute positioning; `rigExport.ts`'s canvas compositor reads the exact
// same numbers to place each layer in a downloaded/shared PNG — a shared
// source of truth rather than a canvas-side re-derivation of what the
// Tailwind classes used to mean, which could silently drift from the live
// screen layout.
//
// The numbers themselves are unchanged from the Tailwind version — same
// stage geometry, same z-order, same reveal offsets — see `RigScene.tsx`'s
// doc comment for what each layer represents.

import type { SlotIndex } from '@funny/shared';

export interface RigLayerGeometry {
  slot: SlotIndex;
  z: number;
  /** Percentages of the 4:3 stage (RIG_ART.md's 400×300 canvas convention). */
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  /** Settled tilt — only the `end` stamp has one. */
  rotate?: number;
  /** Pre-reveal offset (T-FO-4.2, FO-IMG-3). */
  enter: { scale: number; y: number; rotate?: number };
}

export const RIG_LAYERS: readonly RigLayerGeometry[] = [
  { slot: 2, z: 0, xPct: 0, yPct: 0, wPct: 100, hPct: 100, enter: { scale: 1, y: 0 } },
  {
    slot: 0,
    z: 1,
    xPct: 0,
    yPct: 100 - 200 / 3,
    wPct: 100 / 3,
    hPct: 200 / 3,
    enter: { scale: 0.6, y: 16 },
  },
  {
    slot: 1,
    z: 2,
    xPct: 100 - 100 / 3,
    yPct: 100 - 200 / 3,
    wPct: 100 / 3,
    hPct: 200 / 3,
    enter: { scale: 0.6, y: 16 },
  },
  {
    slot: 4,
    z: 3,
    xPct: 50 - 100 / 6,
    yPct: 90 - 100 / 3,
    wPct: 100 / 3,
    hPct: 100 / 3,
    enter: { scale: 0.6, y: 16 },
  },
  { slot: 3, z: 4, xPct: 3, yPct: 4, wPct: 22, hPct: 30, enter: { scale: 0.6, y: -16 } },
  { slot: 5, z: 5, xPct: 26, yPct: 6, wPct: 22, hPct: 30, enter: { scale: 0.6, y: -16 } },
  {
    slot: 6,
    z: 6,
    xPct: 73,
    yPct: 4,
    wPct: 24,
    hPct: 28,
    rotate: -8,
    enter: { scale: 1.7, y: -12, rotate: 10 },
  },
];

export const LAYER_STAGGER_S = 0.35;
