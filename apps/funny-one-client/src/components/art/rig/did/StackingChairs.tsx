// SPDX-License-Identifier: AGPL-3.0-only

// Rig prop for pool id `did.stacking-chairs` (T-FO-4.1, see ../RIG_ART.md). A precarious,
// leaning stack of mismatched folding chairs.

interface Props {
  className?: string;
}

function Chair({
  x,
  y,
  rotate,
  color,
  scale = 1,
}: {
  x: number;
  y: number;
  rotate: number;
  color: string;
  scale?: number;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
      stroke="#1f2937"
      strokeWidth="2"
      fill={color}
    >
      <rect x="-14" y="-4" width="28" height="6" rx="2" />
      <path d="M-14 -4 v-16 M14 -4 v-16" strokeLinecap="round" />
      <path d="M-14 2 v14 M14 2 v14" strokeLinecap="round" />
    </g>
  );
}

export default function StackingChairs({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Chair x={50} y={86} rotate={0} color="#60a5fa" scale={1.1} />
      <Chair x={48} y={66} rotate={-6} color="#facc15" scale={1} />
      <Chair x={53} y={46} rotate={8} color="#ec4899" scale={0.9} />
      <Chair x={46} y={28} rotate={-14} color="#f59e0b" scale={0.8} />

      {/* wobble lines showing imminent collapse */}
      <path
        d="M64 24 q4 -4 2 -10"
        stroke="#1f2937"
        strokeWidth="1.4"
        strokeDasharray="2 3"
        opacity="0.5"
      />
    </svg>
  );
}
