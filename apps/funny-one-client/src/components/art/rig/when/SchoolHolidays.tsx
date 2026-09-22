// SPDX-License-Identifier: AGPL-3.0-only

// `when.school-holidays` badge: a backpack flung into the corner, sun out, a textbook left
// mid-air.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function SchoolHolidays({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      {/* sun */}
      <circle cx="72" cy="28" r="8" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
      <g stroke="#facc15" strokeWidth="2.5" strokeLinecap="round">
        <path d="M72 14 v3 M84 22 l-2 2 M86 30 h-3 M60 22 l2 2" />
      </g>
      {/* backpack, tossed */}
      <g transform="rotate(18 44 60)">
        <rect
          x="30"
          y="44"
          width="28"
          height="32"
          rx="7"
          fill="#60a5fa"
          stroke="#1f2937"
          strokeWidth="2.5"
        />
        <rect
          x="36"
          y="58"
          width="16"
          height="12"
          rx="3"
          fill="#ec4899"
          stroke="#1f2937"
          strokeWidth="2"
        />
        <path d="M36 44 q8 -8 16 0" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
        <path
          d="M30 52 q-6 8 -2 16 M58 52 q6 8 2 16"
          stroke="#1f2937"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>
      {/* flying book */}
      <g transform="rotate(-22 26 30)">
        <rect x="18" y="26" width="16" height="10" fill="#fff" stroke="#1f2937" strokeWidth="2" />
        <path d="M26 26 v10" stroke="#1f2937" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
