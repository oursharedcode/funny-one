// SPDX-License-Identifier: AGPL-3.0-only

// Shared thought bubble every `why` overlay draws on (T-FO-4.2b): a wobbly
// scalloped cloud over a hard ink shadow, plus two trailing dots down-left —
// toward `who`'s head in RigScene's layout. Icons stay inside roughly
// x 22–82 / y 16–64 (tighter at the corners) so nothing kisses the scallops.

const CLOUD =
  'M88 40 Q97 52 79.6 57.4 Q75.8 71 58.3 66.6 Q43 76 34 63.4 Q15 63 18.2 49.2 Q3 42 18.2 30.8 Q15.6 16 34 16.6 Q42 3 58.3 13.4 Q76 8 79.6 22.6 Q97 27 88 40 Z';

export function Bubble() {
  return (
    <>
      <g fill="#1f2937" transform="translate(3 3)">
        <path d={CLOUD} />
        <circle cx="16" cy="80" r="6" />
        <circle cx="8" cy="90" r="3.5" />
      </g>
      <path d={CLOUD} fill="#fef3c7" stroke="#1f2937" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="16" cy="80" r="6" fill="#fef3c7" stroke="#1f2937" strokeWidth="2.5" />
      <circle cx="8" cy="90" r="3.5" fill="#fef3c7" stroke="#1f2937" strokeWidth="2.5" />
    </>
  );
}
