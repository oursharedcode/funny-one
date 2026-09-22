// SPDX-License-Identifier: AGPL-3.0-only

// `why.for-science` bubble: a conical flask of something green and bubbling.
// Probably fine.

import { Bubble } from './Bubble';

interface Props {
  className?: string;
}

const FLASK = 'M46 17 h12 v12 l13 23 q2 6 -4 6 h-30 q-6 0 -4 -6 l13 -23 z';

export default function ForScience({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Bubble />
      <path d={FLASK} fill="#fff" />
      {/* the science */}
      <path d="M42.5 40 h19 l9.5 16 q0 2 -2 2 h-34 q-2 0 -2 -2 z" fill="#10b981" />
      <circle cx="49" cy="47" r="2" fill="#fff" stroke="#1f2937" strokeWidth="1.2" />
      <circle cx="57" cy="51" r="1.5" fill="#fff" stroke="#1f2937" strokeWidth="1.2" />
      <circle cx="53" cy="43" r="1.2" fill="#fff" />
      {/* glass outline on top */}
      <path d={FLASK} fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M44 17 h16" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      {/* fizz */}
      <g stroke="#1f2937" strokeWidth="2" strokeLinecap="round">
        <path d="M28 34 v4 M26 36 h4 M76 30 v4 M74 32 h4" />
      </g>
    </svg>
  );
}
