// SPDX-License-Identifier: AGPL-3.0-only

// `end.fruit-basket` stamp: the mayor's fruit basket, bow still on the handle.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function FruitBasket({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      {/* handle */}
      <path
        d="M34 50 q16 -20 32 0"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M50 33 l-6 -5 l2 6 l-7 -1 l6 4 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* fruit */}
      <circle cx="39" cy="46" r="7" fill="#ef4444" stroke="#1f2937" strokeWidth="2" />
      <circle cx="53" cy="44" r="8" fill="#10b981" stroke="#1f2937" strokeWidth="2" />
      <circle cx="63" cy="48" r="5.5" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
      {/* basket */}
      <path
        d="M28 50 h44 l-5 20 h-34 z"
        fill="#fde68a"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <g stroke="#1f2937" strokeWidth="1.5" opacity="0.5">
        <path d="M32 58 h36 M34 64 h32 M40 50 l-2 20 M50 50 v20 M60 50 l2 20" />
      </g>
    </svg>
  );
}
