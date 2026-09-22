// SPDX-License-Identifier: AGPL-3.0-only

// `end.smelled-like-lemons` stamp: one tilted lemon with a leaf, and the smell
// coming off it in little waves.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function SmelledLikeLemons({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round" opacity="0.55">
        <path d="M30 34 q4 -5 8 0 t8 0" fill="none" />
        <path d="M52 30 q4 -5 8 0 t8 0" fill="none" />
      </g>
      <g transform="rotate(-12 50 56)">
        <ellipse
          cx="50"
          cy="56"
          rx="18"
          ry="13"
          fill="#facc15"
          stroke="#1f2937"
          strokeWidth="2.5"
        />
        <path
          d="M32 52 q-5 1 -4 4 M68 60 q5 -1 4 -4"
          fill="none"
          stroke="#1f2937"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M40 49 q6 -4 13 -2"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity="0.75"
        />
      </g>
      <path
        d="M57 42 q11 -2 13 -11 q-12 0 -13 11 z"
        fill="#10b981"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
