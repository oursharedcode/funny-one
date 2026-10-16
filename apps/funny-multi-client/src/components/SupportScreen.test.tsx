// SPDX-License-Identifier: AGPL-3.0-only

// T-9.4. Rows follow the fetched config field-by-field — the caller only
// mounts this once `hasAnyRail` is true, so unlike Home/EndScreen there is no
// "no rails at all" case to cover here.

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { SupportConfig } from '@funny/shared';
import '../i18n';

// The funnel itself is funnel.test.ts's; here, only which rail a tap names.
const { trackGift } = vi.hoisted(() => ({ trackGift: vi.fn() }));
vi.mock('../funnel', () => ({ trackGift }));

const { default: SupportScreen } = await import('./SupportScreen');

const NO_RAILS: SupportConfig = {
  payId: null,
  payIdName: null,
  sponsorsUrl: null,
  lightningAddress: null,
  kofiUrl: null,
  bmcUrl: null,
  donateUrl: null,
};

function stubClipboard(): ReturnType<typeof vi.fn> {
  const writeText = vi.fn(() => Promise.resolve());
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

describe('rows follow the config', () => {
  it('renders only the PayID row when only payId is set', () => {
    render(<SupportScreen support={{ ...NO_RAILS, payId: 'me@bank' }} onClose={vi.fn()} />);
    expect(screen.getByText('me@bank')).toBeTruthy();
    expect(screen.queryByText('GitHub Sponsors')).toBeNull();
    expect(screen.queryByText('Lightning')).toBeNull();
    expect(screen.queryByText('Support me on Ko-fi')).toBeNull();
    expect(screen.queryByText('Buy me a coffee')).toBeNull();
    expect(screen.queryByText('Donate')).toBeNull();
  });

  it('says beside the PayID title that it works in Australia', () => {
    // Step 75: a note of its own, so the title still reads "PayID".
    render(<SupportScreen support={{ ...NO_RAILS, payId: 'me@bank' }} onClose={vi.fn()} />);
    const note = screen.getByText('In Australia');
    expect(note.parentElement).toBe(screen.getByText('PayID'));
  });

  it('shows the bank note only when payIdName is also set', () => {
    const { rerender } = render(
      <SupportScreen support={{ ...NO_RAILS, payId: 'me@bank' }} onClose={vi.fn()} />,
    );
    expect(screen.queryByText(/Your bank will display/)).toBeNull();

    rerender(
      <SupportScreen
        support={{ ...NO_RAILS, payId: 'me@bank', payIdName: 'Funny Family' }}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Your bank will display: Funny Family')).toBeTruthy();
  });

  it('renders the sponsors row as a link with its hint', () => {
    render(
      <SupportScreen
        support={{ ...NO_RAILS, sponsorsUrl: 'https://github.com/sponsors/someone' }}
        onClose={vi.fn()}
      />,
    );
    const link = screen.getByText('https://github.com/sponsors/someone') as HTMLAnchorElement;
    expect(link.href).toBe('https://github.com/sponsors/someone');
    expect(screen.getByText('Choose a one-time tier')).toBeTruthy();
  });

  it('renders the lightning row with its address and a QR code', () => {
    const { container } = render(
      <SupportScreen
        support={{ ...NO_RAILS, lightningAddress: 'me@getalby.com' }}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('me@getalby.com')).toBeTruthy();
    expect(container.querySelector('svg[height="140"]')).not.toBeNull();
    expect(screen.getByText('Crypto Bitcoin').parentElement).toBe(screen.getByText('Lightning'));
  });

  it('renders Ko-fi and Buy Me a Coffee as links that open a new tab', () => {
    render(
      <SupportScreen
        support={{
          ...NO_RAILS,
          kofiUrl: 'https://ko-fi.com/someone',
          bmcUrl: 'https://buymeacoffee.com/someone',
        }}
        onClose={vi.fn()}
      />,
    );
    const kofi = screen.getByRole('link', { name: 'Support me on Ko-fi' }) as HTMLAnchorElement;
    const bmc = screen.getByRole('link', { name: 'Buy me a coffee' }) as HTMLAnchorElement;
    expect(kofi.href).toBe('https://ko-fi.com/someone');
    expect(bmc.href).toBe('https://buymeacoffee.com/someone');
    for (const link of [kofi, bmc]) {
      expect(link.target).toBe('_blank');
      expect(link.rel).toBe('noopener noreferrer');
    }
  });

  it('shows Ko-fi without Buy Me a Coffee, and the other way round', () => {
    const { rerender } = render(
      <SupportScreen
        support={{ ...NO_RAILS, kofiUrl: 'https://ko-fi.com/someone' }}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Support me on Ko-fi')).toBeTruthy();
    expect(screen.queryByText('Buy me a coffee')).toBeNull();

    rerender(
      <SupportScreen
        support={{ ...NO_RAILS, bmcUrl: 'https://buymeacoffee.com/someone' }}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText('Support me on Ko-fi')).toBeNull();
    expect(screen.getByText('Buy me a coffee')).toBeTruthy();
  });

  it('renders the donate row as a link to the deployer URL', () => {
    render(
      <SupportScreen
        support={{ ...NO_RAILS, donateUrl: 'https://example.com/give' }}
        onClose={vi.fn()}
      />,
    );
    const link = screen.getByText('Donate') as HTMLAnchorElement;
    expect(link.href).toBe('https://example.com/give');
  });

  it('renders every row at once, in the design order, when every field is set', () => {
    render(
      <SupportScreen
        support={{
          payId: 'me@bank',
          payIdName: 'Funny Family',
          sponsorsUrl: 'https://github.com/sponsors/someone',
          lightningAddress: 'me@getalby.com',
          kofiUrl: 'https://ko-fi.com/someone',
          bmcUrl: 'https://buymeacoffee.com/someone',
          donateUrl: 'https://example.com/give',
        }}
        onClose={vi.fn()}
      />,
    );
    const rows = [
      screen.getByText('me@bank'),
      screen.getByText('https://github.com/sponsors/someone'),
      screen.getByText('me@getalby.com'),
      screen.getByText('Support me on Ko-fi'),
      screen.getByText('Buy me a coffee'),
      screen.getByText('Donate'),
    ];
    // Each row comes after the one before it in the document (design §10.2).
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i - 1].compareDocumentPosition(rows[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }
  });
});

describe('copy buttons', () => {
  it('copies the PayID and flashes Copied!', async () => {
    const writeText = stubClipboard();
    render(<SupportScreen support={{ ...NO_RAILS, payId: 'me@bank' }} onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('Copy'));

    expect(writeText).toHaveBeenCalledWith('me@bank');
    expect(await screen.findByText('Copied!')).toBeTruthy();
  });

  it('copies the lightning address independently of the PayID row', async () => {
    const writeText = stubClipboard();
    render(
      <SupportScreen
        support={{ ...NO_RAILS, payId: 'me@bank', lightningAddress: 'me@getalby.com' }}
        onClose={vi.fn()}
      />,
    );

    const copyButtons = screen.getAllByText('Copy');
    fireEvent.click(copyButtons[1]);

    expect(writeText).toHaveBeenCalledWith('me@getalby.com');
  });
});

describe('gift counts', () => {
  it('names each brand button as its own rail', () => {
    trackGift.mockClear();
    render(
      <SupportScreen
        support={{
          ...NO_RAILS,
          kofiUrl: 'https://ko-fi.com/someone',
          bmcUrl: 'https://buymeacoffee.com/someone',
        }}
        onClose={vi.fn()}
      />,
    );
    // jsdom cannot open a tab; the tap is what is under test, not the visit.
    const stay = (event: Event): void => event.preventDefault();
    document.addEventListener('click', stay);
    try {
      fireEvent.click(screen.getByText('Support me on Ko-fi'));
      fireEvent.click(screen.getByText('Buy me a coffee'));
    } finally {
      document.removeEventListener('click', stay);
    }
    expect(trackGift.mock.calls).toEqual([['kofi'], ['bmc']]);
  });
});

describe('closing', () => {
  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<SupportScreen support={{ ...NO_RAILS, payId: 'me@bank' }} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
