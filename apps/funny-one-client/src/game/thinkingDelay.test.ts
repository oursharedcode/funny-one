// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import {
  pickThinkingDelayMs,
  THINKING_DELAY_MAX_MS,
  THINKING_DELAY_MIN_MS,
} from './thinkingDelay.js';

describe('pickThinkingDelayMs', () => {
  it('returns the floor at rng() = 0', () => {
    expect(pickThinkingDelayMs(() => 0)).toBe(THINKING_DELAY_MIN_MS);
  });

  it('approaches but never reaches the ceiling as rng() approaches 1', () => {
    const delay = pickThinkingDelayMs(() => 0.999999);
    expect(delay).toBeLessThan(THINKING_DELAY_MAX_MS);
    expect(delay).toBeGreaterThan(THINKING_DELAY_MIN_MS);
  });

  it('stays within 0.8–1.5 s (FO-BOT-1) across the real Math.random source', () => {
    for (let i = 0; i < 200; i++) {
      const delay = pickThinkingDelayMs();
      expect(delay).toBeGreaterThanOrEqual(THINKING_DELAY_MIN_MS);
      expect(delay).toBeLessThan(THINKING_DELAY_MAX_MS);
    }
  });
});
