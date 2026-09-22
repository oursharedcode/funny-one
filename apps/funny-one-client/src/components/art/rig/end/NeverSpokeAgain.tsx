// SPDX-License-Identifier: AGPL-3.0-only

// `end.never-spoke-again` stamp: a speech bubble struck out in red. The
// agreement was unanimous.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function NeverSpokeAgain({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      <path
        d="M30 32 h40 q4 0 4 4 v20 q0 4 -4 4 h-20 l-10 9 v-9 h-10 q-4 0 -4 -4 v-20 q0 -4 4 -4 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round" opacity="0.35">
        <path d="M36 42 h28 M36 50 h20" />
      </g>
      <path
        d="M36 38 l28 20 M64 38 l-28 20"
        stroke="#ef4444"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
