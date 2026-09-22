// SPDX-License-Identifier: AGPL-3.0-only

// `end.new-holiday-invented` stamp: a calendar with a star on the big day, and
// confetti already in the air.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function NewHolidayInvented({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      <path d="M40 26 v9 M60 26 v9" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
      <rect
        x="30"
        y="32"
        width="40"
        height="38"
        rx="3"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path
        d="M30 35 q0 -3 3 -3 h34 q3 0 3 3 v8 h-40 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M50 47 l3.6 7.8 h8.2 l-6.4 5.4 l2.5 8.2 l-7.9 -4.9 l-7.9 4.9 l2.5 -8.2 l-6.4 -5.4 h8.2 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="27" cy="29" r="2.2" fill="#60a5fa" />
      <circle cx="73" cy="34" r="2.2" fill="#10b981" />
      <path d="M72 24 l4.5 3 l-4.5 3 z" fill="#facc15" />
      <path d="M28 40 l-4.5 3 l4.5 3 z" fill="#ec4899" />
    </svg>
  );
}
