// SPDX-License-Identifier: AGPL-3.0-only
//
// T-5.1. EndScreen is purely presentational — every socket event it reacts to
// (game:restartReady, gallery:ready, game:over) is subscribed by App.tsx and
// handed down as props, so this suite drives it through props directly rather
// than through the socket double's `fire`. Only the outgoing emits
// (game:restart, game:end, game:ready, gallery:share) go through the mock.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { POOLS, SLOT_COUNT, optionsFor } from '@funny/shared';
import { createSocketMock, setUrl } from '../testutils/socketMock';
import i18n from '../i18n';
import { __resetPackCodeForTest, forgetPackCode, rememberPackCode } from '../packCode';
import { renderStory } from '../storyLanguage';
import type {
  GalleryReadyPayload,
  PackId,
  PayConfig,
  Player,
  SlotIndex,
  StoryContent,
  SupportConfig,
} from '@funny/shared';
import type { LobbyState } from '../App';

const NO_RAILS: SupportConfig = {
  payId: null,
  payIdName: null,
  sponsorsUrl: null,
  lightningAddress: null,
  kofiUrl: null,
  bmcUrl: null,
  donateUrl: null,
};

const socketMock = createSocketMock();
vi.mock('../socket', () => ({ socket: socketMock }));

// The still itself is downloadStory.ts's own suite's business; here only that
// a paid story's download is reported.
const downloadStoryImage = vi.fn(async () => {});
vi.mock('../downloadStory', () => ({ buildStoryImageFile: vi.fn(), downloadStoryImage }));

// The funnel itself is funnel.test.ts's; here, only that the pay card is counted.
const { trackPayCard } = vi.hoisted(() => ({ trackPayCard: vi.fn() }));
vi.mock('../funnel', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../funnel')>()),
  trackPayCard,
}));

const { default: EndScreen } = await import('./EndScreen');

function players(...specs: Array<{ id: string; isBot?: boolean }>): Player[] {
  return specs.map(({ id, isBot = false }) => ({ id, nickname: id, isBot }));
}

function lobby(overrides: Partial<LobbyState> = {}): LobbyState {
  return {
    roomCode: 'WXYZ',
    socketId: 's0',
    hostId: 's0',
    language: 'en',
    multiLanguage: false,
    myLanguage: 'en',
    players: players({ id: 's0' }, { id: 's1' }, { id: 's2' }),
    pack: null,
    ...overrides,
  };
}

// Real option ids, so a story can be retold in another language (B-15); the
// answers and prose beside them are the room-language texts, shortened.
const IDS = Array.from({ length: SLOT_COUNT }, (_, i) => POOLS[i as SlotIndex][0]!.id);

const GALLERY: GalleryReadyPayload = {
  entries: [
    {
      nickname: 'p0',
      isBot: false,
      answers: ['a pirate'],
      prose: 'a pirate did stuff.',
      optionIds: IDS,
      content: { kind: 'base' },
      ending: null,
      picture: null,
    },
  ],
};

const GALLERY_TWO: GalleryReadyPayload = {
  entries: [
    {
      nickname: 'p0',
      isBot: false,
      answers: ['a pirate'],
      prose: 'a pirate did stuff.',
      optionIds: IDS,
      content: { kind: 'base' },
      ending: null,
      picture: { url: 'https://worker.example.com/i/p0.png', width: 1024, height: 768 },
    },
    {
      nickname: 'p1',
      isBot: true,
      answers: ['a robot'],
      prose: 'a robot did other stuff.',
      optionIds: IDS,
      content: { kind: 'base' },
      ending: null,
      picture: null,
    },
  ],
};

function renderEnd(props: {
  lobby?: LobbyState;
  readyIds?: string[];
  gameOver?: boolean;
  gallery?: GalleryReadyPayload | null;
  support?: SupportConfig | null;
  onOpenSupport?: () => void;
  pay?: PayConfig | null;
  onOpenPay?: (pack: PackId) => void;
}) {
  return render(
    <EndScreen
      lobby={props.lobby ?? lobby()}
      readyIds={props.readyIds ?? []}
      gameOver={props.gameOver ?? false}
      gallery={props.gallery ?? null}
      support={props.support}
      onOpenSupport={props.onOpenSupport}
      pay={props.pay}
      onOpenPay={props.onOpenPay}
    />,
  );
}

beforeEach(async () => {
  socketMock.reset();
  await i18n.changeLanguage('en');
});

describe('heading', () => {
  it('reads "Rounds are over" before the host finishes the game', () => {
    renderEnd({ gameOver: false });
    expect(screen.getByText('Rounds are over')).toBeTruthy();
    expect(screen.queryByText('Game is over')).toBeNull();
  });

  it('reads "Game is over" once the host has finished it', () => {
    renderEnd({ gameOver: true });
    expect(screen.getByText('Game is over')).toBeTruthy();
    expect(screen.queryByText('Rounds are over')).toBeNull();
  });
});

describe('host — gallery share', () => {
  it('offers a share button before the gallery has been shared', () => {
    renderEnd({ lobby: lobby({ socketId: 's0', hostId: 's0' }), gallery: null });
    fireEvent.click(screen.getByText("Share the room's pictures"));
    expect(socketMock.onlyEmitOf('gallery:share')).toBeDefined();
  });

  it('renders the gallery instead of the share button once shared', () => {
    renderEnd({ lobby: lobby({ socketId: 's0', hostId: 's0' }), gallery: GALLERY });
    expect(screen.getByText('Room gallery')).toBeTruthy();
    expect(screen.queryByText("Share the room's pictures")).toBeNull();
  });

  it('hides the share button once the game is over', () => {
    renderEnd({ lobby: lobby({ socketId: 's0', hostId: 's0' }), gallery: null, gameOver: true });
    expect(screen.queryByText("Share the room's pictures")).toBeNull();
  });
});

describe('room gallery display (RoomGallery)', () => {
  it('shows the picture with its reserved dimensions when one exists', () => {
    renderEnd({ gallery: GALLERY_TWO });
    const img = screen.getByAltText("Cartoon for p0's story") as HTMLImageElement;
    expect(img.src).toBe('https://worker.example.com/i/p0.png');
    expect(img.width).toBe(1024);
    expect(img.height).toBe(768);
  });

  it('shows a no-picture placeholder instead of an image when there is none', () => {
    renderEnd({ gallery: GALLERY });
    expect(screen.getByText('No picture for this story')).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('shows the current story via ProseText, phrase highlighted', () => {
    renderEnd({ gallery: GALLERY_TWO });
    // ProseText splits the highlighted answer into its own span (its own
    // suite covers the highlighting itself) — this only needs to prove the
    // right entry's prose and answers reached it.
    expect(screen.getByText('a pirate')).toBeTruthy();
    expect(screen.getByText(/did stuff/)).toBeTruthy();
  });

  it('starts on the first entry and shows a 1-based counter', () => {
    renderEnd({ gallery: GALLERY_TWO });
    expect(screen.getByText("p0's story")).toBeTruthy();
    expect(screen.getByText('1 / 2')).toBeTruthy();
  });

  it('steps forward to the next entry, wrapping past the last', () => {
    renderEnd({ gallery: GALLERY_TWO });
    fireEvent.click(screen.getByLabelText('Next story'));
    expect(screen.getByText("p1's story")).toBeTruthy();
    expect(screen.getByText('2 / 2')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Next story'));
    expect(screen.getByText("p0's story")).toBeTruthy();
    expect(screen.getByText('1 / 2')).toBeTruthy();
  });

  it('steps backward, wrapping before the first', () => {
    renderEnd({ gallery: GALLERY_TWO });
    fireEvent.click(screen.getByLabelText('Previous story'));
    expect(screen.getByText("p1's story")).toBeTruthy();
    expect(screen.getByText('2 / 2')).toBeTruthy();
  });

  it("opens the stories in the player's own language in a multi-language room (B-15)", () => {
    const { container } = renderEnd({
      lobby: lobby({ language: 'en', multiLanguage: true, myLanguage: 'ru' }),
      gallery: GALLERY_TWO,
    });
    const block = container.querySelector('div[lang]');
    expect(block?.getAttribute('lang')).toBe('ru');
    expect(block?.textContent).toBe(renderStory('ru', IDS).prose);
    // The interface stays in its own language.
    expect(screen.getByText('Room gallery')).toBeTruthy();
  });
});

describe('host — one more game', () => {
  // Step 130: fewer than three people play again, with bots in the seats.
  it('lets a host whose guests left, or who played alone, play again', () => {
    renderEnd({
      lobby: lobby({
        socketId: 's0',
        hostId: 's0',
        players: players({ id: 's0' }, { id: 'bot:1', isBot: true }, { id: 'bot:2', isBot: true }),
      }),
    });
    const button = screen.getByText('One more game') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(socketMock.onlyEmitOf('game:restart')).toBeTruthy();
  });

  it('disables restart and explains why while guests are not yet ready', () => {
    renderEnd({ lobby: lobby({ socketId: 's0', hostId: 's0' }), readyIds: [] });
    const button = screen.getByText('One more game') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(screen.getByText('Waiting for everyone to be ready')).toBeTruthy();
  });

  it('does not require the host itself to be in readyIds', () => {
    // readyIds only ever holds non-host players (game:ready is host-agnostic
    // server-side, but the host drives restart directly) — canRestart must
    // not block on the host's own id never appearing there.
    renderEnd({ lobby: lobby({ socketId: 's0', hostId: 's0' }), readyIds: ['s1', 's2'] });
    const button = screen.getByText('One more game') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('emits game:restart when enabled and clicked', () => {
    renderEnd({ lobby: lobby({ socketId: 's0', hostId: 's0' }), readyIds: ['s1', 's2'] });
    fireEvent.click(screen.getByText('One more game'));
    expect(socketMock.onlyEmitOf('game:restart')).toBeDefined();
  });

  it('emits game:end when Finish Game is clicked', () => {
    renderEnd({ lobby: lobby({ socketId: 's0', hostId: 's0' }) });
    fireEvent.click(screen.getByText('Finish Game'));
    expect(socketMock.onlyEmitOf('game:end')).toBeDefined();
  });

  it('hides restart and finish once the game is over', () => {
    renderEnd({ lobby: lobby({ socketId: 's0', hostId: 's0' }), gameOver: true });
    expect(screen.queryByText('One more game')).toBeNull();
    expect(screen.queryByText('Finish Game')).toBeNull();
  });
});

describe('guest — ready toggle', () => {
  it('shows a waiting-for-host message before the gallery is shared, no ready button', () => {
    renderEnd({ lobby: lobby({ socketId: 's1', hostId: 's0' }), gallery: null });
    expect(screen.getByText('Waiting for host…')).toBeTruthy();
    expect(screen.queryByText("I'm ready for a new game")).toBeNull();
  });

  it('offers a ready button once the gallery is visible', () => {
    renderEnd({ lobby: lobby({ socketId: 's1', hostId: 's0' }), gallery: GALLERY });
    expect(screen.getByText("I'm ready for a new game")).toBeTruthy();
  });

  it('emits game:ready true when not yet ready', () => {
    renderEnd({ lobby: lobby({ socketId: 's1', hostId: 's0' }), gallery: GALLERY, readyIds: [] });
    fireEvent.click(screen.getByText("I'm ready for a new game"));
    expect(socketMock.onlyEmitOf('game:ready').args[0]).toEqual({ ready: true });
  });

  it('shows the active state and a waiting hint once ready, and can toggle off', () => {
    renderEnd({
      lobby: lobby({ socketId: 's1', hostId: 's0' }),
      gallery: GALLERY,
      readyIds: ['s1'],
    });
    expect(screen.getByText('Ready ✓')).toBeTruthy();
    expect(screen.getByText('Waiting for host…')).toBeTruthy();
    fireEvent.click(screen.getByText('Ready ✓'));
    expect(socketMock.onlyEmitOf('game:ready').args[0]).toEqual({ ready: false });
  });

  it('never shows host-only controls to a guest', () => {
    renderEnd({ lobby: lobby({ socketId: 's1', hostId: 's0' }), gallery: GALLERY });
    expect(screen.queryByText('One more game')).toBeNull();
    expect(screen.queryByText('Finish Game')).toBeNull();
    expect(screen.queryByText("Share the room's pictures")).toBeNull();
  });
});

describe('support entry point (T-9.4)', () => {
  it('is absent when the deployer set no rail', () => {
    renderEnd({ support: NO_RAILS });
    expect(screen.queryByText('Support this server')).toBeNull();
  });

  it('is absent when no config has been fetched yet', () => {
    renderEnd({ support: null });
    expect(screen.queryByText('Support this server')).toBeNull();
  });

  it('opens support when clicked once at least one rail is set', () => {
    const onOpenSupport = vi.fn();
    renderEnd({
      support: { ...NO_RAILS, donateUrl: 'https://example.com/donate' },
      onOpenSupport,
    });
    fireEvent.click(screen.getByText('Support this server'));
    expect(onOpenSupport).toHaveBeenCalledTimes(1);
  });
});

// Step 122 (B-29): a paid room's next game, a code for the next game, and a
// paid story saved for the game's receipt record.
describe('the paid code (Step 122)', () => {
  const CODE = 'XMAS26-K7QM-3FPA';
  const ON = { id: 'chr26', on: true, paid: false } as const;
  const PAID = { id: 'chr26', on: true, paid: true } as const;
  const NEXT = '🔔 Next game: every story is a Christmas story';
  const USE = '🔔 Use my Christmas pack here';

  const PAID_CONTENT: StoryContent = { kind: 'paid', pack: 'chr26' };
  const PAID_IDS = Array.from(
    { length: SLOT_COUNT },
    (_, i) => optionsFor(i as SlotIndex, PAID_CONTENT)[0]!.id,
  );
  const PAID_GALLERY: GalleryReadyPayload = {
    entries: [
      {
        nickname: 'p0',
        isBot: false,
        ...renderStory('en', PAID_IDS),
        optionIds: PAID_IDS,
        content: PAID_CONTENT,
        ending: null,
        picture: null,
      },
    ],
  };

  function resetCode(): void {
    forgetPackCode();
    __resetPackCodeForTest();
  }

  beforeEach(() => {
    resetCode();
    downloadStoryImage.mockClear();
    vi.useFakeTimers({ now: Date.parse('2026-12-20T09:00:00Z'), toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
    resetCode();
  });

  it('says the next game of a paid room is all Christmas stories', () => {
    renderEnd({ lobby: lobby({ pack: PAID }) });
    expect(screen.getByText(NEXT)).toBeTruthy();
  });

  it('says nothing of the kind once the game is over, switched off or free', () => {
    const { unmount } = renderEnd({ lobby: lobby({ pack: PAID }), gameOver: true });
    expect(screen.queryByText(NEXT)).toBeNull();
    unmount();
    renderEnd({ lobby: lobby({ pack: { ...PAID, on: false } }) });
    expect(screen.queryByText(NEXT)).toBeNull();
    renderEnd({ lobby: lobby({ pack: ON }) });
    expect(screen.queryByText(NEXT)).toBeNull();
  });

  it("opens the room's next game with this phone's code, until the game is over", () => {
    rememberPackCode(CODE);
    const { unmount } = renderEnd({ lobby: lobby({ socketId: 's1', hostId: 's0', pack: ON }) });
    fireEvent.click(screen.getByText(USE));
    expect(socketMock.onlyEmitOf('room:unlock').args[0]).toEqual({ code: CODE });
    unmount();

    renderEnd({ lobby: lobby({ pack: ON }), gameOver: true });
    expect(screen.queryByText(USE)).toBeNull();
  });

  it("reports a paid story saved, for the game's record, and no free one", async () => {
    const { unmount } = renderEnd({ lobby: lobby({ pack: PAID }), gallery: PAID_GALLERY });
    fireEvent.click(screen.getByText('Download story'));
    await waitFor(() => expect(socketMock.emitsOf('story:exported')).toHaveLength(1));
    expect(socketMock.emitsOf('story:exported')[0]!.args).toEqual([{ kind: 'download' }]);
    unmount();

    renderEnd({ gallery: GALLERY });
    fireEvent.click(screen.getByText('Download story'));
    await waitFor(() => expect(downloadStoryImage).toHaveBeenCalledTimes(2));
    expect(socketMock.emitsOf('story:exported')).toHaveLength(1);
  });
});

// Step 123 (B-29): the pay card — every player's, after a free Christmas game,
// on the website only.
describe('the pay card (Step 123)', () => {
  const CODE = 'XMAS26-K7QM-3FPA';
  const ON = { id: 'chr26', on: true, paid: false } as const;
  const SPONSORS: PayConfig = { pack: 'chr26', rail: 'sponsors' };
  const PAYID: PayConfig = { pack: 'chr26', rail: 'payid' };
  const CARD = /^You just saw one Christmas story\. Unlock all of them: /;

  function resetCode(): void {
    forgetPackCode();
    __resetPackCodeForTest();
  }

  beforeEach(() => {
    resetCode();
    sessionStorage.clear();
    setUrl('');
    trackPayCard.mockClear();
    vi.useFakeTimers({ now: Date.parse('2026-12-20T09:00:00Z'), toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
    resetCode();
    sessionStorage.clear();
    setUrl('');
  });

  it("shows every player the price their rail charges and the pack's last day", () => {
    // The host, outside Australia.
    const { unmount } = renderEnd({ lobby: lobby({ pack: ON }), pay: SPONSORS });
    expect(
      screen.getByText(
        'You just saw one Christmas story. Unlock all of them: US$2, every game, until 1 August 2027.',
      ),
    ).toBeTruthy();
    unmount();

    // A guest, in Australia.
    renderEnd({ lobby: lobby({ socketId: 's2', pack: ON }), pay: PAYID });
    expect(
      screen.getByText(
        'You just saw one Christmas story. Unlock all of them: A$2.60, every game, until 1 August 2027.',
      ),
    ).toBeTruthy();
  });

  // A Russian date ends in "г.", so it does not close the sentence.
  it("writes the date in the reader's language", async () => {
    await i18n.changeLanguage('ru');
    renderEnd({ lobby: lobby({ pack: ON }), pay: SPONSORS });
    expect(
      screen.getByText(/US\$2, в каждой игре, до 1 августа 2027 г\. включительно\.$/),
    ).toBeTruthy();
  });

  it('has one button, which opens the pay page for the pack', () => {
    const onOpenPay = vi.fn();
    const { container } = renderEnd({ lobby: lobby({ pack: ON }), pay: SPONSORS, onOpenPay });
    const card = container.querySelector('[data-pay-card="chr26"]')!;
    expect(card.querySelectorAll('button')).toHaveLength(1);
    fireEvent.click(screen.getByText('Unlock'));
    expect(onOpenPay).toHaveBeenCalledTimes(1);
    expect(onOpenPay).toHaveBeenCalledWith('chr26');
  });

  it('is counted when shown, and stays once the game is over', () => {
    renderEnd({ lobby: lobby({ pack: ON }), pay: SPONSORS, gameOver: true });
    expect(screen.getByText(CARD)).toBeTruthy();
    expect(trackPayCard).toHaveBeenCalled();
  });

  it('is not shown, or counted, where nothing is on sale', () => {
    renderEnd({ lobby: lobby({ pack: ON }), pay: null });
    expect(screen.queryByText(CARD)).toBeNull();
    expect(trackPayCard).not.toHaveBeenCalled();
  });

  it('is not shown in a paid room', () => {
    renderEnd({ lobby: lobby({ pack: { ...ON, paid: true } }), pay: SPONSORS });
    expect(screen.queryByText(CARD)).toBeNull();
  });

  it("is not shown when the host's switch was off: no Christmas story was seen", () => {
    renderEnd({ lobby: lobby({ pack: { ...ON, on: false } }), pay: SPONSORS });
    expect(screen.queryByText(CARD)).toBeNull();
  });

  it('is not shown in a room whose language has no pack', async () => {
    await i18n.changeLanguage('ar');
    renderEnd({ lobby: lobby({ language: 'ar', myLanguage: 'ar', pack: null }), pay: SPONSORS });
    expect(document.querySelector('[data-pay-card]')).toBeNull();
    expect(trackPayCard).not.toHaveBeenCalled();
  });

  it('is never shown in the Android app', () => {
    setUrl('?shell=android');
    renderEnd({ lobby: lobby({ pack: ON }), pay: SPONSORS });
    expect(screen.queryByText(CARD)).toBeNull();
    expect(trackPayCard).not.toHaveBeenCalled();
  });

  it('is not shown on a phone that keeps a code: it has the pack to use', () => {
    rememberPackCode(CODE);
    renderEnd({ lobby: lobby({ socketId: 's1', pack: ON }), pay: SPONSORS });
    expect(screen.queryByText(CARD)).toBeNull();
    expect(screen.getByText('🔔 Use my Christmas pack here')).toBeTruthy();
  });
});
