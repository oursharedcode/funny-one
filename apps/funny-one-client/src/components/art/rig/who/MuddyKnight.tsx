// SPDX-License-Identifier: AGPL-3.0-only

// Rig character for pool id `who.muddy-knight` (T-FO-4.1, see ../RIG_ART.md). A short knight in
// dented armor covered in mud splatter, visor slit for eyes. Static.

interface Props {
  className?: string;
}

export default function MuddyKnight({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* helmet, dented */}
      <path
        d="M34 44 q-2 -22 16 -22 q18 0 16 22 q1 8 -6 10 h-20 q-7 -2 -6 -10 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M40 30 l3 -4" stroke="#1f2937" strokeWidth="1.6" opacity="0.5" />
      <path d="M60 34 l4 -3" stroke="#1f2937" strokeWidth="1.6" opacity="0.5" />

      {/* visor slit, misaligned */}
      <path d="M38 38 h9 v3 h-9 z" fill="#1f2937" />
      <path d="M53 40 h9 v3 h-9 z" fill="#1f2937" />

      {/* plume */}
      <path d="M50 22 q4 -10 -2 -18" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />

      {/* body armor */}
      <path
        d="M30 92 q-2 -26 20 -26 q22 0 20 26 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M50 66 v26" stroke="#1f2937" strokeWidth="1.6" opacity="0.5" />

      {/* mud splatter */}
      <circle cx="36" cy="80" r="3" fill="#f59e0b" opacity="0.8" />
      <circle cx="62" cy="88" r="2.4" fill="#f59e0b" opacity="0.8" />
      <circle cx="58" cy="72" r="2" fill="#f59e0b" opacity="0.8" />
      <circle cx="42" cy="44" r="1.8" fill="#f59e0b" opacity="0.7" />
    </svg>
  );
}
