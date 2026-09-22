// SPDX-License-Identifier: AGPL-3.0-only

// `why.impress-grandma` bubble: grandma herself — bun, big round glasses, one
// eyebrow far higher than the other. She has not commented yet.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function ImpressGrandma({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* bun */}
      <circle cx="52" cy="19" r="6" fill="#fff" stroke="#1f2937" strokeWidth="2.5" />
      <path
        d="M35 36 q0 -19 17 -19 q17 0 17 19 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* face */}
      <ellipse cx="52" cy="41" rx="16" ry="15" fill="#fde68a" stroke="#1f2937" strokeWidth="2.5" />
      <path
        d="M37 34 q6 -8 15 -6 q9 -2 15 6"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* glasses */}
      <circle cx="45" cy="41" r="5.5" fill="#fff" stroke="#1f2937" strokeWidth="2.5" />
      <circle cx="60" cy="40" r="5.5" fill="#fff" stroke="#1f2937" strokeWidth="2.5" />
      <path
        d="M50.5 41 h4 M39.5 41 l-4 -1 M65.5 40 l4 -1"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="45.5" cy="42" r="2" fill="#1f2937" />
      <circle cx="60" cy="41" r="2" fill="#1f2937" />
      {/* the verdict is pending */}
      <path d="M40 34 l9 1 M56 30 l8 2" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      <path d="M46 51 h12" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="37" cy="47" r="2" fill="#ec4899" opacity="0.6" />
      <circle cx="67" cy="47" r="2" fill="#ec4899" opacity="0.6" />
      <circle cx="35" cy="44" r="1.6" fill="#facc15" stroke="#1f2937" strokeWidth="1.2" />
      <circle cx="69" cy="43" r="1.6" fill="#facc15" stroke="#1f2937" strokeWidth="1.2" />
    </svg>
  );
}
