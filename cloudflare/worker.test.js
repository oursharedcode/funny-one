// SPDX-License-Identifier: AGPL-3.0-only
//
// T-4.1 — the image Worker (design §7.2).
//
// SRC shipped its Worker untested: it was a thin pass-through to Workers AI,
// and the only thing it could get wrong was already visible as a missing
// picture. This one holds the cache, and its failures are quiet — a key that
// shifts between deploys orphans every image ever generated, a hit that
// reports `cached:false` spends a daily slot that was never needed (§7.3), and
// a bumped counter on a hit inflates the number players are shown.
//
// The Worker is a plain `fetch(request, env)` export against three bindings, so
// none of that needs miniflare: the fakes below are the whole environment, and
// each one records what the real binding would have been asked to do.

import { describe, expect, it, vi } from 'vitest';
import worker from './worker.js';

const SECRET = 'shared-secret';
const ORIGIN = 'https://img.example';

// A pinned vector for the cache key. If this ever changes without the prompt
// changing, every image in R2 has been orphaned — which is the failure this
// file exists to make loud.
const PROMPT = 'a grumpy pirate and a haunted toaster';
const PROMPT_HASH = '789ff52274636120e03020e13267cd84c1fd4ac2c5a65f5519cbb93686221d18';
const PROMPT_KEY = `i/${PROMPT_HASH}.png`;

// ---------------------------------------------------------------------------
// Fake bindings
// ---------------------------------------------------------------------------

/** 24 bytes: signature, IHDR length and type, then the two size fields. */
function pngBytes(width, height) {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13); // IHDR payload length
  bytes.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

/** SOI, a JFIF APP0 segment to be skipped over, then the SOF0 frame header. */
function jpegBytes(width, height) {
  const bytes = new Uint8Array(2 + 18 + 19);
  const view = new DataView(bytes.buffer);
  bytes.set([0xff, 0xd8], 0); // SOI
  bytes.set([0xff, 0xe0], 2); // APP0
  view.setUint16(4, 16); // length, covering the 14 filler bytes that follow
  bytes.set([0xff, 0xc0], 20); // SOF0
  view.setUint16(22, 17); // length
  bytes[24] = 8; // sample precision
  view.setUint16(25, height);
  view.setUint16(27, width);
  return bytes;
}

function base64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

function fakeR2() {
  const store = new Map();
  const object = (key, record, withBody) => ({
    httpEtag: `"${key}"`,
    customMetadata: record.customMetadata,
    writeHttpMetadata(headers) {
      const { contentType, cacheControl } = record.httpMetadata ?? {};
      if (contentType) headers.set('Content-Type', contentType);
      if (cacheControl) headers.set('Cache-Control', cacheControl);
    },
    ...(withBody ? { body: record.bytes } : {}),
  });
  return {
    store,
    head: vi.fn(async (key) => {
      const record = store.get(key);
      return record ? object(key, record, false) : null;
    }),
    get: vi.fn(async (key) => {
      const record = store.get(key);
      return record ? object(key, record, true) : null;
    }),
    put: vi.fn(async (key, bytes, options = {}) => {
      store.set(key, {
        bytes,
        httpMetadata: options.httpMetadata,
        customMetadata: options.customMetadata,
      });
    }),
  };
}

function fakeKV() {
  const store = new Map();
  return {
    store,
    get: vi.fn(async (key) => store.get(key) ?? null),
    put: vi.fn(async (key, value) => {
      store.set(key, value);
    }),
  };
}

function fakeAI(bytes = jpegBytes(1024, 768)) {
  return { run: vi.fn(async () => ({ image: base64(bytes) })) };
}

function makeEnv(overrides = {}) {
  return {
    WORKER_SECRET: SECRET,
    AI: fakeAI(),
    IMAGES: fakeR2(),
    STATS_KV: fakeKV(),
    ...overrides,
  };
}

/** One request through the Worker. `secret: null` sends no header at all. */
function call(env, path, { secret = SECRET } = {}) {
  const headers = secret === null ? {} : { 'X-Secret': secret };
  return worker.fetch(new Request(`${ORIGIN}${path}`, { headers }), env);
}

function generate(env, prompt = PROMPT) {
  return call(env, `/generate?prompt=${encodeURIComponent(prompt)}`);
}

/** Seed R2 as a previous generation would have left it. */
function seed(env, { key = PROMPT_KEY, bytes = jpegBytes(1024, 768), width, height } = {}) {
  env.IMAGES.store.set(key, {
    bytes,
    httpMetadata: {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000, immutable',
    },
    customMetadata:
      width === undefined ? undefined : { width: String(width), height: String(height) },
  });
}

// ---------------------------------------------------------------------------

describe('the shared secret', () => {
  for (const path of ['/generate?prompt=x', '/exists?prompt=x', '/stats', '/nope']) {
    it(`rejects ${path} without a secret`, async () => {
      const env = makeEnv();
      const res = await call(env, path, { secret: null });
      expect(res.status).toBe(403);
      // Nothing behind the gate was touched.
      expect(env.AI.run).not.toHaveBeenCalled();
      expect(env.IMAGES.head).not.toHaveBeenCalled();
    });
  }

  it('rejects a wrong secret', async () => {
    const res = await call(makeEnv(), '/stats', { secret: 'not-it' });
    expect(res.status).toBe(403);
  });

  it('leaves the image route open, since a phone has no secret to present', async () => {
    const env = makeEnv();
    seed(env);
    const res = await call(env, `/${PROMPT_KEY}`, { secret: null });
    expect(res.status).toBe(200);
  });

  it('answers an unknown authenticated route with 404', async () => {
    expect((await call(makeEnv(), '/whatever')).status).toBe(404);
  });
});

describe('the cache key', () => {
  it('is the sha256 of the prompt, hex, under i/', async () => {
    const env = makeEnv();
    await generate(env);
    expect([...env.IMAGES.store.keys()]).toEqual([PROMPT_KEY]);
  });

  it('is identical for the same prompt across calls', async () => {
    const first = makeEnv();
    const second = makeEnv();
    await generate(first);
    await generate(second);
    expect([...second.IMAGES.store.keys()]).toEqual([...first.IMAGES.store.keys()]);
  });

  it('differs for a prompt differing by one character', async () => {
    const env = makeEnv();
    await generate(env, PROMPT);
    await generate(env, `${PROMPT}.`);
    expect(env.IMAGES.store.size).toBe(2);
  });

  it('hashes the prompt as UTF-8, so non-ASCII prompts are addressable', async () => {
    // Prompt fragments are English (DD-4), but nothing in the Worker enforces
    // that, and a TextEncoder mismatch would silently split the cache.
    const env = makeEnv();
    const res = await generate(env, 'пират');
    expect(res.status).toBe(200);
    expect([...env.IMAGES.store.keys()][0]).toMatch(/^i\/[0-9a-f]{64}\.png$/);
  });
});

describe('GET /generate', () => {
  it('generates on a miss and reports it as uncached', async () => {
    const env = makeEnv();
    const body = await (await generate(env)).json();

    expect(env.AI.run).toHaveBeenCalledTimes(1);
    expect(body).toEqual({
      url: `${ORIGIN}/${PROMPT_KEY}`,
      width: 1024,
      height: 768,
      cached: false,
    });
  });

  it('never raises the step count above the free-tier minimum', async () => {
    // Spec §18: 4 steps is the whole cost model. Raising it is the one change
    // here that costs money without failing anything.
    const env = makeEnv();
    await generate(env);
    expect(env.AI.run).toHaveBeenCalledWith('@cf/black-forest-labs/flux-1-schnell', {
      prompt: PROMPT,
      steps: 4,
    });
  });

  it('stores the bytes with an immutable cache header and its true type', async () => {
    const env = makeEnv();
    await generate(env);
    const [, bytes, options] = env.IMAGES.put.mock.calls[0];
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(options.httpMetadata).toEqual({
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000, immutable',
    });
  });

  it('labels PNG bytes as PNG rather than assuming the usual JPEG', async () => {
    const env = makeEnv({ AI: fakeAI(pngBytes(800, 600)) });
    const body = await (await generate(env)).json();
    expect(env.IMAGES.put.mock.calls[0][2].httpMetadata.contentType).toBe('image/png');
    expect(body).toMatchObject({ width: 800, height: 600 });
  });

  it('serves a hit without calling the model', async () => {
    const env = makeEnv();
    seed(env, { width: 1024, height: 768 });
    const body = await (await generate(env)).json();

    expect(env.AI.run).not.toHaveBeenCalled();
    expect(env.IMAGES.put).not.toHaveBeenCalled();
    expect(body).toEqual({
      url: `${ORIGIN}/${PROMPT_KEY}`,
      width: 1024,
      height: 768,
      cached: true,
    });
  });

  it('reports cached:true when a second call lands after the first stored it', async () => {
    // The §7.3 refund path: the server reserved a slot after a miss on
    // /exists, and only this flag tells it the slot went unused.
    const env = makeEnv();
    const first = await (await generate(env)).json();
    const second = await (await generate(env)).json();

    expect(env.AI.run).toHaveBeenCalledTimes(1);
    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(second.url).toBe(first.url);
  });

  it('rejects a call with no prompt', async () => {
    const env = makeEnv();
    const res = await call(env, '/generate');
    expect(res.status).toBe(400);
    expect(env.AI.run).not.toHaveBeenCalled();
  });

  it('reports a model failure as 502 and stores nothing', async () => {
    const env = makeEnv({
      AI: { run: vi.fn(async () => Promise.reject(new Error('overloaded'))) },
    });
    const res = await generate(env);
    expect(res.status).toBe(502);
    expect(env.IMAGES.store.size).toBe(0);
    expect(env.STATS_KV.put).not.toHaveBeenCalled();
  });

  it('reports an unexpected model response as 502 rather than caching it', async () => {
    const env = makeEnv({ AI: { run: vi.fn(async () => ({ images: ['wrong shape'] })) } });
    const res = await generate(env);
    expect(res.status).toBe(502);
    expect(env.IMAGES.store.size).toBe(0);
  });

  it('fails rather than returning a URL it could not store', async () => {
    // Reporting success here would hand every phone in the room a 404.
    const env = makeEnv();
    env.IMAGES.put = vi.fn(async () => Promise.reject(new Error('bucket gone')));
    const res = await generate(env);
    expect(res.status).toBe(502);
    expect(env.STATS_KV.put).not.toHaveBeenCalled();
  });
});

describe('the generation switch', () => {
  // No `AI` binding is how a deployment with a complete library runs
  // (wrangler.toml): the secret alone must not be able to spend anything.
  it('answers a miss with 503 and stores nothing when the AI binding is absent', async () => {
    const env = makeEnv({ AI: undefined });
    const res = await generate(env);

    expect(res.status).toBe(503);
    expect(await res.text()).toMatch(/switched off/);
    expect(env.IMAGES.put).not.toHaveBeenCalled();
    expect(env.STATS_KV.put).not.toHaveBeenCalled();
  });

  it('still serves every picture that exists, on all three routes', async () => {
    const env = makeEnv({ AI: undefined });
    seed(env, { width: 1024, height: 768 });
    const hit = { url: `${ORIGIN}/${PROMPT_KEY}`, width: 1024, height: 768, cached: true };

    expect(await (await generate(env)).json()).toEqual(hit);
    const probe = await call(env, `/exists?prompt=${encodeURIComponent(PROMPT)}`);
    expect(await probe.json()).toEqual(hit);
    expect((await call(env, `/${PROMPT_KEY}`, { secret: null })).status).toBe(200);
  });

  it('reports its state on /stats, so reading it costs nothing', async () => {
    const on = await (await call(makeEnv(), '/stats')).json();
    const off = await (await call(makeEnv({ AI: undefined }), '/stats')).json();
    expect(on.generation).toBe(true);
    expect(off.generation).toBe(false);
  });
});

describe('GET /exists', () => {
  it('reports a miss without generating anything', async () => {
    const env = makeEnv();
    const res = await call(env, `/exists?prompt=${encodeURIComponent(PROMPT)}`);

    expect(await res.json()).toEqual({ cached: false });
    expect(env.AI.run).not.toHaveBeenCalled();
    expect(env.IMAGES.put).not.toHaveBeenCalled();
  });

  it('returns the URL and dimensions on a hit, so the server can skip the cap', async () => {
    const env = makeEnv();
    seed(env, { width: 1024, height: 768 });
    const res = await call(env, `/exists?prompt=${encodeURIComponent(PROMPT)}`);

    expect(await res.json()).toEqual({
      url: `${ORIGIN}/${PROMPT_KEY}`,
      width: 1024,
      height: 768,
      cached: true,
    });
    expect(env.AI.run).not.toHaveBeenCalled();
  });

  it('agrees with /generate about the key', async () => {
    const env = makeEnv();
    await generate(env);
    const probe = await (await call(env, `/exists?prompt=${encodeURIComponent(PROMPT)}`)).json();
    expect(probe.cached).toBe(true);
    expect(probe.url).toBe(`${ORIGIN}/${PROMPT_KEY}`);
  });

  it('rejects a call with no prompt', async () => {
    expect((await call(makeEnv(), '/exists')).status).toBe(400);
  });
});

describe('GET /i/<hash>.png', () => {
  it('serves the stored bytes with immutable caching and open CORS', async () => {
    // CORS matters: the download/share path re-reads this image through a
    // canvas (§8.3), and a tainted canvas cannot be exported.
    const env = makeEnv();
    seed(env);
    const res = await call(env, `/${PROMPT_KEY}`, { secret: null });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('ETag')).toBeTruthy();
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(jpegBytes(1024, 768));
  });

  it('round-trips what /generate stored', async () => {
    const env = makeEnv();
    const { url } = await (await generate(env)).json();
    const res = await call(env, new URL(url).pathname, { secret: null });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
  });

  it('404s an image that was never generated', async () => {
    const env = makeEnv();
    const res = await call(env, `/i/${'0'.repeat(64)}.png`, { secret: null });
    expect(res.status).toBe(404);
  });

  it('404s a key it could not have written, without asking R2', async () => {
    const env = makeEnv();
    const res = await call(env, '/i/not-a-hash.png', { secret: null });
    expect(res.status).toBe(404);
    expect(env.IMAGES.get).not.toHaveBeenCalled();
  });
});

describe('the daily counter', () => {
  it('bumps once per generation', async () => {
    const env = makeEnv();
    await generate(env);
    await generate(env, `${PROMPT} in a lighthouse`);
    const stats = await (await call(env, '/stats')).json();
    expect(stats.count).toBe(2);
    expect(stats.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('does not bump on a cache hit', async () => {
    // The counter is what players are shown and what the daily cap tracks; a
    // hit costs nothing, so counting it would price a free image.
    const env = makeEnv();
    await generate(env);
    await generate(env);
    expect((await (await call(env, '/stats')).json()).count).toBe(1);
  });

  it('reports zero when KV is not configured', async () => {
    const env = makeEnv({ STATS_KV: undefined });
    expect(await (await call(env, '/stats')).json()).toMatchObject({ count: 0 });
  });

  it('generates fine without KV at all', async () => {
    // The binding is optional by deliberate choice (wrangler.toml), so an
    // account that skipped it must still get pictures.
    const env = makeEnv({ STATS_KV: undefined });
    const res = await generate(env);
    expect(res.status).toBe(200);
    expect((await res.json()).cached).toBe(false);
  });

  it('survives a KV write failure', async () => {
    const kv = fakeKV();
    kv.put = vi.fn(async () => Promise.reject(new Error('KV down')));
    const env = makeEnv({ STATS_KV: kv });
    const res = await generate(env);
    expect(res.status).toBe(200);
    expect(env.IMAGES.store.size).toBe(1);
  });

  it('treats a corrupted counter as zero rather than NaN', async () => {
    const kv = fakeKV();
    kv.store.set(`count:${new Date().toISOString().slice(0, 10)}`, 'banana');
    const env = makeEnv({ STATS_KV: kv });
    await generate(env);
    expect((await (await call(env, '/stats')).json()).count).toBe(1);
  });
});

describe('dimensions', () => {
  it('reads them from the bytes rather than assuming the model default', async () => {
    const env = makeEnv({ AI: fakeAI(jpegBytes(640, 1136)) });
    expect(await (await generate(env)).json()).toMatchObject({ width: 640, height: 1136 });
  });

  it('carries them into R2, so a later hit reports the same numbers', async () => {
    const env = makeEnv({ AI: fakeAI(jpegBytes(640, 1136)) });
    const fresh = await (await generate(env)).json();
    const hit = await (await generate(env)).json();
    expect(hit).toEqual({ ...fresh, cached: true });
  });

  it('falls back to the documented model output when the bytes are unreadable', async () => {
    // A picture with implausible dimensions is better than no picture: the
    // fallback only skews RevealScreen's reserved space.
    const env = makeEnv({ AI: fakeAI(new Uint8Array([1, 2, 3, 4])) });
    expect(await (await generate(env)).json()).toMatchObject({ width: 1024, height: 768 });
  });

  it('falls back for a cached object stored without dimensions', async () => {
    const env = makeEnv();
    seed(env); // no customMetadata
    expect(await (await generate(env)).json()).toMatchObject({
      width: 1024,
      height: 768,
      cached: true,
    });
  });
});
