// SPDX-License-Identifier: AGPL-3.0-only
//
// buildWobbleVideoFile drives a requestAnimationFrame loop against
// performance.now() until 5000ms of simulated elapsed time. Both are faked
// here to advance in fixed 200ms steps — deterministic and fast (25
// synchronous frames) instead of racing real timers. So the frames land at
// 200, 400 … 5000 ms of clip time, which is what the monkey counts rest on.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installCanvasStub, type Canvas2DStub } from './testutils/canvasStub';

const toCanvas = vi.fn().mockResolvedValue(undefined);
vi.mock('qrcode', () => ({ default: { toCanvas } }));

const downloadFile = vi.fn();
vi.mock('./share', () => ({ downloadFile }));

const { buildWobbleVideoFile, isVideoRecordingSupported, recordWobbleVideo } =
  await import('./recordWobble');

class FakeMediaRecorder {
  static isTypeSupported(mime: string): boolean {
    return mime === 'video/webm;codecs=vp9';
  }
  ondataavailable: ((e: { data: Blob; size: number }) => void) | null = null;
  onstop: (() => void) | null = null;
  mimeType: string;
  constructor(_stream: unknown, opts: { mimeType: string }) {
    this.mimeType = opts.mimeType;
  }
  start(): void {}
  stop(): void {
    this.ondataavailable?.({ data: new Blob(['chunk'], { type: this.mimeType }), size: 5 });
    this.onstop?.();
  }
}

interface RecorderEnv {
  decode: ReturnType<typeof vi.fn>;
  /** `crossOrigin` of every image at the moment it was decoded, by URL. */
  crossOriginBySrc: Map<string, string | null>;
}

function installRecorderEnv(opts: { failing?: string[] } = {}): RecorderEnv {
  // The deployer-logo asset fails by default — it stands in for a deployer who
  // removed the file — so the try/catch around it is exercised for real.
  const failing = opts.failing ?? ['deployer-logo'];
  const crossOriginBySrc = new Map<string, string | null>();
  let t = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => {
    const v = t;
    t += 200;
    return v;
  });
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 1;
    }),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  // jsdom doesn't implement HTMLImageElement.prototype.decode at all — no
  // property for `vi.spyOn` to wrap, so it's assigned directly. Each test
  // gets its own fresh `vi.fn()` via this call, so there's nothing stale to
  // restore between tests.
  const decode = vi.fn(function (this: HTMLImageElement) {
    crossOriginBySrc.set(this.src, this.crossOrigin);
    if (failing.some((part) => this.src.includes(part))) return Promise.reject(new Error('404'));
    return Promise.resolve();
  });
  HTMLImageElement.prototype.decode = decode;
  return { decode, crossOriginBySrc };
}

const story = {
  nickname: 'Mika',
  prose: 'x',
  pictureUrl: 'https://img.example/i/abc.png',
  language: 'en' as const,
};

/** The `drawImage` calls whose source is one of the monkey's four sprites. */
function monkeyDraws(ctx: Canvas2DStub): unknown[][] {
  return ctx.calls
    .filter((c) => c.method === 'drawImage')
    .map((c) => c.args)
    .filter((args) => args[0] instanceof HTMLImageElement && args[0].src.includes('/monkey/'));
}

describe('isVideoRecordingSupported', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is false with no MediaRecorder at all', () => {
    expect(isVideoRecordingSupported()).toBe(false);
  });

  it('is false when captureStream is missing', () => {
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    expect(isVideoRecordingSupported()).toBe(false);
  });

  it('is true once MediaRecorder, captureStream and a supported mime all exist', () => {
    installCanvasStub();
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    expect(isVideoRecordingSupported()).toBe(true);
  });
});

describe('buildWobbleVideoFile', () => {
  let recorderEnv: RecorderEnv;

  beforeEach(() => {
    installCanvasStub();
    recorderEnv = installRecorderEnv();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('records a 5-second clip and resolves a webm File named after the player', async () => {
    const file = await buildWobbleVideoFile({
      nickname: 'Mika',
      prose: 'a pirate did stuff.',
      pictureUrl: 'https://img.example/i/abc.png',
      language: 'en',
    });
    expect(file.name).toBe('funny-stories-Mika.webm');
    expect(file.type).toBe('video/webm;codecs=vp9');
  });

  it('loads the picture via a real <img>, unlike the CORS-sensitive still download', async () => {
    await buildWobbleVideoFile({
      nickname: 'Mika',
      prose: 'x',
      pictureUrl: 'https://img.example/i/abc.png',
      language: 'en',
    });
    // Called at least twice: the picture, then the best-effort deployer logo.
    expect(recorderEnv.decode.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('asks for CORS on the cross-origin picture only, never on the app’s own images', async () => {
    await buildWobbleVideoFile(story);
    const { crossOriginBySrc } = recorderEnv;
    expect(crossOriginBySrc.get(story.pictureUrl)).toBe('anonymous');
    const own = [...crossOriginBySrc.keys()].filter((src) => src !== story.pictureUrl);
    // The logo and the monkey's four sprites.
    expect(own).toHaveLength(5);
    for (const src of own) expect(crossOriginBySrc.get(src)).toBeNull();
  });

  it('keeps the canvas in the page while recording and removes it afterwards', async () => {
    let attachedAtStart = 0;
    vi.stubGlobal(
      'MediaRecorder',
      class extends FakeMediaRecorder {
        override start(): void {
          attachedAtStart = document.body.querySelectorAll('canvas').length;
        }
      },
    );
    await buildWobbleVideoFile(story);
    expect(attachedAtStart).toBe(1);
    expect(document.body.querySelector('canvas')).toBeNull();
  });

  it('rejects when no supported MediaRecorder mime type exists', async () => {
    vi.stubGlobal(
      'MediaRecorder',
      class {
        static isTypeSupported(): boolean {
          return false;
        }
      },
    );
    await expect(
      buildWobbleVideoFile({
        nickname: 'Mika',
        prose: 'x',
        pictureUrl: 'https://img.example/i/a.png',
        language: 'en',
      }),
    ).rejects.toThrow('MediaRecorder not supported');
  });
});

describe('the monkey in the clip (B-12)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is on every frame from the moment it walks in, and says ha-ha only while pointing', async () => {
    const ctx = installCanvasStub();
    installRecorderEnv();
    await buildWobbleVideoFile(story);
    // It walks in at 1.5 s: 18 of the 25 frames (1600 … 5000 ms), six sprite
    // draws each — two legs, torso, two arms, head.
    expect(monkeyDraws(ctx)).toHaveLength(18 * 6);
    // The balloon is up from 3.0 s until the fall starts at 4.0 s: 5 frames.
    const laughs = ctx.calls.filter((c) => c.method === 'fillText' && c.args[0] === 'ha-ha');
    expect(laughs).toHaveLength(5);
  });

  it('is left out, and the clip still records, when its sprites fail to load', async () => {
    const ctx = installCanvasStub();
    installRecorderEnv({ failing: ['/monkey/'] });
    const file = await buildWobbleVideoFile(story);
    expect(file.name).toBe('funny-stories-Mika.webm');
    expect(monkeyDraws(ctx)).toHaveLength(0);
    expect(ctx.calls.some((c) => c.method === 'fillText' && c.args[0] === 'ha-ha')).toBe(false);
  });
});

describe('recordWobbleVideo', () => {
  beforeEach(() => {
    installCanvasStub();
    installRecorderEnv();
    downloadFile.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hands the recorded file to downloadFile', async () => {
    await recordWobbleVideo({
      nickname: 'Mika',
      prose: 'x',
      pictureUrl: 'https://img.example/i/abc.png',
      language: 'en',
    });
    expect(downloadFile).toHaveBeenCalledTimes(1);
    expect(downloadFile.mock.calls[0]?.[0]).toBeInstanceOf(File);
  });
});
