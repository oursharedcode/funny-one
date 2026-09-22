// SPDX-License-Identifier: AGPL-3.0-only

// `when.exactly-noon` badge: the sun straight overhead, both clock hands pointing at it.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function ExactlyNoon({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      <circle cx="50" cy="26" r="8" fill="#facc15" stroke="#1f2937" strokeWidth="2.2" />
      <g stroke="#facc15" strokeWidth="2.5" strokeLinecap="round">
        <path d="M36 26 h-4 M64 26 h4 M40 16 l-3 -3 M60 16 l3 -3" />
      </g>
      <circle cx="50" cy="58" r="20" fill="#fff" stroke="#1f2937" strokeWidth="2.5" />
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round">
        <path d="M50 40 v3 M50 76 v-3 M32 58 h3 M68 58 h-3" />
      </g>
      <path
        d="M50 58 v-14 M50.8 58 v-11"
        stroke="#1f2937"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="50" cy="58" r="2.5" fill="#ec4899" stroke="#1f2937" strokeWidth="1.5" />
    </svg>
  );
}
