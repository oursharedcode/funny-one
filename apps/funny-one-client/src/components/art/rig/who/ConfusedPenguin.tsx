// SPDX-License-Identifier: AGPL-3.0-only

// Rig character for pool id `who.confused-penguin` (T-FO-4.1, see ../RIG_ART.md). A penguin
// holding a map upside down, one eyebrow raised, the other flat. Static.

interface Props {
  className?: string;
}

export default function ConfusedPenguin({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* body */}
      <path
        d="M50 30 q22 0 22 30 q0 32 -22 32 q-22 0 -22 -32 q0 -30 22 -30 z"
        fill="#1f2937"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      {/* belly patch */}
      <path
        d="M50 42 q13 0 13 20 q0 20 -13 20 q-13 0 -13 -20 q0 -20 13 -20 z"
        fill="#fef3c7"
        stroke="#1f2937"
        strokeWidth="2"
      />

      {/* confused eyebrows, one raised */}
      <path d="M41 38 q4 -6 9 -3" stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M52 37 l9 1" stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" />

      {/* misaligned eyes */}
      <circle cx="44" cy="44" r="3" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.4" />
      <circle cx="58" cy="47" r="3" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.4" />
      <circle cx="45" cy="44" r="1.3" fill="#1f2937" />
      <circle cx="57" cy="47" r="1.3" fill="#1f2937" />

      {/* beak */}
      <path d="M46 51 l4 6 l4 -6 z" fill="#f59e0b" stroke="#1f2937" strokeWidth="1.6" />

      {/* map, upside down */}
      <g transform="translate(66 58) rotate(178)">
        <rect
          x="0"
          y="0"
          width="18"
          height="14"
          fill="#fef3c7"
          stroke="#1f2937"
          strokeWidth="1.6"
        />
        <path d="M3 4 l5 3 l4 -2 l4 5" stroke="#ec4899" strokeWidth="1.2" fill="none" />
      </g>

      {/* feet */}
      <path d="M40 92 l-6 4 h10 z" fill="#f59e0b" stroke="#1f2937" strokeWidth="1.6" />
      <path d="M60 92 l6 4 h-10 z" fill="#f59e0b" stroke="#1f2937" strokeWidth="1.6" />
    </svg>
  );
}
