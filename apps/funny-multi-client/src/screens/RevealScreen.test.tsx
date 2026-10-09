// SPDX-License-Identifier: AGPL-3.0-only
//
// T-4.4. RevealScreen has no manual "generate" affordance (spec §8, §11) — it
// requests a picture the moment it mounts and reacts to whatever the server
// sends back. These tests drive that reaction through the socket double
// rather than asserting the request itself was made in some particular way,
// since the request is the one line SRC's own tests never bothered pinning.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { POOLS, SLOT_COUNT } from '@funny/shared';
import { createSocketMock } from '../testutils/socketMock';
import i18n from '../i18n';
import { renderStory } from '../storyLanguage';
import type { AuthoredLanguage, RevealStartPayload, SlotIndex } from '@funny/shared';

const socketMock = createSocketMock();
vi.mock('../socket', () => ({ socket: socketMock }));

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
