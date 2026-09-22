// SPDX-License-Identifier: AGPL-3.0-only

// Rig co-character for pool id `with.riddle-robot` (T-FO-4.1, see ../RIG_ART.md). A boxy tin
// robot with a question mark stenciled on its chest plate. Static.

interface Props {
  className?: string;
}

export default function RiddleRobot({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* antenna */}
      <path d="M50 20 v-8" stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="50" cy="10" r="3" fill="#ec4899" stroke="#1f2937" strokeWidth="1.6" />

      {/* boxy head */}
      <rect
        x="34"
        y="20"
        width="32"
        height="26"
        rx="3"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <circle cx="43" cy="33" r="4" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.6" />
      <circle cx="58" cy="35" r="4" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.6" />
      <circle cx="43" cy="33" r="1.5" fill="#1f2937" />
      <circle cx="58" cy="35" r="1.5" fill="#1f2937" />
      <rect x="42" y="40" width="16" height="3" fill="#1f2937" opacity="0.7" />

      {/* boxy body */}
      <rect
        x="28"
        y="48"
        width="44"
        height="40"
        rx="3"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
      />

      {/* question mark chest plate */}
      <rect
        x="42"
        y="56"
        width="16"
        height="24"
        rx="2"
        fill="#fef3c7"
        stroke="#1f2937"
        strokeWidth="1.6"
      />
      <text
        x="50"
        y="76"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill="#1f2937"
        fontFamily="sans-serif"
      >
        ?
      </text>

      {/* bolt joints */}
      <circle cx="30" cy="60" r="2" fill="#1f2937" />
      <circle cx="70" cy="60" r="2" fill="#1f2937" />
      <circle cx="30" cy="80" r="2" fill="#1f2937" />
      <circle cx="70" cy="80" r="2" fill="#1f2937" />
    </svg>
  );
}
