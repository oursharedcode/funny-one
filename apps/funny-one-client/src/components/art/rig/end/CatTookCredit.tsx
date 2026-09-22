// SPDX-License-Identifier: AGPL-3.0-only

// `end.cat-took-credit` stamp: a smug cat wearing a medal it did not earn. The
// lids are at different heights on purpose.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function CatTookCredit({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      <g stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round">
        <path d="M33 48 h-7 M33 53 h-7 M59 47 h7 M59 52 h7" />
      </g>
      <path
        d="M35 37 l-2 -12 l12 6 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M57 37 l2 -12 l-12 6 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="46" cy="47" r="15" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />
      {/* half-shut, and not at the same height */}
      <path d="M38 45 a4.5 4.5 0 0 1 9 0 z" fill="#1f2937" />
      <path d="M50 44 a4 4 0 0 1 8 0 z" fill="#1f2937" />
      <path
        d="M46 51 l-2.5 -2.5 h5 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M46 53 q-3 4 -6 1 M46 53 q3 4 6 1"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M63 58 l-2 -9 l9 3 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="67" cy="63" r="6.5" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
      <circle cx="67" cy="63" r="2.5" fill="#1f2937" />
    </svg>
  );
}
