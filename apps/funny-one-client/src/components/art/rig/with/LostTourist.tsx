// SPDX-License-Identifier: AGPL-3.0-only

// Rig co-character for pool id `with.lost-tourist` (T-FO-4.1, see ../RIG_ART.md). A tourist in a
// loud polka-dotted shirt, draped in cameras, wide sun hat. Static.

interface Props {
  className?: string;
}

export default function LostTourist({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* sun hat */}
      <ellipse cx="50" cy="26" rx="22" ry="6" fill="#facc15" stroke="#1f2937" strokeWidth="2.2" />
      <path
        d="M40 26 q0 -12 10 -12 q10 0 10 12 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.2"
      />

      {/* head */}
      <circle cx="50" cy="38" r="14" fill="#f59e0b" stroke="#1f2937" strokeWidth="2.5" />
      <circle cx="45" cy="37" r="2.4" fill="#1f2937" />
      <circle cx="56" cy="39" r="2.4" fill="#1f2937" />
      <path d="M45 44 q5 3 10 0" stroke="#1f2937" strokeWidth="1.8" strokeLinecap="round" />

      {/* loud dotted shirt body */}
      <path
        d="M30 90 q-2 -28 20 -28 q22 0 20 28 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <circle cx="40" cy="70" r="2" fill="#facc15" />
      <circle cx="50" cy="78" r="2" fill="#facc15" />
      <circle cx="60" cy="68" r="2" fill="#facc15" />
      <circle cx="44" cy="84" r="2" fill="#facc15" />
      <circle cx="58" cy="84" r="2" fill="#facc15" />

      {/* camera straps */}
      <path d="M34 54 l16 30 M66 54 l-16 30" stroke="#1f2937" strokeWidth="1.8" opacity="0.7" />
      <rect x="42" y="78" width="16" height="10" rx="2" fill="#1f2937" />
      <circle cx="50" cy="83" r="3" fill="#60a5fa" stroke="#fef3c7" strokeWidth="1" />
    </svg>
  );
}
