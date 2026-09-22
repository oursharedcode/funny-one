// SPDX-License-Identifier: AGPL-3.0-only

// Rig background for pool id `where.cramped-elevator` (T-FO-4.1, see ../RIG_ART.md). A narrow
// elevator car interior lined with brass buttons. Static.

interface Props {
  className?: string;
}

export default function CrampedElevator({ className = '' }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <rect width="400" height="300" fill="#fde68a" />

      {/* narrow side walls closing in the space */}
      <rect x="0" y="0" width="90" height="300" fill="#fef3c7" stroke="#1f2937" strokeWidth="2.5" />
      <rect
        x="310"
        y="0"
        width="90"
        height="300"
        fill="#fef3c7"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M90 0 v300 M310 0 v300" stroke="#1f2937" strokeWidth="2.5" />

      {/* handrail */}
      <path d="M90 210 h220" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
      <path d="M90 210 h220" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />

      {/* brass button panel */}
      <rect
        x="330"
        y="40"
        width="50"
        height="140"
        rx="6"
        fill="#fef3c7"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <g stroke="#1f2937" strokeWidth="1.8">
        <circle cx="345" cy="60" r="6" fill="#f59e0b" />
        <circle cx="365" cy="60" r="6" fill="#f59e0b" />
        <circle cx="345" cy="80" r="6" fill="#f59e0b" />
        <circle cx="365" cy="80" r="6" fill="#f59e0b" />
        <circle cx="345" cy="100" r="6" fill="#f59e0b" />
        <circle cx="365" cy="100" r="6" fill="#f59e0b" />
        <circle cx="345" cy="120" r="6" fill="#f59e0b" />
        <circle cx="365" cy="120" r="6" fill="#f59e0b" />
        <circle cx="345" cy="140" r="7" fill="#ef4444" />
        <circle cx="365" cy="140" r="7" fill="#10b981" />
      </g>

      {/* ceiling light strip */}
      <rect
        x="140"
        y="14"
        width="120"
        height="10"
        rx="4"
        fill="#fef3c7"
        stroke="#1f2937"
        strokeWidth="2"
      />
    </svg>
  );
}
