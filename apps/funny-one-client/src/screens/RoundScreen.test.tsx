// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-3.2 — same two structural guards as Funny Multi's RoundScreen.test.tsx
// (FM-ANS-1's "no free-text affordance" and FM-ANS-3's "shuffle differs
// between players"), adapted to this screen's plain props (no socket, no
// round payload — just language, slot, and an onSubmit callback).

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { POOLS, POOL_TEXTS, QUESTIONS, SLOT_COUNT } from '@funny/shared';
import type { AuthoredLanguage, SlotIndex } from '@funny/shared';
import i18n from '../i18n';
import RoundScreen from './RoundScreen';

function renderRound(slot: SlotIndex, opts: { language?: AuthoredLanguage } = {}) {
  const onSubmit = vi.fn();
  const result = render(
    <RoundScreen language={opts.language ?? 'en'} slot={slot} onSubmit={onSubmit} />,
  );
  return { ...result, onSubmit };
}

/** Visible option labels, in render order. */
function optionTexts(): string[] {
  return screen.getAllByRole('radio').map((el) => el.textContent ?? '');
}

/** mulberry32 — small, and the point is repeatability, not quality. */
function seedRandom(seed: number): void {
  let a = seed;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  });
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('FM-ANS-1: no free-text affordance', () => {
  it.each(Array.from({ length: SLOT_COUNT }, (_, i) => i))(
    'slot %i renders no text-entry element',
    (slot) => {
      const { container } = renderRound(slot as SlotIndex);
      expect(container.querySelectorAll('input')).toHaveLength(0);
      expect(container.querySelectorAll('textarea')).toHaveLength(0);
      expect(container.querySelectorAll('[contenteditable]')).toHaveLength(0);
      expect(container.querySelectorAll('[placeholder]')).toHaveLength(0);
    },
  );

  it('offers no search or filter box over the options', () => {
    const { container } = renderRound(6);
    expect(container.querySelectorAll('[type="search"]')).toHaveLength(0);
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
  });
});

describe('options come from the shared pools (DD-2)', () => {
  it.each(Array.from({ length: SLOT_COUNT }, (_, i) => i))(
    'slot %i renders exactly its slot pool',
    (slot) => {
      renderRound(slot as SlotIndex);
      const expected = POOLS[slot as SlotIndex].map((o) => POOL_TEXTS.en[o.id]);
      expect(optionTexts().sort()).toEqual([...expected].sort());
    },
  );

  it('renders the question in the game language', () => {
    renderRound(0, { language: 'ru' });
    expect(screen.getByText(QUESTIONS.ru[0]!)).toBeTruthy();
  });

  it('renders option text in the game language', () => {
    renderRound(0, { language: 'ru' });
    const expected = POOLS[0].map((o) => POOL_TEXTS.ru[o.id]);
    expect(optionTexts().sort()).toEqual([...expected].sort());
    expect(optionTexts()).not.toContain(POOL_TEXTS.en[POOLS[0][0]!.id]);
  });
});

describe('FM-ANS-3: shuffle differs between players', () => {
  it('gives two seats different orders over the same option set', () => {
    seedRandom(1);
    const first = render(<RoundScreen language="en" slot={6} onSubmit={vi.fn()} />);
    const orderOne = optionTexts();
    first.unmount();

    seedRandom(99);
    render(<RoundScreen language="en" slot={6} onSubmit={vi.fn()} />);
    const orderTwo = optionTexts();

    expect(orderTwo).not.toEqual(orderOne);
    expect([...orderTwo].sort()).toEqual([...orderOne].sort());
  });

  it('holds the order still while the seat is choosing', () => {
    renderRound(6);
    const before = optionTexts();
    fireEvent.click(screen.getAllByRole('radio')[0]!);
    expect(optionTexts()).toEqual(before);
  });
});

describe('submission', () => {
  it('disables Submit until an option is selected', () => {
    renderRound(0);
    expect(screen.getByRole('button', { name: 'Submit' }).hasAttribute('disabled')).toBe(true);
  });

  it('calls onSubmit with the selected option id exactly once', () => {
    const { onSubmit } = renderRound(0);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]!);
    const submit = screen.getByRole('button', { name: 'Submit' });
    expect(submit.hasAttribute('disabled')).toBe(false);
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
