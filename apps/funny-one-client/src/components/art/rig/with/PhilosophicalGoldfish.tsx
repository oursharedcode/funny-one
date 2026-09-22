// SPDX-License-Identifier: AGPL-3.0-only

// Rig co-character for pool id `with.philosophical-goldfish` (T-FO-4.1, see ../RIG_ART.md). A
// goldfish in a round bowl wearing tiny spectacles, deep in thought. Static.

interface Props {
  className?: string;
}

export default function PhilosophicalGoldfish({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* bowl */}
      <path
        d="M20 46 q30 16 60 0 l-6 34 q-24 12 -48 0 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
        opacity="0.35"
      />
      <ellipse cx="50" cy="46" rx="30" ry="9" fill="none" stroke="#1f2937" strokeWidth="2.5" />
      <path d="M23 62 q27 14 54 0" stroke="#1f2937" strokeWidth="1.6" opacity="0.4" fill="none" />

      {/* goldfish body */}
      <path
        d="M36 60 q4 -12 18 -10 q14 2 12 14 q10 -2 14 6 q-6 6 -14 4 q0 8 -12 6 q-14 -2 -18 -12 z"
        fill="#f59e0b"
        stroke="#1f2937"
        strokeWidth="2.2"
      />

      {/* tail */}
      <path
        d="M36 60 l-10 -6 l1 8 l-9 2 l9 4 l-2 8 l11 -8 z"
        fill="#f59e0b"
        stroke="#1f2937"
        strokeWidth="1.8"
      />

      {/* spectacles */}
      <circle cx="52" cy="60" r="4.5" fill="none" stroke="#1f2937" strokeWidth="1.6" />
      <circle cx="61" cy="61" r="4.5" fill="none" stroke="#1f2937" strokeWidth="1.6" />
      <path d="M56.5 60.5 h4" stroke="#1f2937" strokeWidth="1.4" />
      <circle cx="52" cy="60" r="1.4" fill="#1f2937" />
      <circle cx="61" cy="61" r="1.4" fill="#1f2937" />

      {/* thoughtful mouth */}
      <path d="M40 64 q3 2 6 0" stroke="#1f2937" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
