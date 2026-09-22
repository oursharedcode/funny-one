// SPDX-License-Identifier: AGPL-3.0-only

// `why.test-a-theory` bubble: an apple leaving a branch, with a down-arrow
// beside it. The theory held. Nobody asked for the experiment.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function TestATheory({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* branch */}
      <path
        d="M56 23 q10 3 18 -2"
        fill="none"
        stroke="#1f2937"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M56 23 q10 3 18 -2"
        fill="none"
        stroke="#fde68a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M64 24 q6 2 6 8 q-6 -1 -6 -8 z"
        fill="#10b981"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* the experiment */}
      <circle cx="52" cy="42" r="10" fill="#ef4444" stroke="#1f2937" strokeWidth="2.5" />
      <path d="M52 33 q1 -4 4 -5" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M47 38 q2 -3 5 -3"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round">
        <path d="M40 28 v6 M64 34 v6 M45 22 v3" />
      </g>
      {/* down, as predicted */}
      <path
        d="M30 30 v22 m-4 -5 l4 5 l4 -5"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M34 58 h40" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
