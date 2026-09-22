// SPDX-License-Identifier: AGPL-3.0-only

// `why.never-back-down` bubble: one raised fist, knuckles up, thumb clamped
// across the front, not going anywhere.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function NeverBackDown({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* fist, four knuckles up */}
      <path
        d="M36 54 v-20 a4.5 4.5 0 0 1 9 0 a4.5 4.5 0 0 1 9 0 a4.5 4.5 0 0 1 9 0 a4.5 4.5 0 0 1 9 0 v20 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M45 34 v8 M54 34 v8 M63 34 v8"
        stroke="#1f2937"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* thumb clamped across the front */}
      <rect
        x="36"
        y="42"
        width="26"
        height="10"
        rx="5"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2"
        transform="rotate(-6 49 47)"
      />
      <path
        d="M57 44 q3 3 0 6"
        fill="none"
        stroke="#1f2937"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* sleeve */}
      <rect
        x="40"
        y="52"
        width="28"
        height="9"
        rx="2"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      {/* not budging */}
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round">
        <path d="M30 30 l-4 -3 M78 30 l4 -3 M28 42 h-5 M80 42 h4" />
      </g>
    </svg>
  );
}
