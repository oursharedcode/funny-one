// SPDX-License-Identifier: AGPL-3.0-only

// Rig prop for pool id `did.baking-giant-cake` (T-FO-4.1, see ../RIG_ART.md). A towering,
// lopsided three-tier cake with melting frosting and a lone candle.

interface Props {
  className?: string;
}

export default function BakingGiantCake({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <path d="M22 90 h56 v-14 h-56 z" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />
      <path d="M28 76 h44 v-16 h-44 z" fill="#ec4899" stroke="#1f2937" strokeWidth="2.5" />
      <path d="M34 60 h32 v-14 h-32 z" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />

      {/* melting frosting drips */}
      <path
        d="M22 76 q4 8 -2 14 M40 76 q4 6 0 12 M60 76 q4 8 -2 14 M78 76 q4 8 -2 14"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M34 60 q3 6 -1 10 M50 60 q3 6 -1 10 M66 60 q3 6 -1 10"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* lone candle, slightly bent */}
      <path d="M50 46 q-2 -8 2 -16" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 30 q3 -4 0 -8 q-3 4 0 8" fill="#f59e0b" stroke="#1f2937" strokeWidth="1.4" />
    </svg>
  );
}
