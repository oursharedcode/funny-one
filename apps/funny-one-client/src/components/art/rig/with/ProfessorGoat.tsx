// SPDX-License-Identifier: AGPL-3.0-only

// Rig co-character for pool id `with.professor-goat` (T-FO-4.1, see ../RIG_ART.md). A goat in a
// tweed jacket and a crooked bow tie, curled horns, tidy beard. Static.

interface Props {
  className?: string;
}

export default function ProfessorGoat({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* horns */}
      <path
        d="M38 26 q-8 -4 -6 -12"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M62 25 q9 -3 8 -12"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* head */}
      <path
        d="M34 42 q-2 -18 16 -18 q18 0 16 18 q0 14 -16 14 q-16 0 -16 -14 z"
        fill="#fef3c7"
        stroke="#1f2937"
        strokeWidth="2.5"
      />

      {/* eyes, misaligned */}
      <circle cx="43" cy="38" r="2.8" fill="#1f2937" />
      <circle cx="57" cy="40" r="2.8" fill="#1f2937" />

      {/* beard */}
      <path
        d="M42 50 q8 10 16 0 q0 8 -8 10 q-8 -2 -8 -10 z"
        fill="#fef3c7"
        stroke="#1f2937"
        strokeWidth="1.8"
      />

      {/* tweed jacket body */}
      <path
        d="M30 92 q-3 -30 20 -30 q23 0 20 30 z"
        fill="#f59e0b"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M40 66 l10 12 l10 -12" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.8" />

      {/* crooked bow tie */}
      <path
        d="M45 78 l6 4 l-6 4 z M55 78 l-6 4 l6 4 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="1.6"
        transform="rotate(-10 50 82)"
      />
    </svg>
  );
}
