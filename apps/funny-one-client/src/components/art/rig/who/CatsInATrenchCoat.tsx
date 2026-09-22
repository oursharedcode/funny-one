// SPDX-License-Identifier: AGPL-3.0-only

// Rig character for pool id `who.cats-in-a-trench-coat` (T-FO-4.1, see ../RIG_ART.md). Three
// cats stacked inside one long coat — a top cat face under the collar, two more pairs of ears
// peeking from lower down the coat implying the stack underneath. Static.

interface Props {
  className?: string;
}

export default function CatsInATrenchCoat({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* trench coat, tall */}
      <path
        d="M30 96 q-4 -46 6 -56 h28 q10 10 6 56 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M50 42 v54" stroke="#1f2937" strokeWidth="1.6" opacity="0.5" />
      <circle cx="45" cy="60" r="1.6" fill="#1f2937" />
      <circle cx="45" cy="72" r="1.6" fill="#1f2937" />
      <circle cx="45" cy="84" r="1.6" fill="#1f2937" />

      {/* lower stacked cat ears, peeking above the collar line at two heights */}
      <path d="M36 58 l3 -8 l4 6 z" fill="#facc15" stroke="#1f2937" strokeWidth="1.6" />
      <path d="M64 58 l-3 -8 l-4 6 z" fill="#facc15" stroke="#1f2937" strokeWidth="1.6" />

      {/* collar */}
      <path d="M34 40 l16 10 l16 -10" fill="#60a5fa" stroke="#1f2937" strokeWidth="2.2" />

      {/* top cat head */}
      <path d="M38 26 l4 -10 l6 7 z" fill="#facc15" stroke="#1f2937" strokeWidth="2.2" />
      <path d="M62 26 l-4 -10 l-6 7 z" fill="#facc15" stroke="#1f2937" strokeWidth="2.2" />
      <circle cx="50" cy="30" r="15" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />

      {/* eyes, misaligned */}
      <circle cx="44" cy="28" r="2.8" fill="#1f2937" />
      <circle cx="57" cy="30" r="2.8" fill="#1f2937" />

      {/* nose + whiskers */}
      <path d="M49 34 l2 2 l-2 2 z" fill="#ec4899" />
      <path
        d="M32 32 h8 M60 32 h8"
        stroke="#1f2937"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
