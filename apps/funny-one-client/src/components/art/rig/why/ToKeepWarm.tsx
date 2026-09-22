// SPDX-License-Identifier: AGPL-3.0-only

// `why.to-keep-warm` bubble: a campfire — two crossed logs, three nested flame
// tongues, a few sparks.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function ToKeepWarm({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* flames */}
      <path
        d="M52 18 q-14 12 -10 24 q2 8 10 8 q8 0 10 -8 q4 -12 -10 -24 z"
        fill="#ef4444"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M52 30 q-8 8 -6 14 q2 5 6 5 q4 0 6 -5 q2 -6 -6 -14 z" fill="#f59e0b" />
      <path d="M52 39 q-4 4 -3 7 q1 3 3 3 q2 0 3 -3 q1 -3 -3 -7 z" fill="#facc15" />
      {/* sparks */}
      <g fill="#f59e0b">
        <circle cx="36" cy="26" r="1.5" />
        <circle cx="68" cy="24" r="1.5" />
        <circle cx="66" cy="34" r="1" />
      </g>
      {/* logs */}
      <path d="M36 56 l32 -8 M36 48 l32 8" stroke="#1f2937" strokeWidth="9" strokeLinecap="round" />
      <path d="M36 56 l32 -8 M36 48 l32 8" stroke="#fde68a" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
