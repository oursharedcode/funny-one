// SPDX-License-Identifier: AGPL-3.0-only

// Rig background for pool id `where.jungle-treehouse` (T-FO-4.1, see ../RIG_ART.md). A treehouse
// tangled in thick green vines, deep in the jungle canopy. Static.

interface Props {
  className?: string;
}

export default function JungleTreehouse({ className = '' }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <rect width="400" height="300" fill="#10b981" opacity="0.18" />
      <rect width="400" height="300" fill="#fef3c7" opacity="0.5" />

      {/* canopy blobs */}
      <g fill="#10b981" opacity="0.5">
        <circle cx="60" cy="50" r="50" />
        <circle cx="340" cy="60" r="60" />
        <circle cx="200" cy="30" r="45" />
      </g>

      {/* tree trunk */}
      <path
        d="M180 300 v-160 q0 -20 20 -20 q20 0 20 20 v160 z"
        fill="#f59e0b"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path
        d="M186 200 q4 -3 8 0 M196 240 q4 -3 8 0"
        stroke="#1f2937"
        strokeWidth="1.4"
        opacity="0.5"
      />

      {/* treehouse platform + hut */}
      <rect
        x="130"
        y="120"
        width="140"
        height="14"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.2"
      />
      <rect
        x="150"
        y="70"
        width="100"
        height="52"
        fill="#fde68a"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M144 70 l56 -26 l56 26 z" fill="#f59e0b" stroke="#1f2937" strokeWidth="2.2" />
      <rect x="185" y="92" width="30" height="30" fill="#1f2937" opacity="0.7" />

      {/* vines */}
      <g stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M70 20 q10 60 -10 120 q-8 30 10 60" />
        <path d="M330 30 q-14 50 8 110 q10 30 -12 60" />
        <path d="M250 20 q6 40 -4 80" />
      </g>
    </svg>
  );
}
