// SPDX-License-Identifier: AGPL-3.0-only

// `when.first-snow` badge: three snowflakes of different sizes drifting onto a fresh mound.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

function Flake({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round" transform={`translate(${x} ${y})`}>
      <path
        d={`M0 ${-r} V${r} M${-r} 0 H${r} M${-r * 0.7} ${-r * 0.7} L${r * 0.7} ${r * 0.7} M${r * 0.7} ${-r * 0.7} L${-r * 0.7} ${r * 0.7}`}
      />
    </g>
  );
}

export default function FirstSnow({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      <Flake x={34} y={34} r={9} />
      <Flake x={62} y={28} r={6} />
      <Flake x={70} y={52} r={5} />
      <path
        d="M16 78 q16 -20 36 -12 q18 -6 32 12 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path
        d="M40 70 q4 -3 8 0"
        stroke="#1f2937"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
