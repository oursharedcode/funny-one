// SPDX-License-Identifier: AGPL-3.0-only

// Rig background for pool id `where.cookbook-library` (T-FO-4.1, see ../RIG_ART.md). Shelves
// stacked floor to ceiling with nothing but cookbooks. Static.

interface Props {
  className?: string;
}

function BookRow({ y, colors }: { y: number; colors: string[] }) {
  return (
    <g stroke="#1f2937" strokeWidth="1.8">
      {colors.map((c, i) => (
        <rect key={i} x={16 + i * 24} y={y} width="20" height="48" fill={c} />
      ))}
    </g>
  );
}

export default function CookbookLibrary({ className = '' }: Props) {
  const colors = [
    '#ec4899',
    '#facc15',
    '#60a5fa',
    '#f59e0b',
    '#ec4899',
    '#facc15',
    '#60a5fa',
    '#f59e0b',
  ];
  const colors2 = [
    '#facc15',
    '#60a5fa',
    '#ec4899',
    '#f59e0b',
    '#facc15',
    '#60a5fa',
    '#ec4899',
    '#f59e0b',
  ];

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <rect width="400" height="300" fill="#fef3c7" />

      {/* shelf frame */}
      <g stroke="#1f2937" strokeWidth="2.5">
        <path d="M4 20 h392 M4 96 h392 M4 172 h392 M4 248 h392" />
        <path d="M4 20 v228 M396 20 v228" />
      </g>

      <g transform="translate(190 0)">
        <BookRow y={26} colors={colors} />
      </g>
      <g transform="translate(190 0)">
        <BookRow y={102} colors={colors2} />
      </g>
      <g transform="translate(190 0)">
        <BookRow y={178} colors={colors} />
      </g>

      {/* a fallen cookbook, open, on the floor */}
      <path d="M300 250 l40 -4 l4 30 l-40 4 z" fill="#fef3c7" stroke="#1f2937" strokeWidth="2" />
      <path d="M320 247 v30" stroke="#1f2937" strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}
