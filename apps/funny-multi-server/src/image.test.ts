// SPDX-License-Identifier: AGPL-3.0-only
//
// T-4.3 — image.ts adapted for design §7.3's exists→reserve→generate→refund
// flow. The counter tests are close ports of SRC/server/src/image.test.ts
// (KV recovery, vol02 follow-up to BUGS_AND_IMPROVEMENTS_01.md item 22); the
// rest is new, covering what SRC never had: a cache that can make a
// reservation unnecessary after the fact.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ImageCapReachedError,
  __resetImageCounterStateForTests,
  generateImage,
  imagesGeneratedToday,
  liveGeneration,
  maybeSyncImageCounter,
  releaseImageSlot,
  reserveImageSlot,
  syncImageCounterFromWorker,
} from './image.js';

const todayKey = new Date().toISOString().slice(0, 10);

function mockFetchOk(payload: unknown) {
  return vi.fn(
    async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
}

beforeEach(() => {
  __resetImageCounterStateForTests();
  process.env.CLOUDFLARE_WORKER_URL = 'https://worker.example.com';
  process.env.CLOUDFLARE_WORKER_SECRET = 'shh';
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete process.env.CLOUDFLARE_WORKER_URL;
  delete process.env.CLOUDFLARE_WORKER_SECRET;
  delete process.env.MAX_IMAGES_PER_DAY;
});

describe('image counter — KV persistence (ported from SRC, vol02 follow-up to item 22)', () => {
  it('returns local count when worker has not been synced', () => {
    expect(imagesGeneratedToday()).toBe(0);
    reserveImageSlot();
    reserveImageSlot();
    expect(imagesGeneratedToday()).toBe(2);
  });

  it('returns max(local, worker) — KV value wins after a server restart', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ date: todayKey, count: 17 }));
    await syncImageCounterFromWorker();
    expect(imagesGeneratedToday()).toBe(17);
  });

  it('returns local count when local exceeds worker (in-session generation)', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ date: todayKey, count: 5 }));
    await syncImageCounterFromWorker();
    expect(imagesGeneratedToday()).toBe(5);
    for (let i = 0; i < 8; i++) reserveImageSlot();
    expect(imagesGeneratedToday()).toBe(8);
  });

  it('cap reservation uses max(local, worker) — cold-started process correctly refuses when KV is already at the limit', async () => {
    process.env.MAX_IMAGES_PER_DAY = '25';
    vi.stubGlobal('fetch', mockFetchOk({ date: todayKey, count: 25 }));
    await syncImageCounterFromWorker();
    expect(reserveImageSlot()).toBe(false);
  });

  it('ignores a worker payload for a different UTC day (rollover safety)', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ date: '1999-12-31', count: 999 }));
    await syncImageCounterFromWorker();
    expect(imagesGeneratedToday()).toBe(0);
  });

  it('silently absorbs a worker fetch failure and leaves the counter unchanged', async () => {
    reserveImageSlot();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    await expect(syncImageCounterFromWorker()).resolves.toBeUndefined();
    expect(imagesGeneratedToday()).toBe(1);
  });

  it('silently absorbs a non-2xx response and leaves the counter unchanged', async () => {
    reserveImageSlot();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 })),
    );
    await syncImageCounterFromWorker();
    expect(imagesGeneratedToday()).toBe(1);
  });

  it('returns 0 with no fetch attempt when CLOUDFLARE_WORKER_URL is unset', async () => {
    delete process.env.CLOUDFLARE_WORKER_URL;
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await syncImageCounterFromWorker();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(imagesGeneratedToday()).toBe(0);
  });
});

describe('liveGeneration — the Worker’s generation switch (B-13)', () => {
  it('is false until a sync has heard from the Worker', () => {
    expect(liveGeneration()).toBe(false);
  });

  it('follows the switch the Worker reports', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ date: todayKey, count: 0, generation: true }));
    await syncImageCounterFromWorker();
    expect(liveGeneration()).toBe(true);

    vi.stubGlobal('fetch', mockFetchOk({ date: todayKey, count: 0, generation: false }));
    await syncImageCounterFromWorker();
    expect(liveGeneration()).toBe(false);
  });

  it('reads the switch even when the count belongs to another UTC day', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ date: '1999-12-31', count: 999, generation: true }));
    await syncImageCounterFromWorker();
    expect(liveGeneration()).toBe(true);
    expect(imagesGeneratedToday()).toBe(0);
  });

  it('takes a Worker that predates the switch as generating — that Worker always does', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ date: todayKey, count: 3 }));
    await syncImageCounterFromWorker();
    expect(liveGeneration()).toBe(true);
  });

  it('keeps the last known answer through a failed sync', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ date: todayKey, count: 0, generation: true }));
    await syncImageCounterFromWorker();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    await syncImageCounterFromWorker();
    expect(liveGeneration()).toBe(true);
  });

  it('is false with no Worker configured — nothing can be generated at all', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ date: todayKey, count: 0, generation: true }));
    await syncImageCounterFromWorker();
    delete process.env.CLOUDFLARE_WORKER_URL;
    await syncImageCounterFromWorker();
    expect(liveGeneration()).toBe(false);
  });
});

describe('maybeSyncImageCounter — TTL-bounded refresh (ported from SRC)', () => {
  it('hits the network on the first call', async () => {
    const fetchSpy = mockFetchOk({ date: todayKey, count: 3 });
    vi.stubGlobal('fetch', fetchSpy);
    await maybeSyncImageCounter();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(imagesGeneratedToday()).toBe(3);
  });

  it('skips the network on a follow-up call within the TTL window', async () => {
    const fetchSpy = mockFetchOk({ date: todayKey, count: 3 });
    vi.stubGlobal('fetch', fetchSpy);
    await maybeSyncImageCounter();
    await maybeSyncImageCounter();
    await maybeSyncImageCounter();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('releaseImageSlot — new in this repo (design §7.3 refund)', () => {
  it('decrements the local counter by one', () => {
    reserveImageSlot();
    reserveImageSlot();
    expect(imagesGeneratedToday()).toBe(2);
    releaseImageSlot();
    expect(imagesGeneratedToday()).toBe(1);
  });

  it('floors at zero rather than going negative', () => {
    expect(imagesGeneratedToday()).toBe(0);
    releaseImageSlot();
    releaseImageSlot();
    expect(imagesGeneratedToday()).toBe(0);
  });

  it('does not borrow against the new day when a refund lands after a UTC rollover', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-08-14T23:59:59.500Z'));
      reserveImageSlot();
      expect(imagesGeneratedToday()).toBe(1);

      vi.setSystemTime(new Date('2026-08-15T00:00:00.500Z'));
      // The reservation above belonged to the 14th; the 15th has generated
      // nothing yet. A refund that arrives late must not push the *new*
      // day's counter negative.
      releaseImageSlot();
      expect(imagesGeneratedToday()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

// ============================================================================
// generateImage — design §7.3's exists → reserve → generate → refund flow
// ============================================================================

const HIT = {
  cached: true,
  url: 'https://worker.example.com/i/abc.png',
  width: 1024,
  height: 1024,
};
const MISS = { cached: false };
const GENERATED = {
  cached: false,
  url: 'https://worker.example.com/i/def.png',
  width: 1024,
  height: 1024,
};

function okJson(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('generateImage — cache hit costs no slot', () => {
  it('returns the cached PictureRef from /exists without calling /generate or reserving', async () => {
    const fetchSpy = vi.fn(async (url: string | URL) => {
      expect(String(url)).toContain('/exists?prompt=');
      return okJson(HIT);
    });
    vi.stubGlobal('fetch', fetchSpy);

    const ref = await generateImage('a prompt');

    expect(ref).toEqual({ url: HIT.url, width: HIT.width, height: HIT.height });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(imagesGeneratedToday()).toBe(0);
  });
});

describe('generateImage — cache miss reserves then generates', () => {
  it('reserves a slot and returns the generated PictureRef on a genuine miss', async () => {
    const fetchSpy = vi.fn(async (url: string | URL) => {
      const s = String(url);
      if (s.includes('/exists')) return okJson(MISS);
      if (s.includes('/generate')) return okJson(GENERATED);
      throw new Error(`unexpected URL ${s}`);
    });
    vi.stubGlobal('fetch', fetchSpy);

    const ref = await generateImage('a prompt');

    expect(ref).toEqual({ url: GENERATED.url, width: GENERATED.width, height: GENERATED.height });
    expect(imagesGeneratedToday()).toBe(1);
  });

  it('throws ImageCapReachedError and never calls /generate when the cap is already hit', async () => {
    process.env.MAX_IMAGES_PER_DAY = '1';
    reserveImageSlot(); // fill the only slot

    const fetchSpy = vi.fn(async (url: string | URL) => {
      const s = String(url);
      if (s.includes('/exists')) return okJson(MISS);
      throw new Error(`must not call ${s}`);
    });
    vi.stubGlobal('fetch', fetchSpy);

    await expect(generateImage('a prompt')).rejects.toThrow(ImageCapReachedError);
    expect(imagesGeneratedToday()).toBe(1); // unchanged — no second reservation happened
  });
});

describe('generateImage — refund race (the reservation /exists could not prevent)', () => {
  it('refunds the reservation when /generate itself reports cached:true', async () => {
    // Probe misses, but by the time /generate runs another room has already
    // generated and cached the same prompt — the Worker's own head check
    // (worker.js serveGenerate) reports the hit.
    const fetchSpy = vi.fn(async (url: string | URL) => {
      const s = String(url);
      if (s.includes('/exists')) return okJson(MISS);
      if (s.includes('/generate')) return okJson(HIT);
      throw new Error(`unexpected URL ${s}`);
    });
    vi.stubGlobal('fetch', fetchSpy);

    const ref = await generateImage('a prompt');

    expect(ref).toEqual({ url: HIT.url, width: HIT.width, height: HIT.height });
    // Reserved then refunded — net zero, so a room right at the cap is not
    // blocked by a request that turned out to cost nothing.
    expect(imagesGeneratedToday()).toBe(0);
  });
});

describe('generateImage — /exists failure degrades to a miss, not a thrown error', () => {
  it('proceeds to reserve + generate when the probe itself fails', async () => {
    const fetchSpy = vi.fn(async (url: string | URL) => {
      const s = String(url);
      if (s.includes('/exists')) throw new Error('network down');
      if (s.includes('/generate')) return okJson(GENERATED);
      throw new Error(`unexpected URL ${s}`);
    });
    vi.stubGlobal('fetch', fetchSpy);

    const ref = await generateImage('a prompt');

    expect(ref).toEqual({ url: GENERATED.url, width: GENERATED.width, height: GENERATED.height });
    expect(imagesGeneratedToday()).toBe(1);
  });

  it('proceeds to reserve + generate when the probe returns a non-2xx status', async () => {
    const fetchSpy = vi.fn(async (url: string | URL) => {
      const s = String(url);
      if (s.includes('/exists')) return new Response('nope', { status: 500 });
      if (s.includes('/generate')) return okJson(GENERATED);
      throw new Error(`unexpected URL ${s}`);
    });
    vi.stubGlobal('fetch', fetchSpy);

    await generateImage('a prompt');
    expect(imagesGeneratedToday()).toBe(1);
  });
});

describe('generateImage — /generate failure keeps the reservation (attempts, not successes)', () => {
  it('retries once then throws after exhausting retries, without refunding the slot', async () => {
    const fetchSpy = vi.fn(async (url: string | URL) => {
      const s = String(url);
      if (s.includes('/exists')) return okJson(MISS);
      throw new Error('Worker unreachable');
    });
    vi.stubGlobal('fetch', fetchSpy);

    await expect(generateImage('a prompt')).rejects.toThrow('Worker unreachable');
    // /exists (1) + /generate attempts (1 initial + 2 retries = 3) = 4 calls.
    expect(fetchSpy).toHaveBeenCalledTimes(4);
    expect(imagesGeneratedToday()).toBe(1); // the reservation stands — not refunded on failure
  }, 10_000);

  it('succeeds after one retry', async () => {
    let generateAttempts = 0;
    const fetchSpy = vi.fn(async (url: string | URL) => {
      const s = String(url);
      if (s.includes('/exists')) return okJson(MISS);
      generateAttempts++;
      if (generateAttempts === 1) throw new Error('transient');
      return okJson(GENERATED);
    });
    vi.stubGlobal('fetch', fetchSpy);

    const ref = await generateImage('a prompt');
    expect(ref).toEqual({ url: GENERATED.url, width: GENERATED.width, height: GENERATED.height });
    expect(imagesGeneratedToday()).toBe(1);
  }, 10_000);
});

describe('generateImage — configuration and malformed responses', () => {
  it('throws without calling fetch when the Worker is not configured', async () => {
    delete process.env.CLOUDFLARE_WORKER_URL;
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await expect(generateImage('a prompt')).rejects.toThrow('Cloudflare Worker not configured');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('throws on a /generate response missing required fields, after exhausting retries', async () => {
    const fetchSpy = vi.fn(async (url: string | URL) => {
      const s = String(url);
      if (s.includes('/exists')) return okJson(MISS);
      return okJson({ cached: false, url: 'https://worker.example.com/i/x.png' }); // no width/height
    });
    vi.stubGlobal('fetch', fetchSpy);

    await expect(generateImage('a prompt')).rejects.toThrow(/unexpected response shape/);
    expect(imagesGeneratedToday()).toBe(1); // still not refunded — a malformed response is a failure
  }, 10_000);
});
