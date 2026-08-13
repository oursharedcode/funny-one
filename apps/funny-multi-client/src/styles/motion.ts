// SPDX-License-Identifier: AGPL-3.0-only

// The three named spring presets from DESIGN_SYSTEM.md §4. Use these
// everywhere; do not invent a fourth without a documented reason.

export const snappy = { type: 'spring', stiffness: 400, damping: 30 } as const;
export const goofy = { type: 'spring', stiffness: 180, damping: 12 } as const;
export const panic = { type: 'spring', stiffness: 700, damping: 8 } as const;

/**
 * The phase transition, per spec §17 / DESIGN_SYSTEM.md §17.
 *
 * **Forward direction is locked**: the incoming screen always enters from the
 * left and the outgoing one always exits to the right, whichever way the phase
 * machine actually moved. Leaving a lobby back to Home animates exactly like
 * starting a game — a party game should feel like it is going somewhere, and a
 * back-slide reads as an undo the game does not offer.
 *
 * Named and exported rather than written inline in `App.tsx` so the lock is
 * something a test can hold: the whole point is that these values do **not**
 * vary with direction, which is invisible in a screenshot and easy to
 * "improve" into a directional slide later (`App.test.tsx`).
 *
 * `AnimatePresence` deliberately runs without `mode="wait"` — the outgoing
 * screen exits as the incoming one enters, which keeps the round cadence tight.
 */
export const screenSlide = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
  transition: snappy,
} as const;
