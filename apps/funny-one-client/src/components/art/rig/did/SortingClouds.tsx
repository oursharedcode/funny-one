// SPDX-License-Identifier: AGPL-3.0-only

// Rig prop for pool id `did.sorting-clouds` (T-FO-4.1, see ../RIG_ART.md). Two fluffy clouds
// mid-swap between labeled bins, one holding a tiny lightning bolt.

interface Props {
  className?: string;
}

function Cloud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      stroke="#1f2937"
      strokeWidth="2"
      fill="#fff"
    >
      <circle cx="-8" cy="4" r="8" />
      <circle cx="6" cy="0" r="10" />
      <circle cx="18" cy="6" r="7" />
      <rect
        x="-14"
        y="4"
        width="40"
        height="8"
        rx="4"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2"
      />
    </g>
  );
}

export default function SortingClouds({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* two bins */}
      <path d="M10 78 h26 l-3 16 h-20 z" fill="#fde68a" stroke="#1f2937" strokeWidth="2.2" />
      <path d="M64 78 h26 l-3 16 h-20 z" fill="#fde68a" stroke="#1f2937" strokeWidth="2.2" />

      <Cloud x={22} y={40} scale={0.9} />
      <Cloud x={62} y={54} scale={0.7} />

      {/* tiny lightning bolt peeking from one cloud */}
      <path
        d="M70 60 l-4 8 l4 0 l-5 9"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* motion arcs showing the swap */}
      <path
        d="M30 36 q20 -18 34 8"
        stroke="#1f2937"
        strokeWidth="1.6"
        strokeDasharray="3 4"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}
