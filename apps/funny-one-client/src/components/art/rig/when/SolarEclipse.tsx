// SPDX-License-Identifier: AGPL-3.0-only

// `when.solar-eclipse` badge: ink moon disc sliding across a yellow sun, corona rays peeking out.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function SolarEclipse({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      {/* corona rays */}
      <g stroke="#facc15" strokeWidth="3" strokeLinecap="round">
        <path d="M50 18 v6 M50 78 v-6 M20 48 h6 M80 48 h-6" />
        <path d="M29 27 l4 4 M71 27 l-4 4 M29 69 l4 -4 M71 69 l-4 -4" />
      </g>
      <circle cx="50" cy="48" r="19" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />
      {/* moon, slightly off-center so a sliver of sun stays */}
      <circle cx="54" cy="47" r="18" fill="#1f2937" />
      {/* tiny surprised eyes on the sun's sliver */}
      <circle cx="35" cy="45" r="1.8" fill="#1f2937" />
      <circle cx="34" cy="52" r="1.5" fill="#1f2937" />
    </svg>
  );
}
