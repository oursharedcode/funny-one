// SPDX-License-Identifier: AGPL-3.0-only

// `when.last-day-of-summer` badge: a sun sinking behind the horizon, one orange leaf already
// falling.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function LastDayOfSummer({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      <g stroke="#facc15" strokeWidth="3" strokeLinecap="round">
        <path d="M50 26 v6 M32 34 l4 4 M68 34 l-4 4 M26 50 h6 M74 50 h-6" />
      </g>
      <path d="M32 62 a18 18 0 0 1 36 0 z" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />
      {/* horizon + water */}
      <path d="M14 62 h72" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <g stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round">
        <path d="M22 70 q6 -4 12 0 q6 4 12 0" />
        <path d="M54 72 q6 -4 12 0 q6 4 12 0" />
      </g>
      {/* falling leaf */}
      <path
        d="M74 24 q10 2 10 12 q-10 0 -12 -10 z"
        fill="#f59e0b"
        stroke="#1f2937"
        strokeWidth="2"
        transform="rotate(20 78 30)"
      />
      <path
        d="M76 40 q-4 6 2 10"
        stroke="#1f2937"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
