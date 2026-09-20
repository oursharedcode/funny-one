// SPDX-License-Identifier: AGPL-3.0-only

// FO-BOT-1's "short comedic thinking delay" (archive ONE-4): a virtual seat's
// turn has no natural network latency to read as a turn the way a human
// player's does, so this stands in for it. RNG is injected, same pattern as
// `roundRobin.ts`'s `pickVirtualAnswer`, so a caller — and this module's
// tests — can stay deterministic; real play defaults to `Math.random`.

export const THINKING_DELAY_MIN_MS = 800;
export const THINKING_DELAY_MAX_MS = 1500;

export function pickThinkingDelayMs(rng: () => number = Math.random): number {
  return THINKING_DELAY_MIN_MS + rng() * (THINKING_DELAY_MAX_MS - THINKING_DELAY_MIN_MS);
}
