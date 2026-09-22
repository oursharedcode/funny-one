// SPDX-License-Identifier: AGPL-3.0-only

// `when.power-cut` badge: a dead bulb, crossed out, next to the candle that took over.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function PowerCut({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      {/* dead bulb */}
      <path
        d="M30 48 q-8 -18 10 -20 q18 2 10 20 q-3 4 -3 8 h-14 q0 -4 -3 -8 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.2"
      />
      <path d="M34 60 h12 M35 64 h10" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M32 36 l16 10 M48 36 l-16 10"
        stroke="#ef4444"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* candle */}
      <rect
        x="60"
        y="46"
        width="14"
        height="26"
        rx="2"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path
        d="M60 50 q4 4 8 0 q3 6 6 0"
        stroke="#1f2937"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path d="M67 46 v-6" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      <path d="M67 40 q-6 -8 0 -14 q6 6 0 14 z" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
      <path d="M67 38 q-2 -3 0 -6 q2 3 0 6 z" fill="#f59e0b" />
      <ellipse cx="67" cy="74" rx="11" ry="3.5" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
    </svg>
  );
}
