// SPDX-License-Identifier: AGPL-3.0-only
//
// Design §8.3's whole point is that the picture is fetched and decoded off
// the DOM's `<img>` tainting path (see downloadStory.ts's header) instead of
// SRC's `<img src>` + `img.decode()`. The picture-loading assertions below
// are what actually locks that adaptation in — everything else here is
// standard "does it produce the right File" coverage.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installCanvasStub, type Canvas2DStub } from './testutils/canvasStub';
import i18n from './i18n/index';
import { LANDING_URL, LANDING_URL_TEXT } from './landingUrl';

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
      language: 'en',
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(createImageBitmap).not.toHaveBeenCalled();
    expect(file.type).toBe('image/png');
    expect(file.name).toBe('funny-stories-Mika.png');
    // Only the QR gets drawn — no picture to composite.
    expect(ctx.calls.filter((c) => c.method === 'drawImage')).toHaveLength(1);
  });

  // Owner decision 2026-10-29: the code leads to the landing page, which
  // links both games and both repositories — no longer to the repository.
  it('encodes the landing page in the QR code and prints its address under it', async () => {
    toCanvas.mockClear();
    await buildStoryImageFile({
      nickname: 'Mika',
      prose: 'a pirate did stuff.',
      pictureUrl: null,
      language: 'en',
    });
    expect(toCanvas).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      LANDING_URL,
      expect.anything(),
    );
    const drawn = ctx.calls.filter((c) => c.method === 'fillText').map((c) => c.args[0]);
    expect(drawn).toContain('www.funny-family.oursharedcode.com');
    expect(drawn).not.toContain('Source on GitHub');
  });

  it('fetches the picture URL and decodes it via createImageBitmap, never via <img>', async () => {
    const blob = new Blob(['picture-bytes'], { type: 'image/png' });
    fetchMock.mockResolvedValue({ blob: () => Promise.resolve(blob) });

    const file = await buildStoryImageFile({
      nickname: 'Mika',
      prose: 'a pirate did stuff.',
      pictureUrl: 'https://img.example/i/abc.png',
      language: 'en',
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
      language: 'en',
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
        language: 'en',
      }),
    ).rejects.toThrow('network down');
  });

  describe('footer language and direction (B-15 / Hebrew export)', () => {
    afterEach(async () => {
      await i18n.changeLanguage('en');
    });

    it('writes the footer in the language passed, not the active UI locale', async () => {
      await i18n.changeLanguage('he');
      await buildStoryImageFile({
        nickname: 'Mika',
        prose: 'a pirate did stuff.',
        pictureUrl: null,
        language: 'en',
      });
      expect(
        ctx.calls.find((c) => c.method === 'fillText' && c.args[0] === 'Funny Family'),
      ).toBeDefined();
    });

    it('right-anchors the prose, nickname and footer of a right-to-left story', async () => {
      await buildStoryImageFile({
        nickname: 'Mika',
        prose: 'story',
        pictureUrl: null,
        language: 'he',
      });
      const RIGHT_EDGE = 512 - 28; // WIDTH - PAD
      const proseCall = ctx.calls.find((c) => c.method === 'fillText' && c.args[0] === 'story');
      expect(proseCall?.args[1]).toBe(RIGHT_EDGE);
      const nameCall = ctx.calls.find(
        (c) => c.method === 'fillText' && (c.args[0] as string) === '— Mika',
      );
      expect(nameCall?.args[1]).toBe(RIGHT_EDGE);
      const familyLabelCall = ctx.calls.find(
        (c) => c.method === 'fillText' && c.args[0] === 'משפחה מצחיקה',
      );
      expect(familyLabelCall?.args[1]).toBe(RIGHT_EDGE);
      const urlCall = ctx.calls.find(
        (c) => c.method === 'fillText' && c.args[0] === LANDING_URL_TEXT,
      );
      expect(urlCall?.args[1]).toBe(RIGHT_EDGE);
    });

    // Step 81: Georgia has none of Yoruba's ẹ, ọ, ṣ or ǹ — «nǹkan» came out
    // "nn`kan" — so a Yoruba story and its notice take a font that has them.
    it('draws a Yoruba story and its notice in Cambria or the serif, never Georgia', async () => {
      const drawn: [string, string][] = [];
      ctx.fillText = (text: string) => {
        drawn.push([text, String(ctx.font)]);
      };
      await buildStoryImageFile({
        nickname: 'Mika',
        prose: 'nǹkan',
        pictureUrl: null,
        language: 'yo',
      });
      expect(drawn).toContainEqual(['nǹkan', '22px Cambria, serif']);
      expect(drawn.map(([, font]) => font)).toContain('italic 13px Cambria, serif');
      expect(drawn.filter(([, font]) => font.includes('Georgia'))).toEqual([]);

      drawn.length = 0;
      await buildStoryImageFile({
        nickname: 'Mika',
        prose: 'story',
        pictureUrl: null,
        language: 'en',
      });
      expect(drawn).toContainEqual(['story', '22px Georgia, serif']);
    });
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
    await downloadStoryImage({ nickname: 'Mika', prose: 'x', pictureUrl: null, language: 'en' });
    expect(downloadFile).toHaveBeenCalledTimes(1);
    expect(downloadFile.mock.calls[0]?.[0]).toBeInstanceOf(File);
  });
});
