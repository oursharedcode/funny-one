// SPDX-License-Identifier: AGPL-3.0-only

// The rig compositor (T-FO-4.2, FO-IMG-1/3): stacks a story's drawn answers
// into one scene — CSS layering, not canvas (funny-one-design.md §3,
// FM-NFR-2's low-end-Android bar applies here too). Layer order/positions
// follow rig/RIG_ART.md's canvas conventions, pulled out into
// `rigGeometry.ts` (T-FO-4.3b) so the same numbers drive both this on-screen
// layout and the canvas exporter's PNG composite.
//
// `reveal` drives the spring-physics layer-by-layer assembly (FO-IMG-3),
// reusing motion.ts's `goofy` preset unmodified rather than a new animation
// system. `reveal={false}` renders every layer already settled — the mode
// T-FO-4.3's gallery needs, since a finished story shouldn't replay its
// reveal every time it scrolls into view.

import { motion } from 'framer-motion';
import type { Story } from '@funny/shared';
import { RIG_INDEX } from './art/rig/rigIndex';
import { RIG_LAYERS, LAYER_STAGGER_S } from './art/rig/rigGeometry';
import { goofy } from '../styles/motion';

interface Props {
  story: Story;
  reveal?: boolean;
  className?: string;
}

export default function RigScene({ story, reveal = false, className = '' }: Props) {
  return (
    <div className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-amber-50 ${className}`}>
      {RIG_LAYERS.map(({ slot, z, xPct, yPct, wPct, hPct, rotate = 0, enter }, i) => {
        const optionId = story.answers[slot];
        if (!optionId) return null;
        const Art = RIG_INDEX[optionId];
        if (!Art) return null;

        return (
          <motion.div
            key={slot}
            className="absolute"
            style={{
              zIndex: z,
              left: `${xPct}%`,
              top: `${yPct}%`,
              width: `${wPct}%`,
              height: `${hPct}%`,
            }}
            initial={reveal ? { opacity: 0, rotate, ...enter } : false}
            animate={{ opacity: 1, scale: 1, y: 0, rotate }}
            transition={{ ...goofy, delay: reveal ? i * LAYER_STAGGER_S : 0 }}
          >
            <Art className="h-full w-full" />
          </motion.div>
        );
      })}
    </div>
  );
}
