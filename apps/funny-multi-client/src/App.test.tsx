// SPDX-License-Identifier: AGPL-3.0-only

// T-3.4 — the phase machine, and the §17 transition lock.
//
// `App.tsx` has been the untested centre of the client since T-3.1: every
// screen suite renders its screen directly, so nothing until now checked that
// a `round:start` actually *reaches* RoundScreen, or that the phase machine
// hands each screen the state it needs. Phase 3 is the point where all six
// destinations exist, so it is the point where that becomes checkable.
//
// The transition assertions are behavioural rather than a restatement of the
// constant: framer-motion writes real inline transforms under jsdom, so
// "enters from the left" is observable as `translateX(-100%)` on the incoming
// screen — including when the phase machine moves *backwards*, which is the
// whole content of the forward-only lock.

import { describe, expect, it, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { POOLS, POOL_TEXTS, QUESTIONS, SLOT_COUNT } from '@funny/shared';
import type { PayConfig, RevealStartPayload, SlotIndex } from '@funny/shared';
import { createSocketMock, setUrl } from './testutils/socketMock';
import { screenSlide } from './styles/motion';
import { renderStory } from './storyLanguage';
import i18n from './i18n';

const socketMock = createSocketMock();
vi.mock('./socket', () => ({ socket: socketMock }));
const setReloadSafe = vi.fn();
vi.mock('./swReload', () => ({ setReloadSafe }));
const trackChristmasGame = vi.fn();
vi.mock('./funnel', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./funnel')>()),
  trackChristmasGame,
}));

const { default: App } = await import('./App');

// Real option ids, so the story can be retold in another language (B-15).
const IDS = Array.from({ length: SLOT_COUNT }, (_, i) => POOLS[i as SlotIndex][0]!.id);

const REVEAL: RevealStartPayload = {
  answers: ['a grumpy pirate'],
  prose: 'A grumpy pirate and a haunted toaster were in a lighthouse.',
  optionIds: IDS,
  content: { kind: 'base' },
};

/** Render App and take it as far as the lobby, which most phases require. */
function renderInLobby() {
  const view = render(<App />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hostie' } });
  fireEvent.click(screen.getByText('Create room'));
  socketMock.ackFor('room:create')({ roomCode: 'WXYZ', socketId: 's1' });
  return view;
}

function phaseContainers(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[data-phase]')];
}

function phases(container: HTMLElement): (string | null)[] {
  return phaseContainers(container).map((n) => n.getAttribute('data-phase'));
}

/** Screens currently animating in, identified by the §17 entry transform. */
function enteringPhases(container: HTMLElement): (string | undefined)[] {
  return phaseContainers(container)
    .filter((n) => n.getAttribute('style')?.includes('translateX(-100%)'))
    .map((n) => n.dataset.phase);
}

/**
 * Run the transition to completion.
 *
 * framer-motion drives springs off `requestAnimationFrame`, which never
 * advances on its own under jsdom — so without this the outgoing screen stays
 * mounted forever, and returning to a phase reuses the stale element instead
 * of mounting a fresh one. Both of those broke assertions here before the
 * timers were faked, and neither is a property of the app.
 */
async function settle(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });
}

// Faked once for the whole file rather than per test: framer-motion resolves
// its frame loop the first time it schedules and holds on to it, so swapping
// the timer implementation between tests leaves it driving a dead clock — the
// transitions then never settle, which is what happened first time round.
beforeAll(() => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

// App fetches `${base}config` once at mount (T-9.4). Defaulting to a rejected
// promise matches "offline, or a pre-T-9.3 server" — no support config, no ♥
// — so every test that doesn't care about support rails behaves exactly as
// before this fetch existed. Tests that do care call fetchMock.mockResolvedValueOnce.
const fetchMock = vi.fn().mockRejectedValue(new Error('no /config in this test'));

beforeEach(async () => {
  socketMock.reset();
  setUrl('');
  // B-1c's store-shell flag outlives the URL that set it, by design.
  sessionStorage.clear();
  fetchMock.mockClear();
  fetchMock.mockRejectedValue(new Error('no /config in this test'));
  vi.stubGlobal('fetch', fetchMock);
  await i18n.changeLanguage('en');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('phase routing', () => {
  it('starts on Home', () => {
    const { container } = render(<App />);
    expect(phases(container)).toEqual(['home']);
    expect(screen.getByText('Create room')).toBeTruthy();
  });

  it('moves to the Lobby once a room exists', () => {
    const { container } = renderInLobby();
    expect(phases(container)).toContain('lobby');
    expect(screen.getByText('WXYZ')).toBeTruthy();
  });

  it('routes round:start to the combobox', () => {
    renderInLobby();
    socketMock.fire('round:start', { roundNumber: 0, question: 'Who?', deadline: Date.now() });
    // The radiogroup is RoundScreen's signature — and reaching it proves App
    // handed over both the round payload and the lobby's language.
    expect(screen.getByRole('radiogroup')).toBeTruthy();
    expect(screen.getByText('Round 1 of 7')).toBeTruthy();
  });

  it('routes round:waiting to the waiting screen', () => {
    renderInLobby();
    socketMock.fire('round:start', { roundNumber: 0, question: 'Who?', deadline: Date.now() });
    socketMock.fire('round:waiting', { submitted: 2, total: 3 });
    expect(screen.getByText('2 / 3 submitted')).toBeTruthy();
  });

  it('routes reveal:start to the reveal screen', () => {
    renderInLobby();
    socketMock.fire('round:start', { roundNumber: 0, question: 'Who?', deadline: Date.now() });
    socketMock.fire('reveal:start', REVEAL);
    // RevealScreen's own suite covers the prose rendering itself (it's split
    // into highlighted spans, not one text node) — this only needs to prove
    // App handed the payload to the right screen.
    expect(screen.getByText("Here's your story")).toBeTruthy();
    expect(screen.getByText(/a grumpy pirate/)).toBeTruthy();
  });

  it("routes RevealScreen's continue action to the end screen, not-yet-over", () => {
    // The reveal→end move is client-only (RevealScreen's onContinue), unlike
    // every other phase change, which is server-driven. gameOver stays false
    // here — only a real game:over (above) sets it.
    renderInLobby();
    socketMock.fire('round:start', { roundNumber: 0, question: 'Who?', deadline: Date.now() });
    socketMock.fire('reveal:start', REVEAL);
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('Rounds are over')).toBeTruthy();
    expect(screen.queryByText('Game is over')).toBeNull();
  });

  it('routes game:over to the end screen', () => {
    renderInLobby();
    socketMock.fire('game:over', undefined);
    // EndScreen's own suite covers ready/restart/gallery behaviour — this
    // only needs to prove App handed gameOver: true to the right screen.
    expect(screen.getByText('Game is over')).toBeTruthy();
  });

  it('returns to Home when the player leaves the lobby', () => {
    const { container } = renderInLobby();
    fireEvent.click(screen.getByText('Leave'));
    expect(phases(container)).toContain('home');
  });

  it('clears the previous round when the next one starts', async () => {
    renderInLobby();
    socketMock.fire('round:start', { roundNumber: 0, question: 'Who?', deadline: Date.now() });
    socketMock.fire('round:waiting', { submitted: 3, total: 3 });
    socketMock.fire('round:start', {
      roundNumber: 1,
      question: 'And who else?',
      deadline: Date.now(),
    });
    await settle();

    // Back on the combobox for the new round, not stuck on the waiting count.
    // The count's absence follows from the phase switch rather than from
    // `onRoundStart`'s `setWaiting(null)`: a negative control deleting that
    // line reds nothing, because App only renders WaitingScreen while the
    // phase *is* 'waiting'. The reset is hygiene, and is not claimed as
    // covered here — what this test does guard is the phase switch and the
    // new round payload reaching the screen (both controlled, both red).
    expect(screen.getByText('Round 2 of 7')).toBeTruthy();
    expect(screen.queryByText('3 / 3 submitted')).toBeNull();
    // And the new round starts unanswered.
    expect(
      screen.getAllByRole('radio').filter((r) => r.getAttribute('aria-checked') === 'true'),
    ).toHaveLength(0);
  });
});

describe('multi-language room (B-15)', () => {
  it("plays a joiner's round and story in their own language, not the room's", async () => {
    setUrl('?room=WXYZ&lang=ru&multi=1');
    const { container } = render(<App />);
    // The link paints the join screen in Russian; this joiner taps English.
    await act(async () => {});
    await act(async () => {
      fireEvent.click(screen.getByTitle('English (United Kingdom)'));
    });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'joiner' } });
    fireEvent.click(screen.getByText('Join room'));
    socketMock.ackFor('room:join')({
      socketId: 's2',
      hostId: 's1',
      language: 'ru',
      multiLanguage: true,
      players: [{ id: 's1', nickname: 'hostie', isBot: false }],
    });

    // The server asks in the room's language.
    socketMock.fire('round:start', { roundNumber: 0, question: 'Кто?', deadline: Date.now() });
    expect(screen.getByRole('heading', { name: QUESTIONS.en[0] })).toBeTruthy();
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toContain(
      POOL_TEXTS.en[IDS[0]!],
    );

    // And tells the story in it too.
    socketMock.fire('reveal:start', REVEAL);
    const story = container.querySelector('div[lang]');
    expect(story?.getAttribute('lang')).toBe('en');
    expect(story?.textContent).toBe(renderStory('en', IDS).prose);
  });
});

describe('lobby:update', () => {
  it('applies roster and host changes to the live lobby', () => {
    renderInLobby();
    socketMock.fire('lobby:update', {
      players: [
        { id: 's1', nickname: 'hostie', isBot: false },
        { id: 's2', nickname: 'guest', isBot: false },
      ],
      hostId: 's2',
    });

    expect(screen.getByText('guest')).toBeTruthy();
    // Host moved to s2, so this client is no longer the host and loses Start.
    expect(screen.queryByText('Start Game')).toBeNull();
    expect(screen.getByText('Waiting for host to start…')).toBeTruthy();
  });

  // Step 117 (D2 A): the Christmas funnel counts a game under way in a room
  // that was offered the stories, whichever way its host left the switch.
  it('counts a game in a Christmas room once it starts, with the switch as the host left it', () => {
    trackChristmasGame.mockReset();
    renderInLobby();
    socketMock.fire('lobby:update', {
      players: [{ id: 's1', nickname: 'hostie', isBot: false }],
      hostId: 's1',
      pack: { id: 'chr26', on: false, paid: false },
    });
    expect(trackChristmasGame).not.toHaveBeenCalled();
    socketMock.fire('round:start', { roundNumber: 0, question: 'Who?', deadline: Date.now() });
    expect(trackChristmasGame).toHaveBeenCalledWith(false);
  });

  it('counts nothing in a room offered no pack', () => {
    trackChristmasGame.mockReset();
    renderInLobby();
    socketMock.fire('round:start', { roundNumber: 0, question: 'Who?', deadline: Date.now() });
    expect(trackChristmasGame).not.toHaveBeenCalled();
  });
});

describe('overlays', () => {
  it('shows a translated toast for a server error', () => {
    render(<App />);
    socketMock.fire('error', { code: 'RATE_LIMITED', message: 'raw server text' });
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('Slow down a moment');
    expect(screen.queryByText('raw server text')).toBeNull();
  });

  it('falls back to the server message for a code it cannot translate', () => {
    render(<App />);
    socketMock.fire('error', { code: 'SOMETHING_NEW', message: 'a newer server said this' });
    expect(screen.getByRole('alert').textContent).toBe('a newer server said this');
  });

  it('clears the toast on its own', async () => {
    render(<App />);
    socketMock.fire('error', { code: 'RATE_LIMITED', message: 'raw' });
    expect(screen.queryByRole('alert')).not.toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('offers the host a choice when a player is lost', () => {
    renderInLobby();
    socketMock.fire('player:lost', { nickname: 'guest' });
    const notice = screen.getByRole('alert');
    expect(within(notice).getByText('guest exited')).toBeTruthy();
    // Dismiss, or end the game and start over — spec §12.
    expect(within(notice).getByText('Ignore, continue the game')).toBeTruthy();
    expect(within(notice).getByText('Create a new room')).toBeTruthy();
  });

  it('dismisses the player-lost notice without ending the game', () => {
    renderInLobby();
    socketMock.fire('player:lost', { nickname: 'guest' });
    fireEvent.click(screen.getByText('Ignore, continue the game'));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(socketMock.emitsOf('game:end')).toHaveLength(0);
  });
});

describe('spec §17: the transition is forward-only', () => {
  // The lock is that direction never varies. A directional slide is the
  // obvious "improvement" someone reaches for later, and it is invisible in
  // review — hence a behavioural test rather than a comment.
  it('brings a screen in from the left when moving forward', () => {
    const { container } = renderInLobby();
    // Exactly one screen entering, and it entered leftward.
    expect(enteringPhases(container)).toEqual(['lobby']);
  });

  it('brings a screen in from the left when moving backward too', async () => {
    // Lobby → Home is a retreat in the phase machine, and must still look like
    // going forward — the property a directional slide would break.
    const { container } = renderInLobby();
    await settle();
    expect(phases(container)).toEqual(['lobby']);

    fireEvent.click(screen.getByText('Leave'));
    expect(enteringPhases(container)).toEqual(['home']);
  });

  it('overlaps the two screens rather than waiting', () => {
    // No `mode="wait"` on AnimatePresence (DESIGN_SYSTEM §17): the outgoing
    // screen leaves while the incoming one arrives, which is what keeps the
    // round cadence tight. Both are in the tree mid-transition.
    const { container } = renderInLobby();
    expect(phases(container)).toEqual(['home', 'lobby']);
  });

  it('settles to a single screen once the transition finishes', async () => {
    const { container } = renderInLobby();
    await settle();
    expect(phases(container)).toEqual(['lobby']);
  });

  it('declares no direction-dependent motion', () => {
    // framer-motion expresses a directional variant as a function of `custom`;
    // plain objects cannot vary by direction, which is the property that makes
    // the two tests above hold for every phase pair rather than just the ones
    // exercised here.
    for (const value of Object.values(screenSlide)) {
      expect(typeof value).not.toBe('function');
    }
    expect(screenSlide.initial.x).toBe('-100%');
    expect(screenSlide.exit.x).toBe('100%');
  });
});

describe('support (T-9.4)', () => {
  function resolveConfig(support: Partial<Record<string, string | null>>): void {
    fetchMock.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          support: {
            payId: null,
            payIdName: null,
            sponsorsUrl: null,
            lightningAddress: null,
            kofiUrl: null,
            bmcUrl: null,
            donateUrl: null,
            ...support,
          },
        }),
    });
  }

  it('shows no ♥ on Home when the fetched config has no rail set', async () => {
    resolveConfig({});
    render(<App />);
    await act(async () => {});
    expect(screen.queryByLabelText('Support Author')).toBeNull();
  });

  it('shows no ♥ on Home when /config answers with something unparseable', async () => {
    // Production answers unknown paths with index.html at HTTP 200 until its
    // next deploy — the fetch must fail closed on that, not throw past the app.
    fetchMock.mockResolvedValueOnce({ json: () => Promise.reject(new SyntaxError('not json')) });
    render(<App />);
    await act(async () => {});
    expect(screen.queryByLabelText('Support Author')).toBeNull();
  });

  it('shows a ♥ on Home once the config has a rail, and opens the support screen from it', async () => {
    resolveConfig({ payId: 'me@bank', payIdName: 'Me' });
    render(<App />);
    await act(async () => {});

    const heart = screen.getByLabelText('Support Author');
    fireEvent.click(heart);
    expect(screen.getByText('me@bank')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Close'));
    expect(screen.queryByText('me@bank')).toBeNull();
  });

  // B-26: a reload on update would shut the sheet on someone copying a PayID.
  it('holds a reload on update while the support screen is open', async () => {
    resolveConfig({ payId: 'me@bank', payIdName: 'Me' });
    render(<App />);
    await act(async () => {});
    fireEvent.click(screen.getByLabelText('Support Author'));
    expect(setReloadSafe).toHaveBeenLastCalledWith(false);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(setReloadSafe).toHaveBeenLastCalledWith(true);
  });

  it('offers the same support entry point from the end screen', async () => {
    resolveConfig({ donateUrl: 'https://example.com/give' });
    renderInLobby();
    await act(async () => {});
    socketMock.fire('game:over', undefined);

    fireEvent.click(screen.getByText('Support this server'));
    expect(screen.getByText('Donate')).toBeTruthy();
  });

  // B-1c (FM-APP-3): the Android store app offers no gifts, whatever the
  // server's config says — neither entry point, on either screen. Step 85
  // (B-23) sets every rail, so no single one can slip through.
  const EVERY_RAIL = {
    payId: 'me@bank',
    payIdName: 'Me',
    sponsorsUrl: 'https://github.com/sponsors/me',
    lightningAddress: 'me@example.com',
    kofiUrl: 'https://ko-fi.com/me',
    bmcUrl: 'https://buymeacoffee.com/me',
    donateUrl: 'https://example.com/give',
  };

  it('offers no support entry point anywhere inside the Android store app', async () => {
    setUrl('?shell=android');
    resolveConfig(EVERY_RAIL);
    renderInLobby();
    await act(async () => {});
    socketMock.fire('game:over', undefined);
    expect(screen.queryByText('Support this server')).toBeNull();
    expect(screen.queryByText('me@bank')).toBeNull();
  });

  it('shows no ♥ on Home inside the Android store app, but the privacy link', async () => {
    setUrl('?shell=android');
    resolveConfig(EVERY_RAIL);
    render(<App />);
    await act(async () => {});
    expect(screen.queryByLabelText('Support Author')).toBeNull();
    expect(screen.getByRole('link', { name: 'Privacy policy' }).getAttribute('href')).toBe(
      '/privacy#privacy-en',
    );
  });
});

// Step 123 (B-29): the pay page — open from the first render for a pay link
// (where the landing site's /x26 forwards), later from the end screen's pay
// card; what it sells comes from the same /config fetch as the support rails.
describe('the pay page (Step 123)', () => {
  const SPONSORS: PayConfig = { pack: 'chr26', rail: 'sponsors' };
  const PAYID: PayConfig = { pack: 'chr26', rail: 'payid' };
  const CLOSED = "The pack can't be bought right now. Please come back later.";

  function resolvePay(pay: PayConfig | null): void {
    fetchMock.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          support: {
            payId: null,
            payIdName: null,
            sponsorsUrl: null,
            lightningAddress: null,
            kofiUrl: null,
            bmcUrl: null,
            donateUrl: null,
          },
          pay,
        }),
    });
  }

  function payPage(): Element | null {
    return document.querySelector('[data-pay-page="chr26"]');
  }

  /** A free Christmas game, played to its end screen. */
  function finishChristmasGame(): void {
    socketMock.fire('lobby:update', {
      players: [
        { id: 's1', nickname: 'hostie', isBot: false },
        { id: 's2', nickname: 'guest', isBot: false },
        { id: 's3', nickname: 'third', isBot: false },
      ],
      hostId: 's1',
      pack: { id: 'chr26', on: true, paid: false },
    });
    socketMock.fire('game:over', undefined);
  }

  // The pack is on sale only while its free part runs, so the day is pinned.
  beforeEach(() => {
    vi.setSystemTime(Date.parse('2026-12-20T09:00:00Z'));
    setReloadSafe.mockClear();
  });
  afterEach(() => {
    vi.setSystemTime(vi.getRealSystemTime());
  });

  it('opens from a pay link with the first render, and fills in once the server answers', async () => {
    setUrl('?pay=x26');
    resolvePay(SPONSORS);
    render(<App />);
    expect(payPage()).not.toBeNull();
    expect(screen.queryByText('US$2')).toBeNull();
    await act(async () => {});
    expect(screen.getByText('US$2')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pay US$2 on GitHub' })).toBeTruthy();
  });

  it('sells by the rail the server chose for this visitor', async () => {
    setUrl('?pay=x26');
    resolvePay(PAYID);
    render(<App />);
    await act(async () => {});
    expect(screen.getByRole('button', { name: 'Pay A$2.60 by PayID' })).toBeTruthy();
  });

  it("shuts to the game underneath, and takes the link's name off the address", async () => {
    setUrl('?pay=x26');
    resolvePay(SPONSORS);
    render(<App />);
    await act(async () => {});
    fireEvent.click(screen.getByText('Play free'));
    expect(payPage()).toBeNull();
    expect(window.location.search).toBe('');
    expect(screen.getByText('Create room')).toBeTruthy();
  });

  it('says to come back later when the server cannot be reached, or sells nothing', async () => {
    setUrl('?pay=x26');
    const { unmount } = render(<App />);
    await act(async () => {});
    expect(screen.getByText(CLOSED)).toBeTruthy();
    unmount();

    setUrl('?pay=x26');
    resolvePay(null);
    render(<App />);
    await act(async () => {});
    expect(screen.getByText(CLOSED)).toBeTruthy();
  });

  // B-26: a reload on update would take the page from under someone paying.
  it('holds a reload on update while it is open', async () => {
    setUrl('?pay=x26');
    resolvePay(SPONSORS);
    render(<App />);
    await act(async () => {});
    expect(setReloadSafe).toHaveBeenLastCalledWith(false);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(setReloadSafe).toHaveBeenLastCalledWith(true);
  });

  it("opens from the end screen's pay card and shuts back to the room", async () => {
    resolvePay(SPONSORS);
    renderInLobby();
    await act(async () => {});
    finishChristmasGame();
    expect(document.querySelector('[data-pay-card="chr26"]')).not.toBeNull();
    expect(payPage()).toBeNull();

    fireEvent.click(screen.getByText('Unlock'));
    expect(payPage()).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Pay US$2 on GitHub' })).toBeTruthy();
    expect(screen.queryByText('Play free')).toBeNull();

    fireEvent.click(screen.getByText('Close'));
    expect(payPage()).toBeNull();
    expect(screen.getByText('Unlock')).toBeTruthy();
    // A lobby, an end screen and the pay page in one test: past 5 s when the
    // whole repository's suites run at once on a busy machine (Step 125).
  }, 15_000);

  it('shows no pay card when the server sells nothing', async () => {
    resolvePay(null);
    renderInLobby();
    await act(async () => {});
    finishChristmasGame();
    expect(document.querySelector('[data-pay-card]')).toBeNull();
  });

  // FM-APP-3: no price and no way to pay inside the Android store app.
  it('has no way in inside the Android store app: no link, no card', async () => {
    setUrl('?pay=x26&shell=android');
    resolvePay(SPONSORS);
    renderInLobby();
    await act(async () => {});
    expect(payPage()).toBeNull();
    finishChristmasGame();
    expect(document.querySelector('[data-pay-card]')).toBeNull();
    expect(screen.queryByText('Unlock')).toBeNull();
    expect(screen.queryByText(/US\$2|A\$2\.60/)).toBeNull();
  });
});

// Step 85 (B-23): Google Play wants the privacy policy linked inside the app,
// and the app is this page, so Home links to it, at the reader's language.
describe('privacy link', () => {
  it('links Home to the policy in the interface language, in a new tab', async () => {
    render(<App />);
    const link = screen.getByRole('link', { name: 'Privacy policy' });
    expect(link.getAttribute('href')).toBe('/privacy#privacy-en');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');

    await act(async () => {
      await i18n.changeLanguage('ru');
    });
    expect(
      screen.getByRole('link', { name: 'Политика конфиденциальности' }).getAttribute('href'),
    ).toBe('/privacy#privacy-ru');
  });

  it('is on Home only', async () => {
    renderInLobby();
    await settle();
    expect(screen.queryByRole('link', { name: 'Privacy policy' })).toBeNull();
  });
});

// B-26 (Step 94): a new version reloads the page only on Home. The client
// keeps no room or seat to come back to, so anywhere else a reload drops the
// player out of the room.
describe('reload on update', () => {
  beforeEach(() => {
    setReloadSafe.mockClear();
  });

  it('is allowed on Home', () => {
    render(<App />);
    expect(setReloadSafe).toHaveBeenLastCalledWith(true);
  });

  it('is held in every phase from the lobby to the end screen', () => {
    renderInLobby();
    expect(setReloadSafe).toHaveBeenLastCalledWith(false);
    setReloadSafe.mockClear();
    socketMock.fire('round:start', { roundNumber: 0, question: 'Who?', deadline: Date.now() });
    socketMock.fire('round:waiting', { submitted: 2, total: 3 });
    socketMock.fire('reveal:start', REVEAL);
    socketMock.fire('game:over', undefined);
    expect(setReloadSafe).toHaveBeenCalledWith(false);
    expect(setReloadSafe).not.toHaveBeenCalledWith(true);
  });

  it('is allowed again once the player leaves the lobby for Home', () => {
    renderInLobby();
    fireEvent.click(screen.getByText('Leave'));
    expect(setReloadSafe).toHaveBeenLastCalledWith(true);
  });
});

describe('subscriptions', () => {
  it('detaches every socket listener on unmount', () => {
    const { unmount } = render(<App />);
    const attached = socketMock.on.mock.calls.map(([event]) => event).sort();
    unmount();
    const detached = socketMock.off.mock.calls.map(([event]) => event).sort();
    // A leaked listener keeps a dead React tree alive and fires setState on it.
    expect(detached).toEqual(attached);
  });
});
