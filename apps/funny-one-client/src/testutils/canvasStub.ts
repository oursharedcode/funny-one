// SPDX-License-Identifier: AGPL-3.0-only

// Shared canvas double for downloadStory/videoFooter/recordWobble's suites.
// jsdom implements the <canvas> *element* but not its 2D rendering context,
// `toBlob`, or `captureStream` (no backend to actually rasterize into) — so
// exercising code that draws has to run against a fake context, same as the
// socket suites run against `testutils/socketMock.ts` rather than a real
// socket.io server. `restoreMocks: true` in vitest.config.ts undoes every
// `vi.spyOn` here between tests automatically.

import { vi } from 'vitest';

export interface CanvasCall {
  method: string;
  args: unknown[];
}

export interface Canvas2DStub extends Partial<CanvasRenderingContext2D> {
  calls: CanvasCall[];
}

function makeContextStub(): Canvas2DStub {
  const calls: CanvasCall[] = [];
  const record =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push({ method, args });
    };
  return {
    calls,
    fillRect: record('fillRect'),
    fillText: record('fillText'),
    drawImage: record('drawImage'),
    save: record('save'),
    restore: record('restore'),
    translate: record('translate'),
    rotate: record('rotate'),
    scale: record('scale'),
    // Naive fixed-width measurement — good enough for wrap-point assertions
    // without depending on real font metrics jsdom can't provide anyway.
    measureText: (text: string) => ({ width: text.length * 8 }) as TextMetrics,
    // Settable properties every draw call touches; plain values, no tracking.
    fillStyle: '',
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
  };
}

/**
 * Points every `document.createElement('canvas')` and `HTMLCanvasElement`
 * instance at a fake 2D context, `toBlob`, and `captureStream`. Returns the
 * context stub so a test can assert on `.calls`.
 */
export function installCanvasStub(): Canvas2DStub {
  const ctx = makeContextStub();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
    type?: string,
  ) {
    callback(new Blob(['stub-png'], { type: type ?? 'image/png' }));
  });
  // Not part of jsdom's HTMLCanvasElement at all — `spyOn` needs the property
  // to already exist, so this one is assigned directly rather than spied.
  (HTMLCanvasElement.prototype as unknown as { captureStream: () => MediaStream }).captureStream =
    vi.fn(() => ({}) as MediaStream);
  return ctx;
}
