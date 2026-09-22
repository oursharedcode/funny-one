// SPDX-License-Identifier: AGPL-3.0-only

// `when.thunderstorm` badge: a grumpy cloud, one fat lightning bolt, rain.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function Thunderstorm({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      <path
        d="M28 50 q-8 -2 -6 -10 q2 -8 12 -6 q2 -12 16 -12 q14 0 16 12 q10 -2 12 6 q2 8 -6 10 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* eyebrows + eyes */}
      <path d="M40 36 l8 3 M62 36 l-8 3" stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="44" cy="42" r="2" fill="#1f2937" />
      <circle cx="58" cy="41" r="2.4" fill="#1f2937" />
      {/* bolt */}
      <path
        d="M52 50 l-8 14 h7 l-4 14 l12 -18 h-7 l5 -10 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* rain */}
      <g stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round">
        <path d="M30 56 l-3 8 M36 62 l-3 8 M70 56 l-3 8 M66 66 l-3 8 M26 70 l-3 6" />
      </g>
    </svg>
  );
}
