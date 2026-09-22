// SPDX-License-Identifier: AGPL-3.0-only

// `when.rush-hour` badge: three cars nose to tail, every one of them honking.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

function Car({ x, y, fill }: { x: number; y: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M0 10 q2 -10 10 -10 h6 q6 0 9 8 h3 v8 h-28 z"
        fill={fill}
        stroke="#1f2937"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <rect x="6" y="2" width="8" height="6" fill="#fff" stroke="#1f2937" strokeWidth="1.5" />
      <circle cx="6" cy="17" r="3" fill="#1f2937" />
      <circle cx="22" cy="17" r="3" fill="#1f2937" />
    </g>
  );
}

export default function RushHour({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      <Car x={16} y={54} fill="#60a5fa" />
      <Car x={46} y={54} fill="#ec4899" />
      <Car x={68} y={38} fill="#facc15" />
      <path d="M14 76 h72" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      {/* honks */}
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round" opacity="0.7">
        <path d="M24 46 q4 -4 8 0 M22 40 q6 -6 12 0" />
        <path d="M54 46 q4 -4 8 0 M52 40 q6 -6 12 0" />
        <path d="M60 30 q4 -4 8 0" />
      </g>
    </svg>
  );
}
