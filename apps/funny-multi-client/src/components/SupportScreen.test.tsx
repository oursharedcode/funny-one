// SPDX-License-Identifier: AGPL-3.0-only

// T-9.4. Rows follow the fetched config field-by-field — the caller only
// mounts this once `hasAnyRail` is true, so unlike Home/EndScreen there is no
// "no rails at all" case to cover here.

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { SupportConfig } from '@funny/shared';
import '../i18n';

const { default: SupportScreen } = await import('./SupportScreen');

const NO_RAILS: SupportConfig = {
  payId: null,
  payIdName: null,
  sponsorsUrl: null,
  lightningAddress: null,
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
    expect(screen.queryByText('Donate')).toBeNull();
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

  it('renders every row at once when every field is set', () => {
    render(
      <SupportScreen
        support={{
          payId: 'me@bank',
          payIdName: 'Funny Family',
          sponsorsUrl: 'https://github.com/sponsors/someone',
          lightningAddress: 'me@getalby.com',
          donateUrl: 'https://example.com/give',
        }}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('me@bank')).toBeTruthy();
    expect(screen.getByText('https://github.com/sponsors/someone')).toBeTruthy();
    expect(screen.getByText('me@getalby.com')).toBeTruthy();
    expect(screen.getByText('Donate')).toBeTruthy();
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

describe('closing', () => {
  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<SupportScreen support={{ ...NO_RAILS, payId: 'me@bank' }} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
