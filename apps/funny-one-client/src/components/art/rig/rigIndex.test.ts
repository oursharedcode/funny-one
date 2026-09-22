// SPDX-License-Identifier: AGPL-3.0-only

// Guards the one thing that can silently break here: a pool edit (add/remove/
// rename an option in POOLS[0/1/2/4]) losing its art, or the reverse — art
// left behind for an id the pool no longer has.

import { describe, expect, it } from 'vitest';
import { POOLS } from '@funny/shared';
import { RIG_INDEX } from './rigIndex';

const VISUAL_SLOTS = [0, 1, 2, 4] as const;

describe('RIG_INDEX', () => {
  it('has exactly one entry per visual-slot pool option, no more, no fewer', () => {
    const poolIds = new Set(VISUAL_SLOTS.flatMap((slot) => POOLS[slot].map((o) => o.id)));
    const indexIds = new Set(Object.keys(RIG_INDEX));

    expect(indexIds).toEqual(poolIds);
  });

  it('maps every id to a component', () => {
    for (const component of Object.values(RIG_INDEX)) {
      expect(typeof component).toBe('function');
    }
  });
});
