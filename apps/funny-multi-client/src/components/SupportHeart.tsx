// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: Home's ♥ with its label beside it — "Support Author" in English —
// whose words hop one after another, away from the heart, after it beats,
// then rest a moment, over and over (index.css, `support-hop` /
// `support-beat`). One button, so the label widens the tap target instead of
// adding a second one, and its name is exactly the visible label (WCAG
// 2.5.3). Under prefers-reduced-motion nothing moves.
//
// Beside, not under: one line high, in every language, so the corner it
// takes stays shallow; Home keeps its top clear of it (HomeScreen's `pt-14`).
// Under it, a long label wrapped to two lines and ran into the title.

import { useTranslation } from 'react-i18next';

interface Props {
  onOpen: () => void;
}

/**
 * The parts of the label that hop one by one: its words, or — for a label
 * written without spaces, as in Chinese and Japanese — its characters.
 * Grapheme clusters rather than code points, so no script ever has a vowel
 * sign or a combining mark torn from its letter.
 */
export function hopParts(label: string): string[] {
  const words = label.split(/\s+/).filter(Boolean);
  if (words.length !== 1) return words;
  if (typeof Intl.Segmenter !== 'function') return words;
  const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(label);
  return Array.from(graphemes, (part) => part.segment);
}

export default function SupportHeart({ onOpen }: Props) {
  const { t } = useTranslation();
  const label = t('support.openLabel');
  // Words need the gap a flex row drops with the spaces; characters do not.
  const spaced = /\s/.test(label.trim());
  return (
    <button
      type="button"
      aria-label={label}
      className="fixed right-2 top-2 z-30 flex items-center gap-1"
      onClick={onOpen}
    >
      <span aria-hidden="true" className="support-beat text-2xl leading-none text-pink-500">
        ♥
      </span>
      <span
        aria-hidden="true"
        className={`flex whitespace-nowrap ${spaced ? 'gap-x-1' : ''} rounded-2xl border border-pink-200 bg-white/90 px-2 py-0.5 font-display text-xs font-semibold leading-tight text-pink-600 shadow-sm`}
      >
        {hopParts(label).map((part, index) => (
          <span
            key={index}
            className="support-hop inline-block"
            style={{ animationDelay: `${200 + index * 110}ms` }}
          >
            {part}
          </span>
        ))}
      </span>
    </button>
  );
}
