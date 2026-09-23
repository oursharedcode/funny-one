// SPDX-License-Identifier: AGPL-3.0-only
//
// Funny One's picture has no fetchable URL (see rigExport.ts's header) — the
// picture-loading assertions here lock in that each rig layer is rasterized
// via `HTMLImageElement.decode()` off a serialized-SVG data: URI, rather than
// downloadStory.ts's `fetch`/`createImageBitmap` path.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Story } from '@funny/shared';
import { installCanvasStub, type Canvas2DStub } from './testutils/canvasStub';

const toCanvas = vi.fn().mockResolvedValue(undefined);
vi.mock('qrcode', () => ({ default: { toCanvas } }));

const downloadFile = vi.fn();
vi.mock('./share', () => ({ downloadFile }));

const { buildStoryImageFile, downloadStoryImage } = await import('./rigExport');

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
