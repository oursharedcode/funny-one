// SPDX-License-Identifier: AGPL-3.0-only

// Rig character for pool id `who.overconfident-raccoon` (T-FO-4.1, see ../RIG_ART.md). A
// raccoon in a tiny cape, striking a heroic hands-on-hips pose. Static.

interface Props {
  className?: string;
}

export default function OverconfidentRaccoon({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* tiny cape */}
      <path
        d="M34 52 q16 10 32 0 l4 26 q-20 8 -40 0 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2.2"
      />

      {/* ears */}
      <circle cx="38" cy="30" r="6" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
      <circle cx="60" cy="29" r="6" fill="#facc15" stroke="#1f2937" strokeWidth="2" />

      {/* head */}
      <circle cx="49" cy="46" r="17" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />

      {/* bandit mask */}
      <path d="M34 42 q15 -8 30 0 q-2 8 -15 8 q-13 0 -15 -8 z" fill="#1f2937" opacity="0.85" />

      {/* eyes, misaligned, smug */}
      <circle cx="42" cy="44" r="3" fill="#fef3c7" />
      <circle cx="56" cy="42" r="3" fill="#fef3c7" />
      <circle cx="43" cy="45" r="1.3" fill="#1f2937" />
      <circle cx="55" cy="42" r="1.3" fill="#1f2937" />

      {/* smirk */}
      <path d="M42 55 q7 4 14 -1" stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" />

      {/* body, hands on hips */}
      <path
        d="M32 92 q-3 -22 17 -22 q20 0 17 22 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M32 78 q-8 -2 -8 6" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M66 78 q8 -2 8 6" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />

      {/* striped tail peeking */}
      <path d="M78 82 q10 -6 6 -18" stroke="#1f2937" strokeWidth="3.5" strokeLinecap="round" />
      <path
        d="M78 82 q10 -6 6 -18"
        stroke="#facc15"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}
