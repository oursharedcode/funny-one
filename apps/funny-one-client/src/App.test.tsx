// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-3.2 — the local phase machine end to end: setup -> (handoff -> round)
// seven times -> done, for the OQ-3 default seat mix (1 human + 1 virtual).
// The virtual seat's turn never renders anything (App.tsx returns null for
// it) — it auto-resolves inside the same act() as the human's submit, so the
// next thing on screen after submitting is the next handoff.

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SLOT_COUNT } from '@funny/shared';
import App from './App';
import './i18n';

describe('App', () => {
  it('renders the Funny One home screen before a game starts', () => {
    render(<App />);
    expect(screen.getByText('Funny One')).toBeTruthy();
  });

  // Renders all 7 questions — up to 30 combobox options each, through jsdom —
  // so this runs well past the default 5 s budget (same shape of slowdown as
  // RoundScreen.test.tsx's own multi-slot render sweep in Funny Multi).
  it('plays a full 1 human + 1 virtual game to completion', { timeout: 20_000 }, () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));

    for (let question = 0; question < SLOT_COUNT; question++) {
      expect(screen.getByText('Pass to Player 1')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: "I'm Player 1 — go" }));

      const radios = screen.getAllByRole('radio');
      fireEvent.click(radios[0]!);
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    }

    expect(screen.getByText('Funny One — game complete')).toBeTruthy();
  });
});
