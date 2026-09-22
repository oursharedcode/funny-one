// SPDX-License-Identifier: AGPL-3.0-only

// `when.hat-festival` badge: three hats stacked (sombrero, top hat, party cone) under a line
// of bunting.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function HatFestival({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      {/* bunting */}
      <path d="M14 22 q36 10 72 0" stroke="#1f2937" strokeWidth="1.8" />
      <g stroke="#1f2937" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M24 24 l4 8 l4 -7 z" fill="#ec4899" />
        <path d="M44 27 l4 8 l4 -8 z" fill="#60a5fa" />
        <path d="M64 25 l4 8 l4 -8 z" fill="#facc15" />
      </g>
      {/* sombrero */}
      <ellipse cx="50" cy="74" rx="26" ry="6" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />
      <path
        d="M38 73 q2 -14 12 -14 q10 0 12 14 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      {/* top hat */}
      <rect
        x="40"
        y="46"
        width="20"
        height="14"
        fill="#1f2937"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M35 60 h30" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 54 h20" stroke="#ec4899" strokeWidth="2.5" />
      {/* party cone */}
      <path
        d="M43 46 l7 -16 l7 16 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="30" r="2.5" fill="#ec4899" stroke="#1f2937" strokeWidth="1.5" />
      <circle cx="48" cy="40" r="1.4" fill="#facc15" />
      <circle cx="53" cy="43" r="1.4" fill="#facc15" />
    </svg>
  );
}
