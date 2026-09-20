// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-3.2/3.3 — the local phase machine end to end: setup -> (handoff ->
// round -> thinking) seven times -> done, for the OQ-3 default seat mix (1
// human + 1 virtual). Fake timers stand in for FO-BOT-1's 0.8–1.5 s
// "thinking" delay — same `vi.useFakeTimers`/`advanceTimersByTimeAsync`
// pattern as apps/funny-multi-client/src/App.test.tsx, so this suite runs in
// milliseconds rather than ~10 s of real waiting per game.

import { act, render, screen, fireEvent } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { SLOT_COUNT } from '@funny/shared';
import App from './App';
import { THINKING_DELAY_MAX_MS } from './game/thinkingDelay';
import './i18n';

beforeAll(() => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

async function settle(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(THINKING_DELAY_MAX_MS);
  });
}

describe('App', () => {
  it('renders the Funny One home screen before a game starts', () => {
    render(<App />);
    expect(screen.getByText('Funny One')).toBeTruthy();
  });

  // Renders all 7 questions — up to 30 combobox options each, through jsdom
  // — so this runs well past the default 5 s budget (same shape of slowdown
  // as RoundScreen.test.tsx's own multi-slot render sweep in Funny Multi).
  it('plays a full 1 human + 1 virtual game to completion', { timeout: 20_000 }, async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));

    for (let question = 0; question < SLOT_COUNT; question++) {
      expect(screen.getByText('Pass to Player 1')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: "I'm Player 1 — go" }));

      const radios = screen.getAllByRole('radio');
      fireEvent.click(radios[0]!);
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

      // The virtual seat's turn: ThinkingScreen shows, with nothing on it a
      // human could act on, until its delay elapses and it auto-submits.
      expect(screen.getByText('Bot 1 is thinking…')).toBeTruthy();
      expect(screen.queryAllByRole('button')).toHaveLength(0);
      await settle();
    }

    expect(screen.getByText('Funny One — game complete')).toBeTruthy();
  });
});
