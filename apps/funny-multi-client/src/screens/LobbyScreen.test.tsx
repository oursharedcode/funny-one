// SPDX-License-Identifier: AGPL-3.0-only

// T-3.2. The lobby is where the contract change from T-1.6 actually shows on
// the wire: SRC emitted `game:start` with `{ wobbleEngine: 'lottie' }`, and
// this server's handler takes no payload at all.

import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Player } from '@funny/shared';
import { createSocketMock, setUrl } from '../testutils/socketMock';
import type { LobbyState } from '../App';
import i18n from '../i18n';
import { __resetPackCodeForTest, forgetPackCode, rememberPackCode } from '../packCode';

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
    multiLanguage: false,
    myLanguage: 'en',
    players: players(3),
    pack: null,
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
    expect(url.searchParams.has('multi')).toBe(false);

    // The flash confirms the success branch ran, not just the call.
    expect(await screen.findByText('Copied!')).toBeTruthy();
  });

  it('marks a multi-language room in the link and under the room code (B-15)', () => {
    // `&multi=1` lets the join screen ask the invitee to pick their own
    // language first; the join ack stays the authority on the room itself.
    const writeText = stubClipboard();
    renderLobby({ roomCode: 'WXYZ', language: 'ru', multiLanguage: true });

    fireEvent.click(screen.getByText('Copy link'));

    const url = new URL(writeText.mock.calls[0][0] as string);
    expect(url.searchParams.get('lang')).toBe('ru');
    expect(url.searchParams.get('multi')).toBe('1');
    expect(screen.getByText('Multi-language room')).toBeTruthy();
  });

  it('shows no multi-language badge in an ordinary room', () => {
    renderLobby();
    expect(screen.queryByText('Multi-language room')).toBeNull();
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

describe('cap banner', () => {
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

// Step 117 (owner decision 3A): every room in the edition's languages is a
// Christmas room, and its host can switch the stories off here.
describe('Christmas stories (Step 117)', () => {
  const ON = { id: 'chr26', on: true, paid: false } as const;
  const OFF = { id: 'chr26', on: false, paid: false } as const;
  const LINE = '🔔 This game has two Christmas stories';
  const SWITCH = 'Play with the Christmas 2026 stories';

  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('tells everyone, and shows the host the switch, on', () => {
    renderLobby({ pack: ON });
    expect(screen.getByText(LINE)).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>(SWITCH).checked).toBe(true);
  });

  it("sends the host's switch to the server and shows the server's state, not its own", () => {
    renderLobby({ pack: ON });
    fireEvent.click(screen.getByLabelText(SWITCH));
    expect(socketMock.onlyEmitOf('room:setPack').args).toEqual([{ on: false }]);
    // Still on until the server's lobby:update says otherwise.
    expect(screen.getByLabelText<HTMLInputElement>(SWITCH).checked).toBe(true);
  });

  it('lets the host switch the stories back on', () => {
    renderLobby({ pack: OFF });
    expect(screen.queryByText(LINE)).toBeNull();
    fireEvent.click(screen.getByLabelText(SWITCH));
    expect(socketMock.onlyEmitOf('room:setPack').args).toEqual([{ on: true }]);
  });

  it('shows a guest the line and no switch', () => {
    renderLobby({ pack: ON, socketId: 's1', hostId: 's0' });
    expect(screen.getByText(LINE)).toBeTruthy();
    expect(screen.queryByLabelText(SWITCH)).toBeNull();
  });

  it('shows a guest nothing once the host has switched them off', () => {
    renderLobby({ pack: OFF, socketId: 's1', hostId: 's0' });
    expect(screen.queryByText(LINE)).toBeNull();
    expect(screen.queryByLabelText(SWITCH)).toBeNull();
  });

  it('shows nothing in a room offered no pack', () => {
    renderLobby({ pack: null });
    expect(screen.queryByText(LINE)).toBeNull();
    expect(screen.queryByLabelText(SWITCH)).toBeNull();
  });

  it('names the edition «Новый год 2027» in Russian', async () => {
    await i18n.changeLanguage('ru');
    renderLobby({ pack: ON, language: 'ru', myLanguage: 'ru' });
    expect(screen.getByText('🔔 В этой игре две новогодние истории')).toBeTruthy();
    expect(screen.getByLabelText('Играть с историями «Новый год 2027»')).toBeTruthy();
  });
});

// Step 122 (B-29): a paid room says so, and any player whose phone keeps a
// paid code can open the room with it.
describe('the paid code (Step 122)', () => {
  const CODE = 'XMAS26-K7QM-3FPA';
  const ON = { id: 'chr26', on: true, paid: false } as const;
  const PAID = { id: 'chr26', on: true, paid: true } as const;
  const USE = '🔔 Use my Christmas pack here';
  const SWITCH = 'Play with the Christmas 2026 stories';

  function resetCode(): void {
    forgetPackCode();
    __resetPackCodeForTest();
    sessionStorage.clear();
  }

  beforeEach(() => {
    resetCode();
    // A December day, whatever day the suite runs on.
    vi.useFakeTimers({ now: Date.parse('2026-12-20T09:00:00Z'), toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
    resetCode();
  });

  it('says every story is a Christmas one in a paid room, and offers no code there', () => {
    rememberPackCode(CODE);
    renderLobby({ pack: PAID });
    expect(screen.getByText('🔔 Every story in this game is a Christmas story')).toBeTruthy();
    expect(screen.queryByText('🔔 This game has two Christmas stories')).toBeNull();
    expect(screen.queryByText(USE)).toBeNull();
  });

  // Owner decision 3A: the host can play without the pack, in a paid room too.
  it("keeps the host's switch in a paid room", () => {
    renderLobby({ pack: PAID });
    const toggle = screen.getByLabelText<HTMLInputElement>(SWITCH);
    expect(toggle.checked).toBe(true);
    fireEvent.click(toggle);
    expect(socketMock.onlyEmitOf('room:setPack').args).toEqual([{ on: false }]);
  });

  it('says nothing of the pack in a paid room switched off, and offers no code there', () => {
    rememberPackCode(CODE);
    renderLobby({ pack: { ...PAID, on: false } });
    expect(screen.getByLabelText<HTMLInputElement>(SWITCH).checked).toBe(false);
    expect(screen.queryByText('🔔 Every story in this game is a Christmas story')).toBeNull();
    expect(screen.queryByText(USE)).toBeNull();
  });

  it('offers nothing to a phone that keeps no code', () => {
    renderLobby({ pack: ON });
    expect(screen.queryByText(USE)).toBeNull();
  });

  it("sends a guest's code to the server, and waits for its answer", () => {
    rememberPackCode(CODE);
    renderLobby({ pack: ON, socketId: 's1', hostId: 's0' });
    const button = screen.getByText<HTMLButtonElement>(USE);
    fireEvent.click(button);
    expect(socketMock.onlyEmitOf('room:unlock').args[0]).toEqual({ code: CODE });
    expect(button.disabled).toBe(true);

    socketMock.ackFor('room:unlock')({ ok: true });
    expect(button.disabled).toBe(false);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each([
    ['CODE_INVALID', "That Christmas code isn't right. Check it and try again."],
    ['CODE_BLOCKED', 'This Christmas code no longer works.'],
    ['CODE_ENDED', 'The Christmas 2026 edition has ended.'],
    ['PACK_UNAVAILABLE', "Christmas stories aren't available in this room."],
  ])('says why %s, and takes the button away', (code, text) => {
    rememberPackCode(CODE);
    renderLobby({ pack: ON });
    fireEvent.click(screen.getByText(USE));
    socketMock.ackFor('room:unlock')({ error: { code, message: 'raw server text' } });
    expect(screen.getByRole('alert').textContent).toBe(text);
    expect(screen.queryByText(USE)).toBeNull();
  });

  it.each([
    ['CODE_PENDING', 'This Christmas code is waiting for its payment.'],
    ['RATE_LIMITED', 'Slow down a moment'],
  ])('keeps the button after %s, which a later tap can get past', (code, text) => {
    rememberPackCode(CODE);
    renderLobby({ pack: ON });
    fireEvent.click(screen.getByText(USE));
    socketMock.ackFor('room:unlock')({ error: { code, message: 'raw server text' } });
    expect(screen.getByRole('alert').textContent).toBe(text);
    expect(screen.getByText<HTMLButtonElement>(USE).disabled).toBe(false);
  });

  it('shows why the code Home sent did not open the room', () => {
    rememberPackCode(CODE);
    renderLobby({ pack: ON, codeError: { code: 'CODE_BLOCKED', message: 'blocked' } });
    expect(screen.getByRole('alert').textContent).toBe('This Christmas code no longer works.');
    expect(screen.queryByText(USE)).toBeNull();
  });

  it('drops an old refusal once someone else has paid for the room', () => {
    rememberPackCode(CODE);
    const codeError = { code: 'CODE_PENDING', message: 'pending' } as const;
    const { rerender } = render(
      <LobbyScreen lobby={lobbyState({ pack: ON, codeError })} onLeave={vi.fn()} />,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    rerender(<LobbyScreen lobby={lobbyState({ pack: PAID, codeError })} onLeave={vi.fn()} />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText(USE)).toBeNull();
  });

  it('offers a code to a room with no pack once the free part has ended', () => {
    rememberPackCode(CODE);
    vi.setSystemTime(Date.parse('2027-07-15T09:00:00Z'));
    renderLobby({ pack: null });
    expect(screen.getByText(USE)).toBeTruthy();
  });

  it('offers no code in the Android app', () => {
    rememberPackCode(CODE);
    setUrl('?shell=android');
    renderLobby({ pack: ON });
    expect(screen.queryByText(USE)).toBeNull();
  });
});
