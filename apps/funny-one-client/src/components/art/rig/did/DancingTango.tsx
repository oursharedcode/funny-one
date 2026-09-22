// SPDX-License-Identifier: AGPL-3.0-only

// Rig prop for pool id `did.dancing-tango` (T-FO-4.1, see ../RIG_ART.md). A pair of dance shoe
// footprints mid-tango dip, plus a dropped rose.

interface Props {
  className?: string;
}

function Footprint({
  x,
  y,
  rotate,
  color,
}: {
  x: number;
  y: number;
  rotate: number;
  color: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} stroke="#1f2937" strokeWidth="2">
      <path d="M0 0 q-8 4 -6 16 q1 10 8 10 q7 0 8 -10 q1 -14 -10 -16 z" fill={color} />
    </g>
  );
}

export default function DancingTango({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Footprint x={22} y={30} rotate={-20} color="#ec4899" />
      <Footprint x={44} y={52} rotate={40} color="#1f2937" />
      <Footprint x={30} y={68} rotate={-60} color="#ec4899" />
      <Footprint x={62} y={30} rotate={100} color="#1f2937" />

      {/* dip motion arc */}
      <path
        d="M20 20 q30 10 46 46"
        stroke="#f59e0b"
        strokeWidth="1.8"
        strokeDasharray="2 5"
        fill="none"
        opacity="0.6"
      />

      {/* dropped rose */}
      <g transform="translate(74 70)">
        <path d="M0 0 l10 24" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="0" cy="-2" r="6" fill="#ef4444" stroke="#1f2937" strokeWidth="1.8" />
      </g>
    </svg>
  );
}
