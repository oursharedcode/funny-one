// SPDX-License-Identifier: AGPL-3.0-only
//
// T-5.2. RoomGallery's download/share/video buttons are thin wiring over
// downloadStory.ts/recordWobble.ts/share.ts, each already covered at the
// unit level (including the CORS-safe fetch→createImageBitmap picture path).
// This suite mocks those three modules at the boundary and asserts the
// wiring: which buttons render under which capability/picture combination,
// and that each click calls through with the right args — the same
// boundary-mock pattern the screen suites use for the socket module.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { POOLS, SLOT_COUNT } from '@funny/shared';
import i18n from '../i18n';
import { renderStory } from '../storyLanguage';
import type { AuthoredLanguage, GalleryEntry, SlotIndex } from '@funny/shared';

const buildStoryImageFile = vi.fn();
const downloadStoryImage = vi.fn();
vi.mock('../downloadStory', () => ({ buildStoryImageFile, downloadStoryImage }));

const buildWobbleVideoFile = vi.fn();
const isVideoRecordingSupported = vi.fn(() => false);
vi.mock('../recordWobble', () => ({ buildWobbleVideoFile, isVideoRecordingSupported }));

const canShareFiles = vi.fn(() => false);
const downloadFile = vi.fn();
const shareFiles = vi.fn();
vi.mock('../share', () => ({ canShareFiles, downloadFile, shareFiles }));

const { default: RoomGallery } = await import('./RoomGallery');

// Real option ids, one per slot, so a story can be retold in any language
// (B-15); the answers and prose beside them are the room-language texts the
// server sent, shortened for readability.
const IDS = Array.from({ length: SLOT_COUNT }, (_, i) => POOLS[i as SlotIndex][0]!.id);
const OTHER_IDS = Array.from({ length: SLOT_COUNT }, (_, i) => POOLS[i as SlotIndex][1]!.id);

const WITH_PICTURE: GalleryEntry = {
  nickname: 'Mika',
  isBot: false,
  answers: ['a pirate'],
  prose: 'a pirate did stuff.',
  optionIds: IDS,
  picture: { url: 'https://img.example/i/abc.png', width: 1024, height: 1024 },
};

const NO_PICTURE: GalleryEntry = {
  nickname: 'Bot 1',
  isBot: true,
  answers: ['a robot'],
  prose: 'a robot did stuff.',
  optionIds: OTHER_IDS,
  picture: null,
};

function renderGallery(entries: GalleryEntry[], defaultLanguage: AuthoredLanguage = 'en') {
  return render(
    <RoomGallery entries={entries} roomLanguage="en" defaultLanguage={defaultLanguage} />,
  );
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
  await i18n.changeLanguage('en');
  buildStoryImageFile.mockReset().mockResolvedValue(new File(['x'], 'x.png'));
  downloadStoryImage.mockReset().mockResolvedValue(undefined);
  buildWobbleVideoFile.mockReset().mockResolvedValue(new File(['x'], 'x.webm'));
  isVideoRecordingSupported.mockReset().mockReturnValue(false);
  canShareFiles.mockReset().mockReturnValue(false);
  downloadFile.mockReset();
  shareFiles.mockReset().mockResolvedValue('shared');
});

describe('empty gallery', () => {
  it('renders nothing for zero entries', () => {
    const { container } = renderGallery([]);
    expect(container.innerHTML).toBe('');
  });
});

describe('logo stamp', () => {
  it('overlays the deployer logo on a picture entry', () => {
    renderGallery([WITH_PICTURE]);
    expect(logoStamp()).toBeDefined();
  });

  it('is absent when the entry has no picture', () => {
    renderGallery([NO_PICTURE]);
    expect(logoStamp()).toBeUndefined();
  });
});

describe('download button', () => {
  it('offers the picture download label when a picture exists', () => {
    renderGallery([WITH_PICTURE]);
    expect(screen.getByRole('button', { name: 'Download story and still picture' })).toBeTruthy();
  });

  it('falls back to a story-only label when there is no picture', () => {
    renderGallery([NO_PICTURE]);
    expect(screen.getByRole('button', { name: 'Download story' })).toBeTruthy();
  });

  it('calls downloadStoryImage with the resolved picture URL', async () => {
    renderGallery([WITH_PICTURE]);
    fireEvent.click(screen.getByRole('button', { name: 'Download story and still picture' }));
    await waitFor(() => expect(downloadStoryImage).toHaveBeenCalledTimes(1));
    expect(downloadStoryImage).toHaveBeenCalledWith({
      nickname: 'Mika',
      prose: 'a pirate did stuff.',
      pictureUrl: 'https://img.example/i/abc.png',
    });
  });

  it('passes a null pictureUrl when the entry has no picture', async () => {
    renderGallery([NO_PICTURE]);
    fireEvent.click(screen.getByRole('button', { name: 'Download story' }));
    await waitFor(() => expect(downloadStoryImage).toHaveBeenCalledTimes(1));
    expect(downloadStoryImage.mock.calls[0]?.[0]).toMatchObject({ pictureUrl: null });
  });
});

describe('share button', () => {
  it('is absent when the platform cannot share files', () => {
    canShareFiles.mockReturnValue(false);
    renderGallery([WITH_PICTURE]);
    expect(screen.queryByRole('button', { name: 'Share' })).toBeNull();
  });

  it('builds and shares the still image when clicked', async () => {
    canShareFiles.mockReturnValue(true);
    const file = new File(['x'], 'x.png');
    buildStoryImageFile.mockResolvedValue(file);
    renderGallery([WITH_PICTURE]);

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    await waitFor(() => expect(shareFiles).toHaveBeenCalledTimes(1));
    expect(buildStoryImageFile).toHaveBeenCalledWith({
      nickname: 'Mika',
      prose: 'a pirate did stuff.',
      pictureUrl: 'https://img.example/i/abc.png',
    });
    expect(shareFiles).toHaveBeenCalledWith([file], {
      title: 'Funny Multi',
      text: "Mika's story",
    });
    expect(downloadFile).not.toHaveBeenCalled();
  });

  it('falls back to a download when the platform declines the share', async () => {
    canShareFiles.mockReturnValue(true);
    shareFiles.mockResolvedValue('unsupported');
    const file = new File(['x'], 'x.png');
    buildStoryImageFile.mockResolvedValue(file);
    renderGallery([WITH_PICTURE]);

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    await waitFor(() => expect(downloadFile).toHaveBeenCalledWith(file));
  });
});

describe('video button', () => {
  it('is absent without a picture even when video recording is supported', () => {
    isVideoRecordingSupported.mockReturnValue(true);
    renderGallery([NO_PICTURE]);
    expect(screen.queryByRole('button', { name: 'Download 5s video' })).toBeNull();
  });

  it('is absent when video recording is unsupported even with a picture', () => {
    isVideoRecordingSupported.mockReturnValue(false);
    renderGallery([WITH_PICTURE]);
    expect(screen.queryByRole('button', { name: 'Download 5s video' })).toBeNull();
  });

  it('records and downloads the clip when both are available', async () => {
    isVideoRecordingSupported.mockReturnValue(true);
    const file = new File(['x'], 'x.webm');
    buildWobbleVideoFile.mockResolvedValue(file);
    renderGallery([WITH_PICTURE]);

    fireEvent.click(screen.getByRole('button', { name: 'Download 5s video' }));

    await waitFor(() => expect(downloadFile).toHaveBeenCalledWith(file));
    expect(buildWobbleVideoFile).toHaveBeenCalledWith({
      nickname: 'Mika',
      prose: 'a pirate did stuff.',
      pictureUrl: 'https://img.example/i/abc.png',
    });
  });

  it('shows a recording state and disables the button while in flight', async () => {
    isVideoRecordingSupported.mockReturnValue(true);
    let resolveRecording!: (file: File) => void;
    buildWobbleVideoFile.mockReturnValue(
      new Promise<File>((resolve) => {
        resolveRecording = resolve;
      }),
    );
    renderGallery([WITH_PICTURE]);

    fireEvent.click(screen.getByRole('button', { name: 'Download 5s video' }));

    const recordingButton = await screen.findByRole<HTMLButtonElement>('button', {
      name: 'Recording…',
    });
    expect(recordingButton.disabled).toBe(true);

    resolveRecording(new File(['x'], 'x.webm'));
    await waitFor(() =>
      expect(
        screen.getByRole<HTMLButtonElement>('button', { name: 'Download 5s video' }).disabled,
      ).toBe(false),
    );
  });
});

describe('prev/next navigation', () => {
  it('cycles through entries and updates the counter', () => {
    renderGallery([WITH_PICTURE, NO_PICTURE]);
    expect(screen.getByText('1 / 2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next story' }));
    expect(screen.getByText('2 / 2')).toBeTruthy();
  });
});

describe('story language (B-15)', () => {
  it("shows the server's own texts while a story is in the room language", () => {
    const { container } = renderGallery([WITH_PICTURE]);
    expect(storyBlock(container).getAttribute('lang')).toBe('en');
    expect(storyBlock(container).textContent).toBe(WITH_PICTURE.prose);
  });

  it("opens every story in the player's own language", () => {
    const { container } = renderGallery([WITH_PICTURE, NO_PICTURE], 'ru');
    expect(storyBlock(container).getAttribute('lang')).toBe('ru');
    expect(storyBlock(container).textContent).toBe(renderStory('ru', IDS).prose);

    fireEvent.click(screen.getByRole('button', { name: 'Next story' }));
    expect(storyBlock(container).textContent).toBe(renderStory('ru', OTHER_IDS).prose);
  });

  it('switches one story only, and remembers it while the player browses', () => {
    const { container } = renderGallery([WITH_PICTURE, NO_PICTURE]);

    switchStoryTo('Deutsch (Deutschland)');
    expect(storyBlock(container).textContent).toBe(renderStory('de', IDS).prose);

    fireEvent.click(screen.getByRole('button', { name: 'Next story' }));
    expect(storyBlock(container).getAttribute('lang')).toBe('en');
    expect(storyBlock(container).textContent).toBe(NO_PICTURE.prose);

    fireEvent.click(screen.getByRole('button', { name: 'Previous story' }));
    expect(storyBlock(container).getAttribute('lang')).toBe('de');
    expect(storyBlock(container).textContent).toBe(renderStory('de', IDS).prose);
  });

  it('downloads, shares and records the story in the language on screen', async () => {
    canShareFiles.mockReturnValue(true);
    isVideoRecordingSupported.mockReturnValue(true);
    renderGallery([WITH_PICTURE]);
    switchStoryTo('Italiano (Italia)');
    const prose = renderStory('it', IDS).prose;

    fireEvent.click(screen.getByRole('button', { name: 'Download story and still picture' }));
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download 5s video' }));

    await waitFor(() => expect(buildWobbleVideoFile).toHaveBeenCalledTimes(1));
    expect(downloadStoryImage.mock.calls[0]?.[0]).toMatchObject({ prose });
    expect(buildStoryImageFile.mock.calls[0]?.[0]).toMatchObject({ prose });
    expect(buildWobbleVideoFile.mock.calls[0]?.[0]).toMatchObject({ prose });
  });
});
