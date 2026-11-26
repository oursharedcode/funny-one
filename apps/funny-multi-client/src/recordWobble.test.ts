// SPDX-License-Identifier: AGPL-3.0-only
//
// buildWobbleVideoFile drives a requestAnimationFrame loop against
// performance.now() until 5000ms of simulated elapsed time. Both are faked
// here to advance in fixed 200ms steps — deterministic and fast (25
// synchronous frames) instead of racing real timers. So the frames land at
// 200, 400 … 5000 ms of clip time, which is what the character counts rest on.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installCanvasStub, type Canvas2DStub } from './testutils/canvasStub';
import { setUrl } from './testutils/socketMock';
import { LANDING_URL, LANDING_URL_TEXT, XMAS_URL, XMAS_URL_TEXT } from './landingUrl';
import { resetCharacterTurn } from './videoCharacter';

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

/** The `drawImage` calls whose source is one of a character's four sprites. */
function characterDraws(ctx: Canvas2DStub, folder: string): unknown[][] {
  return ctx.calls
    .filter((c) => c.method === 'drawImage')
    .map((c) => c.args)
    .filter((args) => args[0] instanceof HTMLImageElement && args[0].src.includes(`/${folder}/`));
}

function monkeyDraws(ctx: Canvas2DStub): unknown[][] {
  return characterDraws(ctx, 'monkey');
}

/** On how many frames the balloon says `speech`. */
function balloons(ctx: Canvas2DStub, speech: string): number {
  return ctx.calls.filter((c) => c.method === 'fillText' && c.args[0] === speech).length;
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

// Owner request 2026-11-26: in a golden story's and a paid story's clip a
// reindeer or a Santa stands where the monkey does, turn about, and says
// "ho-ho-ho". No Web Audio in this suite, so these clips are silent here; the
// voice is heard in the last suite of this file.
describe('the Christmas characters in the clip', () => {
  const ENDING = { pictureUrl: 'https://img.example/i/end.png', text: 'Everyone sang carols.' };

  beforeEach(() => {
    resetCharacterTurn();
    // Below one half: the reindeer has this phone's first festive clip.
    vi.spyOn(Math, 'random').mockReturnValue(0.2);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetCharacterTurn();
  });

  async function record(extra: object, env: { failing?: string[] } = {}): Promise<Canvas2DStub> {
    const ctx = installCanvasStub();
    installRecorderEnv(env);
    await buildWobbleVideoFile({ ...story, ...extra });
    return ctx;
  }

  it.each([
    ['a golden story', { golden: true, ending: ENDING }],
    ['a paid story', { paid: true, ending: ENDING }],
  ])('puts a Christmas character in %s’s clip, saying ho-ho-ho', async (_name, flags) => {
    const ctx = await record(flags);
    // The monkey's counts: 18 frames of six sprites, the balloon on 5.
    expect(characterDraws(ctx, 'reindeer')).toHaveLength(18 * 6);
    expect(balloons(ctx, 'ho-ho-ho')).toBe(5);
    expect(monkeyDraws(ctx)).toHaveLength(0);
    expect(characterDraws(ctx, 'santa')).toHaveLength(0);
    expect(balloons(ctx, 'ha-ha')).toBe(0);
  });

  it('gives the two characters turn about, whichever the stories are', async () => {
    const folders: string[] = [];
    for (const flags of [{ golden: true }, { paid: true }, { golden: true }, { golden: true }]) {
      const ctx = await record(flags);
      const folder = characterDraws(ctx, 'santa').length > 0 ? 'santa' : 'reindeer';
      folders.push(folder);
      expect(characterDraws(ctx, folder)).toHaveLength(18 * 6);
      expect(balloons(ctx, 'ho-ho-ho')).toBe(5);
    }
    expect(folders).toEqual(['reindeer', 'santa', 'reindeer', 'santa']);
  });

  it('starts with Santa on a phone where chance says so', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    expect(characterDraws(await record({ golden: true }), 'santa')).toHaveLength(18 * 6);
  });

  it.each([
    ['an ordinary story', {}],
    ['a slice story', { ending: { pictureUrl: null, text: 'Carols.' } }],
  ])(
    'leaves %s the monkey and its ha-ha, and does not spend a turn on it',
    async (_name, extra) => {
      expect(characterDraws(await record({ golden: true }), 'reindeer')).toHaveLength(18 * 6);
      const ctx = await record(extra);
      expect(monkeyDraws(ctx)).toHaveLength(18 * 6);
      expect(balloons(ctx, 'ha-ha')).toBe(5);
      expect(balloons(ctx, 'ho-ho-ho')).toBe(0);
      expect(characterDraws(await record({ paid: true }), 'santa')).toHaveLength(18 * 6);
    },
  );

  it('asks for the character’s sprites as the app’s own images, without CORS', async () => {
    installCanvasStub();
    const { crossOriginBySrc } = installRecorderEnv();
    await buildWobbleVideoFile({ ...story, golden: true });
    const own = [...crossOriginBySrc.keys()].filter((src) => src.includes('/reindeer/'));
    expect(own).toHaveLength(4);
    for (const src of own) expect(crossOriginBySrc.get(src)).toBeNull();
  });

  it('is left out, and the clip still records, when its sprites fail to load', async () => {
    const ctx = installCanvasStub();
    installRecorderEnv({ failing: ['/reindeer/'] });
    const file = await buildWobbleVideoFile({ ...story, golden: true });
    expect(file.name).toBe('funny-stories-Mika.webm');
    for (const folder of ['reindeer', 'santa', 'monkey']) {
      expect(characterDraws(ctx, folder)).toHaveLength(0);
    }
    expect(balloons(ctx, 'ho-ho-ho')).toBe(0);
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

// Step 126 (owner decisions 2026-11-25 D1 A, D2 A): a golden story's and a paid
// story's clip ring with sleigh bells, to the speaker and into the recording.
// Owner request 2026-11-26: and say "ho-ho-ho" aloud as the balloon goes up,
// where the deployment has the voice.
describe('the clip’s sound: sleigh bells and the ho-ho-ho', () => {
  const TRACK = { kind: 'audio', id: 'sound' } as unknown as MediaStreamTrack;
  const BELLS_BYTES = new ArrayBuffer(8);
  const VOICE_BYTES = new ArrayBuffer(4);
  const BELLS = { duration: 5 };
  const VOICE = { duration: 1.5 };
  // The audio clock when the recording starts.
  const NOW = 2;
  let contexts: FakeAudioContext[];
  let stream: { addTrack: ReturnType<typeof vi.fn>; removeTrack: ReturnType<typeof vi.fn> };
  let fetchMock: ReturnType<typeof vi.fn>;
  let recorderMimes: string[];
  /** What the server has at the character's `sounds/ho-ho-ho-….mp3`. */
  let voice: 'there' | 'missing' | 'not a sound';

  interface FakeSource {
    buffer: unknown;
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  }

  interface FakeGain {
    gain: {
      setValueAtTime: ReturnType<typeof vi.fn>;
      linearRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
  }

  class FakeAudioContext {
    currentTime = NOW;
    destination = { node: 'speaker' };
    resume = vi.fn(() => Promise.resolve());
    close = vi.fn(() => Promise.resolve());
    decodeAudioData = vi.fn((bytes: ArrayBuffer) => {
      if (bytes === BELLS_BYTES) return Promise.resolve(BELLS);
      if (voice === 'there') return Promise.resolve(VOICE);
      return Promise.reject(new Error('EncodingError'));
    });
    streamDestination = { stream: { getAudioTracks: () => [TRACK] } };
    createMediaStreamDestination = vi.fn(() => this.streamDestination);
    sources: FakeSource[] = [];
    gains: FakeGain[] = [];
    createBufferSource = vi.fn(() => {
      const source: FakeSource = { buffer: null, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
      this.sources.push(source);
      return source;
    });
    createGain = vi.fn((): FakeGain => {
      const gain: FakeGain = {
        gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      };
      this.gains.push(gain);
      return gain;
    });
    constructor() {
      contexts.push(this);
    }
    /** The source playing `buffer`. */
    playing(buffer: unknown): FakeSource | undefined {
      return this.sources.find((source) => source.buffer === buffer);
    }
  }

  class OpusRecorder extends FakeMediaRecorder {
    static override isTypeSupported(mime: string): boolean {
      return mime === 'video/webm;codecs=vp9' || mime === 'video/webm;codecs=vp9,opus';
    }
    constructor(s: unknown, opts: { mimeType: string }) {
      super(s, opts);
      recorderMimes.push(opts.mimeType);
    }
  }

  beforeEach(() => {
    installCanvasStub();
    installRecorderEnv();
    contexts = [];
    recorderMimes = [];
    voice = 'there';
    // The reindeer has the first festive clip, so the first voice is the reindeer's.
    resetCharacterTurn();
    vi.spyOn(Math, 'random').mockReturnValue(0.2);
    stream = { addTrack: vi.fn(), removeTrack: vi.fn() };
    (HTMLCanvasElement.prototype as unknown as { captureStream: () => unknown }).captureStream =
      vi.fn(() => stream);
    vi.stubGlobal('MediaRecorder', OpusRecorder);
    vi.stubGlobal('AudioContext', FakeAudioContext);
    fetchMock = vi.fn((url: string) => {
      const isVoice = url.includes('ho-ho-ho');
      if (isVoice && voice === 'missing') return Promise.resolve({ ok: false, status: 404 });
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(isVoice ? VOICE_BYTES : BELLS_BYTES),
      });
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetCharacterTurn();
  });

  it.each([
    ['a golden story', { golden: true }],
    ['a paid story', { paid: true }],
  ])('rings in %s, to the speaker and into the recording', async (_name, flags) => {
    const file = await buildWobbleVideoFile({ ...story, ...flags, ending: null });
    expect(contexts).toHaveLength(1);
    const ctx = contexts[0]!;
    expect(ctx.resume).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith('/sounds/sleigh-bells.mp3');
    expect(stream.addTrack).toHaveBeenCalledWith(TRACK);
    expect(recorderMimes).toEqual(['video/webm;codecs=vp9,opus']);
    expect(file.type).toBe('video/webm;codecs=vp9,opus');
    expect(file.name).toBe('funny-stories-Mika.webm');
    const ring = ctx.playing(BELLS)!;
    // From the clip's first frame.
    expect(ring.start.mock.calls).toEqual([[]]);
    expect(ctx.close).toHaveBeenCalledTimes(1);
  });

  it('says ho-ho-ho as the balloon goes up, 3 s in, to the speaker and into the recording', async () => {
    await buildWobbleVideoFile({ ...story, golden: true, ending: null });
    const ctx = contexts[0]!;
    expect(fetchMock).toHaveBeenCalledWith('/sounds/ho-ho-ho-reindeer.mp3');
    expect(ctx.sources).toHaveLength(2);
    const say = ctx.playing(VOICE)!;
    expect(say.connect).toHaveBeenCalledWith(ctx.destination);
    expect(say.connect).toHaveBeenCalledWith(ctx.streamDestination);
    expect(say.start.mock.calls).toEqual([[NOW + 3]]);
    // Everything stops with the clip.
    expect(say.stop).toHaveBeenCalledTimes(1);
    expect(ctx.playing(BELLS)!.stop).toHaveBeenCalledTimes(1);
  });

  // Owner request 2026-11-26: Santa's voice is low, the reindeer's a high cartoon one.
  it('gives each character its own voice: the reindeer’s, then the Santa’s', async () => {
    const voices = (): unknown[] =>
      fetchMock.mock.calls.map(([url]) => url).filter((url) => String(url).includes('ho-ho-ho'));
    await buildWobbleVideoFile({ ...story, golden: true, ending: null });
    expect(voices()).toEqual(['/sounds/ho-ho-ho-reindeer.mp3']);
    await buildWobbleVideoFile({ ...story, paid: true, ending: null });
    expect(voices()).toEqual(['/sounds/ho-ho-ho-reindeer.mp3', '/sounds/ho-ho-ho-santa.mp3']);
  });

  it('turns the bells down under the voice and up again after it', async () => {
    await buildWobbleVideoFile({ ...story, paid: true, ending: null });
    const ctx = contexts[0]!;
    expect(ctx.gains).toHaveLength(1);
    const duck = ctx.gains[0]!;
    // The bells reach the speaker and the recording through the gain alone.
    const ring = ctx.playing(BELLS)!;
    expect(ring.connect.mock.calls).toEqual([[duck]]);
    expect(duck.connect).toHaveBeenCalledWith(ctx.destination);
    expect(duck.connect).toHaveBeenCalledWith(ctx.streamDestination);
    // Full until just before the voice at 3 s, low for its 1.5 s, then back.
    const at = NOW + 3;
    expect(duck.gain.setValueAtTime.mock.calls).toEqual([
      [1, expect.closeTo(at - 0.15, 5)],
      [0.3, expect.closeTo(at + 1.5, 5)],
    ]);
    expect(duck.gain.linearRampToValueAtTime.mock.calls).toEqual([
      [0.3, expect.closeTo(at, 5)],
      [1, expect.closeTo(at + 1.8, 5)],
    ]);
  });

  // A deployment without the voice — and a host that answers a missing file
  // with its start page — rings as it did before there was one.
  it.each([['missing'], ['not a sound']] as const)(
    'rings with the bells alone when the voice is %s',
    async (state) => {
      voice = state;
      const file = await buildWobbleVideoFile({ ...story, golden: true, ending: null });
      const ctx = contexts[0]!;
      expect(stream.addTrack).toHaveBeenCalledWith(TRACK);
      expect(file.type).toBe('video/webm;codecs=vp9,opus');
      expect(ctx.sources).toHaveLength(1);
      expect(ctx.gains).toHaveLength(0);
      const ring = ctx.sources[0]!;
      expect(ring.buffer).toBe(BELLS);
      expect(ring.connect).toHaveBeenCalledWith(ctx.destination);
      expect(ring.connect).toHaveBeenCalledWith(ctx.streamDestination);
      expect(ring.start).toHaveBeenCalledTimes(1);
    },
  );

  it('opens the sound before anything is awaited, inside the tap', async () => {
    const recording = buildWobbleVideoFile({ ...story, golden: true, ending: null });
    // Synchronously, before the first image has even started to load.
    expect(contexts).toHaveLength(1);
    await recording;
  });

  it.each([
    ['an ordinary story', {}],
    ['a slice story', { ending: { pictureUrl: null, text: 'Carols.' } }],
  ])('leaves %s silent', async (_name, extra) => {
    const file = await buildWobbleVideoFile({ ...story, ...extra });
    expect(contexts).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(stream.addTrack).not.toHaveBeenCalled();
    expect(file.type).toBe('video/webm;codecs=vp9');
  });

  it('records a silent clip when the bells cannot be fetched, voice or no voice', async () => {
    fetchMock.mockImplementation((url: string) =>
      url.includes('ho-ho-ho')
        ? Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(VOICE_BYTES) })
        : Promise.resolve({ ok: false, status: 404 }),
    );
    const file = await buildWobbleVideoFile({ ...story, golden: true, ending: null });
    expect(stream.addTrack).not.toHaveBeenCalled();
    expect(file.type).toBe('video/webm;codecs=vp9');
    expect(contexts[0]!.createBufferSource).not.toHaveBeenCalled();
    expect(contexts[0]!.close).toHaveBeenCalledTimes(1);
  });

  it('records a silent clip in a browser without Web Audio', async () => {
    vi.stubGlobal('AudioContext', undefined);
    const file = await buildWobbleVideoFile({ ...story, paid: true, ending: null });
    expect(stream.addTrack).not.toHaveBeenCalled();
    expect(file.type).toBe('video/webm;codecs=vp9');
  });

  it('records the picture alone when the browser refuses to record the sound', async () => {
    vi.stubGlobal(
      'MediaRecorder',
      class extends OpusRecorder {
        constructor(s: unknown, opts: { mimeType: string }) {
          if (opts.mimeType.includes('opus')) throw new Error('NotSupportedError');
          super(s, opts);
        }
      },
    );
    const file = await buildWobbleVideoFile({ ...story, golden: true, ending: null });
    expect(stream.removeTrack).toHaveBeenCalledWith(TRACK);
    expect(file.type).toBe('video/webm;codecs=vp9');
    expect(contexts[0]!.createBufferSource).not.toHaveBeenCalled();
  });

  it('keeps the bells at full strength if the voice cannot be scheduled', async () => {
    vi.stubGlobal(
      'AudioContext',
      class extends FakeAudioContext {
        override createGain = vi.fn((): FakeGain => {
          throw new Error('NotSupportedError');
        });
      },
    );
    await buildWobbleVideoFile({ ...story, golden: true, ending: null });
    const ctx = contexts[0]!;
    const ring = ctx.playing(BELLS)!;
    expect(ring.connect).toHaveBeenCalledWith(ctx.destination);
    expect(ring.connect).toHaveBeenCalledWith(ctx.streamDestination);
    expect(ring.start).toHaveBeenCalledTimes(1);
    expect(ctx.playing(VOICE)).toBeUndefined();
  });
});
