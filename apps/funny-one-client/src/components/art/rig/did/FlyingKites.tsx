// SPDX-License-Identifier: AGPL-3.0-only

// Rig prop for pool id `did.flying-kites` (T-FO-4.1, see ../RIG_ART.md). Two tangled diamond
// kites with wobbly tails, strings crossed.

interface Props {
  className?: string;
}

function Kite({
  x,
  y,
  rotate,
  color,
  tailColors,
}: {
  x: number;
  y: number;
  rotate: number;
  color: string;
  tailColors: string[];
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <path d="M0 -16 L12 0 L0 16 L-12 0 Z" fill={color} stroke="#1f2937" strokeWidth="2.2" />
      <path d="M0 16 q4 10 -2 18 q6 8 0 16" stroke="#1f2937" strokeWidth="1.6" fill="none" />
      {tailColors.map((c, i) => (
        <path
          key={i}
          d={`M${-4 + i * 4} ${22 + i * 10} l4 4 l-4 4 l-4 -4 z`}
          fill={c}
          stroke="#1f2937"
          strokeWidth="1"
        />
      ))}
    </g>
  );
}

export default function FlyingKites({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Kite x={34} y={30} rotate={-10} color="#ec4899" tailColors={['#facc15', '#60a5fa']} />
      <Kite x={64} y={24} rotate={16} color="#60a5fa" tailColors={['#ec4899', '#facc15']} />

      {/* crossed, tangled strings running down offscreen */}
      <path d="M34 46 q10 30 -14 46" stroke="#1f2937" strokeWidth="1.6" fill="none" />
      <path d="M64 40 q-14 26 4 52" stroke="#1f2937" strokeWidth="1.6" fill="none" />
    </svg>
  );
}
