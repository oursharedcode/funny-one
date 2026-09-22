// SPDX-License-Identifier: AGPL-3.0-only

// `when.day-before-birthday` badge: a wrapped present that isn't allowed to be opened yet,
// with an hourglass counting it down.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function DayBeforeBirthday({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      {/* present */}
      <rect
        x="22"
        y="46"
        width="34"
        height="28"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <rect x="20" y="40" width="38" height="9" fill="#ec4899" stroke="#1f2937" strokeWidth="2.5" />
      <path d="M39 40 v34 M20 58 h38" stroke="#facc15" strokeWidth="4" />
      <path d="M39 40 v34 M20 58 h38" stroke="#1f2937" strokeWidth="1" opacity="0.5" />
      <path
        d="M39 40 q-10 -10 -8 -2 q0 3 8 2 q10 -10 8 -2 q0 3 -8 2"
        stroke="#1f2937"
        strokeWidth="2.2"
        fill="#facc15"
        strokeLinejoin="round"
      />
      {/* hourglass */}
      <path d="M64 30 h20 M64 76 h20" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M66 31 q0 12 8 22 q8 10 8 22 h-16 q0 -12 8 -22 q-8 -10 -8 -22 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M68 33 h12 q-1 8 -6 13 q-5 -5 -6 -13 z" fill="#facc15" />
      <path d="M70 74 h8 q-1 -5 -4 -8 q-3 3 -4 8 z" fill="#facc15" />
    </svg>
  );
}
