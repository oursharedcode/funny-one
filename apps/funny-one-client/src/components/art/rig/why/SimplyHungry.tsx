// SPDX-License-Identifier: AGPL-3.0-only

// `why.simply-hungry` bubble: an empty plate with fork and knife standing to
// attention, and a rumble rippling over the top of it.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function SimplyHungry({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* the rumble */}
      <path
        d="M40 26 q3 -4 6 0 t6 0 t6 0 t6 0"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M46 19 q3 -4 6 0 t6 0" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      {/* empty plate */}
      <ellipse cx="52" cy="44" rx="20" ry="10" fill="#fff" stroke="#1f2937" strokeWidth="2.5" />
      <ellipse
        cx="52"
        cy="44"
        rx="13"
        ry="6"
        fill="none"
        stroke="#1f2937"
        strokeWidth="1.5"
        opacity="0.4"
      />
      {/* all that is left */}
      <g fill="#1f2937">
        <circle cx="48" cy="43" r="1" />
        <circle cx="55" cy="45.5" r="1" />
        <circle cx="52" cy="47.5" r="0.8" />
      </g>
      {/* fork */}
      <path d="M28 40 v18" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M24 30 v7 q0 3 4 3 q4 0 4 -3 v-7 M28 30 v8"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* knife */}
      <path d="M74 40 v18" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M74 28 q6 5 0 14 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
