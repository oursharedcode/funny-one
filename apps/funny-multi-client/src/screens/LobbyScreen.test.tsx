// SPDX-License-Identifier: AGPL-3.0-only

// T-3.2. The lobby is where the contract change from T-1.6 actually shows on
// the wire: SRC emitted `game:start` with `{ wobbleEngine: 'lottie' }`, and
// this server's handler takes no payload at all.

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Player } from '@funny/shared';
import { createSocketMock } from '../testutils/socketMock';
import type { LobbyState } from '../App';
import '../i18n';

const socketMock = createSocketMock();
vi.mock('../socket', () => ({ socket: socketMock }));

const { default: LobbyScreen } = await import('./LobbyScreen');

function players(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s${i}`,
    nickname: `player${i}`,
    isBot: false,
  }));
}

function lobbyState(over: Partial<LobbyState> = {}): LobbyState {
  return {
    roomCode: 'WXYZ',
    socketId: 's0',
    hostId: 's0',
    language: 'en',
    players: players(3),
    donateUrl: null,
    ...over,
  };
}

function renderLobby(over: Partial<LobbyState> = {}, onLeave = vi.fn()) {
  render(<LobbyScreen lobby={lobbyState(over)} onLeave={onLeave} />);
  return { onLeave };
}

beforeEach(() => {
  socketMock.reset();
  window.history.replaceState(null, '', '/');
});

describe('starting the game', () => {
  it('emits game:start with no payload at all', () => {
    renderLobby();
    fireEvent.click(screen.getByText('Start Game'));

    const emit = socketMock.onlyEmitOf('game:start');
    // Not merely "no wobbleEngine" — no arguments. The payload type was
    // dropped with its only field (T-1.6), so anything here is a contract
    // violation the server would ignore silently.
    expect(emit.args).toEqual([]);
  });

  it.each([
    [1, false],
    [2, false],
    [3, true],
    [7, true],
  ])('with %i players the start button enabled is %s', (count, enabled) => {
    renderLobby({ players: players(count) });
    expect((screen.getByText('Start Game') as HTMLButtonElement).disabled).toBe(!enabled);
  });

  it('explains why start is unavailable below the minimum', () => {
    renderLobby({ players: players(2) });
    expect(screen.getByText('Start Game').getAttribute('title')).toBe(
      'Need at least 3 players to start',
    );
  });

  it('shows non-hosts a wait notice instead of a start button', () => {
    renderLobby({ socketId: 's1', hostId: 's0' });
    expect(screen.queryByText('Start Game')).toBeNull();
    expect(screen.getByText('Waiting for host to start…')).toBeTruthy();
  });
});

describe('invite link', () => {
  // jsdom ships no Clipboard API at all. Without this the component falls
  // through to its `document.execCommand` path, which jsdom also lacks — so
  // stubbing the modern path both exercises the branch real browsers take and
  // lets the copied value be asserted.
  function stubClipboard(): ReturnType<typeof vi.fn> {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    return writeText;
  }

  it('copies a link carrying both the room code and the room language', async () => {
    // HomeScreen reads `?lang=` to render the join screen in the room's
    // language from the first paint; dropping it would degrade that silently
    // rather than break anything visible.
    const writeText = stubClipboard();
    renderLobby({ roomCode: 'WXYZ', language: 'ru' });

    fireEvent.click(screen.getByText('Copy link'));

    expect(writeText).toHaveBeenCalledTimes(1);
    const url = new URL(writeText.mock.calls[0][0] as string);
    expect(url.searchParams.get('room')).toBe('WXYZ');
    expect(url.searchParams.get('lang')).toBe('ru');

    // The flash confirms the success branch ran, not just the call.
    expect(await screen.findByText('Copied!')).toBeTruthy();
  });

  it('encodes the same link in the QR code', () => {
    const { container } = render(
      <LobbyScreen lobby={lobbyState({ roomCode: 'WXYZ', language: 'ru' })} onLeave={vi.fn()} />,
    );
    expect(screen.getByText('Scan to join')).toBeTruthy();
    const svg = container.querySelector('svg[height="160"]');
    expect(svg).not.toBeNull();
  });
});

describe('player list', () => {
  it('marks the host', () => {
    renderLobby();
    expect(screen.getByText('Host')).toBeTruthy();
  });

  it('lists every player, bots included', () => {
    renderLobby({
      players: [...players(2), { id: 'b1', nickname: 'Botty', isBot: true }],
    });
    expect(screen.getByText('player0')).toBeTruthy();
    expect(screen.getByText('player1')).toBeTruthy();
    expect(screen.getByText('Botty')).toBeTruthy();
  });
});

describe('leaving', () => {
  it('tells the server and the parent', () => {
    const { onLeave } = renderLobby();
    fireEvent.click(screen.getByText('Leave'));
    expect(socketMock.emitsOf('room:leave')).toHaveLength(1);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });
});

describe('cap banner (inert until T-5.3)', () => {
  it('stays hidden while the stats ack goes unanswered', () => {
    renderLobby();
    expect(socketMock.emitsOf('stats:get')).toHaveLength(1);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('stays hidden when the day still has allowance left', () => {
    renderLobby();
    socketMock.ackFor('stats:get')({ openRooms: 1, imagesGeneratedToday: 10, imagesLimit: 50 });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('appears with host guidance once the allowance is spent', () => {
    renderLobby();
    socketMock.ackFor('stats:get')({ openRooms: 1, imagesGeneratedToday: 50, imagesLimit: 50 });
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText(/Tap Start Game when ready/)).toBeTruthy();
  });

  it('omits the host guidance for guests', () => {
    renderLobby({ socketId: 's1', hostId: 's0' });
    socketMock.ackFor('stats:get')({ openRooms: 1, imagesGeneratedToday: 50, imagesLimit: 50 });
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText(/Tap Start Game when ready/)).toBeNull();
  });

  it('reacts to a live stats:update, not only the initial fetch', () => {
    renderLobby();
    socketMock.ackFor('stats:get')({ openRooms: 1, imagesGeneratedToday: 0, imagesLimit: 50 });
    expect(screen.queryByRole('status')).toBeNull();
    socketMock.fire('stats:update', {
      openRooms: 1,
      imagesGeneratedToday: 50,
      imagesLimit: 50,
    });
    expect(screen.getByRole('status')).toBeTruthy();
  });
});
