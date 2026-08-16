// SPDX-License-Identifier: AGPL-3.0-only
//
// buildWobbleVideoFile drives a requestAnimationFrame loop against
// performance.now() until 5000ms of simulated elapsed time. Both are faked
// here to advance in fixed 200ms steps — deterministic and fast (25
// synchronous frames) instead of racing real timers.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installCanvasStub } from './testutils/canvasStub';

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

function installRecorderEnv(): { decode: ReturnType<typeof vi.fn> } {
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
    // The deployer-logo asset doesn't exist in this repo yet (T-7.2) — mirror
    // that 404 so the try/catch around it is exercised for real.
    if (this.src.includes('deployer-logo')) return Promise.reject(new Error('404'));
    return Promise.resolve();
  });
  HTMLImageElement.prototype.decode = decode;
  return { decode };
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
  let recorderEnv: { decode: ReturnType<typeof vi.fn> };

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
    });
    expect(file.name).toBe('funny-stories-Mika.webm');
    expect(file.type).toBe('video/webm;codecs=vp9');
  });

  it('loads the picture via a real <img>, unlike the CORS-sensitive still download', async () => {
    await buildWobbleVideoFile({
      nickname: 'Mika',
      prose: 'x',
      pictureUrl: 'https://img.example/i/abc.png',
    });
    // Called at least twice: the picture, then the best-effort deployer logo.
    expect(recorderEnv.decode.mock.calls.length).toBeGreaterThanOrEqual(2);
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
      }),
    ).rejects.toThrow('MediaRecorder not supported');
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
    });
    expect(downloadFile).toHaveBeenCalledTimes(1);
    expect(downloadFile.mock.calls[0]?.[0]).toBeInstanceOf(File);
  });
});
