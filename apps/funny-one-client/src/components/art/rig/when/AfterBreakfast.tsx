// SPDX-License-Identifier: AGPL-3.0-only

// `when.after-breakfast` badge: a fried egg and a toast slice on a plate, fork at the ready
// for second breakfast.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function AfterBreakfast({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      <ellipse cx="52" cy="60" rx="28" ry="12" fill="#fff" stroke="#1f2937" strokeWidth="2.5" />
      {/* fried egg */}
      <path
        d="M36 56 q2 -12 14 -10 q12 -3 14 8 q6 8 -6 12 q-14 4 -22 -4 q-3 -3 0 -6 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.2"
      />
      <circle cx="50" cy="56" r="5.5" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
      {/* toast */}
      <path
        d="M60 36 q10 -6 18 2 q3 8 -2 16 h-16 q-4 -9 0 -18 z"
        fill="#f59e0b"
        stroke="#1f2937"
        strokeWidth="2.2"
      />
      {/* fork */}
      <g stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round">
        <path d="M22 30 v34" />
        <path d="M18 30 v8 M26 30 v8 M18 38 q4 4 8 0" />
      </g>
    </svg>
  );
}
