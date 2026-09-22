// SPDX-License-Identifier: AGPL-3.0-only

// `why.impress-a-pigeon` bubble: the pigeon in question, both eyes on one side of
// its head and neither of them impressed, next to the heart it was offered.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function ImpressAPigeon({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* body */}
      <path
        d="M40 52 q-2 -20 18 -22 q18 -1 22 14 q1 12 -14 15 q-16 3 -26 -7 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* tail */}
      <path d="M78 42 l6 -4 l-1 7 z" fill="#1f2937" />
      {/* wing */}
      <path
        d="M50 42 q10 -5 20 1 q-8 7 -20 3 z"
        fill="#fff"
        opacity="0.75"
        stroke="#1f2937"
        strokeWidth="1.5"
      />
      {/* head */}
      <circle cx="38" cy="33" r="9" fill="#60a5fa" stroke="#1f2937" strokeWidth="2.5" />
      <path d="M44 40 q-3 3 -1 6" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      {/* beak */}
      <path
        d="M29 33 l-6 2 l6 3 z"
        fill="#f59e0b"
        stroke="#1f2937"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* eyes: both on this side, one higher, both half-lidded */}
      <circle cx="35" cy="31" r="3.5" fill="#fff" stroke="#1f2937" strokeWidth="1.5" />
      <circle cx="41" cy="29.5" r="3" fill="#fff" stroke="#1f2937" strokeWidth="1.5" />
      <circle cx="35.5" cy="31.5" r="1.5" fill="#1f2937" />
      <circle cx="41" cy="30" r="1.3" fill="#1f2937" />
      <path d="M31.5 29 h6 M38.5 27 h5" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      {/* legs */}
      <path
        d="M50 56 v5 M58 56 v5 M46 61 h8 M54 61 h8"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* the offering */}
      <path
        d="M64 21 q-4 -6 -8 -1 q-2 4 8 10 q10 -6 8 -10 q-4 -5 -8 1 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
