// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-3.2 — the combobox, adapted from Funny Multi's RoundScreen (T-3.3).
// The same FM-ANS-1 constraint applies locally: no free-text affordance
// anywhere on this screen (RoundScreen.test.tsx asserts it structurally, same
// as the original). Everything wire-shaped in that version — the
// `round:start` payload, `socket.emit`, `isHost`, the joiner dual-language
// gloss, the story-language badge — has no local equivalent: there is one
// device, one language, one story per seat, chosen once at setup (T-FO-3.1)
// and passed straight through here. No `TimerBar` either (owner call,
// 2026-09-20): pass-and-play has no network latency to bound, and rushing
// whoever is holding the phone works against the game.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import ScrollBox from '../components/ScrollBox';
import { snappy } from '../styles/motion';
import { POOLS, POOL_TEXTS, QUESTIONS, SLOT_COUNT, isVisualSlot } from '@funny/shared';
import type { AuthoredLanguage, OptionId, SlotIndex } from '@funny/shared';

interface Props {
  /** Fixed for the whole game — picked once on HomeScreen (T-FO-3.1). */
  language: AuthoredLanguage;
  slot: SlotIndex;
  onSubmit: (optionId: OptionId) => void;
}

/** Fisher-Yates, on a copy — see the original RoundScreen for why unseeded. */
function shuffled<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export default function RoundScreen({ language, slot, onSubmit }: Props) {
  const { t } = useTranslation();

  const [selected, setSelected] = useState<OptionId | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const optionRefs = useRef(new Map<OptionId, HTMLButtonElement>());

  const options = useMemo(
    () =>
      shuffled(POOLS[slot]).map((option) => ({
        id: option.id,
        text: POOL_TEXTS[language][option.id],
      })),
    [slot, language],
  );

  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
    optionRefs.current.clear();
  }, [slot]);

  function submit(): void {
    if (submitted || selected === null) return;
    setSubmitted(true);
    onSubmit(selected);
  }

  /** Move the selection by `delta`, wrapping, and follow it with focus. */
  function moveSelection(delta: number): void {
    if (submitted || options.length === 0) return;
    const current = options.findIndex((o) => o.id === selected);
    const next =
      current < 0
        ? delta > 0
          ? 0
          : options.length - 1
        : (current + delta + options.length) % options.length;
    const id = options[next]!.id;
    setSelected(id);
    optionRefs.current.get(id)?.focus();
  }

  function focusEdge(index: number): void {
    if (submitted || options.length === 0) return;
    const id = options[index]!.id;
    setSelected(id);
    optionRefs.current.get(id)?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        moveSelection(1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        moveSelection(-1);
        break;
      case 'Home':
        event.preventDefault();
        focusEdge(0);
        break;
      case 'End':
        event.preventDefault();
        focusEdge(options.length - 1);
        break;
      default:
        break;
    }
  }

  // Prose slots carry 20–30 options and need their own scroll region; the
  // visual slots' 9–12 sit in the page flow (design §8.1).
  const scrolls = !isVisualSlot(slot);
  const canSubmit = selected !== null && !submitted;
  const question = QUESTIONS[language][slot];

  const list = (
    <div
      role="radiogroup"
      aria-label={t('round.optionsLabel')}
      aria-disabled={submitted || undefined}
      onKeyDown={onKeyDown}
      className="flex flex-col gap-2"
    >
      {options.map((option) => {
        const isSelected = option.id === selected;
        return (
          <motion.button
            key={option.id}
            ref={(el: HTMLButtonElement | null) => {
              if (el) optionRefs.current.set(option.id, el);
              else optionRefs.current.delete(option.id);
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={submitted}
            // Roving tabindex: the group is one tab stop. The selected card
            // holds it, or the first card before anything is selected.
            tabIndex={isSelected || (selected === null && option.id === options[0]?.id) ? 0 : -1}
            onClick={() => setSelected(option.id)}
            animate={{ scale: isSelected ? 1.02 : 1 }}
            transition={snappy}
            className={`w-full rounded-xl border-2 px-4 py-4 text-start font-prose text-xl leading-snug disabled:opacity-60 ${
              isSelected
                ? 'border-pink-500 bg-pink-500 text-white'
                : 'border-amber-300 bg-white text-gray-800'
            }`}
          >
            {option.text}
          </motion.button>
        );
      })}
    </div>
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6 pt-6">
      <p className="text-xs text-gray-600">
        {t('round.progress', { current: slot + 1, total: SLOT_COUNT })}
      </p>
      <h2 className="font-display text-3xl font-semibold">{question}</h2>

      <p className="text-sm font-semibold text-gray-700">{t('round.pick')}</p>

      {scrolls ? (
        <>
          <ScrollBox className="h-[26rem]" contentClassName="pe-3">
            {list}
          </ScrollBox>
          <p className="text-center text-xs text-gray-500">{t('round.scrollHint')}</p>
        </>
      ) : (
        list
      )}

      <button
        className="rounded bg-pink-500 py-3 font-display text-xl font-semibold text-white disabled:bg-gray-300 disabled:text-gray-500"
        disabled={!canSubmit}
        title={selected === null ? t('round.submitDisabled') : ''}
        onClick={submit}
      >
        {submitted ? t('round.submitted') : t('round.submit')}
      </button>
    </div>
  );
}
