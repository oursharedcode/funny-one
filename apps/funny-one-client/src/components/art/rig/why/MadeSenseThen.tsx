// SPDX-License-Identifier: AGPL-3.0-only

// `why.made-sense-then` bubble: a lit bulb with a confident tick on it — and one
// small doubt curl that turned up later.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function MadeSenseThen({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* bulb */}
      <path
        d="M52 18 q-16 1 -16 16 q0 8 6 13 q3 3 3 8 h14 q0 -5 3 -8 q6 -5 6 -13 q0 -15 -16 -16 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect
        x="45"
        y="55"
        width="14"
        height="5"
        rx="1.5"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2"
      />
      <rect x="47" y="60" width="10" height="3" rx="1.5" fill="#1f2937" />
      {/* the tick that felt right */}
      <path
        d="M44 36 l6 6 l11 -12"
        stroke="#10b981"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* rays */}
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round">
        <path d="M32 30 l-5 -3 M72 30 l5 -3 M30 40 h-6 M74 40 h6" />
      </g>
      {/* ...and the small doubt that came later */}
      <path
        d="M72 50 q5 -4 2 -7 q-3 -3 -6 1"
        stroke="#ec4899"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="72.5" cy="55" r="1.4" fill="#ec4899" />
    </svg>
  );
}
