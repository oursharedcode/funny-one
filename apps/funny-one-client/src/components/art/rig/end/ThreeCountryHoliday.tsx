// SPDX-License-Identifier: AGPL-3.0-only

// `end.three-country-holiday` stamp: three flags on three poles, one per
// country that took the day off.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

function Flag({ x, y, fill }: { x: number; y: number; fill: string }) {
  return (
    <g>
      <path d={`M${x} 70 v-${70 - y}`} stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d={`M${x} ${y} q7 -4 13 0 q-6 4 0 8 q-7 3 -13 -1 z`}
        fill={fill}
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </g>
  );
}

export default function ThreeCountryHoliday({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      <Flag x={31} y={40} fill="#ec4899" />
      <Flag x={49} y={34} fill="#facc15" />
      <Flag x={65} y={42} fill="#60a5fa" />
      <path d="M26 70 h48" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
