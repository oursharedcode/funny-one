// SPDX-License-Identifier: AGPL-3.0-only

// T-3.3 — the combobox (design §8.1). This screen is the product.
//
// SRC put a 70-character textarea here and spent a filter stack, a translation
// pipeline and three render-time grammar repairs coping with what came back.
// FM-ANS-1 replaces all of it: the player picks one option per round and the
// wire carries the option **id** (FM-ANS-2). **No free-text affordance may
// exist on this screen** — no input, no textarea, no editable region, and no
// search field over the options either, since a filter box is a text box.
// `RoundScreen.test.tsx` asserts that structurally rather than trusting review.
//
// Options are not on the wire (DD-2): `round:start` carries only the round
// number, the question and the deadline. The client bundles the same
// `@funny/shared` build as the server, so it renders the pool for
// (roundNumber, room language) locally — the protocol does not grow with pool
// size, and the two sides cannot disagree about pool content because they ship
// as one unit. One round per slot, so the round number *is* the slot index,
// exactly as the server's `slotOf` has it.
//
// Control semantics are a radiogroup rather than a listbox: the options are
// mutually exclusive, committed by a separate Submit, and every one is a large
// tap target on a phone. That gives arrow-key navigation and a single tab stop
// for free, and `<button role="radio">` keeps Space/Enter activation native.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import TimerBar from '../components/TimerBar';
import ScrollBox from '../components/ScrollBox';
import SubmitConfirm from '../components/art/SubmitConfirm';
import { socket } from '../socket';
import { snappy } from '../styles/motion';
import { LANGUAGES, POOLS, POOL_TEXTS, isVisualSlot } from '@funny/shared';
import type { AuthoredLanguage, OptionId, RoundStartPayload, SlotIndex } from '@funny/shared';

interface Props {
  round: RoundStartPayload;
  /** Room content language; `AuthoredLanguage` because every room has pools (App.tsx). */
  language: AuthoredLanguage;
  isHost: boolean;
}

const ROUND_DURATION_MS = 60_000;
const TOTAL_ROUNDS = 7;

/**
 * Fisher-Yates, on a copy.
 *
 * FM-ANS-3 wants the order to differ per player per round, so that two players
 * comparing screens do not see the same list and so position carries no
 * meaning between them. `Math.random` is right here precisely because it is not
 * seeded: any shared seed — room code, round number — would give every player
 * in the room the same order and defeat the requirement.
 */
function shuffled<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export default function RoundScreen({ round, language, isHost }: Props) {
  const { t, i18n } = useTranslation();
  const slot = round.roundNumber as SlotIndex;

  const [selected, setSelected] = useState<OptionId | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const optionRefs = useRef(new Map<OptionId, HTMLButtonElement>());

  // Shuffled once per (player, round) — keyed on the slot, so it is stable for
  // every re-render within a round. Reshuffling on render would reorder the
  // list under the player's finger each time the selection changed, which is
  // both unusable and a way to mis-tap an answer you cannot take back.
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
  }, [round.roundNumber]);

  function submit(): void {
    // The `submitted` half is defence in depth, not the working guard: the
    // button is already disabled by then, so this early-return does not run
    // today. Kept because the action is irreversible and a future keyboard
    // shortcut or a dropped `disabled` would make it load-bearing — but it is
    // deliberately not claimed as covered (see RoundScreen.test.tsx).
    if (submitted || selected === null) return;
    setSubmitted(true);
    socket.emit('round:submit', { optionId: selected });
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

  // Dual-display gloss (spec §8/§9), kept from SRC and kept for the *question*
  // only: when a joiner's UI language differs from the room's content language,
  // the question gets a secondary line in their own language. Option texts stay
  // in the room language alone — a per-option gloss would double the height of
  // a 22-row list on a phone (design §8.1 defers it to B-4).
  const glossQuestions = i18n.getResource(i18n.language, 'translation', 'questions') as
    string[] | undefined;
  const questionGloss =
    i18n.language !== language ? glossQuestions?.[round.roundNumber] : undefined;

  const storyLang = LANGUAGES.find((opt) => opt.code === language);
  // Prose slots carry 20–30 options and need their own scroll region; the
  // visual slots' 9–12 sit in the page flow (design §8.1).
  const scrolls = !isVisualSlot(slot);
  const canSubmit = selected !== null && !submitted;

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
      <TimerBar deadline={round.deadline} duration={ROUND_DURATION_MS} />
      <p className="text-xs text-gray-600">
        {t('round.progress', { current: round.roundNumber + 1, total: TOTAL_ROUNDS })}
      </p>
      <h2 className="font-display text-3xl font-semibold">{round.question}</h2>
      {questionGloss && <p className="text-base italic text-gray-500">{questionGloss}</p>}

      {/* Constant story-language indicator, joiners only (spec §8). The host
          picked this language so they already know it. */}
      {!isHost && storyLang && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-lg" aria-hidden="true">
            {storyLang.flag}
          </span>
          <span>
            {t('round.storyLanguage')}: {storyLang.name}
          </span>
        </div>
      )}

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

      {submitted && (
        <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
          <SubmitConfirm className="h-40 w-40" />
        </div>
      )}
    </div>
  );
}
