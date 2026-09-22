// SPDX-License-Identifier: AGPL-3.0-only

// `when.while-everyone-slept` badge: a lump under a blanket, snores drifting up.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function WhileEveryoneSlept({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      {/* bed */}
      <rect
        x="18"
        y="56"
        width="64"
        height="18"
        rx="3"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M18 74 v6 M82 74 v6" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      {/* lump */}
      <path
        d="M34 56 q10 -18 26 -10 q10 4 10 10 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <rect
        x="20"
        y="48"
        width="18"
        height="10"
        rx="3"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.2"
      />
      {/* one foot sticking out */}
      <path d="M78 52 q6 -2 6 4 q-2 3 -6 2 z" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
      {/* snores */}
      <g stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M54 40 h6 l-6 6 h6" />
        <path d="M64 30 h8 l-8 8 h8" />
        <path d="M76 18 h5 l-5 5 h5" />
      </g>
    </svg>
  );
}
