// SPDX-License-Identifier: AGPL-3.0-only

// `when.wrong-feeling-tuesday` badge: a calendar page with one day circled and a big question
// mark — drawn as a path, not text, so it survives all 15 languages.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function WrongFeelingTuesday({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      <rect
        x="26"
        y="30"
        width="48"
        height="44"
        rx="3"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M26 30 h48 v10 h-48 z" fill="#ec4899" stroke="#1f2937" strokeWidth="2.5" />
      <g stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round">
        <path d="M36 26 v8 M64 26 v8" />
      </g>
      {/* day grid */}
      <g stroke="#1f2937" strokeWidth="1.2" opacity="0.5">
        <path d="M26 51 h48 M26 62 h48 M38 40 v34 M50 40 v34 M62 40 v34" />
      </g>
      <circle cx="44" cy="56.5" r="6" stroke="#60a5fa" strokeWidth="2.5" />
      {/* question mark */}
      <path
        d="M56 58 q0 -7 6 -7 q6 0 6 6 q0 5 -6 7 v5"
        stroke="#1f2937"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="62" cy="75" r="2" fill="#1f2937" />
    </svg>
  );
}
