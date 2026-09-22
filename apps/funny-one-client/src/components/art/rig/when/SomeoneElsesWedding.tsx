// SPDX-License-Identifier: AGPL-3.0-only

// `when.someone-elses-wedding` badge: two interlocked rings and a scatter of hearts — the
// wedding is somebody else's, so no faces, just the party's confetti.

import { Plate } from './Plate';

interface Props {
  className?: string;
}

export default function SomeoneElsesWedding({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Plate />
      <circle cx="42" cy="52" r="14" stroke="#facc15" strokeWidth="5" />
      <circle cx="42" cy="52" r="14" stroke="#1f2937" strokeWidth="1.5" />
      <circle cx="58" cy="50" r="14" stroke="#facc15" strokeWidth="5" />
      <circle cx="58" cy="50" r="14" stroke="#1f2937" strokeWidth="1.5" />
      {/* hearts */}
      <g fill="#ec4899" stroke="#1f2937" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M24 30 q-4 -6 2 -7 q3 0 3 3 q0 -3 3 -3 q6 1 2 7 l-5 5 z" />
        <path d="M74 26 q-4 -6 2 -7 q3 0 3 3 q0 -3 3 -3 q6 1 2 7 l-5 5 z" />
        <path d="M68 74 q-3 -5 2 -6 q2 0 2 2 q0 -2 2 -2 q5 1 2 6 l-4 4 z" />
      </g>
    </svg>
  );
}
