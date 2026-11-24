// SPDX-License-Identifier: AGPL-3.0-only

// Step 123 (B-29): the pay page — what it shows while the pack is on sale, by
// rail and by the reader's language, and what it shows instead.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { REFUND_POLICY_VERSION, type PayConfig } from '@funny/shared';
import i18n from '../i18n';
import { __resetPackCodeForTest, forgetPackCode, rememberPackCode } from '../packCode';
import type { PayDoor } from '../pay';

// The funnel itself is funnel.test.ts's; here, only what the page reports.
const { trackPayPage, trackPayPress } = vi.hoisted(() => ({
  trackPayPage: vi.fn(),
  trackPayPress: vi.fn(),
}));
vi.mock('../funnel', () => ({ trackPayPage, trackPayPress }));

const { default: PayScreen } = await import('./PayScreen');

const SPONSORS: PayConfig = { pack: 'chr26', rail: 'sponsors' };
const PAYID: PayConfig = { pack: 'chr26', rail: 'payid' };
const CODE = 'XMAS26-K7QM-3FPA';

function renderPay(
  props: { pay?: PayConfig | null; door?: PayDoor; onClose?: () => void; waiting?: boolean } = {},
) {
  return render(
    <PayScreen
      pack="chr26"
      pay={props.waiting ? undefined : (props.pay ?? null)}
      door={props.door ?? 'card'}
      onClose={props.onClose ?? (() => {})}
    />,
  );
}

function resetCode(): void {
  forgetPackCode();
  __resetPackCodeForTest();
}

beforeEach(async () => {
  resetCode();
  sessionStorage.clear();
  trackPayPage.mockClear();
  trackPayPress.mockClear();
  await i18n.changeLanguage('en');
  vi.useFakeTimers({ now: Date.parse('2026-12-20T09:00:00Z'), toFake: ['Date'] });
});

afterEach(() => {
  vi.useRealTimers();
  resetCode();
});

describe('on sale outside Australia', () => {
  it("shows the price GitHub charges, unconverted, and the pack's last day", () => {
    renderPay({ pay: SPONSORS });
    expect(screen.getByText('🔔 Christmas 2026 edition')).toBeTruthy();
    expect(screen.getByText('US$2')).toBeTruthy();
    expect(screen.queryByText('A$2.60')).toBeNull();
    expect(screen.getByText(/until 1 August 2027\./)).toBeTruthy();
    expect(screen.getByText(/Your bank converts it\./)).toBeTruthy();
  });

  it('gives the three-step guide, with the tier as GitHub names it', () => {
    // The tier's name sits between U+2068 and U+2069, so a right-to-left line keeps it whole.
    renderPay({ pay: SPONSORS });
    expect(screen.getByText('3 steps, about 3 minutes:')).toBeTruthy();
    const steps = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(steps).toEqual([
      'Sign in to GitHub, or create a free account.',
      'Choose “⁨Christmas 2026 edition⁩”: US$2, one time.',
      'Pay and come back here: your code appears.',
    ]);
  });

  it('states the refund policy before the pay button, with its version', () => {
    renderPay({ pay: SPONSORS });
    const policy = screen.getByText(
      "No refunds for a change of mind. A pack that doesn't work is fixed or refunded.",
    );
    expect(policy.getAttribute('data-policy')).toBe(REFUND_POLICY_VERSION);
    const button = screen.getByRole('button', { name: 'Pay US$2 on GitHub' });
    expect(policy.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('on sale in Australia', () => {
  it('shows the PayID price and no GitHub guide', () => {
    renderPay({ pay: PAYID });
    expect(screen.getByText('A$2.60')).toBeTruthy();
    expect(screen.queryByText('US$2')).toBeNull();
    expect(screen.getByText('By PayID, from any Australian bank.')).toBeTruthy();
    expect(screen.queryByText('3 steps, about 3 minutes:')).toBeNull();
    expect(screen.getByRole('button', { name: 'Pay A$2.60 by PayID' })).toBeTruthy();
  });

  it('lets a visitor the country lookup got wrong switch rails, both ways', () => {
    renderPay({ pay: PAYID });
    fireEvent.click(screen.getByText('Not in Australia?'));
    expect(screen.getByRole('button', { name: 'Pay US$2 on GitHub' })).toBeTruthy();
    expect(screen.getByText('3 steps, about 3 minutes:')).toBeTruthy();
    fireEvent.click(screen.getByText('In Australia?'));
    expect(screen.getByRole('button', { name: 'Pay A$2.60 by PayID' })).toBeTruthy();
  });
});

describe('the pay button', () => {
  it('counts the press by its rail and says the payment cannot be started yet', async () => {
    renderPay({ pay: SPONSORS });
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Pay US$2 on GitHub' }));
    expect(trackPayPress).toHaveBeenCalledWith('sponsors');
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe(
        "The payment can't be started right now. Please try again a little later.",
      ),
    );
  });

  it('counts the rail the visitor switched to, and drops the old failure with the switch', async () => {
    renderPay({ pay: SPONSORS });
    fireEvent.click(screen.getByRole('button', { name: 'Pay US$2 on GitHub' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    fireEvent.click(screen.getByText('In Australia?'));
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Pay A$2.60 by PayID' }));
    expect(trackPayPress).toHaveBeenLastCalledWith('payid');
  });
});

describe('the doors', () => {
  it('counts the page by the door it was opened from', () => {
    const { unmount } = renderPay({ pay: SPONSORS, door: 'link' });
    expect(trackPayPage).toHaveBeenCalledWith('link');
    unmount();
    renderPay({ pay: SPONSORS, door: 'card' });
    expect(trackPayPage).toHaveBeenLastCalledWith('card');
  });

  it('offers a visitor who came by a link the free game', () => {
    const onClose = vi.fn();
    renderPay({ pay: SPONSORS, door: 'link', onClose });
    expect(screen.queryByRole('button', { name: 'Close', hidden: false })).toBeTruthy();
    fireEvent.click(screen.getByText('Play free'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('just shuts for a player who came from the end screen', () => {
    const onClose = vi.fn();
    renderPay({ pay: SPONSORS, door: 'card', onClose });
    expect(screen.queryByText('Play free')).toBeNull();
    fireEvent.click(screen.getByText('Close'));
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('a reader whose language has no Christmas stories (D4 A)', () => {
  it('is told before paying which languages the pack plays in', async () => {
    renderPay({ pay: SPONSORS });
    await act(async () => {
      await i18n.changeLanguage('ar');
    });
    const note = screen.getByRole('note');
    expect(note.textContent).toContain(i18n.t('pay.otherLanguages'));
    const names = [...note.querySelectorAll('li')].map((li) => li.textContent);
    expect(names).toContain('English');
    expect(names).toContain('Deutsch');
    expect(names).toContain('日本語');
    // The two Spanishes read as one; the three languages without the pack are absent.
    expect(names.filter((n) => n === 'Español')).toHaveLength(1);
    expect(names).toHaveLength(19);
    expect(names).not.toContain('العربية');
    expect(names).not.toContain('עברית');
    expect(names).not.toContain('فارسی');
  });

  it('is said to no reader of a language the pack has', async () => {
    renderPay({ pay: SPONSORS });
    expect(screen.queryByRole('note')).toBeNull();
    await act(async () => {
      await i18n.changeLanguage('ta');
    });
    expect(screen.queryByRole('note')).toBeNull();
  });
});

describe('instead of the offer', () => {
  it('shows a phone that keeps a code its own pack, and nothing to buy', () => {
    rememberPackCode(CODE);
    renderPay({ pay: SPONSORS, door: 'link' });
    expect(screen.getByText('You already have this pack.')).toBeTruthy();
    expect(screen.getByText(CODE)).toBeTruthy();
    expect(screen.getByText(/until 1 August 2027\./)).toBeTruthy();
    expect(screen.queryByText('US$2')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Pay / })).toBeNull();
    expect(screen.queryByText('Play free')).toBeNull();
    expect(screen.getByText('Close')).toBeTruthy();
  });

  it('says a kept code has ended once the paid part is over', () => {
    rememberPackCode(CODE);
    vi.setSystemTime(Date.parse('2027-08-03T00:00:00Z'));
    renderPay({ pay: null });
    expect(
      screen.getByText('Your Christmas 2026 edition has ended. Thank you for playing!'),
    ).toBeTruthy();
    expect(screen.queryByText(CODE)).toBeNull();
  });

  it('is no longer on sale once the free part has ended, whatever the server says', () => {
    vi.setSystemTime(Date.parse('2027-07-03T00:00:00Z'));
    renderPay({ pay: SPONSORS, door: 'link' });
    expect(screen.getByText('The Christmas 2026 edition is no longer on sale.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Pay / })).toBeNull();
    expect(screen.getByText('Play free')).toBeTruthy();
  });

  it('says to come back later when the server sells nothing', () => {
    renderPay({ pay: null });
    expect(
      screen.getByText("The pack can't be bought right now. Please come back later."),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Pay / })).toBeNull();
  });

  it('shows only its header until the server has answered', () => {
    renderPay({ waiting: true, door: 'link' });
    expect(screen.getByText('🔔 Christmas 2026 edition')).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByText(/come back later/)).toBeNull();
  });
});
