// SPDX-License-Identifier: AGPL-3.0-only

// `end.feelings-about-pasta` stamp: a bowl of spaghetti with a heart over it.
// The feelings were strong and they were about pasta.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function FeelingsAboutPasta({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      {/* the feelings */}
      <path
        d="M50 27 q-3 -5 -7 -1.5 q-3 3 0.8 6.4 l6.2 5.6 l6.2 -5.6 q3.8 -3.4 0.8 -6.4 q-4 -3.5 -7 1.5 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* the pasta */}
      <path
        d="M31 54 q5 -12 19 -12 q14 0 19 12 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M37 50 q6 -6 12 -3 M45 46 q6 -5 12 -1"
        fill="none"
        stroke="#1f2937"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="43" cy="49" r="4" fill="#ef4444" stroke="#1f2937" strokeWidth="2" />
      <circle cx="57" cy="51" r="3.5" fill="#ef4444" stroke="#1f2937" strokeWidth="2" />
      {/* the bowl */}
      <path
        d="M28 54 h44 q0 18 -22 18 q-22 0 -22 -18 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <ellipse cx="50" cy="54" rx="22" ry="4" fill="#fff" stroke="#1f2937" strokeWidth="2.5" />
    </svg>
  );
}
