// SPDX-License-Identifier: AGPL-3.0-only

// `why.world-record` bubble: a gold trophy with a pink star on the cup. Nobody
// had heard of the record; the trophy exists regardless.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

export default function WorldRecord({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      {/* handles */}
      <path
        d="M38 24 q-12 0 -10 10 q2 6 10 6 M66 24 q12 0 10 10 q-2 6 -10 6"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* cup */}
      <path
        d="M38 20 h28 v14 q0 14 -14 14 q-14 0 -14 -14 z"
        fill="#facc15"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M48 48 h8 v6 h-8 z" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
      <path d="M40 60 q0 -6 6 -6 h12 q6 0 6 6 z" fill="#1f2937" />
      <path
        d="M52 26 l2 4.5 h5 l-4 3 l1.5 5 l-4.5 -3 l-4.5 3 l1.5 -5 l-4 -3 h5 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* nobody had heard of it */}
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round">
        <path d="M26 40 h-4 M78 40 h4 M28 30 l-3 -2 M76 30 l3 -2" />
      </g>
    </svg>
  );
}
