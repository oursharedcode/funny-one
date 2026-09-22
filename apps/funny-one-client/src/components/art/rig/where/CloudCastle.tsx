// SPDX-License-Identifier: AGPL-3.0-only

// Rig background for pool id `where.cloud-castle` (T-FO-4.1, see ../RIG_ART.md). A fluffy castle
// built from clouds, high in a bright blue sky. Static.

interface Props {
  className?: string;
}

export default function CloudCastle({ className = '' }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <rect width="400" height="300" fill="#60a5fa" opacity="0.5" />
      <rect width="400" height="300" fill="#fef3c7" opacity="0.3" />

      {/* distant cloud puffs */}
      <g fill="#fff" stroke="#1f2937" strokeWidth="1.6" opacity="0.85">
        <circle cx="60" cy="60" r="18" />
        <circle cx="82" cy="66" r="12" />
        <circle cx="330" cy="90" r="16" />
        <circle cx="350" cy="80" r="10" />
      </g>

      {/* cloud castle base */}
      <g stroke="#1f2937" strokeWidth="2.5" fill="#fff">
        <circle cx="150" cy="210" r="40" />
        <circle cx="220" cy="220" r="46" />
        <circle cx="280" cy="200" r="34" />
        <circle cx="190" cy="180" r="30" />
      </g>

      {/* turrets, pink flags */}
      <g stroke="#1f2937" strokeWidth="2.2">
        <path d="M150 176 v-30 l-10 -14 l10 -6 l10 6 l-10 14 z" fill="#fde68a" />
        <path d="M250 176 v-26 l-9 -12 l9 -5 l9 5 l-9 12 z" fill="#fde68a" />
        <path d="M150 132 l14 -8 l-3 8 z" fill="#ec4899" />
        <path d="M250 138 l14 -8 l-3 8 z" fill="#ec4899" />
      </g>

      {/* castle door */}
      <path
        d="M204 240 q0 -18 16 -18 q16 0 16 18 v20 h-32 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2"
      />
    </svg>
  );
}
