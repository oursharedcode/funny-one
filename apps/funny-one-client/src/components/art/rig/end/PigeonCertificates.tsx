// SPDX-License-Identifier: AGPL-3.0-only

// `end.pigeon-certificates` stamp: the certificate, its ribbon rosette, and the
// pigeon it was awarded to looking over the top of it.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function PigeonCertificates({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      {/* the recipient */}
      <circle cx="45" cy="33" r="9" fill="#60a5fa" stroke="#1f2937" strokeWidth="2.5" />
      <path
        d="M37 34 q-6 1 -6 3 q0 2 6 2 z"
        fill="#f59e0b"
        stroke="#1f2937"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="46" cy="31" r="2.6" fill="#fff" stroke="#1f2937" strokeWidth="1.2" />
      <circle cx="46.4" cy="31.4" r="1.3" fill="#1f2937" />
      <path d="M45 24 v-4" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      {/* the certificate */}
      <rect
        x="29"
        y="43"
        width="42"
        height="26"
        rx="2"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <g stroke="#1f2937" strokeWidth="1.8" strokeLinecap="round" opacity="0.6">
        <path d="M35 51 h22 M35 57 h22 M35 63 h13" />
      </g>
      <path
        d="M61 66 l-2 7 l4 -2 l3 3 l1 -7 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="63" cy="62" r="5" fill="#ec4899" stroke="#1f2937" strokeWidth="2" />
    </svg>
  );
}
