// SPDX-License-Identifier: AGPL-3.0-only

// `why.no-reason` bubble: a full-body shrug — palms up, eyebrows at two
// different heights, mouth a flat wiggle. There was no reason. That is all.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function NoReason({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* arms, up */}
      <path
        d="M40 47 q-8 -2 -12 -11 M64 47 q8 -2 12 -11"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="28" cy="36" r="4" fill="#fde68a" stroke="#1f2937" strokeWidth="2" />
      <circle cx="76" cy="36" r="4" fill="#fde68a" stroke="#1f2937" strokeWidth="2" />
      <path
        d="M26 33 v-2 M28.5 32.5 v-2 M74 33 v-2 M76.5 32.5 v-2"
        stroke="#1f2937"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* body */}
      <path
        d="M40 60 v-12 q0 -7 12 -7 q12 0 12 7 v12 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="52" cy="30" r="11" fill="#fde68a" stroke="#1f2937" strokeWidth="2.5" />
      <circle cx="47" cy="29" r="3.5" fill="#fff" stroke="#1f2937" strokeWidth="1.5" />
      <circle cx="57.5" cy="27.5" r="3.5" fill="#fff" stroke="#1f2937" strokeWidth="1.5" />
      <circle cx="47.5" cy="29.5" r="1.6" fill="#1f2937" />
      <circle cx="57" cy="28" r="1.6" fill="#1f2937" />
      <path
        d="M43 23 q4 -3 8 -1 M54 21 q4 -2 7 1"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M47 36 q2.5 -2 5 0 t5 0"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
