// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-3.2 — FO-CORE-3: "Pass to {name}" + an explicit "go" tap. There is no
// previous answer available to this screen to accidentally show (App.tsx
// never passes it one), so the "never visible to the next seat" half of
// FO-CORE-3 is a property of the props, not something to re-assert here.

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import i18n from '../i18n';
import HandoffScreen from './HandoffScreen';

const seat = { id: 'seat-0', name: 'Alex', kind: 'human' as const };

describe('HandoffScreen', () => {
  it('names the seat in both the title and the go button', async () => {
    await i18n.changeLanguage('en');
    render(<HandoffScreen seat={seat} onReady={vi.fn()} />);
    expect(screen.getByText('Pass to Alex')).toBeTruthy();
    expect(screen.getByRole('button', { name: "I'm Alex — go" })).toBeTruthy();
  });

  it('calls onReady when the go button is tapped', async () => {
    await i18n.changeLanguage('en');
    const onReady = vi.fn();
    render(<HandoffScreen seat={seat} onReady={onReady} />);
    fireEvent.click(screen.getByRole('button', { name: "I'm Alex — go" }));
    expect(onReady).toHaveBeenCalledTimes(1);
  });
});
