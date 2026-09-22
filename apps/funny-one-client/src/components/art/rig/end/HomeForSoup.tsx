// SPDX-License-Identifier: AGPL-3.0-only

// `end.home-for-soup` stamp: a steaming bowl with the house it is waiting in
// tucked behind the steam.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function HomeForSoup({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      <path
        d="M58 34 l10 -9 l10 9 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="61" y="34" width="14" height="12" fill="#fde68a" stroke="#1f2937" strokeWidth="2" />
      <rect x="66" y="39" width="5" height="7" fill="#1f2937" />
      <g fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" opacity="0.55">
        <path d="M40 46 q-4 -6 0 -11 q4 -5 0 -9" />
        <path d="M52 46 q-4 -6 0 -11 q4 -5 0 -9" />
      </g>
      <path
        d="M26 52 h44 q0 20 -22 20 q-22 0 -22 -20 z"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <ellipse cx="48" cy="52" rx="22" ry="5" fill="#f59e0b" stroke="#1f2937" strokeWidth="2.5" />
    </svg>
  );
}
