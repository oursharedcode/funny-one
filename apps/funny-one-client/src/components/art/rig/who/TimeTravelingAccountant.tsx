// SPDX-License-Identifier: AGPL-3.0-only

// Rig character for pool id `who.time-traveling-accountant` (T-FO-4.1, see ../RIG_ART.md). An
// accountant in a rumpled suit wearing a time-machine helmet (a domed visor with a blinking
// amber light). Static.

interface Props {
  className?: string;
}

export default function TimeTravelingAccountant({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* helmet dome */}
      <path
        d="M32 34 q0 -20 18 -20 q18 0 18 20 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
        opacity="0.75"
      />
      <circle cx="50" cy="16" r="3" fill="#f59e0b" stroke="#1f2937" strokeWidth="1.4" />
      <path d="M32 34 h36" stroke="#1f2937" strokeWidth="2" />

      {/* head */}
      <circle cx="50" cy="46" r="16" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />

      {/* misaligned, mildly alarmed eyes */}
      <circle cx="44" cy="45" r="3" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.4" />
      <circle cx="57" cy="47" r="3" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.4" />
      <circle cx="44" cy="44" r="1.3" fill="#1f2937" />
      <circle cx="58" cy="48" r="1.3" fill="#1f2937" />

      <path d="M45 56 q5 2 10 0" stroke="#1f2937" strokeWidth="1.8" strokeLinecap="round" />

      {/* rumpled suit body */}
      <path
        d="M32 92 q-3 -26 18 -26 q21 0 18 26 z"
        fill="#1f2937"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M42 68 l8 10 l8 -10" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.8" />
      <path d="M50 78 l-3 14 l3 -4 l3 4 z" fill="#ec4899" stroke="#1f2937" strokeWidth="1.4" />
      <path d="M34 78 q3 4 0 8 M66 78 q-3 4 0 8" stroke="#1f2937" strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}
