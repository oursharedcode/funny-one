// SPDX-License-Identifier: AGPL-3.0-only

// T-3.2. The Home screen is the only place a room's *content* language is
// chosen, and the choice is unrecoverable — a room created in a language whose
// pools are not authored plays seven full rounds and throws at reveal. T-2.3
// closed that server-side by narrowing `isValidLanguage` to
// `AUTHORED_LANGUAGES`; the create-mode picker here is the client half of the
// same constraint, and it is what most of this suite is about.
//
// Assertions read rendered *text*, not translation keys: the real catalogue is
// initialised, so a screen referring to a key that does not exist renders the
// bare key and fails here. `catalogs.test.ts` checks en/ru agree with each
// other; this checks the screens agree with the catalogue.

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { AUTHORED_LANGUAGES, LANGUAGES } from '@funny/shared';
import { createSocketMock, setUrl } from '../testutils/socketMock';
import i18n from '../i18n';

const socketMock = createSocketMock();
vi.mock('../socket', () => ({ socket: socketMock }));

// Imported after the mock is registered.
const { default: HomeScreen } = await import('./HomeScreen');

function renderHome(onJoined = vi.fn()) {
  render(<HomeScreen onJoined={onJoined} />);
  return { onJoined };
}

// By role, not placeholder: the nickname field is the only text input on this
// screen, and the placeholder is translated — so a language-switch test would
// otherwise have to know which language it is in.
function nicknameField(): HTMLElement {
  return screen.getByRole('textbox');
}

function typeNickname(value: string): void {
  fireEvent.change(nicknameField(), { target: { value } });
}

/** Language codes offered by a picker, read off its flag rows. */
function pickerCodes(label: string): string[] {
  const picker = screen.getByRole('group', { name: label });
  return within(picker)
    .getAllByRole('button')
    .map((b) => b.getAttribute('title'))
    .map((name) => LANGUAGES.find((l) => l.name === name)?.code ?? `unknown:${name}`);
}

/**
 * Pick a room content language on the create screen.
 *
 * In create mode this deliberately switches the *interface* too (SRC
 * behaviour): the host is choosing the language the game will be played in, so
 * they get to preview it. That makes it global i18next state, which is why the
 * reset below exists — see the note there.
 */
async function chooseContentLanguage(code: string): Promise<void> {
  // Picker rows are titled with the language's *native* name ("Русский
  // (Россия)"), so look it up rather than hard-coding it here.
  const name = LANGUAGES.find((l) => l.code === code)?.name;
  if (!name) throw new Error(`no such language: ${code}`);
  await act(async () => {
    fireEvent.click(screen.getByTitle(name));
  });
}

beforeEach(async () => {
  socketMock.reset();
  setUrl('');
  // i18next's active language is module-global and survives unmount, so a test
  // that switches to Russian leaves every later test asserting English strings
  // against a Russian screen. Six tests failed this way on the first run.
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

describe('mode selection', () => {
  it('opens in create mode when the URL carries no room', () => {
    renderHome();
    expect(screen.getByText('Create room')).toBeTruthy();
    expect(screen.queryByText('Join room')).toBeNull();
  });

  it('opens in join mode when the URL carries a room, showing the code', () => {
    setUrl('?room=abcd');
    renderHome();
    expect(screen.getByText('Join room')).toBeTruthy();
    // Upper-cased for display — room codes are a fixed uppercase alphabet.
    expect(screen.getByText('ABCD')).toBeTruthy();
  });
});

describe('content-language gating (T-2.3 server constraint)', () => {
  it('offers only authored languages as the room content language', () => {
    renderHome();
    expect(pickerCodes('Language')).toEqual([...AUTHORED_LANGUAGES]);
  });

  it('omits a registered-but-unauthored language from the create picker', () => {
    renderHome();
    // `de` is a real registry entry with a flag and a UI catalogue slot, and is
    // exactly what SRC's picker would have offered. It must not be creatable
    // until T-6.3 authors its pools.
    expect(LANGUAGES.some((l) => l.code === 'de')).toBe(true);
    expect(pickerCodes('Language')).not.toContain('de');
  });

  it('still offers all 15 registry languages as the joiner UI language', () => {
    // The mirror of the test above: the narrowing must not leak onto the
    // interface picker, where any language is legitimate (i18next falls back
    // to English for the 13 catalogues Phase 6 adds).
    setUrl('?room=abcd');
    renderHome();
    expect(pickerCodes('Tap to change the interface language')).toEqual(
      LANGUAGES.map((l) => l.code),
    );
  });

  it('sends the picked authored language on room:create', async () => {
    renderHome();
    await chooseContentLanguage('ru');

    // The host previews the room language: picking it switches the interface
    // too, so the create button is now Russian. Asserting that here is what
    // makes the click below meaningful rather than incidental.
    expect(screen.queryByText('Create room')).toBeNull();
    typeNickname('hostie');
    fireEvent.click(screen.getByText('Создать комнату'));

    const [payload] = socketMock.onlyEmitOf('room:create').args;
    expect(payload).toMatchObject({ nickname: 'hostie', language: 'ru' });
  });
});

describe('room:create payload', () => {
  it('carries no wobbleEngine (T-1.6 removed it from the contract)', () => {
    renderHome();
    typeNickname('hostie');
    fireEvent.click(screen.getByText('Create room'));

    const [payload] = socketMock.onlyEmitOf('room:create').args;
    expect(payload).not.toHaveProperty('wobbleEngine');
    expect(Object.keys(payload as object).sort()).toEqual(['language', 'nickname']);
  });

  it('hands App a lobby state with no wobbleEngine and the created language', async () => {
    const { onJoined } = renderHome();
    await chooseContentLanguage('ru');
    typeNickname('hostie');
    fireEvent.click(screen.getByText('Создать комнату'));

    socketMock.ackFor('room:create')({ roomCode: 'WXYZ', socketId: 's1' });

    expect(onJoined).toHaveBeenCalledTimes(1);
    const state = onJoined.mock.calls[0][0];
    expect(state).not.toHaveProperty('wobbleEngine');
    expect(state).toMatchObject({
      roomCode: 'WXYZ',
      socketId: 's1',
      // The creator is their own host.
      hostId: 's1',
      language: 'ru',
      donateUrl: null,
    });
    expect(state.players).toEqual([{ id: 's1', nickname: 'hostie', isBot: false }]);
  });

  it('trims the nickname before sending it', () => {
    renderHome();
    typeNickname('  hostie  ');
    fireEvent.click(screen.getByText('Create room'));
    expect(socketMock.onlyEmitOf('room:create').args[0]).toMatchObject({ nickname: 'hostie' });
  });
});

describe('nickname bounds (server rejects outside 3–20)', () => {
  // Gate 2 found this the expensive way: a 2-character fixture nickname passed
  // every in-process test and failed on the wire. The button is the client-side
  // half of `validateNickname`.
  it.each([
    ['', false],
    ['ab', false],
    ['  ab  ', false],
    ['abc', true],
    ['a'.repeat(20), true],
  ])('nickname %j enables create: %s', (value, enabled) => {
    renderHome();
    typeNickname(value);
    const button = screen.getByText('Create room') as HTMLButtonElement;
    expect(button.disabled).toBe(!enabled);
  });

  it('caps typed input at 20 characters in the field itself', () => {
    renderHome();
    expect(screen.getByPlaceholderText('Pick a nickname').getAttribute('maxLength')).toBe('20');
  });
});

describe('join flow', () => {
  beforeEach(() => {
    setUrl('?room=abcd');
  });

  it('joins with the URL room code and adopts the room language', () => {
    const { onJoined } = renderHome();
    typeNickname('joiner');
    fireEvent.click(screen.getByText('Join room'));

    expect(socketMock.onlyEmitOf('room:join').args[0]).toMatchObject({
      roomCode: 'ABCD',
      nickname: 'joiner',
    });

    socketMock.ackFor('room:join')({
      socketId: 's2',
      hostId: 's1',
      // The host's choice wins over anything this screen had selected.
      language: 'ru',
      players: [{ id: 's1', nickname: 'hostie', isBot: false }],
    });

    expect(onJoined.mock.calls[0][0]).toMatchObject({ roomCode: 'ABCD', language: 'ru' });
  });

  it('offers the escape hatch rather than a raw error when the room is gone', () => {
    renderHome();
    typeNickname('joiner');
    fireEvent.click(screen.getByText('Join room'));
    socketMock.ackFor('room:join')({ error: { code: 'ROOM_NOT_FOUND', message: 'gone' } });

    expect(screen.getByText(/That room no longer exists/)).toBeTruthy();
    expect(screen.queryByText('Room not found')).toBeNull();
    expect(screen.getByText('Create a new room')).toBeTruthy();
  });

  it('shows other join errors translated by code', () => {
    renderHome();
    typeNickname('joiner');
    fireEvent.click(screen.getByText('Join room'));
    socketMock.ackFor('room:join')({ error: { code: 'ROOM_FULL', message: 'raw server text' } });

    expect(screen.getByText('Room is full')).toBeTruthy();
    expect(screen.queryByText('raw server text')).toBeNull();
  });

  it('leaves join mode for create mode via the escape hatch', () => {
    renderHome();
    typeNickname('joiner');
    fireEvent.click(screen.getByText('Join room'));
    socketMock.ackFor('room:join')({ error: { code: 'ROOM_NOT_FOUND', message: 'gone' } });
    fireEvent.click(screen.getByText('Create a new room'));

    expect(screen.getByText('Create room')).toBeTruthy();
    // The dead link is stripped, so a refresh does not return to it.
    expect(window.location.search).toBe('');
  });
});

describe('failures reported as an error event, not an ack', () => {
  // `room:create`'s ack has no error branch, so the rate limiter (T-2.2) emits
  // `error` instead — confirmed against the real server, where an unacceptable
  // `room:create` never acks at all. Without this the busy flag latches and the
  // button is dead until reload.
  it('re-enables Create after a rate-limit error', () => {
    renderHome();
    typeNickname('hostie');
    const button = screen.getByText('Create room') as HTMLButtonElement;

    fireEvent.click(button);
    expect(button.disabled).toBe(true);

    socketMock.fire('error', { code: 'RATE_LIMITED', message: 'Slow down a moment' });
    expect(button.disabled).toBe(false);
  });

  it('re-enables Join after an error event', () => {
    setUrl('?room=abcd');
    renderHome();
    typeNickname('joiner');
    const button = screen.getByText('Join room') as HTMLButtonElement;

    fireEvent.click(button);
    expect(button.disabled).toBe(true);

    socketMock.fire('error', { code: 'RATE_LIMITED', message: 'Slow down a moment' });
    expect(button.disabled).toBe(false);
  });

  it('leaves the toast to App rather than showing the message twice', () => {
    renderHome();
    typeNickname('hostie');
    fireEvent.click(screen.getByText('Create room'));
    socketMock.fire('error', { code: 'RATE_LIMITED', message: 'Slow down a moment' });
    expect(screen.queryByText('Slow down a moment')).toBeNull();
  });
});

describe('stats', () => {
  it('renders no counter while the stats ack goes unanswered', () => {
    renderHome();
    // T-5.3's real server does answer this ack; the mock here just hasn't,
    // which is what the rest of this file exercises deliberately.
    expect(socketMock.emitsOf('stats:get')).toHaveLength(1);
    expect(screen.queryByText(/Open rooms/)).toBeNull();
  });

  it('renders the counter once a stats payload arrives', () => {
    renderHome();
    socketMock.ackFor('stats:get')({ openRooms: 4, imagesGeneratedToday: 2, imagesLimit: 50 });
    expect(screen.getByText('Open rooms: 4')).toBeTruthy();
  });

  it('does not ask for stats in join mode', () => {
    setUrl('?room=abcd');
    renderHome();
    expect(socketMock.emitsOf('stats:get')).toHaveLength(0);
  });
});
