// SPDX-License-Identifier: AGPL-3.0-only

// The rig compositor (T-FO-4.2, FO-IMG-1/3): stacks a story's drawn answers
// into one scene — CSS layering, not canvas (funny-one-design.md §3,
// FM-NFR-2's low-end-Android bar applies here too). Layer order/positions
// follow rig/RIG_ART.md's canvas conventions.
//
// `reveal` drives the spring-physics layer-by-layer assembly (FO-IMG-3),
// reusing motion.ts's `goofy` preset unmodified rather than a new animation
// system. `reveal={false}` renders every layer already settled — the mode
// T-FO-4.3's gallery needs, since a finished story shouldn't replay its
// reveal every time it scrolls into view.

import { motion } from 'framer-motion';
import type { SlotIndex, Story } from '@funny/shared';
import { RIG_INDEX } from './art/rig/rigIndex';
import { goofy } from '../styles/motion';

interface Props {
  story: Story;
  reveal?: boolean;
  className?: string;
}

/**
 * Stack order and stage position per RIG_ART.md: where -> who -> with -> did
 * -> when -> why, z-index 0-5. `who`/`with` are bottom-anchored thirds on
 * opposite sides; `did` bridges them in the foreground; `when` is a badge
 * pinned top-left, and `why` a thought bubble just inboard of it, floating
 * over `who`'s head. `enter` is the pre-reveal offset: ground layers rise in,
 * the badge and bubble drop in, the background just fades.
 */
const LAYERS: readonly {
  slot: SlotIndex;
  z: number;
  position: string;
  enter: { scale: number; y: number };
}[] = [
  { slot: 2, z: 0, position: 'inset-0', enter: { scale: 1, y: 0 } },
  { slot: 0, z: 1, position: 'bottom-0 left-0 h-2/3 w-1/3', enter: { scale: 0.6, y: 16 } },
  { slot: 1, z: 2, position: 'bottom-0 right-0 h-2/3 w-1/3', enter: { scale: 0.6, y: 16 } },
  {
    slot: 4,
    z: 3,
    position: 'bottom-[10%] left-1/2 h-1/3 w-1/3 -translate-x-1/2',
    enter: { scale: 0.6, y: 16 },
  },
  { slot: 3, z: 4, position: 'top-[4%] left-[3%] h-[30%] w-[22%]', enter: { scale: 0.6, y: -16 } },
  { slot: 5, z: 5, position: 'top-[6%] left-[26%] h-[30%] w-[22%]', enter: { scale: 0.6, y: -16 } },
];

const LAYER_STAGGER_S = 0.35;

export default function RigScene({ story, reveal = false, className = '' }: Props) {
  return (
    <div className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-amber-50 ${className}`}>
      {LAYERS.map(({ slot, z, position, enter }, i) => {
        const optionId = story.answers[slot];
        if (!optionId) return null;
        const Art = RIG_INDEX[optionId];
        if (!Art) return null;

        return (
          <motion.div
            key={slot}
            className={`absolute ${position}`}
            style={{ zIndex: z }}
            initial={reveal ? { opacity: 0, ...enter } : false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...goofy, delay: reveal ? i * LAYER_STAGGER_S : 0 }}
          >
            <Art className="h-full w-full" />
          </motion.div>
        );
      })}
    </div>
  );
}
