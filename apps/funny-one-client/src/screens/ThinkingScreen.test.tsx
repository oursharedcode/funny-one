// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-3.3 — purely decorative: this screen has no button, no affordance,
// nothing for a human to tap on the bot's behalf (App.tsx's timer is what
// actually resolves the turn).

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import i18n from '../i18n';
import ThinkingScreen from './ThinkingScreen';

const seat = { id: 'seat-1', name: 'Bot 1', kind: 'virtual' as const };

describe('ThinkingScreen', () => {
  it('names the seat', async () => {
    await i18n.changeLanguage('en');
    render(<ThinkingScreen seat={seat} />);
    expect(screen.getByText('Bot 1 is thinking…')).toBeTruthy();
  });

  it('renders no interactive controls', async () => {
    await i18n.changeLanguage('en');
    const { container } = render(<ThinkingScreen seat={seat} />);
    expect(container.querySelectorAll('button')).toHaveLength(0);
    expect(container.querySelectorAll('input, textarea, [contenteditable]')).toHaveLength(0);
  });
});
