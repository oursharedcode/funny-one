// SPDX-License-Identifier: AGPL-3.0-only

// Rig background for pool id `where.giant-sock-drawer` (T-FO-4.1, see ../RIG_ART.md). An open
// drawer, viewed from above-ish, stuffed with mismatched striped socks. Static.

interface Props {
  className?: string;
}

function Sock({ x, y, rotate, color }: { x: number; y: number; rotate: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <path
        d="M0 0 h20 v34 q0 14 -14 14 q-14 0 -14 -12 q0 -4 4 -6 l4 -2 z"
        fill={color}
        stroke="#1f2937"
        strokeWidth="2"
      />
      <path d="M0 10 h20 M0 20 h20" stroke="#1f2937" strokeWidth="1.4" opacity="0.5" />
    </g>
  );
}

export default function GiantSockDrawer({ className = '' }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <rect width="400" height="300" fill="#fef3c7" />

      {/* drawer walls, viewed from above at an angle */}
      <path
        d="M20 40 L380 40 L360 280 L40 280 Z"
        fill="#fde68a"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M20 40 L380 40 L360 60 L40 60 Z" fill="#facc15" stroke="#1f2937" strokeWidth="2" />

      <Sock x={70} y={90} rotate={-12} color="#ec4899" />
      <Sock x={130} y={70} rotate={8} color="#60a5fa" />
      <Sock x={190} y={100} rotate={-20} color="#facc15" />
      <Sock x={240} y={75} rotate={15} color="#ec4899" />
      <Sock x={290} y={95} rotate={-6} color="#f59e0b" />
      <Sock x={110} y={150} rotate={25} color="#60a5fa" />
      <Sock x={200} y={160} rotate={-15} color="#f59e0b" />
      <Sock x={270} y={155} rotate={10} color="#ec4899" />
    </svg>
  );
}
