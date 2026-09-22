// SPDX-License-Identifier: AGPL-3.0-only

// Rig prop for pool id `did.painting-polka-dots` (T-FO-4.1, see ../RIG_ART.md). A tilted easel
// canvas covered in uneven polka dots, with a loaded paintbrush and drips.

interface Props {
  className?: string;
}

export default function PaintingPolkaDots({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* easel legs */}
      <path
        d="M20 92 l14 -66 M80 92 l-14 -66 M30 60 l40 0"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* canvas, slightly tilted */}
      <g transform="rotate(-4 50 44)">
        <rect x="20" y="10" width="60" height="60" fill="#fff" stroke="#1f2937" strokeWidth="2.5" />
        <circle cx="34" cy="26" r="6" fill="#ec4899" />
        <circle cx="56" cy="20" r="8" fill="#60a5fa" />
        <circle cx="70" cy="40" r="5" fill="#facc15" />
        <circle cx="40" cy="46" r="7" fill="#f59e0b" />
        <circle cx="62" cy="58" r="6" fill="#ec4899" />
        <circle cx="30" cy="60" r="4" fill="#60a5fa" />
      </g>

      {/* paintbrush with drips */}
      <path d="M84 16 l-14 14" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
      <path d="M70 30 l-8 8 l4 4 l8 -8 z" fill="#ec4899" stroke="#1f2937" strokeWidth="1.8" />
      <circle cx="62" cy="42" r="1.6" fill="#ec4899" />
      <circle cx="58" cy="48" r="1.2" fill="#ec4899" />
    </svg>
  );
}
