// SPDX-License-Identifier: AGPL-3.0-only

// T-3.4. A small screen, so a small suite: what it must not do is misreport
// progress, which is the only information it carries.

import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import WaitingScreen from './WaitingScreen';
import i18n from '../i18n';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('WaitingScreen', () => {
  it('says what it is waiting for and how far along it is', () => {
    render(<WaitingScreen waiting={{ submitted: 2, total: 5 }} />);
    expect(screen.getByText('Waiting on others')).toBeTruthy();
    expect(screen.getByText('2 / 5 submitted')).toBeTruthy();
    expect(screen.getByText('Hold tight.')).toBeTruthy();
  });

  it('renders both counts from the payload, not a hard-coded total', () => {
    // 3–7 players, so `total` genuinely varies room to room.
    const { rerender } = render(<WaitingScreen waiting={{ submitted: 0, total: 3 }} />);
    expect(screen.getByText('0 / 3 submitted')).toBeTruthy();

    rerender(<WaitingScreen waiting={{ submitted: 6, total: 7 }} />);
    expect(screen.getByText('6 / 7 submitted')).toBeTruthy();
  });

  it('translates with the interface language', async () => {
    await i18n.changeLanguage('ru');
    render(<WaitingScreen waiting={{ submitted: 1, total: 4 }} />);
    expect(screen.queryByText('Waiting on others')).toBeNull();
    expect(screen.getByText('1 / 4 отправили')).toBeTruthy();
  });

  it('shows no countdown', () => {
    // Deliberate: the 60 s deadline belongs to RoundScreen, where a player can
    // still act on it. TimerBar pins itself to the top of the viewport, so its
    // absence is checkable.
    const { container } = render(<WaitingScreen waiting={{ submitted: 1, total: 3 }} />);
    expect(container.querySelector('.fixed.top-0')).toBeNull();
  });
});
