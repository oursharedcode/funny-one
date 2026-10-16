// SPDX-License-Identifier: AGPL-3.0-only

// B-15. The story-language switch is a toggle and a popover over the start
// window's flag list. RevealScreen's and RoomGallery's suites cover what a
// pick does to the story; this one covers the control itself — what it
// offers, and how it opens, closes and hands focus back.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { LANGUAGES } from '@funny/shared';
import i18n from '../i18n';
import StoryLanguageSwitch from './StoryLanguageSwitch';

function renderSwitch(onChange = vi.fn()) {
  render(<StoryLanguageSwitch value="fr" onChange={onChange} />);
  return { onChange, toggle: screen.getByRole('button', { name: /^Story language/ }) };
}

function list(): HTMLElement {
  return screen.getByRole('group', { name: 'Story language' });
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('closed', () => {
  it('names the language the story is in, and shows its short label', () => {
    const { toggle } = renderSwitch();
    expect(toggle.getAttribute('aria-label')).toBe('Story language: Français (France)');
    expect(toggle.textContent).toContain('FR');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('group')).toBeNull();
  });
});

describe('open', () => {
  it("offers the start window's 20 languages, the current one pressed and focused", () => {
    const { toggle } = renderSwitch();
    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const flags = within(list()).getAllByRole('button');
    expect(flags.map((b) => b.getAttribute('title'))).toEqual(LANGUAGES.map((l) => l.name));
    const pressed = flags.filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed.map((b) => b.getAttribute('title'))).toEqual(['Français (France)']);
    expect(document.activeElement).toBe(pressed[0]);
    // The toggle points at the popover it opened.
    const popover = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
    expect(popover?.contains(list())).toBe(true);
  });

  it('reports the pick, closes, and gives focus back to the toggle', () => {
    const { onChange, toggle } = renderSwitch();
    fireEvent.click(toggle);
    fireEvent.click(screen.getByTitle('日本語 (日本)'));

    expect(onChange).toHaveBeenCalledWith('ja');
    expect(screen.queryByRole('group')).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });

  it('closes on Escape without a pick, focus back on the toggle', () => {
    const { onChange, toggle } = renderSwitch();
    fireEvent.click(toggle);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('group')).toBeNull();
    expect(document.activeElement).toBe(toggle);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('closes on a tap outside it, but not on one inside the list', () => {
    const { onChange, toggle } = renderSwitch();
    fireEvent.click(toggle);

    fireEvent.pointerDown(list());
    expect(screen.queryByRole('group')).not.toBeNull();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('group')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('closes again on a second tap of the toggle', () => {
    const { toggle } = renderSwitch();
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect(screen.queryByRole('group')).toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});
