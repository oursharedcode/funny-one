// SPDX-License-Identifier: AGPL-3.0-only

// Rig character for pool id `who.tiny-dragon` (T-FO-4.1, see ../RIG_ART.md). A dragon the size
// of a teacup — small body, oversized head, stubby wings. Green fill uses the state-success
// token (#10b981), the closest palette color to "green dragon." Static.

interface Props {
  className?: string;
}

export default function TinyDragon({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* stubby wings */}
      <path
        d="M36 58 q-16 -6 -18 -20 q14 0 20 14 z"
        fill="#10b981"
        stroke="#1f2937"
        strokeWidth="2.2"
      />
      <path
        d="M64 58 q16 -6 18 -20 q-14 0 -20 14 z"
        fill="#10b981"
        stroke="#1f2937"
        strokeWidth="2.2"
      />

      {/* body, small */}
      <path
        d="M40 92 q-2 -18 10 -18 h0 q12 0 10 18 z"
        fill="#10b981"
        stroke="#1f2937"
        strokeWidth="2.5"
      />

      {/* spiky back */}
      <path
        d="M46 66 l-3 -6 l4 2 l0 -7 l4 3 l1 -8 l3 7"
        stroke="#1f2937"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* oversized head */}
      <circle cx="50" cy="46" r="20" fill="#10b981" stroke="#1f2937" strokeWidth="2.5" />

      {/* snout */}
      <path d="M40 52 q10 8 20 0" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      <circle cx="41" cy="53" r="1.3" fill="#1f2937" />
      <circle cx="59" cy="53" r="1.3" fill="#1f2937" />

      {/* eyes, misaligned */}
      <circle cx="42" cy="42" r="4" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.6" />
      <circle cx="58" cy="39" r="4" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.6" />
      <circle cx="43" cy="43" r="1.6" fill="#1f2937" />
      <circle cx="57" cy="39" r="1.6" fill="#1f2937" />

      {/* tiny fire puff */}
      <path d="M48 56 q2 6 -1 9 q6 -1 6 -7" fill="#f59e0b" stroke="#1f2937" strokeWidth="1.4" />
    </svg>
  );
}
