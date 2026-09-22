// SPDX-License-Identifier: AGPL-3.0-only

// Rig background for pool id `where.underwater-canyon` (T-FO-4.1, see ../RIG_ART.md). A deep
// canyon with rock silhouettes, bright coral, and curious fish. Static.

interface Props {
  className?: string;
}

export default function UnderwaterCanyon({ className = '' }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <rect width="400" height="300" fill="#60a5fa" opacity="0.35" />
      <rect width="400" height="300" fill="#fef3c7" opacity="0.55" />

      {/* canyon walls */}
      <path
        d="M0 300 v-140 q40 -30 80 -10 q30 -40 70 0 q10 -50 60 -20 q20 -30 60 0 q30 -20 60 10 q30 -10 70 20 v140 z"
        fill="#1f2937"
        opacity="0.75"
      />

      {/* coral */}
      <g stroke="#1f2937" strokeWidth="2">
        <path d="M60 260 q0 -30 -14 -34 M60 260 q0 -30 14 -34" fill="none" strokeLinecap="round" />
        <circle cx="46" cy="222" r="7" fill="#ec4899" />
        <circle cx="74" cy="222" r="7" fill="#ec4899" />

        <path
          d="M300 270 q-4 -26 10 -34 M300 270 q4 -26 -6 -36"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="310" cy="230" r="8" fill="#ec4899" />
        <circle cx="292" cy="228" r="6" fill="#ec4899" />
      </g>

      {/* fish, curious */}
      <g stroke="#1f2937" strokeWidth="2" fill="#facc15">
        <ellipse cx="180" cy="120" rx="16" ry="10" />
        <path d="M166 120 l-10 -6 l0 12 z" />
        <circle cx="188" cy="118" r="1.8" fill="#1f2937" />
      </g>
      <g stroke="#1f2937" strokeWidth="1.8" fill="#facc15" opacity="0.9">
        <ellipse cx="250" cy="160" rx="10" ry="6" />
        <path d="M242 160 l-6 -4 l0 8 z" />
      </g>

      {/* light rays */}
      <g stroke="#fef3c7" strokeWidth="4" opacity="0.4">
        <path d="M120 0 l-20 60" />
        <path d="M200 0 l10 60" />
        <path d="M300 0 l-15 50" />
      </g>
    </svg>
  );
}
