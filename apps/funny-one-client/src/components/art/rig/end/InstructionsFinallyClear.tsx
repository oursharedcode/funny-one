// SPDX-License-Identifier: AGPL-3.0-only

// `end.instructions-finally-clear` stamp: the open manual, at last with a tick
// over it. The page lines are strokes, not <text>.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function InstructionsFinallyClear({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      <path
        d="M26 42 q12 -5 24 0 v24 q-13 -5 -24 0 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M50 42 q12 -5 24 0 v24 q-13 -5 -24 0 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <g stroke="#1f2937" strokeWidth="1.8" strokeLinecap="round" opacity="0.55">
        <path d="M32 50 h12 M32 56 h12 M32 62 h9 M56 50 h12 M56 56 h12 M59 62 h9" />
      </g>
      <path
        d="M38 32 l6 6 l14 -15"
        fill="none"
        stroke="#10b981"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round">
        <path d="M30 26 v-4 M64 28 l3.5 -3.5" />
      </g>
    </svg>
  );
}
