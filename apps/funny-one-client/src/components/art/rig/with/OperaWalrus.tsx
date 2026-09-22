// SPDX-License-Identifier: AGPL-3.0-only

// Rig co-character for pool id `with.opera-walrus` (T-FO-4.1, see ../RIG_ART.md). A walrus in a
// velvet cape, mid-song with tusks bared. Static.

interface Props {
  className?: string;
}

export default function OperaWalrus({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* velvet cape */}
      <path
        d="M28 46 q22 16 44 0 l6 42 q-28 12 -56 0 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2.2"
      />

      {/* head */}
      <circle cx="50" cy="40" r="20" fill="#fef3c7" stroke="#1f2937" strokeWidth="2.5" />

      {/* eyes, misaligned, mid-song squint */}
      <path d="M38 34 q4 -3 7 0" stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="58" cy="33" r="2.6" fill="#1f2937" />

      {/* open singing mouth */}
      <path d="M40 48 q10 12 20 0 q-2 8 -10 8 q-8 0 -10 -8 z" fill="#1f2937" />

      {/* tusks */}
      <path d="M42 54 q-4 10 -2 16" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M42 54 q-4 10 -2 16"
        stroke="#1f2937"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M58 54 q4 10 2 16" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M58 54 q4 10 2 16"
        stroke="#1f2937"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* whiskers */}
      <path
        d="M30 46 h-8 M32 50 h-9 M68 46 h8 M67 50 h9"
        stroke="#1f2937"
        strokeWidth="1.2"
        opacity="0.6"
      />

      {/* music notes */}
      <circle cx="76" cy="26" r="2.4" fill="#facc15" stroke="#1f2937" strokeWidth="1" />
      <path d="M78.4 26 v-10" stroke="#1f2937" strokeWidth="1.4" />
    </svg>
  );
}
