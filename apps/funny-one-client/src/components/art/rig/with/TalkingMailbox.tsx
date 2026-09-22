// SPDX-License-Identifier: AGPL-3.0-only

// Rig co-character for pool id `with.talking-mailbox` (T-FO-4.1, see ../RIG_ART.md). A dented
// mailbox with a wide grinning mouth and its flag stuck up. Static.

interface Props {
  className?: string;
}

export default function TalkingMailbox({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* post */}
      <rect x="46" y="80" width="8" height="14" fill="#1f2937" />

      {/* box, dented barrel shape */}
      <path
        d="M24 78 v-28 q0 -20 26 -20 q26 0 26 20 v28 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M30 50 q3 -3 6 0" stroke="#1f2937" strokeWidth="1.4" opacity="0.5" />
      <path d="M64 56 q4 -2 6 1" stroke="#1f2937" strokeWidth="1.4" opacity="0.5" />

      {/* flag, stuck up */}
      <path d="M20 46 v-16" stroke="#1f2937" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 30 l10 4 l-10 4 z" fill="#ec4899" stroke="#1f2937" strokeWidth="1.6" />

      {/* eyes, misaligned */}
      <circle cx="38" cy="42" r="4" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.6" />
      <circle cx="60" cy="44" r="4" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.6" />
      <circle cx="39" cy="41" r="1.6" fill="#1f2937" />
      <circle cx="61" cy="45" r="1.6" fill="#1f2937" />

      {/* wide grinning mouth with teeth */}
      <path d="M32 58 q18 14 36 0 q-3 10 -18 10 q-15 0 -18 -10 z" fill="#1f2937" />
      <path d="M38 58 v6 M46 58 v8 M54 58 v8 M62 58 v6" stroke="#fef3c7" strokeWidth="2" />
    </svg>
  );
}
