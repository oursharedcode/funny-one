// SPDX-License-Identifier: AGPL-3.0-only

// `when.internet-outage` badge: wifi arcs struck through, the base dot pulling a sad face.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function InternetOutage({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      <g stroke="#60a5fa" strokeWidth="4" strokeLinecap="round">
        <path d="M24 44 q26 -22 52 0" />
        <path d="M32 54 q18 -14 36 0" />
        <path d="M40 63 q10 -7 20 0" />
      </g>
      <g stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round">
        <path d="M24 44 q26 -22 52 0" />
        <path d="M32 54 q18 -14 36 0" />
        <path d="M40 63 q10 -7 20 0" />
      </g>
      <circle cx="50" cy="72" r="6" fill="#60a5fa" stroke="#1f2937" strokeWidth="2" />
      <circle cx="48" cy="71" r="1" fill="#1f2937" />
      <circle cx="52.5" cy="70.5" r="1" fill="#1f2937" />
      <path d="M48 75 q2 -2 4 0" stroke="#1f2937" strokeWidth="1.2" strokeLinecap="round" />
      {/* strike-through */}
      <path d="M28 76 l44 -48" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
      <path d="M28 76 l44 -48" stroke="#1f2937" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
