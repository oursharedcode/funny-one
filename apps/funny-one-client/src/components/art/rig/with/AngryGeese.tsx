// SPDX-License-Identifier: AGPL-3.0-only

// Rig co-character for pool id `with.angry-geese` (T-FO-4.1 draft slice, see ../RIG_ART.md).
// Three geese, wings spread, beaks open mid-honk. Static — reactive motion is applied by the
// future rig compositor (T-FO-4.2), not baked into the asset.

interface Props {
  className?: string;
}

function Goose({ cx, cy, scale = 1 }: { cx: number; cy: number; scale?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      {/* spread wing */}
      <path
        d="M-6 -2 q-14 -10 -18 -22 q10 2 20 12 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2"
      />
      {/* body */}
      <path
        d="M-12 10 q-3 -16 12 -16 q15 0 12 16 q-2 8 -12 8 q-10 0 -12 -8 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.2"
      />
      {/* neck + head, craned forward and angry */}
      <path d="M6 -6 q10 -8 16 -16" stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="24" cy="-24" r="6.5" fill="#fff" stroke="#1f2937" strokeWidth="2" />
      {/* angry eyebrow + eye */}
      <path d="M21 -29 l6 -1" stroke="#1f2937" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="25" cy="-25" r="1.4" fill="#1f2937" />
      {/* open honking beak */}
      <path d="M30 -24 l9 -3 l0 4 l-8 3 z" fill="#f59e0b" stroke="#1f2937" strokeWidth="1.6" />
      {/* feet */}
      <path d="M-4 18 l-3 6 M4 18 l3 6" stroke="#1f2937" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

export default function AngryGeese({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Goose cx={22} cy={64} scale={0.85} />
      <Goose cx={50} cy={70} scale={1} />
      <Goose cx={70} cy={62} scale={0.7} />
      {/* honk marks over the loudest one */}
      <g stroke="#1f2937" strokeWidth="1.8" strokeLinecap="round" opacity="0.7">
        <path d="M58 30 q4 -6 10 -6" />
        <path d="M62 38 q6 -8 14 -6" />
      </g>
    </svg>
  );
}
