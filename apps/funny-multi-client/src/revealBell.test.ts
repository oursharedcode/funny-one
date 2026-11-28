// SPDX-License-Identifier: AGPL-3.0-only
//
// Step 133 (B-29 #9, D3 A): the golden story's bell. A fake AudioContext
// stands in for the browser's, which jsdom lacks.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FADE_FROM_S,
  LATE_MS,
  REVEAL_BELL_VOLUME,
  RING_S,
  __resetRevealBellForTest,
  coolRevealBell,
  ringRevealBell,
  wakeRevealBell,
  warmRevealBell,
} from './revealBell';

const BELLS = { duration: 5 };
const BELLS_BYTES = new ArrayBuffer(8);
/** The audio clock when the bell rings. */
const NOW = 3;

interface FakeSource {
  buffer: unknown;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  onended: (() => void) | null;
}

interface FakeGain {
  gain: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

let contexts: FakeAudioContext[];
let fetchMock: ReturnType<typeof vi.fn>;
/** Whether the browser lets the context run. */
let allowed: boolean;

class FakeAudioContext {
  state: 'running' | 'suspended' = 'suspended';
  currentTime = NOW;
  sampleRate = 48000;
  destination = { node: 'speaker' };
  resume = vi.fn(() => {
    if (!allowed) return new Promise<void>(() => {});
    this.state = 'running';
    return Promise.resolve();
  });
  suspend = vi.fn(() => {
    this.state = 'suspended';
    return Promise.resolve();
  });
  createBuffer = vi.fn(() => ({ silence: true }));
  decodeAudioData = vi.fn((bytes: ArrayBuffer) =>
    bytes === BELLS_BYTES ? Promise.resolve(BELLS) : Promise.reject(new Error('EncodingError')),
  );
  sources: FakeSource[] = [];
  gains: FakeGain[] = [];
  createBufferSource = vi.fn(() => {
    const source: FakeSource = {
      buffer: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      onended: null,
    };
    this.sources.push(source);
    return source;
  });
  createGain = vi.fn(() => {
    const gain: FakeGain = {
      gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    this.gains.push(gain);
    return gain;
  });
  constructor() {
    contexts.push(this);
  }
  /** The sources playing the bells, not the silent sample. */
  rings(): FakeSource[] {
    return this.sources.filter((s) => s.buffer === BELLS);
  }
}

/** Lets every settled promise's callbacks run. */
async function flush(): Promise<void> {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

beforeEach(() => {
  __resetRevealBellForTest();
  contexts = [];
  allowed = true;
  vi.stubGlobal('AudioContext', FakeAudioContext);
  fetchMock = vi.fn(() =>
    Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(BELLS_BYTES) }),
  );
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('the reveal bell (Step 133, D3 A)', () => {
  it('is silent when no tap woke it', async () => {
    ringRevealBell({});
    await flush();
    expect(contexts).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('opens one context in the first tap, fetches the bells once, then lets it idle', async () => {
    wakeRevealBell();
    const ctx = contexts[0]!;
    // Inside the tap: resumed, and a silent sample started.
    expect(ctx.resume).toHaveBeenCalledTimes(1);
    expect(ctx.sources[0]!.buffer).toEqual({ silence: true });
    expect(ctx.sources[0]!.start).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith('/sounds/sleigh-bells.mp3');
    await flush();
    expect(ctx.suspend).toHaveBeenCalledTimes(1);
    expect(ctx.state).toBe('suspended');

    wakeRevealBell();
    wakeRevealBell();
    expect(contexts).toHaveLength(1);
    expect(ctx.resume).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rings the first 2.5 s softly, fading out, and idles again', async () => {
    wakeRevealBell();
    await flush();
    const ctx = contexts[0]!;
    ringRevealBell({});
    await flush();
    expect(ctx.resume).toHaveBeenCalledTimes(2);
    const [bell] = ctx.rings();
    expect(bell!.start).toHaveBeenCalledWith(NOW, 0, RING_S);
    const gain = ctx.gains[0]!;
    expect(bell!.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalledWith(ctx.destination);
    expect(gain.gain.setValueAtTime.mock.calls).toEqual([
      [REVEAL_BELL_VOLUME, NOW],
      [REVEAL_BELL_VOLUME, NOW + FADE_FROM_S],
    ]);
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, NOW + RING_S);
    expect(RING_S).toBeLessThan(3);
    // Still running while it rings; suspended once it has rung.
    expect(ctx.state).toBe('running');
    bell!.onended!();
    await flush();
    expect(ctx.state).toBe('suspended');
    expect(bell!.disconnect).toHaveBeenCalled();
  });

  it('rings once a reveal, however often it is asked', async () => {
    wakeRevealBell();
    await flush();
    const reveal = {};
    ringRevealBell(reveal);
    ringRevealBell(reveal);
    await flush();
    expect(contexts[0]!.rings()).toHaveLength(1);
    contexts[0]!.rings()[0]!.onended!();
    ringRevealBell(reveal);
    ringRevealBell({});
    await flush();
    expect(contexts[0]!.rings()).toHaveLength(2);
  });

  it('stays silent, with no error, where the phone refuses sound', async () => {
    vi.useFakeTimers();
    allowed = false;
    wakeRevealBell();
    await flush();
    const ctx = contexts[0]!;
    // Never allowed, so it is asked again at the next tap.
    wakeRevealBell();
    expect(ctx.resume).toHaveBeenCalledTimes(2);
    ringRevealBell({});
    await vi.advanceTimersByTimeAsync(LATE_MS);
    expect(ctx.rings()).toEqual([]);
  });

  it('stays silent when the bells cannot be had', async () => {
    fetchMock.mockImplementation(() => Promise.resolve({ ok: false, status: 404 }));
    wakeRevealBell();
    await flush();
    ringRevealBell({});
    await flush();
    expect(contexts[0]!.rings()).toEqual([]);
    expect(contexts[0]!.state).toBe('suspended');
  });

  it('does nothing in a browser without Web Audio', async () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(() => wakeRevealBell()).not.toThrow();
    expect(() => warmRevealBell()).not.toThrow();
    expect(() => ringRevealBell({})).not.toThrow();
    expect(() => coolRevealBell()).not.toThrow();
    await flush();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('the bell kept warm for a golden reveal (Step 133)', () => {
  /** A context a tap has woken, now idle. */
  async function woken(): Promise<FakeAudioContext> {
    wakeRevealBell();
    await flush();
    const ctx = contexts[0]!;
    expect(ctx.state).toBe('suspended');
    return ctx;
  }

  it('runs from the last round, and rings the moment the reveal opens', async () => {
    const ctx = await woken();
    warmRevealBell();
    expect(ctx.resume).toHaveBeenCalledTimes(2);
    await flush();
    expect(ctx.state).toBe('running');
    // Taps on a running context start nothing more.
    wakeRevealBell();
    expect(ctx.resume).toHaveBeenCalledTimes(2);

    ringRevealBell({});
    await flush();
    expect(ctx.resume).toHaveBeenCalledTimes(2);
    expect(ctx.rings()).toHaveLength(1);
    expect(ctx.rings()[0]!.start).toHaveBeenCalledWith(NOW, 0, RING_S);
    expect(ctx.suspend).toHaveBeenCalledTimes(1);
  });

  it('idles once it has rung, and taps do not start it again', async () => {
    const ctx = await woken();
    warmRevealBell();
    await flush();
    ringRevealBell({});
    await flush();
    ctx.rings()[0]!.onended!();
    await flush();
    expect(ctx.state).toBe('suspended');
    wakeRevealBell();
    expect(ctx.resume).toHaveBeenCalledTimes(2);
    // App cools it as the reveal closes: nothing changes.
    coolRevealBell();
    await flush();
    expect(ctx.state).toBe('suspended');
  });

  it('rings to its end, should the reveal close while it rings', async () => {
    const ctx = await woken();
    warmRevealBell();
    await flush();
    ringRevealBell({});
    await flush();
    coolRevealBell();
    await flush();
    expect(ctx.state).toBe('running');
    ctx.rings()[0]!.onended!();
    await flush();
    expect(ctx.state).toBe('suspended');
  });

  it('idles when cooled with no reveal rung', async () => {
    const ctx = await woken();
    warmRevealBell();
    await flush();
    coolRevealBell();
    await flush();
    expect(ctx.state).toBe('suspended');
    wakeRevealBell();
    expect(ctx.resume).toHaveBeenCalledTimes(2);
  });

  it('starts again at a tap, should the phone stop it while warm', async () => {
    const ctx = await woken();
    warmRevealBell();
    await flush();
    // An iPhone stops it for a call.
    ctx.state = 'suspended';
    wakeRevealBell();
    expect(ctx.resume).toHaveBeenCalledTimes(3);
    await flush();
    expect(ctx.state).toBe('running');
  });

  it('runs from the first tap, if warmed before any', async () => {
    warmRevealBell();
    expect(contexts).toEqual([]);
    wakeRevealBell();
    await flush();
    const ctx = contexts[0]!;
    expect(ctx.state).toBe('running');
    expect(ctx.suspend).not.toHaveBeenCalled();
  });
});
