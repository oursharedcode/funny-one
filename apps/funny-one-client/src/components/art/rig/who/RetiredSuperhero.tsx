// SPDX-License-Identifier: AGPL-3.0-only

// Rig character for pool id `who.retired-superhero` (T-FO-4.1, see ../RIG_ART.md). An elderly
// superhero in a faded cape and fuzzy slippers, potbelly included. Static.

interface Props {
  className?: string;
}

export default function RetiredSuperhero({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* faded cape */}
      <path
        d="M32 44 q18 14 36 0 l6 40 q-24 10 -48 0 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2.2"
        opacity="0.65"
      />

      {/* head, wrinkled */}
      <circle cx="50" cy="34" r="16" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />
      <path
        d="M38 30 q3 -2 6 0 M56 32 q3 -2 6 0"
        stroke="#1f2937"
        strokeWidth="1.2"
        opacity="0.6"
      />

      {/* mask */}
      <path d="M36 30 q14 -8 28 0 q-2 6 -14 6 q-12 0 -14 -6 z" fill="#1f2937" opacity="0.8" />
      <circle cx="43" cy="31" r="2.6" fill="#fef3c7" />
      <circle cx="57" cy="29" r="2.6" fill="#fef3c7" />
      <circle cx="43" cy="31" r="1.1" fill="#1f2937" />
      <circle cx="57" cy="29" r="1.1" fill="#1f2937" />

      {/* potbelly body */}
      <path
        d="M32 92 q-6 -34 18 -34 q24 0 18 34 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <circle cx="50" cy="66" r="7" fill="#facc15" stroke="#1f2937" strokeWidth="1.8" />

      {/* fuzzy slippers */}
      <ellipse cx="42" cy="94" rx="8" ry="4" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.8" />
      <ellipse cx="58" cy="94" rx="8" ry="4" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.8" />
    </svg>
  );
}
