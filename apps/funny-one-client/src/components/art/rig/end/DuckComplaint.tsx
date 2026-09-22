// SPDX-License-Identifier: AGPL-3.0-only

// `end.duck-complaint` stamp: one unamused duck and the form it filed, marked
// in red by somebody who meant it.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function DuckComplaint({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      {/* the complaint */}
      <rect
        x="47"
        y="30"
        width="26"
        height="34"
        rx="2"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <g stroke="#1f2937" strokeWidth="1.8" strokeLinecap="round" opacity="0.6">
        <path d="M52 38 h16 M52 44 h16 M52 50 h10" />
      </g>
      <path d="M55 52 l12 9 M67 52 l-12 9" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      {/* the duck */}
      <path d="M33 56 v10" stroke="#1f2937" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="37" cy="42" r="10" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />
      <path
        d="M29 43 q-6 1 -6 3 q0 3 6 3 z"
        fill="#f59e0b"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="38" cy="39" r="2.6" fill="#fff" stroke="#1f2937" strokeWidth="1.2" />
      <circle cx="38.4" cy="39.4" r="1.3" fill="#1f2937" />
      <path d="M33 33 l8 2" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
