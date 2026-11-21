// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installCanvasStub, type Canvas2DStub } from './testutils/canvasStub';
import { LANDING_URL, LANDING_URL_TEXT, XMAS_URL_TEXT } from './landingUrl';
import i18n from './i18n/index';

const toCanvas = vi.fn().mockResolvedValue(undefined);
vi.mock('qrcode', () => ({ default: { toCanvas } }));

const { drawAttribution, drawEndingCard, drawStoryText, measureAttributionHeight, renderQrCanvas } =
  await import('./videoFooter');

describe('renderQrCanvas', () => {
  beforeEach(() => {
    installCanvasStub();
    toCanvas.mockClear();
  });

  it('renders the given value onto a 120px canvas', async () => {
    await renderQrCanvas(LANDING_URL);
    expect(toCanvas).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      LANDING_URL,
      expect.objectContaining({ width: 120 }),
    );
  });
});

describe('measureAttributionHeight', () => {
  let ctx: Canvas2DStub;

  beforeEach(() => {
    ctx = installCanvasStub();
  });

  it('is at least the QR size (120px) even for a short notice', () => {
    const height = measureAttributionHeight(ctx as unknown as CanvasRenderingContext2D, 720, 'en');
    expect(height).toBeGreaterThanOrEqual(120);
  });
});

describe('drawStoryText', () => {
  let ctx: Canvas2DStub;

  beforeEach(() => {
    ctx = installCanvasStub();
  });

  it('draws every wrapped line and returns a y-coordinate past the last one', () => {
    const bottom = drawStoryText(ctx as unknown as CanvasRenderingContext2D, 'a short story', {
      topY: 100,
      canvasWidth: 720,
      maxHeight: 400,
      language: 'en',
    });
    expect(bottom).toBeGreaterThan(100);
    const fillTextCalls = ctx.calls.filter((c) => c.method === 'fillText');
    expect(fillTextCalls.length).toBeGreaterThan(0);
  });

  it('shrinks the font to keep a long story within a tight height budget', () => {
    const long = Array.from({ length: 40 }, () => 'wobble').join(' ');
    drawStoryText(ctx as unknown as CanvasRenderingContext2D, long, {
      topY: 0,
      canvasWidth: 720,
      maxHeight: 60,
      language: 'en',
    });
    // fitStory tries STORY_MAX_PX (24) down to STORY_MIN_PX (14); a story
    // this long can't fit 60px at 24px lines, so it must have shrunk.
    expect(ctx.font).not.toContain('24px');
  });

  it('starts a right-to-left story at the right edge (Step 73)', () => {
    drawStoryText(ctx as unknown as CanvasRenderingContext2D, 'story', {
      topY: 0,
      canvasWidth: 720,
      maxHeight: 400,
      language: 'fa',
    });
    const call = ctx.calls.find((c) => c.method === 'fillText' && c.args[0] === 'story');
    expect(call?.args[1]).toBe(720 - 40); // canvasWidth - PAD
  });

  it('draws a Yoruba story in Cambria or the serif: Georgia has none of its ẹ, ọ, ṣ or ǹ (Step 81)', () => {
    const opts = { topY: 0, canvasWidth: 720, maxHeight: 400 } as const;
    drawStoryText(ctx as unknown as CanvasRenderingContext2D, 'nǹkan', { ...opts, language: 'yo' });
    expect(ctx.font).toBe('24px Cambria, serif');
    drawStoryText(ctx as unknown as CanvasRenderingContext2D, 'story', { ...opts, language: 'en' });
    expect(ctx.font).toBe('24px Georgia, serif');
  });
});

describe('drawAttribution', () => {
  let ctx: Canvas2DStub;

  beforeEach(() => {
    ctx = installCanvasStub();
  });

  it('draws the QR image and the landing page’s name and address', () => {
    const qrCanvas = document.createElement('canvas');
    drawAttribution(ctx as unknown as CanvasRenderingContext2D, qrCanvas, {
      topY: 0,
      canvasWidth: 720,
      language: 'en',
    });

    const drawImageCalls = ctx.calls.filter((c) => c.method === 'drawImage');
    expect(drawImageCalls[0]?.args[0]).toBe(qrCanvas);

    const fillTextArgs = ctx.calls.filter((c) => c.method === 'fillText').map((c) => c.args[0]);
    expect(fillTextArgs).toContain('Funny Family');
    // The address is drawn without its scheme or trailing slash.
    expect(fillTextArgs).toContain('www.funny-family.oursharedcode.com');
  });

  describe('footer language (B-15)', () => {
    afterEach(async () => {
      await i18n.changeLanguage('en');
    });

    it('writes the label in the language passed, not the active UI locale', async () => {
      await i18n.changeLanguage('he');
      const qrCanvas = document.createElement('canvas');
      drawAttribution(ctx as unknown as CanvasRenderingContext2D, qrCanvas, {
        topY: 0,
        canvasWidth: 720,
        language: 'en',
      });
      const fillTextArgs = ctx.calls.filter((c) => c.method === 'fillText').map((c) => c.args[0]);
      expect(fillTextArgs).toContain('Funny Family');
    });

    it('right-anchors the label and URL of a right-to-left story (Step 73)', () => {
      const qrCanvas = document.createElement('canvas');
      drawAttribution(ctx as unknown as CanvasRenderingContext2D, qrCanvas, {
        topY: 0,
        canvasWidth: 720,
        language: 'he',
      });
      const x = (text: string) =>
        ctx.calls.find((c) => c.method === 'fillText' && c.args[0] === text)?.args[1];
      expect(x('משפחה מצחיקה')).toBe(720 - 40); // canvasWidth - PAD
      expect(x(LANDING_URL_TEXT)).toBe(720 - 40);
      expect(ctx.textAlign).toBe('left'); // reset for the next frame's drawing
    });

    it('writes a Yoruba notice in Cambria or the serif, never Georgia (Step 81)', () => {
      const drawn: [string, string][] = [];
      ctx.fillText = (text: string) => {
        drawn.push([text, String(ctx.font)]);
      };
      const qrCanvas = document.createElement('canvas');
      drawAttribution(ctx as unknown as CanvasRenderingContext2D, qrCanvas, {
        topY: 0,
        canvasWidth: 720,
        language: 'yo',
      });
      expect(drawn.map(([, font]) => font)).toContain('italic 20px Cambria, serif');
      expect(drawn.filter(([, font]) => font.includes('Georgia'))).toEqual([]);
    });
  });
});

// Step 117 (B-29): a golden story's footer names the edition and its page.
describe('drawAttribution for the Christmas 2026 edition', () => {
  it('draws the label and address it is given', () => {
    const ctx = installCanvasStub();
    drawAttribution(ctx as unknown as CanvasRenderingContext2D, document.createElement('canvas'), {
      topY: 0,
      canvasWidth: 720,
      language: 'en',
      labelKey: 'footer.edition',
      urlText: XMAS_URL_TEXT,
    });
    const drawn = ctx.calls.filter((c) => c.method === 'fillText').map((c) => c.args[0]);
    expect(drawn).toContain('Christmas 2026 edition');
    expect(drawn).toContain(XMAS_URL_TEXT);
    expect(drawn).not.toContain('Funny Family');
    expect(drawn).not.toContain(LANDING_URL_TEXT);
  });
});

// Step 117: the card a Christmas story's clip ends on when it has no ending
// picture — the bell over the ending, centred in the picture's square.
describe('drawEndingCard', () => {
  function drawnWithFonts(ctx: Canvas2DStub): [string, string, number, number][] {
    const drawn: [string, string, number, number][] = [];
    ctx.fillText = (text: string, x: number, y: number) => {
      drawn.push([text, String(ctx.font), x, y]);
    };
    return drawn;
  }

  it('draws the bell and the ending, centred in the square', () => {
    const ctx = installCanvasStub();
    const drawn = drawnWithFonts(ctx);
    drawEndingCard(ctx as unknown as CanvasRenderingContext2D, 'Everyone sang carols.', {
      x: -320,
      y: -320,
      size: 640,
      language: 'en',
    });
    expect(drawn[0]?.[0]).toBe('🔔');
    expect(
      drawn
        .slice(1)
        .map(([text]) => text)
        .join(' '),
    ).toBe('Everyone sang carols.');
    for (const [, , x] of drawn) expect(x).toBe(0);
    expect(drawn[1]?.[1]).toBe('52px Georgia, serif');
    // Its frame is a filled, stroked path; the context is left aligned left.
    expect(ctx.calls.some((c) => c.method === 'fill')).toBe(true);
    expect(ctx.calls.some((c) => c.method === 'stroke')).toBe(true);
    expect(ctx.textAlign).toBe('left');
  });

  it('shrinks a long ending to fit under the bell', () => {
    const ctx = installCanvasStub();
    const drawn = drawnWithFonts(ctx);
    drawEndingCard(ctx as unknown as CanvasRenderingContext2D, 'word '.repeat(100).trim(), {
      x: 0,
      y: 0,
      size: 640,
      language: 'en',
    });
    const size = Number(/^(\d+)px/.exec(drawn[1]?.[1] ?? '')?.[1]);
    expect(size).toBeLessThan(52);
    expect(size).toBeGreaterThanOrEqual(26);
    const lastY = drawn[drawn.length - 1]?.[3] ?? Infinity;
    expect(lastY).toBeLessThan(640 - 56);
  });

  it("writes an ending in the story's family, and a right-to-left one in its direction", () => {
    const ctx = installCanvasStub();
    const drawn = drawnWithFonts(ctx);
    drawEndingCard(ctx as unknown as CanvasRenderingContext2D, 'Gbogbo wọn kọrin.', {
      x: 0,
      y: 0,
      size: 640,
      language: 'yo',
    });
    expect(drawn[1]?.[1]).toBe('52px Cambria, serif');
    const rtl = installCanvasStub();
    drawEndingCard(rtl as unknown as CanvasRenderingContext2D, 'כולם שרו.', {
      x: 0,
      y: 0,
      size: 640,
      language: 'he',
    });
    expect(rtl.direction).toBe('rtl');
  });
});
