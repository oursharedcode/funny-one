// SPDX-License-Identifier: AGPL-3.0-only

// Guards the one thing that can silently break here: a pool edit (add/remove/
// rename an option in a slot the rig draws) losing its art, or the reverse — art
// left behind for an id the pool no longer has.
//
// RIG_SLOTS is Funny One's own list, deliberately not shared's VISUAL_SLOTS:
// that one drives Funny Multi's AI prompt and stays at the 4 prose-free slots.
// Since T-FO-4.2c the rig draws all seven, so this covers every pool.

import { describe, expect, it } from 'vitest';
import { POOLS } from '@funny/shared';
import { RIG_INDEX } from './rigIndex';

const RIG_SLOTS = [0, 1, 2, 3, 4, 5, 6] as const;

describe('RIG_INDEX', () => {
  it('has exactly one entry per rig-slot pool option, no more, no fewer', () => {
    const poolIds = new Set(RIG_SLOTS.flatMap((slot) => POOLS[slot].map((o) => o.id)));
    const indexIds = new Set(Object.keys(RIG_INDEX));

    expect(indexIds).toEqual(poolIds);
  });

  it('maps every id to a component', () => {
    for (const component of Object.values(RIG_INDEX)) {
      expect(typeof component).toBe('function');
    }
  });
});
