// SPDX-License-Identifier: AGPL-3.0-only

// `why.instructions-said-so` bubble: an open manual with a bulleted list and one
// enormous red exclamation mark. The manual was very clear about it.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function InstructionsSaidSo({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* the manual */}
      <path
        d="M29 26 q11 -4 23 0 v32 q-12 -4 -23 0 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M52 26 q11 -4 22 0 v32 q-11 -4 -22 0 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <g fill="#ec4899">
        <circle cx="35" cy="34" r="1.6" />
        <circle cx="35" cy="41" r="1.6" />
        <circle cx="35" cy="48" r="1.6" />
      </g>
      <g stroke="#1f2937" strokeWidth="1.8" strokeLinecap="round" opacity="0.7">
        <path d="M39 34 h9 M39 41 h9 M39 48 h7" />
      </g>
      {/* step one, in fact */}
      <path
        d="M63 30 q4 0 3.5 4 l-1.5 11 q-0.3 2 -2 2 q-1.7 0 -2 -2 l-1.5 -11 q-0.5 -4 3.5 -4 z"
        fill="#ef4444"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="63" cy="52.5" r="2.6" fill="#ef4444" stroke="#1f2937" strokeWidth="2" />
    </svg>
  );
}
