// SPDX-License-Identifier: AGPL-3.0-only

// `end.museum-exhibit` stamp: whatever it was, now in a glass case on a plinth
// with a little placard nobody reads.

import { Seal } from './Seal';

interface Props {
  className?: string;
}

export default function MuseumExhibit({ className = '' }: Props) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100" fill="none">
      <Seal />
      {/* the exhibit */}
      <circle cx="50" cy="48" r="8" fill="#ec4899" stroke="#1f2937" strokeWidth="2" />
      <path d="M50 40 v-4" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      {/* the glass */}
      <rect x="32" y="28" width="36" height="32" rx="2" fill="#60a5fa" opacity="0.28" />
      <rect
        x="32"
        y="28"
        width="36"
        height="32"
        rx="2"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <path
        d="M35 46 l9 -16 M39 52 l6 -11"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* the plinth */}
      <rect
        x="29"
        y="60"
        width="42"
        height="12"
        rx="2"
        fill="#fde68a"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
      <rect
        x="41"
        y="63"
        width="18"
        height="6"
        rx="1"
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="1.6"
      />
    </svg>
  );
}
