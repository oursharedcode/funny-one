// SPDX-License-Identifier: AGPL-3.0-only

// `why.everyone-else-did` bubble: three identical little people, each with an
// arrow over their head pointing the same way.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

function Person({ x }: { x: number }) {
  return (
    <g>
      <path
        d={`M${x - 6} 56 v-9 q0 -6 6 -6 q6 0 6 6 v9 z`}
        fill="#60a5fa"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx={x} cy={35} r={5.5} fill="#60a5fa" stroke="#1f2937" strokeWidth="2" />
      <circle cx={x - 2} cy={34} r={1.1} fill="#1f2937" />
      <circle cx={x + 2.2} cy={33.4} r={1.1} fill="#1f2937" />
      <path d={`M${x - 1.5} 37.5 h3`} stroke="#1f2937" strokeWidth="1.2" strokeLinecap="round" />
      <path
        d={`M${x - 5} 25 h10 m-3 -3 l3 3 l-3 3`}
        stroke="#1f2937"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export default function EveryoneElseDid({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      <Person x={34} />
      <Person x={52} />
      <Person x={70} />
    </svg>
  );
}
