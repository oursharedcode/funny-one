// SPDX-License-Identifier: AGPL-3.0-only

// Step 133 (B-29): one of hollyArt.ts's pictures as an inline SVG, for the
// ending card on the screen (StoryEnding.tsx). The clip's canvas draws the same
// path data with Path2D (videoFooter.ts). Decoration only, hidden from screen
// readers.

import type { Art } from './hollyArt';

interface Props {
  art: Art;
  className?: string;
}

export default function ArtSvg({ art, className }: Props) {
  const [left, top, side] = art.box;
  return (
    <svg
      aria-hidden="true"
      viewBox={`${left} ${top} ${side} ${side}`}
      className={className}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {art.parts.map((part, i) => (
        <path
          // The parts never change order: the index is their identity.
          key={i}
          d={part.d}
          fill={part.fill ?? 'none'}
          stroke={part.stroke}
          strokeWidth={part.width}
          transform={
            part.turn === undefined && part.shift === undefined
              ? undefined
              : `rotate(${part.turn ?? 0}) translate(${part.shift ?? 0} 0)`
          }
        />
      ))}
    </svg>
  );
}
