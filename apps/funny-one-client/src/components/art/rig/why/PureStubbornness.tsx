// SPDX-License-Identifier: AGPL-3.0-only

// `why.pure-stubbornness` bubble: a mule's head — ears up, eyes half-lidded and
// not level, mouth flat, one small "hmph" puff out of the nostril.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function PureStubbornness({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* ears */}
      <path
        d="M40 30 q-3 -12 4 -16 q6 6 3 16 z"
        fill="#fde68a"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M64 30 q3 -12 -4 -16 q-6 6 -3 16 z"
        fill="#fde68a"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* head */}
      <ellipse cx="52" cy="42" rx="18" ry="16" fill="#fde68a" stroke="#1f2937" strokeWidth="2.5" />
      <path d="M48 27 q4 -6 8 0" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      {/* muzzle */}
      <ellipse cx="52" cy="50" rx="10" ry="7" fill="#fff" stroke="#1f2937" strokeWidth="2" />
      <circle cx="48" cy="51" r="1.5" fill="#1f2937" />
      <circle cx="56" cy="51" r="1.5" fill="#1f2937" />
      <path d="M46 55.5 h12" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      {/* eyes: half-lidded, one lower than the other */}
      <circle cx="45" cy="38" r="4.5" fill="#fff" stroke="#1f2937" strokeWidth="1.5" />
      <circle cx="60" cy="36" r="4.5" fill="#fff" stroke="#1f2937" strokeWidth="1.5" />
      <circle cx="45.5" cy="39.5" r="2" fill="#1f2937" />
      <circle cx="60" cy="37.5" r="2" fill="#1f2937" />
      <path d="M40.5 38 a4.5 4.5 0 0 1 9 0 z" fill="#fde68a" stroke="#1f2937" strokeWidth="1.5" />
      <path d="M55.5 36 a4.5 4.5 0 0 1 9 0 z" fill="#fde68a" stroke="#1f2937" strokeWidth="1.5" />
      <path d="M40 32 l9 3 M64 30 l-9 3" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      {/* hmph */}
      <g fill="#fff" stroke="#1f2937" strokeWidth="1.5">
        <circle cx="72" cy="50" r="2.4" />
        <circle cx="76" cy="48" r="2.2" />
        <circle cx="79" cy="51" r="2" />
      </g>
    </svg>
  );
}
