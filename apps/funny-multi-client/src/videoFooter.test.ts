// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installCanvasStub, type Canvas2DStub } from './testutils/canvasStub';
import { SOURCE_URL } from './sourceUrl';
import i18n from './i18n/index';

const toCanvas = vi.fn().mockResolvedValue(undefined);
vi.mock('qrcode', () => ({ default: { toCanvas } }));

const { drawAttribution, drawStoryText, measureAttributionHeight, renderQrCanvas } =
  await import('./videoFooter');

describe('renderQrCanvas', () => {
  beforeEach(() => {
    installCanvasStub();
    toCanvas.mockClear();
  });

  it('renders the given value onto a 120px canvas', async () => {
    await renderQrCanvas(SOURCE_URL);
    expect(toCanvas).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      SOURCE_URL,
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
});

describe('drawAttribution', () => {
  let ctx: Canvas2DStub;

  beforeEach(() => {
    ctx = installCanvasStub();
  });

  it('draws the QR image and the source label/URL text', () => {
    const qrCanvas = document.createElement('canvas');
    drawAttribution(ctx as unknown as CanvasRenderingContext2D, qrCanvas, {
      topY: 0,
      canvasWidth: 720,
      language: 'en',
    });

    const drawImageCalls = ctx.calls.filter((c) => c.method === 'drawImage');
    expect(drawImageCalls[0]?.args[0]).toBe(qrCanvas);

    const fillTextArgs = ctx.calls.filter((c) => c.method === 'fillText').map((c) => c.args[0]);
    // URL is drawn without its protocol prefix.
    expect(fillTextArgs).toContain(SOURCE_URL.replace(/^https?:\/\//, ''));
  });

  describe('footer language (B-15)', () => {
    afterEach(async () => {
      await i18n.changeLanguage('en');
    });

    it('writes the source label in the language passed, not the active UI locale', async () => {
      await i18n.changeLanguage('he');
      const qrCanvas = document.createElement('canvas');
      drawAttribution(ctx as unknown as CanvasRenderingContext2D, qrCanvas, {
        topY: 0,
        canvasWidth: 720,
        language: 'en',
      });
      const fillTextArgs = ctx.calls.filter((c) => c.method === 'fillText').map((c) => c.args[0]);
      expect(fillTextArgs).toContain('Source on GitHub');
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
      expect(x(i18n.getFixedT('he')('footer.source'))).toBe(720 - 40); // canvasWidth - PAD
      expect(x(SOURCE_URL.replace(/^https?:\/\//, ''))).toBe(720 - 40);
      expect(ctx.textAlign).toBe('left'); // reset for the next frame's drawing
    });
  });
});
