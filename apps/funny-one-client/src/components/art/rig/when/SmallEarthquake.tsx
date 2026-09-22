// SPDX-License-Identifier: AGPL-3.0-only

// `when.small-earthquake` badge: a tilted little house over a zigzag crack, wobble lines either
// side. Static — the compositor applies the reveal motion.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function SmallEarthquake({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      {/* cracked ground */}
      <path
        d="M16 68 h10 l6 -8 l6 12 l6 -10 l6 8 h10 l5 -6 l5 8 h14"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* tilted house */}
      <g transform="rotate(-9 50 46)">
        <rect
          x="38"
          y="42"
          width="24"
          height="18"
          fill="#60a5fa"
          stroke="#1f2937"
          strokeWidth="2.5"
        />
        <path
          d="M34 43 l16 -14 l16 14 z"
          fill="#ec4899"
          stroke="#1f2937"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <rect x="46" y="49" width="8" height="11" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
      </g>
      {/* wobble lines */}
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round" opacity="0.6">
        <path d="M22 34 q-5 5 0 10 M18 30 q-8 8 0 16" />
        <path d="M78 34 q5 5 0 10 M82 30 q8 8 0 16" />
      </g>
    </svg>
  );
}
