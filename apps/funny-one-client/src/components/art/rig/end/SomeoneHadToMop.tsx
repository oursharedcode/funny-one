// SPDX-License-Identifier: AGPL-3.0-only

// `end.someone-had-to-mop` stamp: mop, bucket, and the puddle that made both
// necessary.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function SomeoneHadToMop({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      {/* the puddle */}
      <path
        d="M26 64 q10 -5 23 -2 q11 3 24 -2 q3 8 -9 10 q-19 3 -32 0 q-8 -2 -6 -6 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* bucket */}
      <path
        d="M54 48 q8 -10 16 0"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M52 48 h20 l-3 16 h-14 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* mop */}
      <path d="M31 62 l13 -32" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M25 62 q5 -12 14 -7 q-2 11 -10 13 q-6 1 -4 -6 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M29 58 l-1 6 M33 58 l0 6 M37 56 l2 6"
        stroke="#1f2937"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
