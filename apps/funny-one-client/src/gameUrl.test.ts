// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, describe, expect, it, vi } from 'vitest';
import { gameUrl } from './gameUrl';

describe('gameUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is the serving origin plus the root mount point', () => {
    vi.stubEnv('BASE_URL', '/');
    expect(gameUrl()).toBe(`${window.location.origin}/`);
  });

  // The owner's VM serves the build under /funny1-game (T-FO-6.2) — the QR
  // code on an exported picture must land there, not at the host's root.
  it('keeps the sub-path the build is served under', () => {
    vi.stubEnv('BASE_URL', '/funny1-game/');
    expect(gameUrl()).toBe(`${window.location.origin}/funny1-game/`);
  });
});
