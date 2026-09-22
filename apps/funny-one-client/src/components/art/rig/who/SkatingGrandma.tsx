// SPDX-License-Identifier: AGPL-3.0-only

// Rig character for pool id `who.skating-grandma` (T-FO-4.1, see ../RIG_ART.md). A grandmother
// zooming along on roller skates, hair in a bun, spectacles. Static (the compositor applies any
// reveal motion, not this asset).

interface Props {
  className?: string;
}

export default function SkatingGrandma({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      {/* hair bun */}
      <circle cx="50" cy="22" r="7" fill="#fef3c7" stroke="#1f2937" strokeWidth="2" />

      {/* head */}
      <circle cx="50" cy="38" r="16" fill="#facc15" stroke="#1f2937" strokeWidth="2.5" />

      {/* spectacles */}
      <circle cx="43" cy="38" r="4.5" fill="none" stroke="#1f2937" strokeWidth="1.8" />
      <circle cx="55" cy="37" r="4.5" fill="none" stroke="#1f2937" strokeWidth="1.8" />
      <path d="M47.5 38 h3" stroke="#1f2937" strokeWidth="1.6" />
      <circle cx="43" cy="38" r="1.4" fill="#1f2937" />
      <circle cx="55" cy="37" r="1.4" fill="#1f2937" />

      {/* excited grin */}
      <path d="M43 46 q7 5 14 0" stroke="#1f2937" strokeWidth="2.2" strokeLinecap="round" />

      {/* buttoned coat body, leaning forward for speed */}
      <path
        d="M30 86 q6 -30 20 -30 q14 0 20 30 z"
        fill="#ec4899"
        stroke="#1f2937"
        strokeWidth="2.5"
        transform="rotate(-8 50 70)"
      />
      <circle cx="50" cy="62" r="1.6" fill="#1f2937" />
      <circle cx="50" cy="70" r="1.6" fill="#1f2937" />
      <circle cx="50" cy="78" r="1.6" fill="#1f2937" />

      {/* roller skates */}
      <rect x="28" y="86" width="16" height="6" rx="2" fill="#1f2937" />
      <rect x="56" y="86" width="16" height="6" rx="2" fill="#1f2937" />
      <circle cx="31" cy="94" r="2.4" fill="#f59e0b" stroke="#1f2937" strokeWidth="1.2" />
      <circle cx="41" cy="94" r="2.4" fill="#f59e0b" stroke="#1f2937" strokeWidth="1.2" />
      <circle cx="59" cy="94" r="2.4" fill="#f59e0b" stroke="#1f2937" strokeWidth="1.2" />
      <circle cx="69" cy="94" r="2.4" fill="#f59e0b" stroke="#1f2937" strokeWidth="1.2" />

      {/* speed lines */}
      <path
        d="M18 60 h8 M14 70 h8"
        stroke="#1f2937"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
