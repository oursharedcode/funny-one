// SPDX-License-Identifier: AGPL-3.0-only

// Copied verbatim from apps/funny-multi-client/src/styles/motion.ts (steering/
// funny-one-design.md §2: motion presets are shared unmodified between the
// two products).

export const snappy = { type: 'spring', stiffness: 400, damping: 30 } as const;
export const goofy = { type: 'spring', stiffness: 180, damping: 12 } as const;
export const panic = { type: 'spring', stiffness: 700, damping: 8 } as const;

/**
 * The phase transition. Forward direction is locked: the incoming screen
 * always enters from the left and the outgoing one always exits to the
 * right, whichever way the phase machine actually moved (mirrors Funny
 * Multi's lock — see its motion.ts for the full rationale).
 */
export const screenSlide = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
  transition: snappy,
} as const;
