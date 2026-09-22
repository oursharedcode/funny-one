// SPDX-License-Identifier: AGPL-3.0-only

// `end.a-song-about-it` stamp: two notes over a few stave lines. Somebody
// wrote the whole thing down.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function ASongAboutIt({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      <g stroke="#1f2937" strokeWidth="1.5" opacity="0.3">
        <path d="M26 44 h48 M26 52 h48 M26 60 h48 M26 68 h48" />
      </g>
      {/* first note */}
      <path
        d="M46 36 q10 4 8 14"
        fill="none"
        stroke="#1f2937"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M46 62 v-26" stroke="#1f2937" strokeWidth="2.8" strokeLinecap="round" />
      <ellipse cx="39" cy="63" rx="7.5" ry="5.5" fill="#1f2937" transform="rotate(-18 39 63)" />
      {/* second note */}
      <path d="M69 54 v-20" stroke="#1f2937" strokeWidth="2.8" strokeLinecap="round" />
      <ellipse
        cx="63"
        cy="55"
        rx="6.5"
        ry="5"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2"
        transform="rotate(-18 63 55)"
      />
    </svg>
  );
}
