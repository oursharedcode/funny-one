// SPDX-License-Identifier: AGPL-3.0-only

// Rig background for pool id `where.snowy-mountain` (T-FO-4.1, see ../RIG_ART.md). A mountain
// pass with a snow cap and wind-blown flags against a blue sky. Static.

interface Props {
  className?: string;
}

export default function SnowyMountain({ className = '' }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <rect width="400" height="300" fill="#60a5fa" opacity="0.4" />
      <rect width="400" height="300" fill="#fef3c7" opacity="0.4" />

      {/* far peak */}
      <path
        d="M0 220 L110 90 L220 220 Z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.2"
        opacity="0.7"
      />

      {/* main peak */}
      <path d="M100 260 L230 60 L370 260 Z" fill="#1f2937" opacity="0.15" />
      <path d="M100 260 L230 60 L370 260 Z" fill="none" stroke="#1f2937" strokeWidth="2.5" />
      <path d="M230 60 L270 130 L210 130 Z" fill="#fff" stroke="#1f2937" strokeWidth="2" />
      <path d="M200 180 q30 -14 60 0" stroke="#fff" strokeWidth="10" opacity="0.8" />

      {/* wind-blown flags on a rope at the pass */}
      <path d="M20 240 q190 -30 360 10" stroke="#1f2937" strokeWidth="2" fill="none" />
      <g stroke="#1f2937" strokeWidth="1.6">
        <path d="M90 232 l14 6 l-12 8 z" fill="#ec4899" />
        <path d="M160 224 l14 6 l-12 8 z" fill="#facc15" />
        <path d="M240 226 l14 7 l-12 7 z" fill="#60a5fa" />
        <path d="M310 236 l14 7 l-12 7 z" fill="#ec4899" />
      </g>

      {/* ground snow */}
      <path d="M0 268 q200 -20 400 4 v28 h-400 z" fill="#fff" stroke="#1f2937" strokeWidth="2" />
    </svg>
  );
}
