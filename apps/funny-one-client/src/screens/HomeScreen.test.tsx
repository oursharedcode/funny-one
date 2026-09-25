// SPDX-License-Identifier: AGPL-3.0-only

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomeScreen from './HomeScreen';
import i18n from '../i18n';
import { MAX_SEATS, MIN_SEATS } from '../game/roundRobin';

function nameInputs(): HTMLInputElement[] {
  return screen.getAllByPlaceholderText('Name') as HTMLInputElement[];
}

function startButton(): HTMLButtonElement {
  return screen.getByText('Start game') as HTMLButtonElement;
}

// A language pick now switches the UI and is remembered (T-FO-5.1a) — reset
// both so one test's pick can't leak into the next.
beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage('en');
});

describe('HomeScreen (T-FO-3.1)', () => {
  it('starts with the OQ-3 solo default: 1 human + 1 virtual seat', () => {
    render(<HomeScreen onStart={vi.fn()} />);
    expect(nameInputs()).toHaveLength(2);
    expect(screen.getByText('You')).toBeTruthy();
    expect(screen.getByText('Bot')).toBeTruthy();
    expect(startButton().disabled).toBe(false);
  });

  it('adding a player and a virtual seat grows the seat list', () => {
    render(<HomeScreen onStart={vi.fn()} />);
    fireEvent.click(screen.getByText('+ Add player'));
    fireEvent.click(screen.getByText('+ Add virtual'));
    expect(nameInputs()).toHaveLength(4);
  });

  it('cannot remove below MIN_SEATS — the remove buttons disable at the floor', () => {
    render(<HomeScreen onStart={vi.fn()} />);
    expect(nameInputs()).toHaveLength(MIN_SEATS);
    const removeButtons = screen.getAllByLabelText('Remove player') as HTMLButtonElement[];
    expect(removeButtons.every((b) => b.disabled)).toBe(true);
  });

  it('removing a seat above the floor shrinks the list; add re-enables it', () => {
    render(<HomeScreen onStart={vi.fn()} />);
    fireEvent.click(screen.getByText('+ Add player'));
    expect(nameInputs()).toHaveLength(3);
    const removeButtons = screen.getAllByLabelText('Remove player') as HTMLButtonElement[];
    fireEvent.click(removeButtons[0]!);
    expect(nameInputs()).toHaveLength(2);
  });

  it('cannot add past MAX_SEATS — both add buttons disable at the ceiling', () => {
    render(<HomeScreen onStart={vi.fn()} />);
    const addPlayer = screen.getByText('+ Add player') as HTMLButtonElement;
    for (let i = 0; i < MAX_SEATS; i++) {
      if (nameInputs().length >= MAX_SEATS) break;
      fireEvent.click(addPlayer);
    }
    expect(nameInputs()).toHaveLength(MAX_SEATS);
    expect((screen.getByText('+ Add player') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByText('+ Add virtual') as HTMLButtonElement).disabled).toBe(true);
  });

  it('an empty player name disables Start', () => {
    render(<HomeScreen onStart={vi.fn()} />);
    fireEvent.change(nameInputs()[0]!, { target: { value: '  ' } });
    expect(startButton().disabled).toBe(true);
  });

  it('picking a language highlights it (aria-pressed)', () => {
    render(<HomeScreen onStart={vi.fn()} />);
    const picker = screen.getByRole('group', { name: 'Language' });
    fireEvent.click(screen.getByTitle('Русский (Россия)'));
    expect(picker.querySelector('[aria-pressed="true"]')?.textContent).toContain('RU');
  });

  it('Start calls onStart with the trimmed seats and the selected language', () => {
    const onStart = vi.fn();
    render(<HomeScreen onStart={onStart} />);
    fireEvent.change(nameInputs()[0]!, { target: { value: '  Alice  ' } });
    const start = startButton();
    fireEvent.click(screen.getByTitle('Русский (Россия)'));
    fireEvent.click(start);

    expect(onStart).toHaveBeenCalledTimes(1);
    const [seats, language] = onStart.mock.calls[0]!;
    expect(language).toBe('ru');
    expect(seats).toHaveLength(2);
    expect(seats[0]).toMatchObject({ name: 'Alice', kind: 'human' });
    expect(seats[1]).toMatchObject({ name: 'Bot 1', kind: 'virtual' });
  });
});

describe('HomeScreen UI language (T-FO-5.1a)', () => {
  it('a pick switches the UI language and remembers it for the next launch', () => {
    render(<HomeScreen onStart={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Deutsch (Deutschland)'));
    expect(i18n.language).toBe('de');
    expect(localStorage.getItem('funny-one.language')).toBe('de');
  });

  it('picking Hebrew flips the document to RTL, and back', () => {
    render(<HomeScreen onStart={vi.fn()} />);
    fireEvent.click(screen.getByTitle('עברית (ישראל)'));
    expect(document.documentElement.dir).toBe('rtl');
    fireEvent.click(screen.getByTitle('English (United Kingdom)'));
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('pre-selects the language the UI is already in', async () => {
    await i18n.changeLanguage('ja');
    render(<HomeScreen onStart={vi.fn()} />);
    const pressed = screen.getByRole('group').querySelector('[aria-pressed="true"]');
    expect(pressed?.textContent).toContain('JP');
  });
});
