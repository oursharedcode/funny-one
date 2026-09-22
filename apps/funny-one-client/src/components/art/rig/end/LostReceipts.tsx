// SPDX-License-Identifier: AGPL-3.0-only

// `end.lost-receipts` stamp: two receipts with torn zigzag ends blowing off in
// opposite directions. Probably for the best.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function LostReceipts({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      <g transform="rotate(-14 40 46)">
        <path
          d="M31 30 h18 v28 l-4.5 -3 l-4.5 3 l-4.5 -3 l-4.5 3 z"
          fill="#fff"
          stroke="#1f2937"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <g stroke="#1f2937" strokeWidth="1.6" strokeLinecap="round" opacity="0.55">
          <path d="M35 37 h10 M35 42 h10 M35 47 h6" />
        </g>
      </g>
      <g transform="rotate(16 62 50)">
        <path
          d="M54 34 h16 v26 l-4 -3 l-4 3 l-4 -3 l-4 3 z"
          fill="#fff"
          stroke="#1f2937"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <g stroke="#1f2937" strokeWidth="1.6" strokeLinecap="round" opacity="0.55">
          <path d="M58 41 h8 M58 46 h8 M58 51 h5" />
        </g>
      </g>
      {/* gone */}
      <g fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <path d="M26 64 q8 4 16 1 M58 68 q9 2 15 -3" />
      </g>
    </svg>
  );
}
