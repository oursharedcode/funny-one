// SPDX-License-Identifier: AGPL-3.0-only

// `when.seagull-decision` badge: a seagull head, very pleased with itself, under a lit bulb.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function SeagullDecision({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      {/* bulb */}
      <g stroke="#facc15" strokeWidth="2.5" strokeLinecap="round">
        <path d="M50 16 v-4 M38 22 l-3 -3 M62 22 l3 -3 M34 32 h-4 M66 32 h4" />
      </g>
      <path
        d="M42 38 q-6 -14 8 -16 q14 2 8 16 q-2 3 -2 6 h-12 q0 -3 -2 -6 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.2"
      />
      <path d="M45 46 h10 M46 49 h8" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      {/* seagull */}
      <path
        d="M32 62 q6 -12 20 -10 q16 2 18 14 q-2 10 -18 10 q-18 0 -20 -14 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path
        d="M68 64 l14 -2 l-12 6 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="56" cy="60" r="3.2" fill="#1f2937" />
      <circle cx="44" cy="62" r="2.2" fill="#1f2937" />
      <path d="M50 54 l8 -2" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
