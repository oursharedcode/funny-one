// SPDX-License-Identifier: AGPL-3.0-only

// Rig character for pool id `who.grumpy-pirate` (T-FO-4.1 draft slice, see ../RIG_ART.md).
// A short, scowling pirate dwarfed by an enormous feathered hat. Static — reactive motion (the
// spring reveal) is applied by the future rig compositor (T-FO-4.2), not baked into the asset.

interface Props {
  className?: string;
}

export default function GrumpyPirate({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* enormous hat brim */}
      <path
        d="M14 42 q36 -20 72 0 q-6 10 -36 10 q-30 0 -36 -10 z"
        fill="#1f2937"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      {/* hat crown */}
      <path
        d="M30 42 q4 -22 20 -22 q16 0 20 22 z"
        fill="#1f2937"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      {/* skull-and-crossbones badge, kept simple/off-palette-free */}
      <circle cx="50" cy="30" r="5" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.5" />
      {/* enormous feather */}
      <path d="M66 26 q18 -14 22 -34" stroke="#ec4899" strokeWidth="3.5" strokeLinecap="round" />
      <path
        d="M70 22 q6 -4 8 -10 M74 14 q5 -3 7 -8 M78 6 q4 -2 6 -6"
        stroke="#ec4899"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* head, squashed short under the hat */}
      <circle cx="50" cy="56" r="18" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />

      {/* grumpy V eyebrows */}
      <path d="M39 47 l9 4" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M63 46 l-9 5" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />

      {/* eyes, deliberately misaligned */}
      <circle cx="42" cy="56" r="3.2" fill="#1f2937" />
      <circle cx="58" cy="53" r="3.2" fill="#1f2937" />

      {/* downturned mouth */}
      <path d="M42 68 q8 -6 16 0" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />

      {/* short body / coat */}
      <path
        d="M32 92 q-2 -22 18 -22 q20 0 18 22 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M40 74 v18 M60 74 v18" stroke="#1f2937" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}
