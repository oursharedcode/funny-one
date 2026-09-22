// SPDX-License-Identifier: AGPL-3.0-only

// `end.indoor-rainbow` stamp: three bands rising off the floorboards next to a
// window that had nothing to do with it. Each band is an ink arc with a colour
// arc laid on top, so the ink reads as an outline.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

const BANDS: readonly { d: string; fill: string }[] = [
  { d: 'M30 68 q20 -38 40 0', fill: '#ef4444' },
  { d: 'M37 68 q13 -26 26 0', fill: '#facc15' },
  { d: 'M44 68 q6 -14 12 0', fill: '#60a5fa' },
];

export default function IndoorRainbow({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      <rect
        x="26"
        y="26"
        width="15"
        height="15"
        rx="1"
        fill="#fef3c7"
        stroke="#1f2937"
        strokeWidth="2"
      />
      <path d="M33.5 26 v15 M26 33.5 h15" stroke="#1f2937" strokeWidth="1.5" />
      {BANDS.map(({ d }) => (
        <path key={d} d={d} fill="none" stroke="#1f2937" strokeWidth="9" strokeLinecap="round" />
      ))}
      {BANDS.map(({ d, fill }) => (
        <path key={d} d={d} fill="none" stroke={fill} strokeWidth="5.5" strokeLinecap="round" />
      ))}
      <path d="M24 70 h52" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
