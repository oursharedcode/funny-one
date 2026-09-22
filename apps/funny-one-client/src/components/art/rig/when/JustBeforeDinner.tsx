// SPDX-License-Identifier: AGPL-3.0-only

// `when.just-before-dinner` badge: a steaming pot with the lid rattling, clock nudging six.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function JustBeforeDinner({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      {/* steam */}
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round" opacity="0.55">
        <path d="M40 40 q-4 -6 0 -12 q4 -6 0 -12" />
        <path d="M50 38 q-4 -6 0 -12 q4 -6 0 -12" />
      </g>
      {/* pot */}
      <path
        d="M28 50 h44 v18 q0 8 -8 8 h-28 q-8 0 -8 -8 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path d="M24 50 h52" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M30 46 q20 -6 40 0"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
        transform="rotate(-6 50 46)"
      />
      <circle cx="50" cy="42" r="2.5" fill="#1f2937" />
      <path
        d="M22 60 q-6 0 -6 -4 M78 60 q6 0 6 -4"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* clock */}
      <circle cx="76" cy="30" r="10" fill="#fff" stroke="#1f2937" strokeWidth="2.2" />
      <path d="M76 30 v5 M76 30 l3 -6" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      <circle cx="76" cy="30" r="1.3" fill="#1f2937" />
    </svg>
  );
}
