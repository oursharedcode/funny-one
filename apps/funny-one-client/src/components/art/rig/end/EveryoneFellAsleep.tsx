// SPDX-License-Identifier: AGPL-3.0-only

// `end.everyone-fell-asleep` stamp: a heap of blanket with three sets of shut
// eyes in it, and the Zs drawn as paths (no <text>).

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function EveryoneFellAsleep({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      <path
        d="M68 24 h7 l-7 8 h7"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M50 38 h13 l-13 14 h13"
        fill="none"
        stroke="#1f2937"
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M25 70 q3 -18 15 -18 q7 0 10 6 q4 -10 14 -10 q13 0 14 22 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M31 62 q3 3.5 6 0 M41 60 q3 3.5 6 0 M56 55 q3 3.5 6 0"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
