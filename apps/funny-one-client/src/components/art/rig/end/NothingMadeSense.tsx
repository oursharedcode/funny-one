// SPDX-License-Identifier: AGPL-3.0-only

// `end.nothing-made-sense` stamp: a perfectly content face with two question
// marks orbiting it. Nothing made sense and that was fine.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function NothingMadeSense({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      {/* fine about it */}
      <circle cx="50" cy="54" r="18" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />
      <circle cx="44" cy="50" r="3.4" fill="#fff" stroke="#1f2937" strokeWidth="1.5" />
      <circle cx="57" cy="48.5" r="3.4" fill="#fff" stroke="#1f2937" strokeWidth="1.5" />
      <circle cx="44.5" cy="50.5" r="1.6" fill="#1f2937" />
      <circle cx="56.5" cy="49" r="1.6" fill="#1f2937" />
      <path
        d="M42 59 q8 8 16 0"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* none of it made sense */}
      <path
        d="M29 32 q0 -6 6 -6 q6 0 6 5 q0 5 -6 6 v2"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="35" cy="44" r="1.8" fill="#1f2937" />
      <path
        d="M63 29 q0 -5 4.5 -5 q4.5 0 4.5 4 q0 4 -4.5 4.5 v1.5"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="67.5" cy="39" r="1.5" fill="#1f2937" />
    </svg>
  );
}
