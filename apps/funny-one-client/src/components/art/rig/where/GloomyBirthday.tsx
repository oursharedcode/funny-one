// SPDX-License-Identifier: AGPL-3.0-only

// Rig background for pool id `where.gloomy-birthday` (T-FO-4.1, see ../RIG_ART.md). A birthday
// hall with sagging balloons and a drooping "Happy Birthday" banner. Static.

interface Props {
  className?: string;
}

export default function GloomyBirthday({ className = '' }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <rect width="400" height="300" fill="#fef3c7" opacity="0.6" />
      <rect width="400" height="300" fill="#60a5fa" opacity="0.12" />

      <g stroke="#1f2937" strokeWidth="1.5" opacity="0.3">
        <path d="M0 250 h400 M0 270 h400 M0 290 h400" />
      </g>

      {/* drooping banner */}
      <path d="M40 50 q160 60 320 0" stroke="#1f2937" strokeWidth="2" fill="none" />
      <g stroke="#1f2937" strokeWidth="1.6" fill="#fef3c7">
        <path d="M120 66 l16 -4 l16 10 l-4 16 z" />
        <path d="M180 78 l16 -4 l16 10 l-4 16 z" />
        <path d="M240 74 l16 -6 l14 12 l-6 16 z" />
      </g>

      {/* sagging balloons on long limp strings */}
      <g stroke="#1f2937" strokeWidth="2">
        <path d="M80 90 q4 60 -6 110" fill="none" />
        <ellipse cx="80" cy="86" rx="16" ry="20" fill="#ec4899" transform="rotate(8 80 86)" />

        <path d="M200 60 q-6 70 4 140" fill="none" />
        <ellipse cx="200" cy="56" rx="16" ry="20" fill="#60a5fa" transform="rotate(-6 200 56)" />

        <path d="M320 96 q8 50 -4 100" fill="none" />
        <ellipse cx="320" cy="92" rx="15" ry="19" fill="#facc15" transform="rotate(10 320 92)" />
      </g>

      {/* table */}
      <path d="M120 262 h160 v10 h-160 z" fill="#fff" stroke="#1f2937" strokeWidth="2" />
      <path d="M130 272 v16 M270 272 v16" stroke="#1f2937" strokeWidth="2" />
    </svg>
  );
}
