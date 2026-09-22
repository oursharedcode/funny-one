// SPDX-License-Identifier: AGPL-3.0-only

// `end.ice-cream-for-all` stamp: three cones, one per everybody.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

function Cone({ x, y, fill }: { x: number; y: number; fill: string }) {
  return (
    <g>
      <path
        d={`M${x - 7} ${y} l7 20 l7 -20 z`}
        fill="#fde68a"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d={`M${x - 4} ${y + 2} l3 9 M${x + 1} ${y + 1} l3 8`}
        stroke="#1f2937"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx={x} cy={y - 7} r="8" fill={fill} stroke="#1f2937" strokeWidth="2" />
    </g>
  );
}

export default function IceCreamForAll({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      <Cone x={33} y={48} fill="#ec4899" />
      <Cone x={67} y={48} fill="#60a5fa" />
      <Cone x={50} y={44} fill="#fef3c7" />
    </svg>
  );
}
