// SPDX-License-Identifier: AGPL-3.0-only

// Rig co-character for pool id `with.tuba-frog` (T-FO-4.1, see ../RIG_ART.md). A frog in a
// marching band uniform, mid-puff on a brass tuba. Static.

interface Props {
  className?: string;
}

export default function TubaFrog({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* tuba */}
      <circle cx="70" cy="58" r="14" fill="#f59e0b" stroke="#1f2937" strokeWidth="2.2" />
      <path d="M60 62 q-16 -2 -20 4" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
      <path
        d="M60 62 q-16 -2 -20 4"
        stroke="#1f2937"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* head, puffed cheeks */}
      <circle cx="42" cy="42" r="16" fill="#10b981" stroke="#1f2937" strokeWidth="2.5" />
      <circle cx="30" cy="46" r="6" fill="#10b981" stroke="#1f2937" strokeWidth="2" />
      <circle cx="52" cy="48" r="5" fill="#10b981" stroke="#1f2937" strokeWidth="2" />

      {/* bulging eyes, misaligned */}
      <circle cx="35" cy="30" r="5" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.8" />
      <circle cx="49" cy="28" r="5" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.8" />
      <circle cx="36" cy="29" r="2" fill="#1f2937" />
      <circle cx="48" cy="27" r="2" fill="#1f2937" />

      {/* marching band jacket */}
      <path
        d="M26 90 q-2 -24 16 -24 q18 0 16 24 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M42 66 v24" stroke="#facc15" strokeWidth="2.4" />
      <circle cx="42" cy="72" r="1.6" fill="#facc15" />
      <circle cx="42" cy="80" r="1.6" fill="#facc15" />

      {/* hat feather */}
      <path d="M42 16 q-6 -8 -2 -14" stroke="#facc15" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
