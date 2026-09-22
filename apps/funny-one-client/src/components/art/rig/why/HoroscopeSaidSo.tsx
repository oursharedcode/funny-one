// SPDX-License-Identifier: AGPL-3.0-only

// `why.horoscope-said-so` bubble: a crystal ball on an ink stand with a big star
// swimming in it. It was very specific.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

const SMALL_STAR = 'l1 2 l2 0 l-1.6 1.4 l0.6 2 l-2 -1.2 l-2 1.2 l0.6 -2 l-1.6 -1.4 l2 0 z';

export default function HoroscopeSaidSo({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* stand */}
      <path d="M38 60 h28 l-4 -7 h-20 z" fill="#1f2937" />
      {/* the ball */}
      <circle cx="52" cy="38" r="17" fill="#60a5fa" stroke="#1f2937" strokeWidth="2.5" />
      <path
        d="M41 32 q4 -7 11 -7"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M52 29 l2 5 h5 l-4 3 l2 5 l-5 -3 l-5 3 l2 -5 l-4 -3 h5 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <g fill="#fff">
        <path d={`M42 44 ${SMALL_STAR}`} />
        <path d={`M61 46 ${SMALL_STAR}`} />
      </g>
      {/* very specific */}
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round">
        <path d="M28 28 v5 M25.5 30.5 h5 M76 24 v5 M73.5 26.5 h5 M76 44 v4 M74 46 h4" />
      </g>
    </svg>
  );
}
