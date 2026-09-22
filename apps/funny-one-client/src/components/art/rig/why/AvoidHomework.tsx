// SPDX-License-Identifier: AGPL-3.0-only

// `why.avoid-homework` bubble: the homework — a lined notebook with a pink
// spine — crossed out in red, pencil dropped on top of it.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function AvoidHomework({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* the homework */}
      <rect
        x="32"
        y="22"
        width="36"
        height="36"
        rx="2"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path
        d="M32 24 q0 -2 2 -2 h6 v36 h-6 q-2 0 -2 -2 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <g stroke="#1f2937" strokeWidth="1.8" strokeLinecap="round" opacity="0.6">
        <path d="M45 31 h17 M45 38 h17 M45 45 h12 M45 52 h15" />
      </g>
      {/* not today */}
      <path
        d="M40 28 l24 24 M64 28 l-24 24"
        stroke="#ef4444"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* pencil, down */}
      <g transform="rotate(40 66 44)">
        <rect
          x="58"
          y="40"
          width="18"
          height="8"
          rx="1"
          fill="#facc15"
          stroke="#1f2937"
          strokeWidth="2"
        />
        <rect
          x="58"
          y="40"
          width="4"
          height="8"
          rx="1"
          fill="#ec4899"
          stroke="#1f2937"
          strokeWidth="2"
        />
        <path
          d="M76 40 l6 4 l-6 4 z"
          fill="#fde68a"
          stroke="#1f2937"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M80 42.7 l2 1.3 l-2 1.3 z" fill="#1f2937" />
      </g>
    </svg>
  );
}
