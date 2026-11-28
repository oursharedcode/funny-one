// SPDX-License-Identifier: AGPL-3.0-only
//
// T-4.4. RevealScreen has no manual "generate" affordance (spec §8, §11) — it
// requests a picture the moment it mounts and reacts to whatever the server
// sends back. These tests drive that reaction through the socket double
// rather than asserting the request itself was made in some particular way,
// since the request is the one line SRC's own tests never bothered pinning.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { POOLS, SLOT_COUNT, optionsFor } from '@funny/shared';
import { createSocketMock } from '../testutils/socketMock';
import i18n from '../i18n';
import { endingText, renderStory } from '../storyLanguage';
import type { AuthoredLanguage, RevealStartPayload, SlotIndex, StoryContent } from '@funny/shared';

const socketMock = createSocketMock();
vi.mock('../socket', () => ({ socket: socketMock }));
const trackGoldenCartoon = vi.fn();
vi.mock('../funnel', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../funnel')>()),
  trackGoldenCartoon,
}));
const ringRevealBell = vi.fn();
vi.mock('../revealBell', () => ({ ringRevealBell }));

const { default: RevealScreen } = await import('./RevealScreen');

// Real option ids, one per slot, so the story can be retold in any language
// (B-15). The answers and prose beside them are the room-language texts the
// server sent, shortened for readability; the screen shows them as they are
// whenever the story is in the room language.
const IDS = Array.from({ length: SLOT_COUNT }, (_, i) => POOLS[i as SlotIndex][0]!.id);

const REVEAL: RevealStartPayload = {
  answers: ['a grumpy pirate', 'a battered toaster'],
  prose: 'Once upon a time, a grumpy pirate met a battered toaster.',
  optionIds: IDS,
  content: { kind: 'base' },
};

const PICTURE = { url: 'https://worker.example.com/i/abc.png', width: 1024, height: 1024 };

function renderReveal(
  reveal: RevealStartPayload = REVEAL,
  onContinue = vi.fn(),
  defaultLanguage: AuthoredLanguage = 'en',
) {
  return {
    onContinue,
    ...render(
      <RevealScreen
        reveal={reveal}
        roomLanguage="en"
        defaultLanguage={defaultLanguage}
        onContinue={onContinue}
      />,
    ),
  };
}

/** The deployer logo over the picture. Found by its file, since the language switch's flag is an `alt=""` image too. */
function logoStamp(): HTMLImageElement | undefined {
  return (screen.queryAllByAltText('') as HTMLImageElement[]).find((img) =>
    img.src.includes('/deployer-logo.png'),
  );
}

/** The element holding the story's text, with its own lang and dir. */
function storyBlock(container: HTMLElement): HTMLElement {
  const block = container.querySelector<HTMLElement>('div[lang]');
  if (!block) throw new Error('no story block');
  return block;
}

function switchStoryTo(languageName: string): void {
  fireEvent.click(screen.getByRole('button', { name: /^Story language/ }));
  fireEvent.click(screen.getByTitle(languageName));
}

beforeEach(async () => {
  socketMock.reset();
  trackGoldenCartoon.mockReset();
  await i18n.changeLanguage('en');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('mount behaviour', () => {
  it('requests a picture automatically, with no button to press', () => {
    renderReveal();
    expect(socketMock.onlyEmitOf('reveal:requestPicture')).toBeDefined();
    // No generate/summon button anywhere — generation is not a user action.
    expect(screen.queryByRole('button', { name: /generate/i })).toBeNull();
  });

  it('renders the story prose with the player-supplied phrases highlighted', () => {
    renderReveal();
    expect(screen.getByText(/a grumpy pirate/)).toBeTruthy();
    expect(screen.getByText(/a battered toaster/)).toBeTruthy();
  });

  it('detaches its listeners on unmount', () => {
    const { unmount } = renderReveal();
    expect(socketMock.on).toHaveBeenCalledWith('reveal:pictureReady', expect.any(Function));
    expect(socketMock.on).toHaveBeenCalledWith('reveal:pictureError', expect.any(Function));
    unmount();
    expect(socketMock.off).toHaveBeenCalledWith('reveal:pictureReady', expect.any(Function));
    expect(socketMock.off).toHaveBeenCalledWith('reveal:pictureError', expect.any(Function));
  });
});

describe('waiting state', () => {
  it('shows no waiting mascot before the wait-control delay elapses', () => {
    vi.useFakeTimers();
    renderReveal();
    expect(screen.queryByText('Summoning chaos…')).toBeNull();
    vi.useRealTimers();
  });

  it('shows the waiting mascot once generation has run past the delay', () => {
    vi.useFakeTimers();
    renderReveal();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Summoning chaos…')).toBeTruthy();
    vi.useRealTimers();
  });
});

describe('reveal:pictureReady', () => {
  it('renders the picture with explicit width/height reserved for layout', () => {
    renderReveal();
    socketMock.fire('reveal:pictureReady', { picture: PICTURE, imagePrompt: 'a prompt' });

    const img = screen.getByAltText('AI-generated cartoon of your story') as HTMLImageElement;
    expect(img.src).toBe(PICTURE.url);
    expect(img.width).toBe(PICTURE.width);
    expect(img.height).toBe(PICTURE.height);
  });

  it('starts faded out and reveals the flourish and logo stamp only once the image itself has loaded', () => {
    renderReveal();
    socketMock.fire('reveal:pictureReady', { picture: PICTURE, imagePrompt: 'a prompt' });

    const img = screen.getByAltText('AI-generated cartoon of your story');
    expect(img.className).toContain('opacity-0');
    expect(logoStamp()).toBeUndefined();

    act(() => {
      fireEvent.load(img);
    });
    expect(img.className).toContain('opacity-100');
    expect(logoStamp()).toBeDefined();
  });

  it('clears any prior waiting/error state once a picture lands', () => {
    renderReveal();
    socketMock.fire('reveal:pictureError', { message: 'nope', code: 'GENERIC' });
    expect(screen.getByText('nope')).toBeTruthy();

    socketMock.fire('reveal:pictureReady', { picture: PICTURE, imagePrompt: 'a prompt' });
    expect(screen.queryByText('nope')).toBeNull();
    expect(screen.getByAltText('AI-generated cartoon of your story')).toBeTruthy();
  });
});

describe('reveal:pictureError', () => {
  it('shows the generic message and an error mascot for a GENERIC failure', () => {
    renderReveal();
    socketMock.fire('reveal:pictureError', {
      message: 'Generation failed. Try again.',
      code: 'GENERIC',
    });

    expect(screen.getByText('Generation failed. Try again.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('falls back to the server message when code is absent (older-client wire compatibility)', () => {
    renderReveal();
    socketMock.fire('reveal:pictureError', { message: 'A server-supplied reason.' });
    expect(screen.getByText('A server-supplied reason.')).toBeTruthy();
  });

  it('shows the i18n cap-reached caption with hours-until-midnight, ignoring the server message', () => {
    renderReveal();
    socketMock.fire('reveal:pictureError', {
      message: 'The cartoon oven is full for today. Try again tomorrow!',
      code: 'CAP_REACHED',
    });
    // The English server message is NOT what's shown — the client derives its
    // own i18n'd, hours-till-reset caption from the code alone.
    expect(
      screen.queryByText('The cartoon oven is full for today. Try again tomorrow!'),
    ).toBeNull();
    expect(
      screen.getByText(/The cartoon oven is full\. New cartoons in ~\d+ hours\./),
    ).toBeTruthy();
  });

  it('retries by re-emitting reveal:retryPicture and clearing the error', () => {
    renderReveal();
    socketMock.fire('reveal:pictureError', {
      message: 'Generation failed. Try again.',
      code: 'GENERIC',
    });
    expect(screen.getByText('Generation failed. Try again.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(socketMock.onlyEmitOf('reveal:retryPicture')).toBeDefined();
    expect(screen.queryByText('Generation failed. Try again.')).toBeNull();
  });
});

describe('continue', () => {
  it('calls onContinue when the continue link is pressed, independent of picture status', () => {
    const { onContinue } = renderReveal();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});

describe('story language (B-15)', () => {
  it("shows the server's own texts when the story is in the room language", () => {
    const { container } = renderReveal();
    const block = storyBlock(container);
    expect(block.getAttribute('lang')).toBe('en');
    expect(block.textContent).toBe(REVEAL.prose);
    expect(
      screen.getByRole('button', { name: 'Story language: English (United Kingdom)' }),
    ).toBeTruthy();
  });

  it("opens the story in the player's own language in a multi-language room", () => {
    const { container } = renderReveal(REVEAL, vi.fn(), 'ru');
    const block = storyBlock(container);
    expect(block.getAttribute('lang')).toBe('ru');
    expect(block.textContent).toBe(renderStory('ru', IDS).prose);
    // The interface stays in its own language.
    expect(screen.getByText("Here's your story")).toBeTruthy();
  });

  it('retells the story in the language picked on the switch, and back', () => {
    const { container } = renderReveal();

    switchStoryTo('Français (France)');
    expect(storyBlock(container).getAttribute('lang')).toBe('fr');
    expect(storyBlock(container).textContent).toBe(renderStory('fr', IDS).prose);
    // Picking closes the list.
    expect(screen.queryByTitle('Deutsch (Deutschland)')).toBeNull();

    switchStoryTo('English (United Kingdom)');
    expect(storyBlock(container).textContent).toBe(REVEAL.prose);
  });

  it('gives a Hebrew story its own right-to-left direction on a left-to-right screen', () => {
    const { container } = renderReveal();
    expect(storyBlock(container).getAttribute('dir')).toBe('ltr');

    switchStoryTo('עברית (ישראל)');
    expect(storyBlock(container).getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.dir).toBe('ltr');
  });
});

// Step 117 (B-29): a Christmas story's ending shows under the scene once the
// scene has come; a golden story says so above its text.
describe('Christmas stories (Step 117)', () => {
  const GOLDEN: StoryContent = { kind: 'full', pack: 'chr26' };
  const SLICE: StoryContent = { kind: 'slice', pack: 'chr26' };
  const idsFor = (content: StoryContent) =>
    Array.from({ length: SLOT_COUNT }, (_, i) => optionsFor(i as SlotIndex, content)[0]!.id);
  const revealOf = (content: StoryContent): RevealStartPayload => {
    const optionIds = idsFor(content);
    return { ...renderStory('en', optionIds), optionIds, content };
  };
  const ENDING = { url: 'https://worker.example.com/i/end.png', width: 1024, height: 1024 };
  const ENDING_ALT = 'AI-generated cartoon of how your story ended';

  it('marks a golden story above its text, and no other', () => {
    renderReveal(revealOf(GOLDEN));
    expect(screen.getByText('🔔 A Christmas story')).toBeTruthy();
  });

  it('shows no badge on a slice story or a base one', () => {
    const { unmount } = renderReveal(revealOf(SLICE));
    expect(screen.queryByText('🔔 A Christmas story')).toBeNull();
    unmount();
    renderReveal();
    expect(screen.queryByText('🔔 A Christmas story')).toBeNull();
  });

  it("shows a golden story's ending picture under the scene once both have come", () => {
    renderReveal(revealOf(GOLDEN));
    expect(screen.queryByAltText(ENDING_ALT)).toBeNull();
    socketMock.fire('reveal:pictureReady', { picture: PICTURE, imagePrompt: 'p', ending: ENDING });
    const ending = screen.getByAltText<HTMLImageElement>(ENDING_ALT);
    expect(ending.src).toBe(ENDING.url);
    expect(screen.queryByTestId('ending-card')).toBeNull();
  });

  it("shows a golden story's ending as a card when its picture could not be had", () => {
    const reveal = revealOf(GOLDEN);
    renderReveal(reveal);
    socketMock.fire('reveal:pictureReady', { picture: PICTURE, imagePrompt: 'p', ending: null });
    expect(screen.getByTestId('ending-card').textContent).toContain(endingText(reveal, 'en'));
  });

  it("shows a slice story's ending as a card once its scene has come", () => {
    const reveal = revealOf(SLICE);
    renderReveal(reveal);
    expect(screen.queryByTestId('ending-card')).toBeNull();
    socketMock.fire('reveal:pictureReady', { picture: PICTURE, imagePrompt: 'p' });
    const card = screen.getByTestId('ending-card');
    expect(card.textContent).toContain(endingText(reveal, 'en'));
    expect(card.getAttribute('lang')).toBe('en');
  });

  it('leaves room under an ending card for the floating Continue button, not under a picture', () => {
    // In the browser the button, 20vh off the bottom, covered the card's words.
    const { unmount } = renderReveal(revealOf(SLICE));
    socketMock.fire('reveal:pictureReady', { picture: PICTURE, imagePrompt: 'p' });
    expect(screen.getByTestId('ending-card').nextElementSibling).toBe(
      screen.getByTestId('ending-room'),
    );
    unmount();
    renderReveal(revealOf(GOLDEN));
    socketMock.fire('reveal:pictureReady', { picture: PICTURE, imagePrompt: 'p', ending: ENDING });
    expect(screen.queryByTestId('ending-room')).toBeNull();
  });

  it('shows no ending while the scene failed', () => {
    renderReveal(revealOf(SLICE));
    socketMock.fire('reveal:pictureError', { code: 'GENERIC', message: 'x' });
    expect(screen.queryByTestId('ending-card')).toBeNull();
  });

  it('shows no ending for a base story', () => {
    renderReveal();
    socketMock.fire('reveal:pictureReady', { picture: PICTURE, imagePrompt: 'p' });
    expect(screen.queryByTestId('ending-card')).toBeNull();
    expect(screen.queryByAltText(ENDING_ALT)).toBeNull();
  });

  it("retells the ending card in the story's switched language", () => {
    const reveal = revealOf(SLICE);
    renderReveal(reveal);
    socketMock.fire('reveal:pictureReady', { picture: PICTURE, imagePrompt: 'p' });
    switchStoryTo('Deutsch (Deutschland)');
    const card = screen.getByTestId('ending-card');
    expect(card.getAttribute('lang')).toBe('de');
    expect(card.textContent).toContain(endingText(renderStory('de', reveal.optionIds), 'de'));
  });

  // Step 133 (D3 A): the bell, as the screen opens, for a golden story only.
  it('rings for a golden story as the screen opens, once', () => {
    ringRevealBell.mockClear();
    const reveal = revealOf(GOLDEN);
    renderReveal(reveal);
    expect(ringRevealBell).toHaveBeenCalledTimes(1);
    expect(ringRevealBell).toHaveBeenCalledWith(reveal);
    // Retelling the story in another language rings nothing more.
    switchStoryTo('Deutsch (Deutschland)');
    socketMock.fire('reveal:pictureReady', { picture: PICTURE, imagePrompt: 'p', ending: ENDING });
    expect(ringRevealBell).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a slice story', { kind: 'slice', pack: 'chr26' }],
    ['a paid story, whose clip rings', { kind: 'paid', pack: 'chr26' }],
    ['a base story', { kind: 'base' }],
  ] as const)('stays quiet for %s', (_name, content) => {
    ringRevealBell.mockClear();
    renderReveal(revealOf(content));
    expect(ringRevealBell).not.toHaveBeenCalled();
  });

  it("counts a golden story's cartoon once it has come, and no other story's", () => {
    const { unmount } = renderReveal(revealOf(SLICE));
    socketMock.fire('reveal:pictureReady', { picture: PICTURE, imagePrompt: 'p' });
    expect(trackGoldenCartoon).not.toHaveBeenCalled();
    unmount();

    renderReveal(revealOf(GOLDEN));
    expect(trackGoldenCartoon).not.toHaveBeenCalled();
    socketMock.fire('reveal:pictureReady', { picture: PICTURE, imagePrompt: 'p', ending: ENDING });
    expect(trackGoldenCartoon).toHaveBeenCalled();
  });
});
