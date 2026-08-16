// SPDX-License-Identifier: AGPL-3.0-only
//
// Design §8.3's whole point is that the picture is fetched and decoded off
// the DOM's `<img>` tainting path (see downloadStory.ts's header) instead of
// SRC's `<img src>` + `img.decode()`. The picture-loading assertions below
// are what actually locks that adaptation in — everything else here is
// standard "does it produce the right File" coverage.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installCanvasStub, type Canvas2DStub } from './testutils/canvasStub';

const toCanvas = vi.fn().mockResolvedValue(undefined);
vi.mock('qrcode', () => ({ default: { toCanvas } }));

const downloadFile = vi.fn();
vi.mock('./share', () => ({ downloadFile }));

const { buildStoryImageFile, downloadStoryImage } = await import('./downloadStory');

describe('buildStoryImageFile', () => {
  let ctx: Canvas2DStub;
  let fetchMock: ReturnType<typeof vi.fn>;
  let createImageBitmap: ReturnType<typeof vi.fn>;
  const fakeBitmap = { close: () => {} } as unknown as ImageBitmap;

  beforeEach(() => {
    ctx = installCanvasStub();
    fetchMock = vi.fn();
    createImageBitmap = vi.fn().mockResolvedValue(fakeBitmap);
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('createImageBitmap', createImageBitmap);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('skips the fetch entirely when there is no picture', async () => {
    const file = await buildStoryImageFile({
      nickname: 'Mika',
      prose: 'a pirate did stuff.',
      pictureUrl: null,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(createImageBitmap).not.toHaveBeenCalled();
    expect(file.type).toBe('image/png');
    expect(file.name).toBe('funny-stories-Mika.png');
    // Only the QR gets drawn — no picture to composite.
    expect(ctx.calls.filter((c) => c.method === 'drawImage')).toHaveLength(1);
  });

  it('fetches the picture URL and decodes it via createImageBitmap, never via <img>', async () => {
    const blob = new Blob(['picture-bytes'], { type: 'image/png' });
    fetchMock.mockResolvedValue({ blob: () => Promise.resolve(blob) });

    const file = await buildStoryImageFile({
      nickname: 'Mika',
      prose: 'a pirate did stuff.',
      pictureUrl: 'https://img.example/i/abc.png',
    });

    expect(fetchMock).toHaveBeenCalledWith('https://img.example/i/abc.png');
    expect(createImageBitmap).toHaveBeenCalledWith(blob);
    // Picture + QR, both composited via drawImage — the bitmap path never
    // touches an <img> element (none exist to assert against, which is the
    // point: nothing here could taint the canvas).
    const drawImageCalls = ctx.calls.filter((c) => c.method === 'drawImage');
    expect(drawImageCalls).toHaveLength(2);
    expect(drawImageCalls[0]?.args[0]).toBe(fakeBitmap);
    expect(file.type).toBe('image/png');
  });

  it('sanitizes the nickname into a safe filename, falling back to "story"', async () => {
    const file = await buildStoryImageFile({
      nickname: '  ***  ',
      prose: 'x',
      pictureUrl: null,
    });
    expect(file.name).toBe('funny-stories-story.png');
  });

  it('propagates a fetch failure rather than silently producing a picture-less card', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    await expect(
      buildStoryImageFile({
        nickname: 'Mika',
        prose: 'x',
        pictureUrl: 'https://img.example/i/abc.png',
      }),
    ).rejects.toThrow('network down');
  });
});

describe('downloadStoryImage', () => {
  beforeEach(() => {
    installCanvasStub();
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('createImageBitmap', vi.fn());
    downloadFile.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hands the built file to downloadFile', async () => {
    await downloadStoryImage({ nickname: 'Mika', prose: 'x', pictureUrl: null });
    expect(downloadFile).toHaveBeenCalledTimes(1);
    expect(downloadFile.mock.calls[0]?.[0]).toBeInstanceOf(File);
  });
});
