// SPDX-License-Identifier: AGPL-3.0-only

// `why.one-grape` bubble: one (1) grape on a little prize plinth, with a stem, a
// leaf and — in fairness — a very good shine.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function OneGrape({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* plinth */}
      <path
        d="M38 60 h28 l-3 -6 h-22 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* the grape */}
      <circle cx="52" cy="40" r="14" fill="#10b981" stroke="#1f2937" strokeWidth="2.5" />
      <path
        d="M45 34 q3 -4 7 -3"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* stem + leaf */}
      <path d="M54 26 q2 -6 6 -8" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M58 20 q8 -4 10 4 q-8 4 -10 -4 z"
        fill="#10b981"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* shine */}
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round">
        <path d="M30 30 v6 M27 33 h6 M74 36 v6 M71 39 h6 M36 20 v4 M34 22 h4" />
      </g>
    </svg>
  );
}
