// SPDX-License-Identifier: AGPL-3.0-only

// `end.cloud-looked-away` stamp: the cloud that had been watching, now with
// both pupils jammed as far to one side as they will go.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function CloudLookedAway({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      <path
        d="M34 64 q-10 0 -10 -9 q0 -8 9 -9 q1 -11 12 -11 q8 0 11 7 q3 -3 7 -3 q9 0 9 9 q7 1 7 8 q0 8 -9 8 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="43" cy="48" r="6" fill="#fff" stroke="#1f2937" strokeWidth="2" />
      <circle cx="57" cy="47" r="6" fill="#fff" stroke="#1f2937" strokeWidth="2" />
      <circle cx="47.2" cy="48" r="2.6" fill="#1f2937" />
      <circle cx="61.2" cy="47" r="2.6" fill="#1f2937" />
      <ellipse cx="50" cy="58" rx="3" ry="2.2" fill="#1f2937" />
      {/* anywhere but there */}
      <g fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <path d="M71 56 q5 -2 7 -6" />
      </g>
    </svg>
  );
}
