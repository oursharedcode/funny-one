// SPDX-License-Identifier: AGPL-3.0-only

// `why.forgot-the-plan` bubble: a clipboard whose plan fades line by line into
// a trailing-off dotted line, with one bead of sweat beside it.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function ForgotThePlan({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* clipboard */}
      <rect
        x="34"
        y="21"
        width="36"
        height="39"
        rx="3"
        fill="#fde68a"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <rect x="45" y="17" width="14" height="8" rx="2" fill="#1f2937" />
      <rect x="38" y="26" width="28" height="30" fill="#fff" stroke="#1f2937" strokeWidth="1.5" />
      {/* the plan, forgetting itself */}
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round">
        <path d="M42 33 h20 M42 39 h20" />
        <path d="M42 45 h20" strokeDasharray="3 3" opacity="0.6" />
        <path d="M42 51 h6" strokeDasharray="1.5 3" opacity="0.35" />
      </g>
      <g fill="#1f2937" opacity="0.6">
        <circle cx="54" cy="51" r="1.3" />
        <circle cx="58" cy="51" r="1.3" />
        <circle cx="62" cy="51" r="1.3" />
      </g>
      {/* ...uh */}
      <path
        d="M76 34 q-5 7 0 10 q5 -3 0 -10 z"
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
