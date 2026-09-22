// SPDX-License-Identifier: AGPL-3.0-only

// `why.bet-with-themselves` bubble: a coin mid-flip between two fists, thumbs
// up — and both fists are theirs.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function BetWithThemselves({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* left hand */}
      <rect
        x="28"
        y="44"
        width="16"
        height="12"
        rx="4"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path
        d="M38 44 q1 -8 5 -8 q3 1 2 8 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* right hand (also theirs) */}
      <rect
        x="60"
        y="44"
        width="16"
        height="12"
        rx="4"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path
        d="M66 44 q-1 -8 -5 -8 q-3 1 -2 8 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* the coin */}
      <circle cx="52" cy="26" r="10" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />
      <circle cx="52" cy="26" r="6.5" fill="none" stroke="#1f2937" strokeWidth="1.5" />
      <path
        d="M52 21 l1.5 3.5 h3.5 l-2.8 2.2 l1 3.8 l-3.2 -2.2 l-3.2 2.2 l1 -3.8 l-2.8 -2.2 h3.5 z"
        fill="#1f2937"
      />
      <path
        d="M38 30 q-1 -9 6 -13 M66 30 q1 -9 -6 -13"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M46 38 l-2 -2 M58 38 l2 -2" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
