// SPDX-License-Identifier: AGPL-3.0-only

// `end.neighbors-applauded` stamp: two hands mid-clap under a window that is
// still lit, because the neighbours stayed up for this.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function NeighborsApplauded({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      <rect
        x="24"
        y="24"
        width="15"
        height="15"
        rx="1.5"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M31.5 24 v15 M24 31.5 h15" stroke="#1f2937" strokeWidth="1.8" />
      <g stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round">
        <path d="M50 34 v-6 M35 40 l-4 -4 M65 40 l4 -4 M28 56 h-5 M72 56 h5" />
      </g>
      <g transform="rotate(-18 50 56)">
        <path
          d="M50 44 h-11 a7 7 0 0 0 -7 7 v9 a7 7 0 0 0 7 7 h11 z"
          fill="#fde68a"
          stroke="#1f2937"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M37 50 h13 M37 55.5 h13 M37 61 h13"
          stroke="#1f2937"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.55"
        />
      </g>
      <g transform="rotate(18 50 56)">
        <path
          d="M50 44 h11 a7 7 0 0 1 7 7 v9 a7 7 0 0 1 -7 7 h-11 z"
          fill="#fde68a"
          stroke="#1f2937"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M63 50 h-13 M63 55.5 h-13 M63 61 h-13"
          stroke="#1f2937"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.55"
        />
      </g>
    </svg>
  );
}
