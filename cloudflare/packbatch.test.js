// SPDX-License-Identifier: AGPL-3.0-only
//
// B-29 — the pack batch (packbatch.mjs) and its local Worker
// (packbatch-worker.js).
//
// What a mistake here costs: a picture filed under a key the game never asks
// for is a hole in the edition nobody sees until a family plays it; a batch
// that redraws what it already holds pays twice; one that ignores a spent
// allocation or a wrong secret burns through 650 requests to learn nothing; a
// Worker that stores anything but WebP under an immutable header puts it on
// every CDN for a year. The fakes below are a Map for the bucket and a script
// of forced failures.

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_PROMPT_LENGTH } from '@funny/shared';
import batchWorker from './packbatch-worker.js';
import {
  FatalError,
  batchConfig,
  call,
  cropPictures,
  keepDraws,
  mergeManifest,
  packItems,
  parseArgs,
  productionConfig,
  productionKey,
  renameRetrying,
  runBatch,
  withKeys,
} from './packbatch.mjs';
import { MAX_ATTEMPTS } from './pregenerate.mjs';

const WEBP = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
]);

describe('packItems', () => {
  const items = packItems('chr26');

  it('is the 625 scenes and 25 aftermaths, each prompt distinct and within the cap', () => {
    expect(items.filter((it) => it.kind === 'scene')).toHaveLength(625);
    expect(items.filter((it) => it.kind === 'aftermath')).toHaveLength(25);
    expect(new Set(items.map((it) => it.prompt)).size).toBe(650);
    expect(new Set(items.map((it) => it.n)).size).toBe(650);
    expect(Math.max(...items.map((it) => it.prompt.length))).toBeLessThanOrEqual(MAX_PROMPT_LENGTH);
  });

  it('groups the scenes by character pair, 25 to a sheet, then one sheet of aftermaths', () => {
    const sheets = new Map();
    for (const it of items) sheets.set(it.sheet, [...(sheets.get(it.sheet) ?? []), it]);
    expect(sheets.size).toBe(26);
    for (const [name, members] of sheets) {
      expect(members).toHaveLength(25);
      if (name === 'chr26-aftermaths') continue;
      expect(new Set(members.map((it) => `${it.ids[0]} ${it.ids[1]}`)).size).toBe(1);
    }
    expect(items[0]).toMatchObject({ n: 'S001', file: 'scenes/S001.webp' });
    expect(items.at(-1)).toMatchObject({ n: 'A25', file: 'aftermaths/A25.webp' });
  });

  it('refuses a pack that does not exist', () => {
    expect(() => packItems('nope')).toThrow(FatalError);
  });
});

describe('productionKey', () => {
  it("is production worker.js's own key — the vector worker.test.js pins", async () => {
    await expect(productionKey('a grumpy pirate and a haunted toaster')).resolves.toBe(
      'i/789ff52274636120e03020e13267cd84c1fd4ac2c5a65f5519cbb93686221d18.png',
    );
  });
});

describe('mergeManifest', () => {
  const items = [{ n: 'S001', key: 'i/a.png', prompt: 'p' }];

  it("keeps a picture's draw history across runs", () => {
    expect(mergeManifest(items, null)[0].draws).toBe(0);
    const old = { items: [{ ...items[0], draws: 2, bytes: 123 }] };
    expect(mergeManifest(items, old)[0]).toMatchObject({ draws: 2, bytes: 123 });
  });

  it('stops when a drawn picture’s prompt has changed — the fragments are frozen', () => {
    const old = { items: [{ ...items[0], prompt: 'other', draws: 1 }] };
    expect(() => mergeManifest(items, old)).toThrow(/frozen/);
  });
});

describe('call', () => {
  const opts = (fetch) => ({ base: 'http://b', secret: 's', fetch, sleep: async () => {} });

  it('retries 429, 5xx and network errors, then succeeds', async () => {
    const answers = [
      () => new Response('slow', { status: 429 }),
      () => {
        throw new TypeError('fetch failed');
      },
      () => new Response('oops', { status: 503 }),
      () => Response.json({ ok: true }),
    ];
    const fetch = vi.fn(async () => answers.shift()());
    const res = await call(opts(fetch), 'GET', '/ping');
    expect(await res.json()).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(fetch.mock.calls[0][1].headers['X-Secret']).toBe('s');
  });

  it('gives up after MAX_ATTEMPTS', async () => {
    const fetch = vi.fn(async () => new Response('down', { status: 502 }));
    await expect(call(opts(fetch), 'GET', '/ping')).rejects.toThrow(FatalError);
    expect(fetch).toHaveBeenCalledTimes(MAX_ATTEMPTS);
  });

  it('never retries what retrying cannot fix: 403, 400, a spent allocation (402)', async () => {
    for (const status of [403, 400, 402]) {
      const fetch = vi.fn(async () => new Response('no', { status }));
      await expect(call(opts(fetch), 'POST', '/draw')).rejects.toThrow(`HTTP ${status}`);
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  });
});

describe('runBatch', () => {
  let out;
  beforeEach(() => {
    out = mkdtempSync(join(tmpdir(), 'packbatch-test-'));
  });
  afterEach(() => rmSync(out, { recursive: true, force: true }));

  const items = (count) =>
    Array.from({ length: count }, (_, i) => ({
      n: `S${String(i + 1).padStart(3, '0')}`,
      key: `i/${String(i).padStart(64, '0')}.png`,
      prompt: `prompt ${i}`,
      file: `scenes/S${String(i + 1).padStart(3, '0')}.webp`,
      draws: 0,
    }));

  function fakeApi({ stored = {}, drawFailures = [], putFailures = [] } = {}) {
    const bucket = new Map(Object.entries(stored));
    const drawn = [];
    let inFlight = 0;
    let peak = 0;
    const api = {
      head: vi.fn(async (key) => {
        const it = bucket.get(key);
        return it ? { exists: true, contentType: it.contentType } : { exists: false };
      }),
      get: vi.fn(async () => Buffer.from(WEBP)),
      draw: vi.fn(async (prompt) => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        await new Promise((r) => setTimeout(r, 1));
        inFlight--;
        const failure = drawFailures.shift();
        if (failure) throw failure;
        drawn.push(prompt);
        return Buffer.from('jpeg bytes');
      }),
      put: vi.fn(async (key, bytes, size) => {
        const failure = putFailures.shift();
        if (failure) throw failure;
        bucket.set(key, { contentType: 'image/webp', bytes, size });
        return { stored: key };
      }),
    };
    return { api, bucket, drawn, peak: () => peak };
  }

  const encode = async (src, dst) => {
    expect(readFileSync(src, 'utf8')).toBe('jpeg bytes');
    writeFileSync(dst, WEBP);
    return { width: 1024, height: 768, bytes: WEBP.length };
  };

  it('draws what is missing, skips stored WebP, and redraws a stored JPEG or PNG', async () => {
    const list = items(4);
    const fake = fakeApi({
      stored: {
        [list[0].key]: { contentType: 'image/webp' },
        [list[1].key]: { contentType: 'image/png' },
      },
    });
    const save = vi.fn();
    const summary = await runBatch(list, { api: fake.api, encode, out, save, log: () => {} });
    expect(summary).toMatchObject({ total: 4, existed: 1, drawn: 3, done: 4 });
    expect(fake.drawn.sort()).toEqual(['prompt 1', 'prompt 2', 'prompt 3']);
    expect(fake.api.put).toHaveBeenCalledWith(list[2].key, expect.any(Buffer), {
      width: 1024,
      height: 768,
      bytes: WEBP.length,
    });
    expect(save).toHaveBeenCalledTimes(3);
    expect(list[2]).toMatchObject({ draws: 1, width: 1024, height: 768 });
    expect(existsSync(join(out, list[2].file))).toBe(true);
    expect(readdirSync(join(out, 'tmp'))).toEqual([]);
  });

  it('never draws more than --limit, even four at a time', async () => {
    const fake = fakeApi();
    const summary = await runBatch(items(20), {
      api: fake.api,
      encode,
      out,
      limit: 5,
      log: () => {},
    });
    expect(summary).toMatchObject({ drawn: 5, missing: 15 });
    expect(fake.drawn).toHaveLength(5);
    expect(fake.peak()).toBeLessThanOrEqual(4);
  });

  it('status (a dry run) draws nothing and counts the holes', async () => {
    const list = items(3);
    const fake = fakeApi({ stored: { [list[0].key]: { contentType: 'image/webp' } } });
    const summary = await runBatch(list, {
      api: fake.api,
      encode,
      out,
      dryRun: true,
      log: () => {},
    });
    expect(summary).toMatchObject({ existed: 1, missing: 2, drawn: 0 });
    expect(fake.api.draw).not.toHaveBeenCalled();
  });

  it('--restore fetches a stored picture whose local copy is lost', async () => {
    const list = items(1);
    const fake = fakeApi({ stored: { [list[0].key]: { contentType: 'image/webp' } } });
    const summary = await runBatch(list, {
      api: fake.api,
      encode,
      out,
      dryRun: true,
      restore: true,
      log: () => {},
    });
    expect(summary.restored).toBe(1);
    expect(readFileSync(join(out, list[0].file))).toEqual(Buffer.from(WEBP));
  });

  it('a redraw overwrites the stored key and keeps the old local copy in rejected/', async () => {
    const [item] = items(1);
    item.draws = 1;
    const fake = fakeApi({ stored: { [item.key]: { contentType: 'image/webp' } } });
    const local = join(out, item.file);
    await runBatch([item], { api: fake.api, encode, out, log: () => {} }); // makes the dirs
    writeFileSync(local, 'first draw');
    const summary = await runBatch([item], {
      api: fake.api,
      encode,
      out,
      redraw: new Set([item.n]),
      log: () => {},
    });
    expect(summary.drawn).toBe(1);
    expect(fake.api.head).toHaveBeenCalledTimes(1); // only the first run asked
    expect(readFileSync(join(out, 'rejected', `${item.n}.draw1.webp`), 'utf8')).toBe('first draw');
    expect(item.draws).toBe(2);
  });

  it('stops at the first fatal error — a spent free allocation — and keeps what it paid for', async () => {
    const fake = fakeApi({ drawFailures: [null, new FatalError('HTTP 402 allocation spent')] });
    const save = vi.fn();
    const summary = await runBatch(items(10), {
      api: fake.api,
      encode,
      out,
      concurrency: 1,
      save,
      log: () => {},
    });
    expect(summary.fatal).toMatch(/S002: HTTP 402/);
    expect(summary.drawn).toBe(2); // counted when started
    expect(fake.drawn).toHaveLength(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(fake.api.draw).toHaveBeenCalledTimes(2);
  });

  it('a put that fails leaves the local copy matching the bucket', async () => {
    const [item] = items(1);
    item.draws = 1;
    const fake = fakeApi({ putFailures: [new FatalError('HTTP 403')] });
    await runBatch([], { api: fake.api, encode, out, log: () => {} }); // makes the dirs
    writeFileSync(join(out, item.file), 'first draw');
    const summary = await runBatch([item], {
      api: fake.api,
      encode,
      out,
      redraw: new Set([item.n]),
      log: () => {},
    });
    expect(summary.fatal).toMatch(/S001: HTTP 403/);
    expect(readFileSync(join(out, item.file), 'utf8')).toBe('first draw');
    expect(readdirSync(join(out, 'rejected'))).toEqual([]);
    expect(item.draws).toBe(1);
  });

  it('an unexpected error stops the batch like a fatal one, after the pictures in flight', async () => {
    const fake = fakeApi({ drawFailures: [new Error('EPERM: rename')] });
    const save = vi.fn();
    const summary = await runBatch(items(10), { api: fake.api, encode, out, save, log: () => {} });
    expect(summary.fatal).toMatch(/S001: Error: EPERM: rename/);
    expect(fake.drawn).toHaveLength(3); // the other three workers' pictures
    expect(save).toHaveBeenCalledTimes(3);
  });

  it.each([
    ['cut', { cropped: 'T', cutDraw: 7 }],
    ['kept', { kept: 'T', keptDraw: 3 }],
  ])(
    'a redraw of a %s picture makes it a fresh draw, keeping the copy apart',
    async (tag, marks) => {
      const [item] = items(1);
      Object.assign(item, { draws: 7 }, marks);
      mkdirSync(join(out, 'scenes'), { recursive: true });
      writeFileSync(join(out, item.file), `${tag} copy`);
      const fake = fakeApi();
      await runBatch([item], {
        api: fake.api,
        encode,
        out,
        redraw: new Set([item.n]),
        log: () => {},
      });
      expect(item).toMatchObject({ draws: 8 });
      for (const field of Object.keys(marks)) expect(item[field]).toBeUndefined();
      expect(readFileSync(join(out, 'rejected', `${item.n}.draw7.${tag}.webp`), 'utf8')).toBe(
        `${tag} copy`,
      );
    },
  );
});

describe('cropPictures', () => {
  let out;
  beforeEach(() => {
    out = mkdtempSync(join(tmpdir(), 'packbatch-crop-'));
    mkdirSync(join(out, 'scenes'));
  });
  afterEach(() => rmSync(out, { recursive: true, force: true }));

  const item = (n, extra = {}) => ({
    n,
    key: `i/${n.padStart(64, '0')}.png`,
    file: `scenes/${n}.webp`,
    draws: 7,
    ...extra,
  });
  const crop = vi.fn(async (src, dst) => {
    writeFileSync(dst, `cut ${readFileSync(src, 'utf8')}`);
    return { width: 1024, height: 1024, bytes: 9 };
  });
  const bucket = () => {
    const stored = new Map();
    return { stored, api: { put: vi.fn(async (key, bytes) => stored.set(key, String(bytes))) } };
  };

  it('stores the cut copy over its key and keeps the uncut one in rejected/', async () => {
    const list = [item('S097'), item('S109')];
    for (const it of list) writeFileSync(join(out, it.file), `signed ${it.n}`);
    const { stored, api } = bucket();
    const save = vi.fn();
    const now = () => 'T';
    expect(await cropPictures(list, { api, crop, out, save, now })).toEqual({ cropped: 2 });
    expect(stored.get(list[0].key)).toBe('cut signed S097');
    expect(readFileSync(join(out, 'scenes', 'S097.webp'), 'utf8')).toBe('cut signed S097');
    expect(readFileSync(join(out, 'rejected', 'S097.draw7.webp'), 'utf8')).toBe('signed S097');
    expect(list[1]).toMatchObject({
      cropped: 'T',
      cutDraw: 7,
      width: 1024,
      height: 1024,
      bytes: 9,
    });
    expect(save).toHaveBeenCalledTimes(2);
    expect(readdirSync(join(out, 'tmp'))).toEqual([]);
  });

  it('cuts an earlier draw when one is named, and the latest joins the rejected', async () => {
    const it1 = item('S197');
    mkdirSync(join(out, 'rejected'));
    writeFileSync(join(out, it1.file), 'draw 7, merged');
    writeFileSync(join(out, 'rejected', 'S197.draw1.webp'), 'draw 1, signed');
    const { stored, api } = bucket();
    const from = new Map([['S197', 1]]);
    await cropPictures([it1], { api, crop, out, from, now: () => 'T' });
    expect(stored.get(it1.key)).toBe('cut draw 1, signed');
    expect(readFileSync(join(out, it1.file), 'utf8')).toBe('cut draw 1, signed');
    expect(readFileSync(join(out, 'rejected', 'S197.draw7.webp'), 'utf8')).toBe('draw 7, merged');
    expect(readFileSync(join(out, 'rejected', 'S197.draw1.webp'), 'utf8')).toBe('draw 1, signed');
    expect(it1).toMatchObject({ cropped: 'T', cutDraw: 1, draws: 7 });
  });

  it('never cuts a picture twice, nor one with no file to cut, and stores nothing then', async () => {
    writeFileSync(join(out, 'scenes', 'S001.webp'), 'x');
    const { api } = bucket();
    const cut = (list, from) => cropPictures(list, { api, crop, out, from });
    await expect(cut([item('S001'), item('S002', { cropped: 'T' })])).rejects.toThrow(
      /already cut or kept: S002/,
    );
    await expect(cut([item('S001', { keptDraw: 2 })])).rejects.toThrow(/already cut or kept/);
    await expect(cut([item('S001'), item('S003')])).rejects.toThrow(/no local copy of S003/);
    for (const k of [0, 7, 9]) {
      await expect(cut([item('S001')], new Map([['S001', k]]))).rejects.toThrow(
        /no such earlier draw: S001/,
      );
    }
    await expect(cut([item('S001')], new Map([['S001', 2]]))).rejects.toThrow(
      /earlier draw is not in rejected\/: S001/,
    );
    expect(api.put).not.toHaveBeenCalled();
  });

  it('keeps an earlier draw as it was, and only one that is named', async () => {
    const it1 = item('A02', { draws: 12 });
    mkdirSync(join(out, 'rejected'));
    writeFileSync(join(out, it1.file), 'draw 12, people');
    writeFileSync(join(out, 'rejected', 'A02.draw9.webp'), 'draw 9, one passer-by');
    const { stored, api } = bucket();
    const copy = vi.fn(async (src, dst) => {
      writeFileSync(dst, readFileSync(src));
      return { width: 1024, height: 1024, bytes: 21 };
    });
    await expect(keepDraws([it1], { api, copy, out })).rejects.toThrow(/keep needs the draw/);
    expect(api.put).not.toHaveBeenCalled();
    const from = new Map([['A02', 9]]);
    expect(await keepDraws([it1], { api, copy, out, from, now: () => 'T' })).toEqual({ kept: 1 });
    expect(stored.get(it1.key)).toBe('draw 9, one passer-by');
    expect(readFileSync(join(out, it1.file), 'utf8')).toBe('draw 9, one passer-by');
    expect(readFileSync(join(out, 'rejected', 'A02.draw12.webp'), 'utf8')).toBe('draw 12, people');
    expect(it1).toMatchObject({ kept: 'T', keptDraw: 9, draws: 12, bytes: 21 });
    expect(it1.cropped).toBeUndefined();
  });

  it('a put that fails leaves the local copy matching the bucket', async () => {
    const it1 = item('S005');
    writeFileSync(join(out, it1.file), 'signed');
    const api = { put: vi.fn(async () => Promise.reject(new FatalError('HTTP 403'))) };
    await expect(cropPictures([it1], { api, crop, out })).rejects.toThrow('HTTP 403');
    expect(readFileSync(join(out, it1.file), 'utf8')).toBe('signed');
    expect(readdirSync(join(out, 'rejected'))).toEqual([]);
    expect(it1.cropped).toBeUndefined();
  });
});

describe('renameRetrying', () => {
  const locked = (code) => Object.assign(new Error(code), { code });

  it('waits out a lock that Windows holds for a moment', () => {
    const rename = vi
      .fn()
      .mockImplementationOnce(() => {
        throw locked('EPERM');
      })
      .mockImplementationOnce(() => {
        throw locked('EBUSY');
      });
    const wait = vi.fn();
    renameRetrying('a', 'b', { rename, wait });
    expect(rename).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledTimes(2);
  });

  it('gives up after its tries, and at once on any other error', () => {
    const always = vi.fn(() => {
      throw locked('EACCES');
    });
    expect(() => renameRetrying('a', 'b', { rename: always, wait: () => {}, tries: 3 })).toThrow(
      'EACCES',
    );
    expect(always).toHaveBeenCalledTimes(3);
    const missing = vi.fn(() => {
      throw locked('ENOENT');
    });
    expect(() => renameRetrying('a', 'b', { rename: missing, wait: () => {} })).toThrow('ENOENT');
    expect(missing).toHaveBeenCalledTimes(1);
  });
});

describe('the batch Worker', () => {
  const SECRET = 'run-secret';
  const KEY = `i/${'a'.repeat(64)}.png`;

  function env({ aiError, aiImage = btoa('jpeg') } = {}) {
    const store = new Map();
    return {
      store,
      env: {
        WORKER_SECRET: SECRET,
        AI: {
          run: vi.fn(async () => {
            if (aiError) throw new Error(aiError);
            return { image: aiImage };
          }),
        },
        IMAGES: {
          head: async (key) => store.get(key)?.meta ?? null,
          get: async (key) => {
            const it = store.get(key);
            return it
              ? {
                  body: it.bytes,
                  writeHttpMetadata: (h) => h.set('Content-Type', it.meta.httpMetadata.contentType),
                }
              : null;
          },
          put: async (key, bytes, options) => {
            store.set(key, { bytes, meta: { ...options, size: bytes.length } });
          },
        },
      },
    };
  }

  const request = (method, path, { secret = SECRET, body } = {}) =>
    new Request(`http://127.0.0.1:5189${path}`, {
      method,
      body,
      headers: secret ? { 'X-Secret': secret } : {},
    });

  it('answers nothing without the run’s secret', async () => {
    const { env: e } = env();
    expect((await batchWorker.fetch(request('GET', '/ping', { secret: null }), e)).status).toBe(
      403,
    );
    expect((await batchWorker.fetch(request('GET', '/ping', { secret: 'x' }), e)).status).toBe(403);
    const unset = { ...e, WORKER_SECRET: undefined };
    expect((await batchWorker.fetch(request('GET', '/ping', { secret: null }), unset)).status).toBe(
      403,
    );
  });

  it('stores WebP under an immutable header with its size, and heads it back', async () => {
    const { env: e, store } = env();
    const res = await batchWorker.fetch(
      request('PUT', `/put?key=${KEY}&width=1024&height=768`, { body: WEBP }),
      e,
    );
    expect(res.status).toBe(200);
    expect(store.get(KEY).meta).toMatchObject({
      httpMetadata: {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000, immutable',
      },
      customMetadata: { width: '1024', height: '768' },
    });
    const head = await (await batchWorker.fetch(request('GET', `/head?key=${KEY}`), e)).json();
    expect(head).toEqual({
      exists: true,
      contentType: 'image/webp',
      width: 1024,
      height: 768,
      size: WEBP.length,
    });
    const got = await batchWorker.fetch(request('GET', `/get?key=${KEY}`), e);
    expect(got.headers.get('Content-Type')).toBe('image/webp');
  });

  it('refuses to store anything but WebP, under anything but a picture key, without a size', async () => {
    const { env: e, store } = env();
    const tries = [
      [`/put?key=${KEY}&width=1024&height=768`, Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])],
      [`/put?key=i/../x.png&width=1024&height=768`, WEBP],
      [`/put?key=${KEY}&width=0&height=768`, WEBP],
      [`/put?key=${KEY}`, WEBP],
    ];
    for (const [path, body] of tries) {
      expect((await batchWorker.fetch(request('PUT', path, { body }), e)).status).toBe(400);
    }
    expect(store.size).toBe(0);
  });

  it('draws with Flux Schnell at 4 steps and hands back the bytes, storing nothing', async () => {
    const { env: e, store } = env();
    const res = await batchWorker.fetch(
      request('POST', '/draw', { body: JSON.stringify({ prompt: 'a snowman' }) }),
      e,
    );
    expect(res.status).toBe(200);
    expect(Buffer.from(await res.arrayBuffer()).toString()).toBe('jpeg');
    expect(e.AI.run).toHaveBeenCalledWith('@cf/black-forest-labs/flux-1-schnell', {
      prompt: 'a snowman',
      steps: 4,
    });
    expect(store.size).toBe(0);
  });

  it('turns a spent free allocation into 402 and any other model error into 502', async () => {
    const draw = (e) =>
      batchWorker.fetch(request('POST', '/draw', { body: JSON.stringify({ prompt: 'p' }) }), e);
    const spent = env({ aiError: '4006: you have used up your daily free allocation' }).env;
    expect((await draw(spent)).status).toBe(402);
    expect((await draw(env({ aiError: 'capacity' }).env)).status).toBe(502);
    expect((await draw(env({ aiImage: null }).env)).status).toBe(502);
  });
});

describe('the run’s wrangler config', () => {
  it("takes production's bucket and date, and makes both bindings remote", () => {
    const prod = productionConfig();
    expect(prod.bucket).toBe('funny-multi-images');
    const toml = batchConfig(prod);
    expect(toml).toContain('bucket_name = "funny-multi-images"');
    expect(toml).toContain(`compatibility_date = "${prod.date}"`);
    expect(toml.match(/^remote = true$/gm)).toHaveLength(2);
    expect(toml).toMatch(/^main = ".*\/cloudflare\/packbatch-worker\.js"$/m);
    expect(toml).not.toContain('\\');
  });
});

describe('parseArgs', () => {
  it('reads the commands and their options', () => {
    expect(parseArgs([])).toMatchObject({ command: 'plan', pack: 'chr26', limit: Infinity });
    expect(parseArgs(['draw', '--limit', '5'])).toMatchObject({ command: 'draw', limit: 5 });
    expect(parseArgs(['redraw', 'S017', 'A03']).names).toEqual(['S017', 'A03']);
    expect(parseArgs(['crop', 'S097']).names).toEqual(['S097']);
    const cut = parseArgs(['crop', 'S105', 'S197:1']);
    expect(cut.names).toEqual(['S105', 'S197']);
    expect([...cut.from]).toEqual([['S197', 1]]);
    expect([...parseArgs(['keep', 'A02:9']).from]).toEqual([['A02', 9]]);
  });

  it('refuses what it does not understand', () => {
    expect(() => parseArgs(['redraw'])).toThrow(/needs the pictures/);
    expect(() => parseArgs(['crop'])).toThrow(/needs the pictures/);
    expect(() => parseArgs(['redraw', 'S197:1'])).toThrow(/not a picture name/);
    expect(() => parseArgs(['crop', 'S197:x'])).toThrow(/not a picture name/);
    expect(() => parseArgs(['keep'])).toThrow(/keep needs each picture/);
    expect(() => parseArgs(['keep', 'A02:9', 'A04'])).toThrow(/keep needs each picture/);
    expect(() => parseArgs(['draw', '--limit', '-1'])).toThrow(FatalError);
    expect(() => parseArgs(['draw', '--fast'])).toThrow(/unknown option/);
    expect(() => parseArgs(['deploy'])).toThrow(/unknown command/);
  });
});

describe('withKeys', () => {
  it('files every chr26 picture under a distinct production key', async () => {
    const keyed = await withKeys(packItems('chr26'));
    expect(new Set(keyed.map((it) => it.key)).size).toBe(650);
    expect(keyed.every((it) => /^i\/[0-9a-f]{64}\.png$/.test(it.key))).toBe(true);
  });
});
