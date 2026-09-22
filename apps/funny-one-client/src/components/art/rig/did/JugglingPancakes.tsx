// SPDX-License-Identifier: AGPL-3.0-only

// Rig prop for pool id `did.juggling-pancakes` (T-FO-4.1 draft slice, see ../RIG_ART.md). A tall
// lopsided stack with two more discs mid-air, motion arcs implying the juggle — the prop layer
// carries the action; the juggling character itself lives in the who/with layers. Static — the
// future rig compositor (T-FO-4.2) applies the reveal motion, not this asset.

interface Props {
  className?: string;
}

export default function JugglingPancakes({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* grounded stack, each disc slightly offset for the lopsided/hand-drawn read */}
      <g stroke="#1f2937" strokeWidth="2.2">
        <ellipse cx="50" cy="86" rx="20" ry="5" fill="#facc15" />
        <ellipse cx="48" cy="78" rx="19" ry="5" fill="#fde68a" />
        <ellipse cx="51" cy="70" rx="18" ry="4.6" fill="#facc15" />
        <ellipse cx="49" cy="63" rx="17" ry="4.4" fill="#fde68a" />
      </g>
      {/* pat of syrup on top */}
      <path
        d="M43 61 q6 -4 12 0 q2 3 -2 4 q-6 2 -10 -1 q-2 -1 0 -3 z"
        fill="#f59e0b"
        stroke="#1f2937"
        strokeWidth="1.6"
      />

      {/* two pancakes mid-air, with motion arcs behind them */}
      <g stroke="#1f2937" strokeWidth="1.6" opacity="0.55" fill="none">
        <path d="M20 30 q10 -14 28 -10" strokeLinecap="round" />
        <path d="M84 24 q-12 -12 -30 -6" strokeLinecap="round" />
      </g>
      <ellipse cx="22" cy="34" rx="14" ry="4" fill="#facc15" stroke="#1f2937" strokeWidth="2" />
      <ellipse cx="80" cy="20" rx="13" ry="3.6" fill="#fde68a" stroke="#1f2937" strokeWidth="2" />
    </svg>
  );
}
