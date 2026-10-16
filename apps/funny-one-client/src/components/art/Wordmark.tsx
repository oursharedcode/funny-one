// SPDX-License-Identifier: AGPL-3.0-only

// Copied verbatim from apps/funny-multi-client/src/components/art/Wordmark.tsx
// (steering/funny-one-design.md §2: design-system components carry over
// unmodified). The rendered text comes from the home.title i18n key, which
// differs per product catalog.

import { motion } from 'framer-motion';
import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { goofy } from '../../styles/motion';

// The wordmark — Fredoka in brand pink, slightly tilted, bounces in on mount
// (DESIGN_SYSTEM §5). The text is per-language via the home.title i18n key:
// "Funny Multi" in English, «Чепуха 37» in Russian.
//
// A long title wraps onto balanced, centred lines. A single word wider than
// the column (Tamil «வேடிக்கையான» is ~440 px at 48 px) can't wrap, so the font
// shrinks until the title fits the column, never below MIN_FONT_PX (Step 74).

const MIN_FONT_PX = 24;

// Shrinks the element's font until it is no wider than its parent's content
// box. Runs again when the text changes, when the parent's width changes, and
// once the web fonts have loaded (a fallback font measures differently).
function useFitToColumn<T extends HTMLElement>(text: string) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const column = el?.parentElement;
    if (!el || !column) return;
    let lastRoom = -1;
    const fit = (force: boolean) => {
      const style = getComputedStyle(column);
      const room =
        column.clientWidth -
        (parseFloat(style.paddingLeft) || 0) -
        (parseFloat(style.paddingRight) || 0);
      if (!force && room === lastRoom) return; // a height change only
      lastRoom = room;
      el.style.fontSize = '';
      let size = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > room && size > MIN_FONT_PX) {
        size = Math.max(
          MIN_FONT_PX,
          Math.min(size - 1, Math.floor((size * room) / el.scrollWidth)),
        );
        el.style.fontSize = `${size}px`;
      }
    };
    fit(true);
    let live = true;
    void document.fonts?.ready.then(() => {
      if (live) fit(true);
    });
    // jsdom has no ResizeObserver.
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => fit(false));
    observer?.observe(column);
    return () => {
      live = false;
      observer?.disconnect();
    };
  }, [text]);
  return ref;
}

interface Props {
  className?: string;
}

export default function Wordmark({ className = '' }: Props) {
  const { t } = useTranslation();
  const title = t('home.title');
  const ref = useFitToColumn<HTMLHeadingElement>(title);
  return (
    <motion.h1
      ref={ref}
      className={`font-display font-bold text-5xl md:text-6xl text-pink-500 text-center text-balance ${className}`}
      initial={{ scale: 0.3, rotate: -14, opacity: 0 }}
      animate={{ scale: 1, rotate: -4, opacity: 1 }}
      transition={goofy}
    >
      {title}
    </motion.h1>
  );
}
