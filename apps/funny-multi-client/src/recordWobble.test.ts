// SPDX-License-Identifier: AGPL-3.0-only
//
// buildWobbleVideoFile drives a requestAnimationFrame loop against
// performance.now() until 5000ms of simulated elapsed time. Both are faked
// here to advance in fixed 200ms steps — deterministic and fast (25
// synchronous frames) instead of racing real timers. So the frames land at
// 200, 400 … 5000 ms of clip time, which is what the monkey counts rest on.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installCanvasStub, type Canvas2DStub } from './testutils/canvasStub';
import { setUrl } from './testutils/socketMock';
import { LANDING_URL, LANDING_URL_TEXT, XMAS_URL, XMAS_URL_TEXT } from './landingUrl';

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

  // Owner decision 2026-10-29: the clip's code leads to the landing page too.
  it('encodes the landing page in the QR code', async () => {
    toCanvas.mockClear();
    await buildWobbleVideoFile({
      nickname: 'Mika',
      prose: 'a pirate did stuff.',
      pictureUrl: 'https://img.example/i/abc.png',
      language: 'en',
    });
    expect(toCanvas).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      'https://www.funny-family.oursharedcode.com/',
      expect.anything(),
    );
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

// Step 117 (B-29): a Christmas story's clip shows the scene for its first half
// and its ending for the second — the golden story's ending picture, or the
// ending as a card — and a golden story's footer names the edition.
describe('a Christmas story in the clip (Step 117)', () => {
  const ENDING_URL = 'https://img.example/i/end.png';
  const TEXT = 'Everyone sang carols.';
  let ctx: Canvas2DStub;

  beforeEach(() => {
    ctx = installCanvasStub();
    toCanvas.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
    localStorage.clear();
    setUrl('');
  });

  function drawsOf(src: string): number {
    return ctx.calls.filter(
      (c) =>
        c.method === 'drawImage' && c.args[0] instanceof HTMLImageElement && c.args[0].src === src,
    ).length;
  }

  function bells(): number {
    return ctx.calls.filter((c) => c.method === 'fillText' && c.args[0] === '🔔').length;
  }

  function texts(): string[] {
    return ctx.calls.filter((c) => c.method === 'fillText').map((c) => String(c.args[0]));
  }

  it('shows the scene for the whole clip when the story is not a Christmas one', async () => {
    installRecorderEnv();
    await buildWobbleVideoFile(story);
    expect(drawsOf(story.pictureUrl)).toBe(25);
    expect(bells()).toBe(0);
  });

  // Frames land every 200 ms; the ending fades in from 2.5 s over 0.3 s, so
  // the 2.6 s frame shows both and every later one the ending alone.
  it("hands a golden story's second half to its ending picture", async () => {
    installRecorderEnv();
    await buildWobbleVideoFile({
      ...story,
      golden: true,
      ending: { pictureUrl: ENDING_URL, text: TEXT },
    });
    expect(drawsOf(story.pictureUrl)).toBe(13);
    expect(drawsOf(ENDING_URL)).toBe(13);
    expect(bells()).toBe(0);
  });

  it("ends a slice story's clip on its ending card", async () => {
    installRecorderEnv();
    await buildWobbleVideoFile({ ...story, ending: { pictureUrl: null, text: TEXT } });
    expect(drawsOf(story.pictureUrl)).toBe(13);
    expect(bells()).toBe(13);
    expect(texts()).toContain(TEXT);
  });

  it('falls back to the card when the ending picture cannot be had', async () => {
    installRecorderEnv({ failing: ['deployer-logo', '/end.png'] });
    const file = await buildWobbleVideoFile({
      ...story,
      golden: true,
      ending: { pictureUrl: ENDING_URL, text: TEXT },
    });
    expect(file.name).toBe('funny-stories-Mika.webm');
    expect(drawsOf(ENDING_URL)).toBe(0);
    expect(bells()).toBe(13);
  });

  it("leads a golden story's clip to the edition's page on the website", async () => {
    installRecorderEnv();
    await buildWobbleVideoFile({ ...story, golden: true, ending: null });
    expect(toCanvas).toHaveBeenCalledWith(expect.anything(), XMAS_URL, expect.anything());
    expect(texts()).toContain('Christmas 2026 edition');
    expect(texts()).toContain(XMAS_URL_TEXT);
  });

  it('keeps the landing page in the Android app', async () => {
    setUrl('?shell=android');
    installRecorderEnv();
    await buildWobbleVideoFile({ ...story, golden: true, ending: null });
    expect(toCanvas).toHaveBeenCalledWith(expect.anything(), LANDING_URL, expect.anything());
    expect(texts()).toContain('Christmas 2026 edition');
    expect(texts()).toContain(LANDING_URL_TEXT);
  });

  // Step 122: a paid story's clip thanks its buyer on the website; in the
  // Android app it reads as a golden story's.
  it("thanks a paid story's buyer and leads to the edition's page on the website", async () => {
    installRecorderEnv();
    await buildWobbleVideoFile({ ...story, paid: true, ending: null });
    expect(toCanvas).toHaveBeenCalledWith(expect.anything(), XMAS_URL, expect.anything());
    expect(texts().some((t) => t.startsWith('Your Christmas 2026 stories'))).toBe(true);
    expect(texts()).toContain(XMAS_URL_TEXT);
    expect(texts()).not.toContain('Christmas 2026 edition');
  });

  it("names the edition and keeps the landing page for a paid story's clip in the Android app", async () => {
    setUrl('?shell=android');
    installRecorderEnv();
    await buildWobbleVideoFile({ ...story, paid: true, ending: null });
    expect(toCanvas).toHaveBeenCalledWith(expect.anything(), LANDING_URL, expect.anything());
    expect(texts()).toContain('Christmas 2026 edition');
    expect(texts()).toContain(LANDING_URL_TEXT);
    expect(texts().some((t) => t.startsWith('Your Christmas'))).toBe(false);
  });

  // A download leaves the room: never its code, nor a link holding one, nor a
  // price in the free half (owner decision 5A) — nor, from Step 122, the paid
  // code this phone keeps, and a paid story no price.
  it.each([
    ['a base story on the website', '?room=WXYZ', false, false],
    ['a golden story on the website', '?room=WXYZ', true, false],
    ['a paid story on the website', '?room=WXYZ', false, true],
    ['a golden story in the Android app', '?room=WXYZ&shell=android', true, false],
    ['a paid story in the Android app', '?room=WXYZ&shell=android', false, true],
  ])('carries no code and no price: %s', async (_name, search, golden, paid) => {
    setUrl(search);
    localStorage.setItem('funny37.packCode', 'XMAS26-K7QM-3FPA');
    installRecorderEnv();
    await buildWobbleVideoFile({
      ...story,
      golden,
      paid,
      ending: golden || paid ? { pictureUrl: ENDING_URL, text: TEXT } : null,
    });
    const encoded = toCanvas.mock.calls.map((c) => String(c[1]));
    expect(encoded).toHaveLength(1);
    for (const text of [...encoded, ...texts()]) {
      expect(text).not.toMatch(/WXYZ|room=|[?&]code=|unlock|XMAS26|K7QM/i);
      expect(text).not.toMatch(/[$€£₽¥₹]|A\$|AUD|USD/);
    }
  });
});
