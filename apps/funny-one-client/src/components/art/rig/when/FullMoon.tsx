// SPDX-License-Identifier: AGPL-3.0-only

// `when.full-moon` badge: a very full moon with craters, a wisp of cloud and a couple of stars.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function FullMoon({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      <circle cx="50" cy="48" r="24" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />
      <g fill="#fef3c7" stroke="#1f2937" strokeWidth="1.5">
        <circle cx="40" cy="40" r="4.5" />
        <circle cx="58" cy="36" r="3" />
        <circle cx="56" cy="56" r="5.5" />
        <circle cx="42" cy="58" r="2.5" />
      </g>
      {/* sleepy moon face */}
      <path
        d="M44 48 q2 2 4 0 M52 47 q2 2 4 0"
        stroke="#1f2937"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <g fill="#fff" stroke="#1f2937" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M22 26 l1.5 3.5 l3.5 .5 l-2.5 2.5 l.5 3.5 l-3 -2 l-3 2 l.5 -3.5 l-2.5 -2.5 l3.5 -.5 z" />
        <path d="M78 66 l1.5 3.5 l3.5 .5 l-2.5 2.5 l.5 3.5 l-3 -2 l-3 2 l.5 -3.5 l-2.5 -2.5 l3.5 -.5 z" />
      </g>
      {/* cloud wisp */}
      <path
        d="M20 68 q6 -8 14 -3 q8 -6 16 2 q-2 5 -8 5 h-20 q-4 -1 -2 -4 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2"
      />
    </svg>
  );
}
