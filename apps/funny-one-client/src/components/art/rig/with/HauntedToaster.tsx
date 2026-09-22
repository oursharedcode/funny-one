// SPDX-License-Identifier: AGPL-3.0-only

// Rig co-character for pool id `with.haunted-toaster` (T-FO-4.1, see ../RIG_ART.md). A battered
// toaster with glowing eyes and a slice of toast peeking from the slot. Static.

interface Props {
  className?: string;
}

export default function HauntedToaster({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* body */}
      <path
        d="M26 90 v-34 q0 -14 24 -14 q24 0 24 14 v34 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      {/* dents */}
      <path d="M32 74 q3 -3 6 0" stroke="#1f2937" strokeWidth="1.4" opacity="0.5" />
      <path d="M64 80 q4 -2 6 1" stroke="#1f2937" strokeWidth="1.4" opacity="0.5" />

      {/* toast slot */}
      <rect x="36" y="46" width="28" height="6" rx="2" fill="#1f2937" />

      {/* toast peeking, slightly askew */}
      <path
        d="M40 46 q0 -14 10 -14 q10 0 10 14 z"
        fill="#f59e0b"
        stroke="#1f2937"
        strokeWidth="2"
        transform="rotate(-5 50 40)"
      />

      {/* glowing eyes on the front panel, misaligned */}
      <circle cx="38" cy="66" r="5" fill="#ec4899" stroke="#1f2937" strokeWidth="2" />
      <circle cx="38" cy="66" r="1.8" fill="#1f2937" />
      <circle cx="58" cy="70" r="5" fill="#ec4899" stroke="#1f2937" strokeWidth="2" />
      <circle cx="58" cy="70" r="1.8" fill="#1f2937" />

      {/* dial knob + feet */}
      <circle cx="48" cy="84" r="2.6" fill="#60a5fa" stroke="#1f2937" strokeWidth="1.4" />
      <rect x="30" y="90" width="6" height="4" fill="#1f2937" />
      <rect x="64" y="90" width="6" height="4" fill="#1f2937" />
    </svg>
  );
}
