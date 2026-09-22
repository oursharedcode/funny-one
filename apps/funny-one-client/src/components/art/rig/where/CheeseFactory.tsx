// SPDX-License-Identifier: AGPL-3.0-only

// Rig background for pool id `where.cheese-factory` (T-FO-4.1, see ../RIG_ART.md). Stacked
// cheese wheels of different sizes with holes, factory shelving and pipes. Static.

interface Props {
  className?: string;
}

export default function CheeseFactory({ className = '' }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <rect width="400" height="300" fill="#fef3c7" />

      <g stroke="#1f2937" strokeWidth="1.5" opacity="0.3">
        <path d="M0 250 h400 M0 270 h400 M0 290 h400" />
      </g>

      {/* shelving */}
      <path d="M0 96 h400 M0 176 h400" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M40 96 v80 M360 96 v80" stroke="#1f2937" strokeWidth="2" opacity="0.5" />

      {/* pipe */}
      <path d="M0 40 h400" stroke="#60a5fa" strokeWidth="10" opacity="0.6" />
      <path d="M0 40 h400" stroke="#1f2937" strokeWidth="2" opacity="0.6" />

      {/* cheese wheels, varying sizes, stacked */}
      <g stroke="#1f2937" strokeWidth="2.5">
        <circle cx="90" cy="140" r="34" fill="#facc15" />
        <circle cx="78" cy="130" r="4" fill="#1f2937" opacity="0.3" />
        <circle cx="100" cy="150" r="5" fill="#1f2937" opacity="0.3" />
        <circle cx="95" cy="128" r="3" fill="#1f2937" opacity="0.3" />

        <circle cx="200" cy="150" r="40" fill="#facc15" />
        <circle cx="188" cy="138" r="5" fill="#1f2937" opacity="0.3" />
        <circle cx="212" cy="160" r="6" fill="#1f2937" opacity="0.3" />
        <circle cx="205" cy="135" r="4" fill="#1f2937" opacity="0.3" />
        <circle cx="190" cy="160" r="3" fill="#1f2937" opacity="0.3" />

        <circle cx="310" cy="140" r="30" fill="#facc15" />
        <circle cx="300" cy="132" r="4" fill="#1f2937" opacity="0.3" />
        <circle cx="318" cy="148" r="5" fill="#1f2937" opacity="0.3" />
      </g>

      {/* small stacked wheel row on lower shelf */}
      <g stroke="#1f2937" strokeWidth="2" fill="#fde68a">
        <circle cx="140" cy="220" r="16" />
        <circle cx="170" cy="220" r="16" />
        <circle cx="256" cy="222" r="18" />
      </g>
    </svg>
  );
}
