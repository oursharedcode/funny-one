// SPDX-License-Identifier: AGPL-3.0-only

// The first test in this repo, written before rotation.ts exists (FM-ARC-2 build
// order). Cases marked "ported" come from SRC/server/src/game.test.ts and must
// keep passing byte-for-byte in behaviour: the rotation is what makes two
// implementations of this game produce the same stories, so it is the one piece
// that may never drift from the source project.

import { describe, expect, it } from 'vitest';
import { storyIndex } from './rotation.js';

describe('storyIndex — rotation formula (FM-CORE-6, spec §4)', () => {
  // --------------------------------------------------------------------------
  // Known values (ported from SRC)
  // --------------------------------------------------------------------------

  it('N=3, R=0 — initial round, each player gets their own story', () => {
    expect(storyIndex(0, 0, 3)).toBe(0);
    expect(storyIndex(1, 0, 3)).toBe(1);
    expect(storyIndex(2, 0, 3)).toBe(2);
  });

  it('N=3, R=1 — matches the spec example: P0→S2, P1→S0, P2→S1', () => {
    expect(storyIndex(0, 1, 3)).toBe(2);
    expect(storyIndex(1, 1, 3)).toBe(0);
    expect(storyIndex(2, 1, 3)).toBe(1);
  });

  it('N=3, R=2 — second rotation', () => {
    expect(storyIndex(0, 2, 3)).toBe(1);
    expect(storyIndex(1, 2, 3)).toBe(2);
    expect(storyIndex(2, 2, 3)).toBe(0);
  });

  it('N=3, R=3 — wraps cleanly back to the identity assignment', () => {
    expect(storyIndex(0, 3, 3)).toBe(0);
    expect(storyIndex(1, 3, 3)).toBe(1);
    expect(storyIndex(2, 3, 3)).toBe(2);
  });

  it('N=5, R=6 — round count > player count, spec §1 says some repeats are intentional', () => {
    // (P - R) mod N with double-modulo to stay non-negative in JS.
    // P=0, R=6, N=5 → (-6 mod 5 + 5) mod 5 = (-1 + 5) mod 5 = 4
    expect(storyIndex(0, 6, 5)).toBe(4);
    expect(storyIndex(1, 6, 5)).toBe(0);
    expect(storyIndex(4, 6, 5)).toBe(3);
  });

  // --------------------------------------------------------------------------
  // Structural invariants (ported from SRC)
  // --------------------------------------------------------------------------

  it('N=7, R∈[0..6] — every player touches every story exactly once', () => {
    for (let p = 0; p < 7; p++) {
      const visited = new Set<number>();
      for (let r = 0; r < 7; r++) {
        visited.add(storyIndex(p, r, 7));
      }
      expect(visited.size).toBe(7);
    }
  });

  it('N=7, R∈[0..6] — every round is a bijection (no two players share a story)', () => {
    for (let r = 0; r < 7; r++) {
      const stories = new Set<number>();
      for (let p = 0; p < 7; p++) {
        stories.add(storyIndex(p, r, 7));
      }
      expect(stories.size).toBe(7);
    }
  });

  it('N=4 over a full 7-round game — each story receives every player at least once', () => {
    // With 4 players and 7 rounds, some stories see the same player twice.
    // The invariant we care about: every player visits every story at least once.
    for (let p = 0; p < 4; p++) {
      const visited = new Set<number>();
      for (let r = 0; r < 7; r++) {
        visited.add(storyIndex(p, r, 4));
      }
      expect(visited.size).toBe(4);
    }
  });

  // --------------------------------------------------------------------------
  // The shipped player range, 3–7 (FM-CORE-1). SRC spot-checked N=4 and N=7;
  // this repo is the shared implementation for the whole product family, so
  // cover every room size the game can actually be played at.
  // --------------------------------------------------------------------------

  it('N∈[3..7] — every round is a bijection at every supported room size', () => {
    for (let n = 3; n <= 7; n++) {
      for (let r = 0; r < 7; r++) {
        const stories = new Set<number>();
        for (let p = 0; p < n; p++) {
          stories.add(storyIndex(p, r, n));
        }
        expect(stories.size, `N=${n}, R=${r} must map players onto distinct stories`).toBe(n);
      }
    }
  });

  it('N∈[3..7] — a 7-round game visits every story from every seat', () => {
    for (let n = 3; n <= 7; n++) {
      for (let p = 0; p < n; p++) {
        const visited = new Set<number>();
        for (let r = 0; r < 7; r++) {
          visited.add(storyIndex(p, r, n));
        }
        expect(visited.size, `N=${n}, P=${p} must reach all ${n} stories`).toBe(n);
      }
    }
  });

  it('result always lands inside [0, N) — no negative modulo leaking through', () => {
    for (let n = 1; n <= 7; n++) {
      for (let p = 0; p < n; p++) {
        for (let r = 0; r < 40; r++) {
          const idx = storyIndex(p, r, n);
          expect(Number.isInteger(idx)).toBe(true);
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThan(n);
        }
      }
    }
  });

  it('N=1 — the modulo boundary collapses to the single story', () => {
    // Below the 3-player room minimum, but it is the edge the double-modulo
    // has to survive; future single-device products may call it with N=1.
    expect(storyIndex(0, 0, 1)).toBe(0);
    expect(storyIndex(0, 99, 1)).toBe(0);
  });

  it('is periodic in R with period N', () => {
    for (let n = 3; n <= 7; n++) {
      for (let p = 0; p < n; p++) {
        for (let r = 0; r < 20; r++) {
          expect(storyIndex(p, r, n)).toBe(storyIndex(p, r + n, n));
        }
      }
    }
  });

  // --------------------------------------------------------------------------
  // Range guards
  // --------------------------------------------------------------------------

  it('rejects invalid inputs (ported from SRC)', () => {
    expect(() => storyIndex(0, 0, 0)).toThrow(RangeError);
    expect(() => storyIndex(0, 0, -1)).toThrow(RangeError);
    expect(() => storyIndex(-1, 0, 3)).toThrow(RangeError);
    expect(() => storyIndex(0, -1, 3)).toThrow(RangeError);
    expect(() => storyIndex(1.5, 0, 3)).toThrow(RangeError);
  });

  it('rejects non-integer round and playerCount', () => {
    expect(() => storyIndex(0, 1.5, 3)).toThrow(RangeError);
    expect(() => storyIndex(0, 0, 3.5)).toThrow(RangeError);
  });

  it('rejects NaN and Infinity in every position', () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      expect(() => storyIndex(bad, 0, 3)).toThrow(RangeError);
      expect(() => storyIndex(0, bad, 3)).toThrow(RangeError);
      expect(() => storyIndex(0, 0, bad)).toThrow(RangeError);
    }
  });
});
