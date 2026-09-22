// SPDX-License-Identifier: AGPL-3.0-only

// `why.because-tuesday` bubble: a ring-bound calendar with exactly one day
// highlighted and a single nervous sweat-drop. That was reason enough.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function BecauseTuesday({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* calendar */}
      <rect
        x="32"
        y="22"
        width="40"
        height="36"
        rx="3"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path
        d="M32 25 q0 -3 3 -3 h34 q3 0 3 3 v7 h-40 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M40 17 v9 M64 17 v9" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
      <g stroke="#1f2937" strokeWidth="1.5" opacity="0.5">
        <path d="M32 41 h40 M32 50 h40 M40 32 v26 M48 32 v26 M56 32 v26 M64 32 v26" />
      </g>
      {/* it was this one */}
      <rect x="40" y="32" width="8" height="9" fill="#facc15" />
      {/* ...and that was reason enough */}
      <path
        d="M76 26 q-5 7 0 10 q5 -3 0 -10 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
