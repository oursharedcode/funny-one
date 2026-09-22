// SPDX-License-Identifier: AGPL-3.0-only

// Rig character for pool id `who.sleepy-llama` (T-FO-4.1, see ../RIG_ART.md). A very sleepy
// llama with droopy eyelids drawn as heavy closed-eye arcs rather than open pupils. Static.

interface Props {
  className?: string;
}

export default function SleepyLlama({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* ears, drooping */}
      <path
        d="M38 30 q-6 -12 -2 -20 q8 2 8 16 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.2"
      />
      <path
        d="M56 29 q4 -13 -1 -20 q-8 3 -6 17 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.2"
      />

      {/* long snout head */}
      <path
        d="M32 46 q-4 -20 16 -20 q18 0 16 20 q0 14 -10 18 q-4 10 -6 10 q-2 0 -6 -10 q-10 -4 -10 -18 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
      />

      {/* droopy closed eyelids */}
      <path d="M38 44 q5 4 10 0" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M52 46 q6 5 11 0" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M36 40 q4 -3 8 -1"
        stroke="#1f2937"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* nostrils */}
      <circle cx="46" cy="60" r="1.6" fill="#1f2937" />
      <circle cx="52" cy="61" r="1.6" fill="#1f2937" />

      {/* long neck */}
      <path
        d="M40 62 q-2 16 -2 24 h20 q0 -8 -2 -24 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
      />

      {/* body */}
      <path
        d="M24 92 q-2 -20 15 -20 h22 q17 0 15 20 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
    </svg>
  );
}
