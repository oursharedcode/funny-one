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
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { POOLS, SLOT_COUNT, optionsFor } from '@funny/shared';
import i18n from '../i18n';
import { endingText, renderStory } from '../storyLanguage';
import type { AuthoredLanguage, GalleryEntry, SlotIndex, StoryContent } from '@funny/shared';

const buildStoryImageFile = vi.fn();
const downloadStoryImage = vi.fn();
vi.mock('../downloadStory', () => ({ buildStoryImageFile, downloadStoryImage }));

const buildWobbleVideoFile = vi.fn();
const isVideoRecordingSupported = vi.fn(() => false);
const buildGameVideoFile = vi.fn();
class RecordingStopped extends Error {}
vi.mock('../recordWobble', () => ({
  buildGameVideoFile,
  buildWobbleVideoFile,
  isVideoRecordingSupported,
  RecordingStopped,
}));

const canShareFiles = vi.fn(() => false);
const downloadFile = vi.fn();
const shareFiles = vi.fn();
vi.mock('../share', () => ({ canShareFiles, downloadFile, shareFiles }));

const trackGoldenCartoon = vi.fn();
const trackGameVideo = vi.fn();
vi.mock('../funnel', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../funnel')>()),
  trackGameVideo,
  trackGoldenCartoon,
}));

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
  content: { kind: 'base' },
  ending: null,
};

const NO_PICTURE: GalleryEntry = {
  nickname: 'Bot 1',
  isBot: true,
  answers: ['a robot'],
  prose: 'a robot did stuff.',
  optionIds: OTHER_IDS,
  picture: null,
  content: { kind: 'base' },
  ending: null,
};

function renderGallery(
  entries: GalleryEntry[],
  defaultLanguage: AuthoredLanguage = 'en',
  onExported?: (kind: 'download' | 'share') => void,
) {
  return render(
    <RoomGallery
      entries={entries}
      roomLanguage="en"
      defaultLanguage={defaultLanguage}
      onExported={onExported}
    />,
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
  buildGameVideoFile.mockReset().mockResolvedValue(new File(['x'], 'all.webm'));
  trackGameVideo.mockReset();
  isVideoRecordingSupported.mockReset().mockReturnValue(false);
  canShareFiles.mockReset().mockReturnValue(false);
  downloadFile.mockReset();
  shareFiles.mockReset().mockResolvedValue('shared');
  trackGoldenCartoon.mockReset();
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
      language: 'en',
      golden: false,
      paid: false,
      endingUrl: null,
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
      language: 'en',
      golden: false,
      paid: false,
      endingUrl: null,
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
    expect(screen.queryByRole('button', { name: 'Make a 5s video' })).toBeNull();
  });

  it('is absent when video recording is unsupported even with a picture', () => {
    isVideoRecordingSupported.mockReturnValue(false);
    renderGallery([WITH_PICTURE]);
    expect(screen.queryByRole('button', { name: 'Make a 5s video' })).toBeNull();
  });

  it('records the clip, and saves it only when asked to (D3 B)', async () => {
    isVideoRecordingSupported.mockReturnValue(true);
    const file = new File(['x'], 'x.webm');
    buildWobbleVideoFile.mockResolvedValue(file);
    renderGallery([WITH_PICTURE]);

    fireEvent.click(screen.getByRole('button', { name: 'Make a 5s video' }));

    const save = await screen.findByRole('button', { name: 'Save video' });
    expect(downloadFile).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Share video' })).toBeNull();
    fireEvent.click(save);
    expect(downloadFile).toHaveBeenCalledWith(file);
    expect(buildWobbleVideoFile).toHaveBeenCalledWith({
      nickname: 'Mika',
      prose: 'a pirate did stuff.',
      pictureUrl: 'https://img.example/i/abc.png',
      language: 'en',
      golden: false,
      paid: false,
      ending: null,
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

    fireEvent.click(screen.getByRole('button', { name: 'Make a 5s video' }));

    const recordingButton = await screen.findByRole<HTMLButtonElement>('button', {
      name: 'Recording…',
    });
    expect(recordingButton.disabled).toBe(true);

    resolveRecording(new File(['x'], 'x.webm'));
    expect(await screen.findByRole('button', { name: 'Save video' })).toBeTruthy();
  });

  it("shares the made clip from a tap of its own, saving it where sharing can't", async () => {
    isVideoRecordingSupported.mockReturnValue(true);
    canShareFiles.mockReturnValue(true);
    const file = new File(['x'], 'x.webm');
    buildWobbleVideoFile.mockResolvedValue(file);
    renderGallery([WITH_PICTURE]);
    fireEvent.click(screen.getByRole('button', { name: 'Make a 5s video' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Share video' }));
    await waitFor(() =>
      expect(shareFiles).toHaveBeenCalledWith([file], {
        title: 'Funny Multi',
        text: "Mika's story",
      }),
    );
    expect(downloadFile).not.toHaveBeenCalled();

    shareFiles.mockResolvedValue('unsupported');
    fireEvent.click(screen.getByRole('button', { name: 'Share video' }));
    await waitFor(() => expect(downloadFile).toHaveBeenCalledWith(file));
  });

  it("keeps each story's made clip, and remakes it in another language", async () => {
    isVideoRecordingSupported.mockReturnValue(true);
    renderGallery([WITH_PICTURE, NO_PICTURE]);
    fireEvent.click(screen.getByRole('button', { name: 'Make a 5s video' }));
    await screen.findByRole('button', { name: 'Save video' });

    fireEvent.click(screen.getByRole('button', { name: 'Next story' }));
    expect(screen.queryByRole('button', { name: 'Save video' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Previous story' }));
    expect(screen.getByRole('button', { name: 'Save video' })).toBeTruthy();

    switchStoryTo('Italiano (Italia)');
    expect(screen.queryByRole('button', { name: 'Save video' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Make a 5s video' })).toBeTruthy();
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
    fireEvent.click(screen.getByRole('button', { name: 'Make a 5s video' }));

    await waitFor(() => expect(buildWobbleVideoFile).toHaveBeenCalledTimes(1));
    expect(downloadStoryImage.mock.calls[0]?.[0]).toMatchObject({ prose, language: 'it' });
    expect(buildStoryImageFile.mock.calls[0]?.[0]).toMatchObject({ prose, language: 'it' });
    expect(buildWobbleVideoFile.mock.calls[0]?.[0]).toMatchObject({ prose, language: 'it' });
  });
});

// Step 117 (B-29): a Christmas story's ending under its scene — the aftermath
// picture for a golden story, a card for a slice one — and what its exports get.
describe('Christmas stories (Step 117)', () => {
  const GOLDEN: StoryContent = { kind: 'full', pack: 'chr26' };
  const SLICE: StoryContent = { kind: 'slice', pack: 'chr26' };
  const idsFor = (content: StoryContent) =>
    Array.from({ length: SLOT_COUNT }, (_, i) => optionsFor(i as SlotIndex, content)[0]!.id);
  const GOLDEN_IDS = idsFor(GOLDEN);
  const SLICE_IDS = idsFor(SLICE);
  const ENDING = { url: 'https://img.example/i/end.png', width: 1024, height: 1024 };
  const SCENE = { url: 'https://img.example/i/scene.png', width: 1024, height: 1024 };

  const GOLDEN_ENTRY: GalleryEntry = {
    nickname: 'Mika',
    isBot: false,
    ...renderStory('en', GOLDEN_IDS),
    optionIds: GOLDEN_IDS,
    picture: SCENE,
    content: GOLDEN,
    ending: ENDING,
  };
  const SLICE_ENTRY: GalleryEntry = {
    nickname: 'Rin',
    isBot: false,
    ...renderStory('en', SLICE_IDS),
    optionIds: SLICE_IDS,
    picture: SCENE,
    content: SLICE,
    ending: null,
  };

  it("shows a golden story's badge and its ending picture under the scene", () => {
    renderGallery([GOLDEN_ENTRY]);
    expect(screen.getByText('🔔 A Christmas story')).toBeTruthy();
    const ending = screen.getByAltText<HTMLImageElement>("Cartoon of how Mika's story ended");
    expect(ending.src).toBe(ENDING.url);
    expect(screen.queryByTestId('ending-card')).toBeNull();
  });

  it("shows a golden story's ending as a card when its picture could not be had", () => {
    renderGallery([{ ...GOLDEN_ENTRY, ending: null }]);
    const card = screen.getByTestId('ending-card');
    expect(card.textContent).toContain(endingText(renderStory('en', GOLDEN_IDS), 'en'));
  });

  it("shows a slice story's ending as a card, with no badge", () => {
    renderGallery([SLICE_ENTRY]);
    expect(screen.queryByText('🔔 A Christmas story')).toBeNull();
    const card = screen.getByTestId('ending-card');
    expect(card.textContent).toContain(endingText(renderStory('en', SLICE_IDS), 'en'));
    expect(screen.queryByAltText("Cartoon of how Rin's story ended")).toBeNull();
  });

  it('shows no ending at all for a base story', () => {
    renderGallery([WITH_PICTURE]);
    expect(screen.queryByTestId('ending-card')).toBeNull();
    expect(screen.queryByAltText("Cartoon of how Mika's story ended")).toBeNull();
    expect(screen.queryByText('🔔 A Christmas story')).toBeNull();
  });

  it('retells the ending card in the language the story is switched to', () => {
    renderGallery([SLICE_ENTRY]);
    switchStoryTo('Deutsch (Deutschland)');
    const card = screen.getByTestId('ending-card');
    expect(card.getAttribute('lang')).toBe('de');
    expect(card.textContent).toContain(endingText(renderStory('de', SLICE_IDS), 'de'));
  });

  it("hands a golden story's ending to its still and its video", async () => {
    canShareFiles.mockReturnValue(true);
    isVideoRecordingSupported.mockReturnValue(true);
    renderGallery([GOLDEN_ENTRY]);

    fireEvent.click(screen.getByRole('button', { name: 'Download story and still picture' }));
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    fireEvent.click(screen.getByRole('button', { name: 'Make a 5s video' }));

    await waitFor(() => expect(buildWobbleVideoFile).toHaveBeenCalledTimes(1));
    const still = { golden: true, endingUrl: ENDING.url, pictureUrl: SCENE.url };
    expect(downloadStoryImage.mock.calls[0]?.[0]).toMatchObject(still);
    expect(buildStoryImageFile.mock.calls[0]?.[0]).toMatchObject(still);
    expect(buildWobbleVideoFile.mock.calls[0]?.[0]).toMatchObject({
      golden: true,
      ending: {
        pictureUrl: ENDING.url,
        text: endingText(renderStory('en', GOLDEN_IDS), 'en'),
      },
    });
  });

  it("ends a slice story's video on its card, with no edition footer", async () => {
    isVideoRecordingSupported.mockReturnValue(true);
    renderGallery([SLICE_ENTRY]);
    fireEvent.click(screen.getByRole('button', { name: 'Make a 5s video' }));
    await waitFor(() => expect(buildWobbleVideoFile).toHaveBeenCalledTimes(1));
    expect(buildWobbleVideoFile.mock.calls[0]?.[0]).toMatchObject({
      golden: false,
      ending: { pictureUrl: null, text: endingText(renderStory('en', SLICE_IDS), 'en') },
    });
  });

  it("counts a golden story's cartoon, and no other", () => {
    const { unmount } = renderGallery([WITH_PICTURE, SLICE_ENTRY]);
    fireEvent.click(screen.getByRole('button', { name: 'Next story' }));
    expect(trackGoldenCartoon).not.toHaveBeenCalled();
    unmount();

    renderGallery([{ ...GOLDEN_ENTRY, picture: null }]);
    expect(trackGoldenCartoon).not.toHaveBeenCalled();
  });

  it('counts a golden cartoon once it is on screen', () => {
    renderGallery([WITH_PICTURE, GOLDEN_ENTRY]);
    expect(trackGoldenCartoon).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Next story' }));
    expect(trackGoldenCartoon).toHaveBeenCalled();
  });

  // Step 122 (B-29): every story of a paid game is the whole pack's.
  describe('a paid story (Step 122)', () => {
    const PAID: StoryContent = { kind: 'paid', pack: 'chr26' };
    const PAID_IDS = idsFor(PAID);
    const PAID_ENTRY: GalleryEntry = {
      nickname: 'Mika',
      isBot: false,
      ...renderStory('en', PAID_IDS),
      optionIds: PAID_IDS,
      picture: SCENE,
      content: PAID,
      ending: ENDING,
    };

    it('shows its ending picture, but no golden badge and no golden count', () => {
      renderGallery([PAID_ENTRY]);
      expect(screen.queryByText('🔔 A Christmas story')).toBeNull();
      const ending = screen.getByAltText<HTMLImageElement>("Cartoon of how Mika's story ended");
      expect(ending.src).toBe(ENDING.url);
      expect(trackGoldenCartoon).not.toHaveBeenCalled();
    });

    it('hands its ending and the paid footer to its still and its video', async () => {
      canShareFiles.mockReturnValue(true);
      isVideoRecordingSupported.mockReturnValue(true);
      renderGallery([PAID_ENTRY]);

      fireEvent.click(screen.getByRole('button', { name: 'Download story and still picture' }));
      fireEvent.click(screen.getByRole('button', { name: 'Share' }));
      fireEvent.click(screen.getByRole('button', { name: 'Make a 5s video' }));

      await waitFor(() => expect(buildWobbleVideoFile).toHaveBeenCalledTimes(1));
      const still = { golden: false, paid: true, endingUrl: ENDING.url, pictureUrl: SCENE.url };
      expect(downloadStoryImage.mock.calls[0]?.[0]).toMatchObject(still);
      expect(buildStoryImageFile.mock.calls[0]?.[0]).toMatchObject(still);
      expect(buildWobbleVideoFile.mock.calls[0]?.[0]).toMatchObject({
        golden: false,
        paid: true,
        ending: { pictureUrl: ENDING.url, text: endingText(renderStory('en', PAID_IDS), 'en') },
      });
    });

    it('reports each download, share and video once it is done', async () => {
      canShareFiles.mockReturnValue(true);
      isVideoRecordingSupported.mockReturnValue(true);
      const onExported = vi.fn();
      renderGallery([PAID_ENTRY], 'en', onExported);

      fireEvent.click(screen.getByRole('button', { name: 'Download story and still picture' }));
      await waitFor(() => expect(onExported).toHaveBeenCalledTimes(1));
      expect(onExported).toHaveBeenLastCalledWith('download');

      fireEvent.click(screen.getByRole('button', { name: 'Share' }));
      await waitFor(() => expect(onExported).toHaveBeenCalledTimes(2));
      expect(onExported).toHaveBeenLastCalledWith('share');

      // The clip counts when it is saved or shared, not when it is made (D3 B).
      fireEvent.click(screen.getByRole('button', { name: 'Make a 5s video' }));
      const save = await screen.findByRole('button', { name: 'Save video' });
      expect(onExported).toHaveBeenCalledTimes(2);
      fireEvent.click(save);
      expect(onExported).toHaveBeenCalledTimes(3);
      expect(onExported).toHaveBeenLastCalledWith('download');
      fireEvent.click(screen.getByRole('button', { name: 'Share video' }));
      await waitFor(() => expect(onExported).toHaveBeenCalledTimes(4));
      expect(onExported).toHaveBeenLastCalledWith('share');
    });

    it('reports a declined share as the download it became, a dismissed one not at all', async () => {
      canShareFiles.mockReturnValue(true);
      const onExported = vi.fn();
      renderGallery([PAID_ENTRY], 'en', onExported);

      shareFiles.mockResolvedValue('unsupported');
      fireEvent.click(screen.getByRole('button', { name: 'Share' }));
      await waitFor(() => expect(onExported).toHaveBeenCalledWith('download'));

      shareFiles.mockResolvedValue('cancelled');
      fireEvent.click(screen.getByRole('button', { name: 'Share' }));
      await waitFor(() => expect(shareFiles).toHaveBeenCalledTimes(2));
      expect(onExported).toHaveBeenCalledTimes(1);
    });

    it('never reports a free story', async () => {
      canShareFiles.mockReturnValue(true);
      isVideoRecordingSupported.mockReturnValue(true);
      const onExported = vi.fn();
      renderGallery([GOLDEN_ENTRY, WITH_PICTURE], 'en', onExported);

      for (let i = 0; i < 2; i++) {
        fireEvent.click(screen.getByRole('button', { name: 'Download story and still picture' }));
        fireEvent.click(screen.getByRole('button', { name: 'Share' }));
        fireEvent.click(screen.getByRole('button', { name: 'Make a 5s video' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Save video' }));
        await waitFor(() => expect(downloadFile).toHaveBeenCalledTimes(i + 1));
        fireEvent.click(screen.getByRole('button', { name: 'Next story' }));
      }
      expect(downloadStoryImage).toHaveBeenCalledTimes(2);
      expect(shareFiles).toHaveBeenCalledTimes(2);
      expect(onExported).not.toHaveBeenCalled();
    });
  });
});

// Step 135 (B-29 #7): every story's clip, one after another, in one video.
describe('the whole-game video (Step 135)', () => {
  const OTHER: GalleryEntry = {
    ...NO_PICTURE,
    nickname: 'Bot 2',
    seat: 2,
    picture: { url: 'https://img.example/i/def.png', width: 1024, height: 1024 },
  };
  const GAME = [WITH_PICTURE, NO_PICTURE, OTHER];
  const button = () => screen.getByRole('button', { name: 'Video of the whole game' });

  beforeEach(() => isVideoRecordingSupported.mockReturnValue(true));

  it('is offered once two stories have pictures', () => {
    const { unmount } = renderGallery([WITH_PICTURE, NO_PICTURE]);
    expect(screen.queryByRole('button', { name: 'Video of the whole game' })).toBeNull();
    unmount();
    renderGallery(GAME);
    expect(button()).toBeTruthy();
  });

  it('is absent where video cannot be recorded', () => {
    isVideoRecordingSupported.mockReturnValue(false);
    renderGallery(GAME);
    expect(screen.queryByRole('button', { name: 'Video of the whole game' })).toBeNull();
  });

  it("records the stories with pictures in the gallery's order and languages", async () => {
    renderGallery(GAME);
    switchStoryTo('Italiano (Italia)');
    fireEvent.click(button());

    await waitFor(() => expect(buildGameVideoFile).toHaveBeenCalledTimes(1));
    const options = buildGameVideoFile.mock.calls[0]![0];
    expect(options.footer).toEqual({ golden: false, paid: false });
    expect(options.stories).toMatchObject([
      { nickname: 'Mika', language: 'it', pictureUrl: WITH_PICTURE.picture!.url },
      { nickname: 'Bot 2', language: 'en', pictureUrl: OTHER.picture!.url },
    ]);
    expect(trackGameVideo).toHaveBeenCalledWith(false);
  });

  it('says it is preparing, then which story it records, then offers the video', async () => {
    canShareFiles.mockReturnValue(true);
    const file = new File(['x'], 'all.webm');
    let finish!: (file: File) => void;
    let part!: (number: number, total: number) => void;
    buildGameVideoFile.mockImplementation((options: { onPart: typeof part }) => {
      part = options.onPart;
      return new Promise<File>((resolve) => {
        finish = resolve;
      });
    });
    renderGallery(GAME);
    fireEvent.click(button());

    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Preparing the video…' }).disabled,
    ).toBe(true);
    // One recording at a time.
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Make a 5s video' }).disabled,
    ).toBe(true);
    act(() => part(2, 2));
    expect(screen.getByRole('button', { name: 'Recording story 2 of 2…' })).toBeTruthy();

    await act(async () => finish(file));
    expect(downloadFile).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Save video' }));
    expect(downloadFile).toHaveBeenCalledWith(file);
    fireEvent.click(screen.getByRole('button', { name: 'Share video' }));
    await waitFor(() =>
      expect(shareFiles).toHaveBeenCalledWith([file], {
        title: 'Funny Multi',
        text: 'Video of the whole game',
      }),
    );
  });

  it('says so when the recording stopped, and offers to try again', async () => {
    buildGameVideoFile.mockRejectedValueOnce(new RecordingStopped());
    renderGallery(GAME);
    fireEvent.click(button());

    expect((await screen.findByRole('alert')).textContent).toBe(
      'The recording stopped: keep this screen open until it finishes.',
    );
    expect(trackGameVideo).not.toHaveBeenCalled();
    fireEvent.click(button());
    await screen.findByRole('button', { name: 'Save video' });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('gives the recording up when the screen is left', () => {
    buildGameVideoFile.mockReturnValue(new Promise<File>(() => undefined));
    const { unmount } = renderGallery(GAME);
    fireEvent.click(button());
    const { signal } = buildGameVideoFile.mock.calls[0]![0];
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it("takes one footer from the room, and counts a paid game's video as one export", async () => {
    const paid = GAME.map((entry): GalleryEntry => ({
      ...entry,
      content: { kind: 'paid', pack: 'chr26' },
    }));
    const onExported = vi.fn();
    renderGallery(paid, 'en', onExported);
    fireEvent.click(button());

    const save = await screen.findByRole('button', { name: 'Save video' });
    expect(buildGameVideoFile.mock.calls[0]![0].footer).toEqual({ golden: false, paid: true });
    expect(trackGameVideo).toHaveBeenCalledWith(true);
    expect(onExported).not.toHaveBeenCalled();
    fireEvent.click(save);
    expect(onExported.mock.calls).toEqual([['download']]);
  });

  it("puts the edition's footer under a free Christmas game, and reports nothing", async () => {
    const free = GAME.map((entry): GalleryEntry => ({
      ...entry,
      content: { kind: 'slice', pack: 'chr26' },
    }));
    const onExported = vi.fn();
    renderGallery(free, 'en', onExported);
    fireEvent.click(button());

    fireEvent.click(await screen.findByRole('button', { name: 'Save video' }));
    expect(buildGameVideoFile.mock.calls[0]![0].footer).toEqual({ golden: true, paid: false });
    expect(onExported).not.toHaveBeenCalled();
  });
});
