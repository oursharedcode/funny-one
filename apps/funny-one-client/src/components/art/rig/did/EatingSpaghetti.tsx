// SPDX-License-Identifier: AGPL-3.0-only

// Rig prop for pool id `did.eating-spaghetti` (T-FO-4.1, see ../RIG_ART.md). A bowl overflowing
// with tangled spaghetti, a fork twirling one strand sky-high, and sauce splats.

interface Props {
  className?: string;
}

export default function EatingSpaghetti({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <path
        d="M18 76 q32 14 64 0 l-6 14 h-52 z"
        fill="#fef3c7"
        stroke="#1f2937"
        strokeWidth="2.5"
      />

      {/* tangled noodles overflowing the bowl */}
      <g stroke="#facc15" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M24 74 q6 -14 -4 -22 q-8 -6 2 -16" />
        <path d="M40 72 q10 -10 0 -22 q-8 -8 4 -18" />
        <path d="M56 72 q-8 -12 2 -20 q10 -8 -2 -20" />
        <path d="M70 74 q6 -10 -6 -20" />
      </g>

      {/* sauce splats */}
      <circle cx="30" cy="68" r="2.2" fill="#ef4444" />
      <circle cx="52" cy="70" r="2.6" fill="#ef4444" />
      <circle cx="62" cy="64" r="1.8" fill="#ef4444" />

      {/* fork twirling one strand sky-high */}
      <path d="M60 40 l6 -30" stroke="#1f2937" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M60 40 l-4 -28 M64 40 l0 -30 M68 40 l4 -28"
        stroke="#1f2937"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M64 12 q10 -4 8 -18"
        stroke="#facc15"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
