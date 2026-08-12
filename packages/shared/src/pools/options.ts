// SPDX-License-Identifier: AGPL-3.0-only

// Canonical option ids and English image-prompt fragments (FM-POOL-1/6, FM-IMG-2).
//
// ─── SCAFFOLD — content authored in T-1.4 ───────────────────────────────────
// The pools are intentionally empty right now. pools.test.ts is already written
// and fails against them (each slot reports 0 options against its 9–12 / 20–30
// minimum); that red is the T-1.3 → T-1.5 to-do list, per the task plan.
// ────────────────────────────────────────────────────────────────────────────
//
// Authoring rules, all enforced by pools.test.ts:
//   • id is `<slot prefix>.<kebab-slug>` and permanent once shipped (DD-1)
//   • visual slots (0, 1, 2, 4) carry `promptEn`; prose slots (3, 5, 6) do not
//   • `promptEn` is printable ASCII, ≤ 120 chars, and phrased to drop into the
//     skeleton from design §7.1:
//       'two distinct subjects: {0} on the left and {1} on the right, in {2}. They {4}'
//     so slot 2 reads as a bare noun phrase ("a kitchen"), not "in the kitchen"
//     — the skeleton supplies the preposition, while the *display* text supplies
//     whatever its own language's prose template needs.
//   • family-friendly and absurd; no real people, no brands (FM-POOL-6) — the
//     one rule no test can check, so it is on the author.

import type { Pools } from './schema.js';

export const POOLS: Pools = {
  0: [], // who      — visual, 9–12
  1: [], // withWhom — visual, 9–12
  2: [], // where    — visual, 9–12
  3: [], // when     — prose,  20–30
  4: [], // did      — visual, 9–12
  5: [], // why      — prose,  20–30
  6: [], // ending   — prose,  20–30
};

/** Every option id across all slots, in slot order. */
export const ALL_OPTION_IDS: readonly string[] = Object.values(POOLS).flatMap((options) =>
  options.map((option) => option.id),
);
