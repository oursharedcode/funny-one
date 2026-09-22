// SPDX-License-Identifier: AGPL-3.0-only

// `why.warranty-forbade-it` bubble: the warranty itself — folded corner, gold
// seal, small print — with a big red "do not" stamped across it.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function WarrantyForbadeIt({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* the document */}
      <path
        d="M36 20 h28 l8 8 v32 h-36 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M64 20 v8 h8"
        fill="#fef3c7"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="44" cy="31" r="4" fill="#facc15" stroke="#1f2937" strokeWidth="1.5" />
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round" opacity="0.6">
        <path d="M52 31 h12 M40 40 h26 M40 47 h26 M40 54 h16" />
      </g>
      {/* said not to */}
      <circle cx="58" cy="47" r="12" fill="none" stroke="#ef4444" strokeWidth="4" />
      <path d="M49.5 38.5 l17 17" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
