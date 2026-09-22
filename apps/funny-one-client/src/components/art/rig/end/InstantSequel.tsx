// SPDX-License-Identifier: AGPL-3.0-only

// `end.instant-sequel` stamp: a clapperboard with the play triangle already
// pressed. They did not wait.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function InstantSequel({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      {/* board */}
      <rect
        x="28"
        y="44"
        width="44"
        height="26"
        rx="2"
        fill="#fef3c7"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path
        d="M44 50 l15 9 l-15 9 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* clapper */}
      <path
        d="M27 34 l44 -6 l1.5 10 l-44 6 z"
        fill="#1f2937"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <g fill="#fff">
        <path d="M35 33.2 l4.5 -0.6 l2 5 l-4.5 0.6 z" />
        <path d="M49 31.2 l4.5 -0.6 l2 5 l-4.5 0.6 z" />
        <path d="M63 29.2 l4.5 -0.6 l2 5 l-4.5 0.6 z" />
      </g>
    </svg>
  );
}
