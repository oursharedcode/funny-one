// SPDX-License-Identifier: AGPL-3.0-only

// `when.clocks-stopped` badge: a clock with one bent hand, a spring popped out the side and a
// crack across the glass.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function ClocksStopped({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      <circle cx="48" cy="50" r="24" fill="#fff" stroke="#1f2937" strokeWidth="2.5" />
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round">
        <path d="M48 30 v4 M48 66 v4 M28 50 h4 M64 50 h4" />
      </g>
      {/* bent hands */}
      <path
        d="M48 50 l-2 -14 l6 -3"
        stroke="#1f2937"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M48 50 l10 4 l-3 6"
        stroke="#1f2937"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="50" r="2.5" fill="#ec4899" stroke="#1f2937" strokeWidth="1.5" />
      {/* crack */}
      <path d="M58 30 l-4 8 l5 5 l-4 8" stroke="#1f2937" strokeWidth="1.6" strokeLinecap="round" />
      {/* popped spring */}
      <path
        d="M70 44 q5 -5 3 -9 q-2 -4 -6 -1 q-4 3 0 6 q4 2 6 -2"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* fallen number-ish tick */}
      <path d="M74 70 l4 -4" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
