// SPDX-License-Identifier: AGPL-3.0-only

// `why.for-a-sticker` bubble: one gold star sticker on its backing sheet, corner
// already peeling, glossy enough to justify anything.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function ForASticker({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* backing sheet, corner peeling */}
      <path
        d="M30 24 h44 v36 h-32 l-12 -10 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M30 50 l12 10 q-11 -1 -12 -10 z"
        fill="#fef3c7"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* the sticker */}
      <path
        d="M52 26 L56.1 36.3 L67.2 37.1 L58.7 44.2 L61.4 54.9 L52 49 L42.6 54.9 L45.3 44.2 L36.8 37.1 L47.9 36.3 Z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M46 38 q3 -3 6 -3"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* shiny */}
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round">
        <path d="M25 34 v5 M22.5 36.5 h5 M79 42 v5 M76.5 44.5 h5 M74 20 v4 M72 22 h4" />
      </g>
    </svg>
  );
}
