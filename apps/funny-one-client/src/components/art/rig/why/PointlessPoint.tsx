// SPDX-License-Identifier: AGPL-3.0-only

// `why.pointless-point` bubble: a mitten of a hand pointing very firmly at a
// dotted circle of nothing in particular.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function PointlessPoint({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* cuff */}
      <rect
        x="20"
        y="34"
        width="10"
        height="22"
        rx="2"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      {/* the point */}
      <path
        d="M29 34 h33 q5 0 5 4 q0 4 -5 4 h-14 q2 3 2 6 v4 q0 4 -4 4 h-17 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M34 47 h11 M34 52 h9" stroke="#1f2937" strokeWidth="1.8" strokeLinecap="round" />
      {/* ...at nothing */}
      <circle
        cx="78"
        cy="40"
        r="6"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2"
        strokeDasharray="3 2.5"
      />
      <circle cx="78" cy="40" r="1.2" fill="#1f2937" opacity="0.4" />
    </svg>
  );
}
