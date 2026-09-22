// SPDX-License-Identifier: AGPL-3.0-only

// Rig background for pool id `where.messy-kitchen` (T-FO-4.1 draft slice, see ../RIG_ART.md).
// A cluttered counter with lopsided hanging pots and a flour cloud mid-fall. Static — backgrounds
// are never animated (DESIGN_SYSTEM §8/§5 mascot-construction rules extended to rig art).

interface Props {
  className?: string;
}

export default function MessyKitchen({ className = '' }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <rect width="400" height="300" fill="#fef3c7" />

      {/* tiled floor */}
      <g stroke="#1f2937" strokeWidth="1.5" opacity="0.35">
        <path d="M0 250 h400 M0 270 h400 M0 290 h400" />
        <path d="M40 240 v60 M120 240 v60 M200 240 v60 M280 240 v60 M360 240 v60" />
      </g>

      {/* back wall shelf */}
      <path d="M0 90 h400" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />

      {/* counter */}
      <path
        d="M6 236 q194 -10 388 0 v14 q-194 10 -388 0 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M6 236 q194 -10 388 0" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />

      {/* cabinet doors under the counter */}
      <g stroke="#1f2937" strokeWidth="2" fill="#fde68a">
        <rect x="30" y="250" width="70" height="40" rx="4" />
        <rect x="130" y="250" width="70" height="40" rx="4" />
        <rect x="260" y="250" width="70" height="40" rx="4" />
      </g>

      {/* hanging pots, deliberately lopsided */}
      <g stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round">
        <path d="M70 90 v28" />
        <path d="M52 118 q18 -10 36 0 v10 q-18 8 -36 0 z" fill="#60a5fa" />
        <path d="M52 118 h36" />

        <path d="M170 90 v20" />
        <path d="M150 110 q22 -12 44 2 v8 q-22 10 -44 -2 z" fill="#ec4899" />

        <path d="M300 90 v34" />
        <path d="M278 124 a24 16 0 1 0 48 4 a24 16 0 1 0 -48 -4" fill="#facc15" />
      </g>

      {/* spilled flour cloud, mid-fall */}
      <g fill="#fff" stroke="#1f2937" strokeWidth="2" opacity="0.9">
        <circle cx="230" cy="160" r="16" />
        <circle cx="248" cy="150" r="11" />
        <circle cx="212" cy="150" r="10" />
        <circle cx="236" cy="140" r="8" />
      </g>
      <g stroke="#1f2937" strokeWidth="1.5" opacity="0.5">
        <path d="M226 178 q-3 8 -1 14" />
        <path d="M240 180 q3 9 0 16" />
      </g>
    </svg>
  );
}
