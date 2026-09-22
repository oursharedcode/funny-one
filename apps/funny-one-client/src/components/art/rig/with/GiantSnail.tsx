// SPDX-License-Identifier: AGPL-3.0-only

// Rig co-character for pool id `with.giant-snail` (T-FO-4.1, see ../RIG_ART.md). An enormous
// smiling snail with a swirly striped shell. Static.

interface Props {
  className?: string;
}

export default function GiantSnail({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* shell, swirly stripes */}
      <circle cx="56" cy="52" r="22" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />
      <path
        d="M56 52 m-16 0 a16 16 0 1 1 32 0 a11 11 0 1 1 -22 0 a6 6 0 1 1 12 0"
        fill="none"
        stroke="#ec4899"
        strokeWidth="2.4"
      />

      {/* body, foot */}
      <path
        d="M20 88 q-2 -14 12 -14 h30 q8 0 8 10 q0 8 -8 8 q-24 4 -42 -4 z"
        fill="#fef3c7"
        stroke="#1f2937"
        strokeWidth="2.5"
      />

      {/* eyestalks */}
      <path
        d="M26 74 q-4 -14 -2 -20"
        stroke="#1f2937"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M34 74 q2 -12 6 -18"
        stroke="#1f2937"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="24" cy="53" r="3.4" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.6" />
      <circle cx="40" cy="55" r="3.4" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.6" />
      <circle cx="24" cy="53" r="1.4" fill="#1f2937" />
      <circle cx="40" cy="55" r="1.4" fill="#1f2937" />

      {/* smiling mouth */}
      <path d="M22 76 q6 5 12 0" stroke="#1f2937" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
