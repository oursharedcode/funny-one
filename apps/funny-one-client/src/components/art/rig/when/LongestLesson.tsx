// SPDX-License-Identifier: AGPL-3.0-only

// `when.longest-lesson` badge: a chalkboard full of squiggle, and a wall clock whose minute hand
// has sagged in sympathy.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function LongestLesson({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      <rect
        x="18"
        y="34"
        width="52"
        height="38"
        rx="2"
        fill="#1f2937"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <rect x="21" y="37" width="46" height="32" fill="#10b981" opacity="0.85" />
      <g stroke="#fef3c7" strokeWidth="1.8" strokeLinecap="round" opacity="0.9">
        <path d="M26 44 q6 -4 12 0 t12 0 t10 0" />
        <path d="M26 52 q6 4 12 0 t12 0 t8 0" />
        <path d="M26 60 q6 -4 12 0 t12 0" />
      </g>
      {/* drooping clock */}
      <circle cx="80" cy="30" r="10" fill="#fff" stroke="#1f2937" strokeWidth="2.2" />
      <path d="M80 30 v-6" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      <path d="M80 30 q6 2 6 10" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      <circle cx="80" cy="30" r="1.3" fill="#1f2937" />
      {/* chalk stub */}
      <path d="M22 76 l8 0" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M22 76 l8 0" stroke="#1f2937" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
