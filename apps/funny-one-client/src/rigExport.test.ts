// SPDX-License-Identifier: AGPL-3.0-only
//
// Funny One's picture has no fetchable URL (see rigExport.ts's header) — the
// picture-loading assertions here lock in that each rig layer is rasterized
// via `HTMLImageElement.decode()` off a serialized-SVG data: URI, rather than
// downloadStory.ts's `fetch`/`createImageBitmap` path. Since D-10 that second
// path exists here too, for a story shown from the picture library — its own
// `describe` below.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Story } from '@funny/shared';
import { installCanvasStub, type Canvas2DStub } from './testutils/canvasStub';
import { gameUrl } from './gameUrl';
import i18n from './i18n/index';

const toCanvas = vi.fn().mockResolvedValue(undefined);
vi.mock('qrcode', () => ({ default: { toCanvas } }));

const downloadFile = vi.fn();
vi.mock('./share', () => ({ downloadFile }));

const { buildStoryImageFile, downloadStoryImage, sizedSvgDataUri } = await import('./rigExport');

function fullStory(): Story {
  return {
    picture: null,
    answers: [
      'who.grumpy-pirate',
      'with.angry-geese',
      'where.messy-kitchen',
      'when.hat-festival',
      'did.juggling-pancakes',
      'why.impress-a-pigeon',
      'end.duck-complaint',
    ],
  };
}

describe('buildStoryImageFile', () => {
  let ctx: Canvas2DStub;
  let decode: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ctx = installCanvasStub();
    // jsdom doesn't implement HTMLImageElement.prototype.decode at all — no
    // property for `vi.spyOn` to wrap, so it's assigned directly (same
    // pattern as funny-multi-client/src/recordWobble.test.ts).
    const d = vi.fn(() => Promise.resolve());
    HTMLImageElement.prototype.decode = d;
    decode = d;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rasterizes every filled slot plus the QR footer', async () => {
    const file = await buildStoryImageFile({
      name: 'Ann',
      prose: 'A grumpy pirate did stuff.',
      story: fullStory(),
    });

    expect(decode).toHaveBeenCalledTimes(7);
    // 7 rig layers + 1 QR, all composited via drawImage.
    expect(ctx.calls.filter((c) => c.method === 'drawImage')).toHaveLength(8);
    expect(file.type).toBe('image/png');
    expect(file.name).toBe('funny-story-Ann.png');
  });

  it('skips a slot with no answer', async () => {
    const story = fullStory();
    story.answers[6] = null;

    await buildStoryImageFile({ name: 'Ann', prose: 'x', story });

    expect(decode).toHaveBeenCalledTimes(6);
    expect(ctx.calls.filter((c) => c.method === 'drawImage')).toHaveLength(7);
  });

  it('rotates the tilted end-stamp layer around its own centre', async () => {
    await buildStoryImageFile({ name: 'Ann', prose: 'x', story: fullStory() });

    const rotateCalls = ctx.calls.filter((c) => c.method === 'rotate');
    expect(rotateCalls).toHaveLength(1);
    expect(rotateCalls[0]?.args[0]).toBeCloseTo((-8 * Math.PI) / 180);
  });

  it('sanitizes the name into a safe filename, falling back to "story"', async () => {
    const file = await buildStoryImageFile({ name: '  ***  ', prose: 'x', story: fullStory() });
    expect(file.name).toBe('funny-story-story.png');
  });

  it('anchors a right-to-left story and its footer at the right edge (Step 73)', async () => {
    await i18n.changeLanguage('fa');
    try {
      await buildStoryImageFile({ name: 'Ann', prose: 'story', story: fullStory() });
    } finally {
      await i18n.changeLanguage('en');
    }
    const x = (text: string) =>
      ctx.calls.find((c) => c.method === 'fillText' && c.args[0] === text)?.args[1];
    const RIGHT_EDGE = 800 - 28; // WIDTH - PAD
    expect(x('story')).toBe(RIGHT_EDGE);
    expect(x('— Ann')).toBe(RIGHT_EDGE);
    expect(x(i18n.getFixedT('fa')('footer.playYourself'))).toBe(RIGHT_EDGE);
    expect(x(gameUrl())).toBe(RIGHT_EDGE);
  });
});

// D-10: a story the gallery showed from the picture library is exported with
// that picture — fetched as a blob, never an <img>, so the canvas stays clean.
describe('buildStoryImageFile with a library picture (D-10)', () => {
  const PICTURE_URL = 'https://pictures.example/i/abc.png';
  // A string body: jsdom's Blob is not one Node's Response accepts.
  const JPEG = 'jpeg-bytes';
  let ctx: Canvas2DStub;
  let decode: ReturnType<typeof vi.fn>;
  let bitmap: { width: number; height: number; close: ReturnType<typeof vi.fn> };

  function stubLibrary(response: () => Promise<Response>, width = 1024, height = 1024): void {
    bitmap = { width, height, close: vi.fn() };
    vi.stubGlobal('fetch', vi.fn(response));
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(() => Promise.resolve(bitmap)),
    );
  }

  const options = () => ({ name: 'Ann', prose: 'x', story: fullStory(), pictureUrl: PICTURE_URL });
  const drawn = () => ctx.calls.filter((c) => c.method === 'drawImage');
  const notices = () => ctx.calls.filter((c) => c.method === 'fillText').map((c) => c.args[0]);

  beforeEach(() => {
    ctx = installCanvasStub();
    const d = vi.fn(() => Promise.resolve());
    HTMLImageElement.prototype.decode = d;
    decode = d;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('draws the library picture in the rig’s place, at the export width', async () => {
    stubLibrary(() => Promise.resolve(new Response(JPEG)));

    const file = await buildStoryImageFile(options());

    expect(fetch).toHaveBeenCalledExactlyOnceWith(PICTURE_URL, expect.anything());
    expect(decode).not.toHaveBeenCalled();
    // The picture + the QR; none of the seven rig layers.
    expect(drawn()).toHaveLength(2);
    expect(drawn()[0]?.args).toEqual([bitmap, 0, 0, 800, 800]);
    expect(bitmap.close).toHaveBeenCalledTimes(1);
    expect(file.name).toBe('funny-story-Ann.png');
  });

  it('keeps the picture’s own aspect ratio', async () => {
    stubLibrary(() => Promise.resolve(new Response(JPEG)), 1024, 768);
    await buildStoryImageFile(options());
    expect(drawn()[0]?.args).toEqual([bitmap, 0, 0, 800, 600]);
  });

  it('says in the footer that the cartoon came from the library', async () => {
    stubLibrary(() => Promise.resolve(new Response(JPEG)));
    await buildStoryImageFile(options());
    expect(notices().join(' ')).toContain('picture library');
  });

  it.each([
    ['the request fails', () => Promise.reject(new TypeError('offline'))],
    ['the library answers 404', () => Promise.resolve(new Response('', { status: 404 }))],
  ])('draws the rig after all when %s', async (_case, response) => {
    stubLibrary(response);

    await buildStoryImageFile(options());

    expect(decode).toHaveBeenCalledTimes(7);
    expect(drawn()).toHaveLength(8);
    expect(notices().join(' ')).not.toContain('picture library');
  });

  it('draws the rig when the bytes do not decode', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('not a picture'))),
    );
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(() => Promise.reject(new Error('undecodable'))),
    );

    await buildStoryImageFile(options());

    expect(decode).toHaveBeenCalledTimes(7);
    expect(drawn()).toHaveLength(8);
  });

  it('asks for nothing when the gallery showed the rig', async () => {
    stubLibrary(() => Promise.resolve(new Response(JPEG)));
    await buildStoryImageFile({ ...options(), pictureUrl: null });
    expect(fetch).not.toHaveBeenCalled();
    expect(decode).toHaveBeenCalledTimes(7);
  });
});

describe('downloadStoryImage', () => {
  beforeEach(() => {
    installCanvasStub();
    HTMLImageElement.prototype.decode = vi.fn(() => Promise.resolve());
    downloadFile.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hands the built file to downloadFile', async () => {
    await downloadStoryImage({ name: 'Ann', prose: 'x', story: fullStory() });
    expect(downloadFile).toHaveBeenCalledTimes(1);
    expect(downloadFile.mock.calls[0]?.[0]).toBeInstanceOf(File);
  });
});

describe('sizedSvgDataUri', () => {
  const decode = (uri: string) => decodeURIComponent(uri.slice(uri.indexOf(',') + 1));

  // Regression: without the namespace a data: SVG is not an image, so every
  // real-browser export failed at decode() (T-FO-6.1 offline check).
  it('adds the SVG namespace the inline art components leave out', () => {
    const out = decode(sizedSvgDataUri('<svg viewBox="0 0 4 3"><rect width="4"/></svg>', 8, 6));
    expect(out).toMatch(/^<svg [^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(out).toContain('width="8"');
    expect(out).toContain('height="6"');
    expect(out).toContain('<rect width="4"');
  });

  it('keeps an existing namespace without doubling it', () => {
    const out = decode(
      sizedSvgDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"/>', 8, 6),
    );
    expect(out.match(/xmlns=/g)).toHaveLength(1);
  });
});
