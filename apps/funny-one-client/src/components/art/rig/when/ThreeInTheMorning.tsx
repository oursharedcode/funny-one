// SPDX-License-Identifier: AGPL-3.0-only

// `when.three-in-the-morning` badge: a crescent moon, two stars, and a small clock stuck at
// three o'clock.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function ThreeInTheMorning({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      <path
        d="M40 26 q-16 6 -14 22 q3 17 20 18 q-9 -8 -8 -20 q1 -12 2 -20 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <g fill="#facc15" stroke="#1f2937" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M62 26 l2 5 l5 1 l-4 3 l1 5 l-4 -3 l-4 3 l1 -5 l-4 -3 l5 -1 z" />
        <path d="M76 44 l1.5 3.5 l3.5 .5 l-2.5 2.5 l.5 3.5 l-3 -2 l-3 2 l.5 -3.5 l-2.5 -2.5 l3.5 -.5 z" />
      </g>
      <circle cx="62" cy="68" r="12" fill="#fff" stroke="#1f2937" strokeWidth="2.5" />
      <path d="M62 68 v-8 M62 68 h7" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="62" cy="68" r="1.6" fill="#1f2937" />
    </svg>
  );
}
