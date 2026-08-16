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
import i18n from '../i18n';
import type { GalleryEntry } from '@funny/shared';

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

const WITH_PICTURE: GalleryEntry = {
  nickname: 'Mika',
  isBot: false,
  answers: ['a pirate'],
  prose: 'a pirate did stuff.',
  picture: { url: 'https://img.example/i/abc.png', width: 1024, height: 1024 },
};

const NO_PICTURE: GalleryEntry = {
  nickname: 'Bot 1',
  isBot: true,
  answers: ['a robot'],
  prose: 'a robot did stuff.',
  picture: null,
};

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
    const { container } = render(<RoomGallery entries={[]} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('download button', () => {
  it('offers the picture download label when a picture exists', () => {
    render(<RoomGallery entries={[WITH_PICTURE]} />);
    expect(screen.getByRole('button', { name: 'Download story and still picture' })).toBeTruthy();
  });

  it('falls back to a story-only label when there is no picture', () => {
    render(<RoomGallery entries={[NO_PICTURE]} />);
    expect(screen.getByRole('button', { name: 'Download story' })).toBeTruthy();
  });

  it('calls downloadStoryImage with the resolved picture URL', async () => {
    render(<RoomGallery entries={[WITH_PICTURE]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Download story and still picture' }));
    await waitFor(() => expect(downloadStoryImage).toHaveBeenCalledTimes(1));
    expect(downloadStoryImage).toHaveBeenCalledWith({
      nickname: 'Mika',
      prose: 'a pirate did stuff.',
      pictureUrl: 'https://img.example/i/abc.png',
    });
  });

  it('passes a null pictureUrl when the entry has no picture', async () => {
    render(<RoomGallery entries={[NO_PICTURE]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Download story' }));
    await waitFor(() => expect(downloadStoryImage).toHaveBeenCalledTimes(1));
    expect(downloadStoryImage.mock.calls[0]?.[0]).toMatchObject({ pictureUrl: null });
  });
});

describe('share button', () => {
  it('is absent when the platform cannot share files', () => {
    canShareFiles.mockReturnValue(false);
    render(<RoomGallery entries={[WITH_PICTURE]} />);
    expect(screen.queryByRole('button', { name: 'Share' })).toBeNull();
  });

  it('builds and shares the still image when clicked', async () => {
    canShareFiles.mockReturnValue(true);
    const file = new File(['x'], 'x.png');
    buildStoryImageFile.mockResolvedValue(file);
    render(<RoomGallery entries={[WITH_PICTURE]} />);

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
    render(<RoomGallery entries={[WITH_PICTURE]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    await waitFor(() => expect(downloadFile).toHaveBeenCalledWith(file));
  });
});

describe('video button', () => {
  it('is absent without a picture even when video recording is supported', () => {
    isVideoRecordingSupported.mockReturnValue(true);
    render(<RoomGallery entries={[NO_PICTURE]} />);
    expect(screen.queryByRole('button', { name: 'Download 5s video' })).toBeNull();
  });

  it('is absent when video recording is unsupported even with a picture', () => {
    isVideoRecordingSupported.mockReturnValue(false);
    render(<RoomGallery entries={[WITH_PICTURE]} />);
    expect(screen.queryByRole('button', { name: 'Download 5s video' })).toBeNull();
  });

  it('records and downloads the clip when both are available', async () => {
    isVideoRecordingSupported.mockReturnValue(true);
    const file = new File(['x'], 'x.webm');
    buildWobbleVideoFile.mockResolvedValue(file);
    render(<RoomGallery entries={[WITH_PICTURE]} />);

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
    render(<RoomGallery entries={[WITH_PICTURE]} />);

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
    render(<RoomGallery entries={[WITH_PICTURE, NO_PICTURE]} />);
    expect(screen.getByText('1 / 2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next story' }));
    expect(screen.getByText('2 / 2')).toBeTruthy();
  });
});
