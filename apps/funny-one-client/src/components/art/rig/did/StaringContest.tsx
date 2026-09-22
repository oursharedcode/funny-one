// SPDX-License-Identifier: AGPL-3.0-only

// Rig prop for pool id `did.staring-contest` (T-FO-4.1, see ../RIG_ART.md). Two huge, unblinking
// misaligned eyes facing off with a tension line and sweat drops between them.

interface Props {
  className?: string;
}

function BigEye({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) ${flip ? 'scale(-1 1)' : ''}`}>
      <ellipse cx="0" cy="0" rx="16" ry="12" fill="#fff" stroke="#1f2937" strokeWidth="2.5" />
      <circle cx="3" cy="1" r="6" fill="#1f2937" />
      <circle cx="1" cy="-1" r="1.6" fill="#fff" />
    </g>
  );
}

export default function StaringContest({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <BigEye x={26} y={48} />
      <BigEye x={74} y={52} flip />

      {/* tension line */}
      <path d="M42 48 h16" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />

      {/* sweat drops */}
      <path d="M20 30 q-3 6 0 10 q3 -4 0 -10" fill="#60a5fa" stroke="#1f2937" strokeWidth="1.4" />
      <path d="M82 34 q-3 6 0 10 q3 -4 0 -10" fill="#60a5fa" stroke="#1f2937" strokeWidth="1.4" />
    </svg>
  );
}
