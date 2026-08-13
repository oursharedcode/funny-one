// SPDX-License-Identifier: AGPL-3.0-only

// T-3.3 — the combobox.
//
// Two of Gate 3's three clauses are properties of this rendered screen rather
// than of a phone in someone's hand — "no free-text affordance anywhere" and
// "shuffle differs between players" — so they are asserted here and become
// permanent regression guards instead of one-off observations. The third
// (two phones playing seven rounds end to end) stays manual.

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { POOLS, POOL_TEXTS, SLOT_COUNT, isVisualSlot } from '@funny/shared';
import type { AuthoredLanguage, RoundStartPayload, SlotIndex } from '@funny/shared';
import { createSocketMock } from '../testutils/socketMock';
import i18n from '../i18n';

const socketMock = createSocketMock();
vi.mock('../socket', () => ({ socket: socketMock }));

const { default: RoundScreen } = await import('./RoundScreen');

function roundPayload(over: Partial<RoundStartPayload> = {}): RoundStartPayload {
  return {
    roundNumber: 0,
    question: 'Who?',
    deadline: Date.now() + 60_000,
    ...over,
  };
}

function renderRound(
  over: Partial<RoundStartPayload> = {},
  opts: { language?: AuthoredLanguage; isHost?: boolean } = {},
) {
  return render(
    <RoundScreen
      round={roundPayload(over)}
      language={opts.language ?? 'en'}
      isHost={opts.isHost ?? true}
    />,
  );
}

/** Visible option labels, in render order. */
function optionTexts(): string[] {
  return screen.getAllByRole('radio').map((el) => el.textContent ?? '');
}

/**
 * Deterministic `Math.random` so "two players" get reproducibly different
 * shuffles. mulberry32 — small, and the point is repeatability, not quality.
 */
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
  socketMock.reset();
  await i18n.changeLanguage('en');
});

describe('FM-ANS-1: no free-text affordance', () => {
  // The defining constraint of this product. SRC had a textarea here, and
  // everything downstream — the profanity filter, the translation pipeline,
  // three render-time grammar repairs — existed to cope with what it produced.
  // A regression would be silent: the game would still work, and would quietly
  // be a different game.
  it.each(Array.from({ length: SLOT_COUNT }, (_, i) => i))(
    'round %i renders no text-entry element',
    (roundNumber) => {
      const { container } = renderRound({ roundNumber });
      expect(container.querySelectorAll('input')).toHaveLength(0);
      expect(container.querySelectorAll('textarea')).toHaveLength(0);
      expect(container.querySelectorAll('[contenteditable]')).toHaveLength(0);
      expect(container.querySelectorAll('[placeholder]')).toHaveLength(0);
    },
  );

  it('offers no search or filter box over the options', () => {
    // A filter field would reintroduce typing by the back door (design §8.1).
    const { container } = renderRound({ roundNumber: 6 });
    expect(container.querySelectorAll('[type="search"]')).toHaveLength(0);
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
  });
});

describe('options come from the shared pools (DD-2)', () => {
  it.each(Array.from({ length: SLOT_COUNT }, (_, i) => i))(
    'round %i renders exactly its slot pool',
    (roundNumber) => {
      renderRound({ roundNumber });
      const slot = roundNumber as SlotIndex;
      const expected = POOLS[slot].map((o) => POOL_TEXTS.en[o.id]);
      expect(optionTexts().sort()).toEqual([...expected].sort());
    },
  );

  it('sizes visual slots at 9–12 and prose slots at 20–30', () => {
    for (let roundNumber = 0; roundNumber < SLOT_COUNT; roundNumber++) {
      const { unmount } = renderRound({ roundNumber });
      const count = screen.getAllByRole('radio').length;
      const [min, max] = isVisualSlot(roundNumber as SlotIndex) ? [9, 12] : [20, 30];
      expect(count, `round ${roundNumber}`).toBeGreaterThanOrEqual(min);
      expect(count, `round ${roundNumber}`).toBeLessThanOrEqual(max);
      unmount();
    }
  });

  it('renders option text in the ROOM language, not the interface language', async () => {
    // The answer becomes part of a story written in the room's language; a
    // joiner reading English options would be picking words that never appear.
    await i18n.changeLanguage('en');
    renderRound({ roundNumber: 0 }, { language: 'ru' });

    const expected = POOLS[0].map((o) => POOL_TEXTS.ru[o.id]);
    expect(optionTexts().sort()).toEqual([...expected].sort());
    // And specifically not the English ones.
    expect(optionTexts()).not.toContain(POOL_TEXTS.en[POOLS[0][0]!.id]);
  });
});

describe('FM-ANS-3: shuffle differs between players', () => {
  it('gives two players different orders over the same option set', () => {
    seedRandom(1);
    const playerOne = render(
      <RoundScreen round={roundPayload({ roundNumber: 6 })} language="en" isHost />,
    );
    const orderOne = optionTexts();
    playerOne.unmount();

    seedRandom(99);
    render(<RoundScreen round={roundPayload({ roundNumber: 6 })} language="en" isHost />);
    const orderTwo = optionTexts();

    expect(orderTwo).not.toEqual(orderOne);
    // A permutation, not a different or truncated set — position is what
    // differs, never which answers are available.
    expect([...orderTwo].sort()).toEqual([...orderOne].sort());
  });

  it('holds the order still while the player is choosing', () => {
    // Reshuffling on re-render would move the list under the player's finger
    // on every selection — a way to commit an answer you did not mean.
    renderRound({ roundNumber: 6 });
    const before = optionTexts();

    fireEvent.click(screen.getAllByRole('radio')[3]!);
    expect(optionTexts()).toEqual(before);

    fireEvent.click(screen.getAllByRole('radio')[7]!);
    expect(optionTexts()).toEqual(before);
  });

  it('reshuffles when the round changes', () => {
    seedRandom(7);
    const { rerender } = render(
      <RoundScreen round={roundPayload({ roundNumber: 5 })} language="en" isHost />,
    );
    const orderFive = optionTexts();

    rerender(<RoundScreen round={roundPayload({ roundNumber: 6 })} language="en" isHost />);
    const orderSix = optionTexts();

    // Slots 5 and 6 are both 22-option prose pools with different contents;
    // the point is that the list is rebuilt, not carried over.
    expect(orderSix).not.toEqual(orderFive);
  });
});

describe('radiogroup semantics', () => {
  it('exposes the options as a single radiogroup', () => {
    renderRound({ roundNumber: 0 });
    const group = screen.getByRole('radiogroup', { name: 'Answers to choose from' });
    expect(within(group).getAllByRole('radio')).toHaveLength(POOLS[0].length);
  });

  it('selects exactly one option at a time', () => {
    renderRound({ roundNumber: 0 });
    const radios = screen.getAllByRole('radio');

    fireEvent.click(radios[2]!);
    expect(radios[2]!.getAttribute('aria-checked')).toBe('true');
    expect(radios.filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1);

    fireEvent.click(radios[5]!);
    expect(radios[2]!.getAttribute('aria-checked')).toBe('false');
    expect(radios[5]!.getAttribute('aria-checked')).toBe('true');
    expect(radios.filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1);
  });

  it('keeps the group to one tab stop', () => {
    renderRound({ roundNumber: 0 });
    const tabbable = () => screen.getAllByRole('radio').filter((r) => r.tabIndex === 0);
    expect(tabbable()).toHaveLength(1);

    fireEvent.click(screen.getAllByRole('radio')[4]!);
    expect(tabbable()).toHaveLength(1);
    expect(tabbable()[0]!.getAttribute('aria-checked')).toBe('true');
  });

  it('moves the selection with the arrow keys, wrapping at both ends', () => {
    renderRound({ roundNumber: 0 });
    const group = screen.getByRole('radiogroup');
    const radios = screen.getAllByRole('radio');
    const last = radios.length - 1;

    fireEvent.keyDown(group, { key: 'ArrowDown' });
    expect(radios[0]!.getAttribute('aria-checked')).toBe('true');

    fireEvent.keyDown(group, { key: 'ArrowDown' });
    expect(radios[1]!.getAttribute('aria-checked')).toBe('true');

    fireEvent.keyDown(group, { key: 'ArrowUp' });
    fireEvent.keyDown(group, { key: 'ArrowUp' });
    expect(radios[last]!.getAttribute('aria-checked')).toBe('true');

    fireEvent.keyDown(group, { key: 'ArrowDown' });
    expect(radios[0]!.getAttribute('aria-checked')).toBe('true');
  });

  it('jumps to the ends with Home and End', () => {
    renderRound({ roundNumber: 0 });
    const group = screen.getByRole('radiogroup');
    const radios = screen.getAllByRole('radio');

    fireEvent.keyDown(group, { key: 'End' });
    expect(radios[radios.length - 1]!.getAttribute('aria-checked')).toBe('true');

    fireEvent.keyDown(group, { key: 'Home' });
    expect(radios[0]!.getAttribute('aria-checked')).toBe('true');
  });
});

describe('FM-ANS-4: submit is gated on a selection', () => {
  it('disables Submit until something is picked, and says why', () => {
    renderRound({ roundNumber: 0 });
    const submit = screen.getByText('Submit') as HTMLButtonElement;

    expect(submit.disabled).toBe(true);
    expect(submit.getAttribute('title')).toBe('Pick an answer first');

    fireEvent.click(screen.getAllByRole('radio')[0]!);
    expect(submit.disabled).toBe(false);
    expect(submit.getAttribute('title')).toBe('');
  });

  it('sends the picked option id, never its text', () => {
    renderRound({ roundNumber: 0 });
    const radios = screen.getAllByRole('radio');
    const pickedText = radios[3]!.textContent;

    fireEvent.click(radios[3]!);
    fireEvent.click(screen.getByText('Submit'));

    const [payload] = socketMock.onlyEmitOf('round:submit').args as [{ optionId: string }];
    // The id belongs to this round's pool — the same membership check the
    // server makes before it will accept the answer (FM-ANS-2).
    expect(POOLS[0].map((o) => o.id)).toContain(payload.optionId);
    expect(POOL_TEXTS.en[payload.optionId]).toBe(pickedText);
    expect(payload).not.toHaveProperty('answer');
  });

  it('disables the button after submitting, so a second tap sends nothing', () => {
    // Named for what it actually proves. A negative control — deleting the
    // `submitted` early-return inside `submit()` — did **not** red this test,
    // because the disabled button is what stops the second click and the
    // early-return never runs. The guard stays as defence in depth on an
    // irreversible action, but it is redundant today and this test does not
    // cover it; nothing else reaches `submit()`.
    renderRound({ roundNumber: 0 });
    fireEvent.click(screen.getAllByRole('radio')[0]!);
    fireEvent.click(screen.getByText('Submit'));

    const button = screen.getByText('Submitted') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(socketMock.emitsOf('round:submit')).toHaveLength(1);
  });

  it('locks the options once submitted and confirms it', () => {
    renderRound({ roundNumber: 0 });
    fireEvent.click(screen.getAllByRole('radio')[0]!);
    fireEvent.click(screen.getByText('Submit'));

    expect(screen.getByText('Submitted')).toBeTruthy();
    for (const radio of screen.getAllByRole('radio')) {
      expect((radio as HTMLButtonElement).disabled).toBe(true);
    }
    // Changing the pick after committing must not reach the server.
    fireEvent.click(screen.getAllByRole('radio')[2]!);
    expect(socketMock.emitsOf('round:submit')).toHaveLength(1);
  });

  it('ignores arrow keys after submitting', () => {
    renderRound({ roundNumber: 0 });
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]!);
    fireEvent.click(screen.getByText('Submit'));

    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowDown' });
    expect(radios[0]!.getAttribute('aria-checked')).toBe('true');
  });
});

describe('round transitions', () => {
  it('clears the selection and the submitted state on the next round', () => {
    const { rerender } = render(
      <RoundScreen round={roundPayload({ roundNumber: 0 })} language="en" isHost />,
    );
    fireEvent.click(screen.getAllByRole('radio')[0]!);
    fireEvent.click(screen.getByText('Submit'));
    expect(screen.getByText('Submitted')).toBeTruthy();

    rerender(
      <RoundScreen
        round={roundPayload({ roundNumber: 1, question: 'And who else?' })}
        language="en"
        isHost
      />,
    );

    expect(screen.getByText('Submit')).toBeTruthy();
    expect((screen.getByText('Submit') as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen.getAllByRole('radio').filter((r) => r.getAttribute('aria-checked') === 'true'),
    ).toHaveLength(0);
  });

  it('counts rounds from 1 for the player', () => {
    renderRound({ roundNumber: 0 });
    expect(screen.getByText('Round 1 of 7')).toBeTruthy();
  });
});

describe('joiner-only affordances (spec §8/§9)', () => {
  it('glosses the question when the interface language differs from the room', async () => {
    await i18n.changeLanguage('en');
    renderRound({ roundNumber: 0, question: 'Кто?' }, { language: 'ru', isHost: false });
    // Primary stays in the room language; the gloss is the joiner's own.
    expect(screen.getByText('Кто?')).toBeTruthy();
    expect(screen.getByText('Who?')).toBeTruthy();
  });

  it('shows no gloss when the two languages agree', () => {
    renderRound({ roundNumber: 0, question: 'Who?' }, { language: 'en', isHost: false });
    expect(screen.getAllByText('Who?')).toHaveLength(1);
  });

  it('reminds joiners which language the story is in, but not the host', () => {
    const joiner = renderRound({ roundNumber: 0 }, { language: 'en', isHost: false });
    expect(screen.getByText(/Story language/)).toBeTruthy();
    joiner.unmount();

    renderRound({ roundNumber: 0 }, { language: 'en', isHost: true });
    expect(screen.queryByText(/Story language/)).toBeNull();
  });
});
