// SPDX-License-Identifier: AGPL-3.0-only
//
// Design §8.3's whole point is that the picture is fetched and decoded off
// the DOM's `<img>` tainting path (see downloadStory.ts's header) instead of
// SRC's `<img src>` + `img.decode()`. The picture-loading assertions below
// are what actually locks that adaptation in — everything else here is
// standard "does it produce the right File" coverage.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installCanvasStub, type Canvas2DStub } from './testutils/canvasStub';
import { setUrl } from './testutils/socketMock';
import i18n from './i18n/index';
import { LANDING_URL, LANDING_URL_TEXT, XMAS_URL, XMAS_URL_TEXT } from './landingUrl';

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

  // Step 117 (B-29): a golden story's still names the Christmas 2026 edition
  // and carries its ending picture under the scene.
  describe('a golden story (Step 117)', () => {
    const SCENE_URL = 'https://img.example/i/scene.png';
    const ENDING_URL = 'https://img.example/i/end.png';
    const scene = { close: () => {} } as unknown as ImageBitmap;
    const ending = { close: () => {} } as unknown as ImageBitmap;

    function pictureFetches(): void {
      const blobs: Record<string, Blob> = {
        [SCENE_URL]: new Blob(['scene']),
        [ENDING_URL]: new Blob(['ending']),
      };
      fetchMock.mockImplementation((url: string) =>
        blobs[url]
          ? Promise.resolve({ blob: () => Promise.resolve(blobs[url]) })
          : Promise.reject(new Error('no such picture')),
      );
      createImageBitmap.mockImplementation((blob: Blob) =>
        Promise.resolve(blob === blobs[SCENE_URL] ? scene : ending),
      );
    }

    function texts(): string[] {
      return ctx.calls.filter((c) => c.method === 'fillText').map((c) => String(c.args[0]));
    }

    beforeEach(() => {
      toCanvas.mockClear();
      pictureFetches();
    });

    afterEach(async () => {
      sessionStorage.clear();
      setUrl('');
      await i18n.changeLanguage('en');
    });

    it("leads to the edition's page on the website, under the edition's name", async () => {
      await buildStoryImageFile({
        nickname: 'Mika',
        prose: 'x',
        pictureUrl: null,
        language: 'en',
        golden: true,
      });
      expect(toCanvas).toHaveBeenCalledWith(expect.anything(), XMAS_URL, expect.anything());
      expect(texts()).toContain(XMAS_URL_TEXT);
      expect(texts()).toContain('Christmas 2026 edition');
      expect(texts()).not.toContain('Funny Family');
    });

    it('keeps the landing page inside the Android app, where no payment address may go', async () => {
      setUrl('?shell=android');
      await buildStoryImageFile({
        nickname: 'Mika',
        prose: 'x',
        pictureUrl: null,
        language: 'en',
        golden: true,
      });
      expect(toCanvas).toHaveBeenCalledWith(expect.anything(), LANDING_URL, expect.anything());
      expect(texts()).toContain(LANDING_URL_TEXT);
      expect(texts()).toContain('Christmas 2026 edition');
      expect(texts().some((t) => t.includes('/x26'))).toBe(false);
    });

    it('names the edition «Новый год 2027» in Russian', async () => {
      await buildStoryImageFile({
        nickname: 'Мика',
        prose: 'x',
        pictureUrl: null,
        language: 'ru',
        golden: true,
      });
      expect(texts()).toContain('«Новый год 2027»');
    });

    it('draws the ending picture under the scene, the whole width', async () => {
      await buildStoryImageFile({
        nickname: 'Mika',
        prose: 'x',
        pictureUrl: SCENE_URL,
        language: 'en',
        golden: true,
        endingUrl: ENDING_URL,
      });
      const drawn = ctx.calls.filter((c) => c.method === 'drawImage');
      expect(drawn[0]?.args).toEqual([scene, 0, 0, 512, 512]);
      expect(drawn[1]?.args).toEqual([ending, 0, 512, 512, 512]);
      // The prose starts under both pictures.
      const prose = ctx.calls.find((c) => c.method === 'fillText' && c.args[0] === 'x');
      expect(prose?.args[2]).toBe(1024 + 28);
    });

    it('still builds the scene and the story when the ending picture cannot be had', async () => {
      await buildStoryImageFile({
        nickname: 'Mika',
        prose: 'x',
        pictureUrl: SCENE_URL,
        language: 'en',
        golden: true,
        endingUrl: 'https://img.example/i/gone.png',
      });
      const drawn = ctx.calls.filter((c) => c.method === 'drawImage');
      expect(drawn.map((c) => c.args[0])).toEqual([scene, expect.anything()]);
    });

    it('never draws an ending for a story that is not golden', async () => {
      await buildStoryImageFile({
        nickname: 'Mika',
        prose: 'x',
        pictureUrl: SCENE_URL,
        language: 'en',
        endingUrl: ENDING_URL,
      });
      expect(fetchMock).not.toHaveBeenCalledWith(ENDING_URL);
      expect(texts()).toContain('Funny Family');
      expect(toCanvas).toHaveBeenCalledWith(expect.anything(), LANDING_URL, expect.anything());
    });
  });

  // Step 122 (B-29): a paid story's still carries its ending, as a golden
  // story's does, and its footer the buyer's thank-you — wrapped to the column
  // when it is longer — leading to the edition's page, on the website.
  describe('a paid story (Step 122)', () => {
    const LABEL_FONT = 'bold 13px system-ui, sans-serif';
    const THANKS = 'Your Christmas 2026 stories: every game, enjoy your party :))';
    const story = { nickname: 'Mika', prose: 'x', pictureUrl: null, language: 'en' } as const;

    interface Drawn {
      text: string;
      font: string;
      y: number;
    }

    /** Every text the still draws from here on, with its font and its top. */
    function recordTexts(): Drawn[] {
      const drawn: Drawn[] = [];
      ctx.fillText = (text: string, _x: number, y: number) => {
        drawn.push({ text, font: String(ctx.font), y });
      };
      return drawn;
    }

    /** The height of each still built so far: its cream background's. */
    function stillHeights(): number[] {
      return ctx.calls
        .filter((c) => c.method === 'fillRect' && c.args[0] === 0 && c.args[1] === 0)
        .map((c) => Number(c.args[3]));
    }

    beforeEach(() => {
      toCanvas.mockClear();
    });

    afterEach(async () => {
      sessionStorage.clear();
      setUrl('');
      await i18n.changeLanguage('en');
    });

    it("thanks its buyer on the website and leads to the edition's page", async () => {
      const drawn = recordTexts();
      await buildStoryImageFile({ ...story, paid: true });
      expect(toCanvas).toHaveBeenCalledWith(expect.anything(), XMAS_URL, expect.anything());
      const label = drawn.filter((d) => d.font === LABEL_FONT).map((d) => d.text);
      expect(label.join(' ')).toBe(THANKS);
      expect(drawn.map((d) => d.text)).toContain(XMAS_URL_TEXT);
      expect(drawn.map((d) => d.text)).not.toContain('Christmas 2026 edition');
    });

    it('wraps the thank-you to the column and drops the address under its last line', async () => {
      const drawn = recordTexts();
      await buildStoryImageFile({ ...story, paid: true });
      const label = drawn.filter((d) => d.font === LABEL_FONT);
      expect(label.length).toBeGreaterThan(1);
      label.slice(1).forEach((line, i) => expect(line.y - label[i]!.y).toBe(18));
      // As far under the last line as under a one-line label.
      const url = drawn.find((d) => d.text === XMAS_URL_TEXT);
      expect(url!.y - label[label.length - 1]!.y).toBe(20);
    });

    it('grows the still by the lines the thank-you wraps onto', async () => {
      await buildStoryImageFile({ ...story, golden: true });
      const drawn = recordTexts();
      await buildStoryImageFile({ ...story, paid: true });
      const lines = drawn.filter((d) => d.font === LABEL_FONT).length;
      const [golden, paid] = stillHeights();
      expect(paid! - golden!).toBe((lines - 1) * 18);
    });

    it("reads as a golden story's inside the Android app: the edition, the landing page", async () => {
      setUrl('?shell=android');
      const drawn = recordTexts();
      await buildStoryImageFile({ ...story, paid: true });
      expect(toCanvas).toHaveBeenCalledWith(expect.anything(), LANDING_URL, expect.anything());
      const texts = drawn.map((d) => d.text);
      expect(texts).toContain('Christmas 2026 edition');
      expect(texts).toContain(LANDING_URL_TEXT);
      expect(texts.some((t) => t.includes('/x26') || t.startsWith('Your Christmas'))).toBe(false);
    });

    it('thanks a Russian buyer in Russian', async () => {
      const drawn = recordTexts();
      await buildStoryImageFile({ ...story, nickname: 'Мика', language: 'ru', paid: true });
      const label = drawn.filter((d) => d.font === LABEL_FONT).map((d) => d.text);
      expect(label.join(' ')).toBe(
        'Ваши истории «Новый год 2027»: каждая игра, весёлого праздника :))',
      );
    });

    it('draws its ending picture under the scene, the whole width', async () => {
      const scene = { close: () => {} } as unknown as ImageBitmap;
      const ending = { close: () => {} } as unknown as ImageBitmap;
      const blobs = { scene: new Blob(['scene']), ending: new Blob(['ending']) };
      fetchMock.mockImplementation((url: string) =>
        Promise.resolve({
          blob: () => Promise.resolve(url.endsWith('/end.png') ? blobs.ending : blobs.scene),
        }),
      );
      createImageBitmap.mockImplementation((blob: Blob) =>
        Promise.resolve(blob === blobs.scene ? scene : ending),
      );
      await buildStoryImageFile({
        ...story,
        pictureUrl: 'https://img.example/i/scene.png',
        paid: true,
        endingUrl: 'https://img.example/i/end.png',
      });
      const drawn = ctx.calls.filter((c) => c.method === 'drawImage');
      expect(drawn[0]?.args).toEqual([scene, 0, 0, 512, 512]);
      expect(drawn[1]?.args).toEqual([ending, 0, 512, 512, 512]);
    });
  });

  // Step 117: a download leaves the room, so it never carries the room's code
  // or a link holding one — nor, in the free half, a price (owner decision 5A).
  // Step 122: nor the paid code this phone keeps, and a paid story no price.
  describe('no code and no price on a still', () => {
    afterEach(() => {
      sessionStorage.clear();
      localStorage.clear();
      setUrl('');
    });

    it.each([
      ['a base story on the website', '?room=WXYZ', false, false],
      ['a golden story on the website', '?room=WXYZ', true, false],
      ['a paid story on the website', '?room=WXYZ', false, true],
      ['a base story in the Android app', '?room=WXYZ&shell=android', false, false],
      ['a golden story in the Android app', '?room=WXYZ&shell=android', true, false],
      ['a paid story in the Android app', '?room=WXYZ&shell=android', false, true],
    ])('%s', async (_name, search, golden, paid) => {
      setUrl(search);
      localStorage.setItem('funny37.packCode', 'XMAS26-K7QM-3FPA');
      toCanvas.mockClear();
      await buildStoryImageFile({
        nickname: 'Mika',
        prose: 'a pirate did stuff.',
        pictureUrl: null,
        language: 'en',
        golden,
        paid,
      });
      const encoded = toCanvas.mock.calls.map((c) => String(c[1]));
      const printed = ctx.calls
        .filter((c) => c.method === 'fillText')
        .map((c) => String(c.args[0]));
      for (const text of [...encoded, ...printed]) {
        expect(text).not.toMatch(/WXYZ|room=|[?&]code=|unlock|XMAS26|K7QM/i);
        expect(text).not.toMatch(/[$€£₽¥₹]|A\$|AUD|USD/);
      }
      expect(encoded).toHaveLength(1);
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
