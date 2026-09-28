// SPDX-License-Identifier: AGPL-3.0-only
//
// T-9.2 — the library pre-generator (design §10.1).
//
// Its failures are expensive rather than visible: a walk that misses a
// combination leaves a hole the game fills at the daily cap's cost, one that
// generates what already exists spends real money twice, and one that keeps
// going past a wrong secret sends 10⁴ requests to learn nothing. The fake Worker
// below is a Set of cached prompts plus a script of forced failures.

import { describe, expect, it, vi } from 'vitest';
import { POOLS, VISUAL_SLOTS } from '@funny/shared';
import { buildPrompt } from '../apps/funny-multi-server/src/prompt.ts';
import { enumeratePrompts, MAX_ATTEMPTS, MAX_CONCURRENCY, pregenerate } from './pregenerate.mjs';

const WORKER = 'https://img.example';
const SECRET = 'shared-secret';

function fakeWorker({ cached = [], failures = {} } = {}) {
  const store = new Set(cached);
  const calls = [];
  let inFlight = 0;
  let peak = 0;
  const fetch = vi.fn(async (url, init) => {
    inFlight++;
    peak = Math.max(peak, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 1));
    inFlight--;
    const { pathname, searchParams } = new URL(url);
    const prompt = searchParams.get('prompt');
    calls.push({ route: pathname, prompt, secret: init.headers['X-Secret'] });
    const queue = failures[`${pathname} ${prompt}`];
    if (queue?.length) {
      const next = queue.shift();
      if (next === 'network') throw new TypeError('fetch failed');
      return new Response('nope', { status: next });
    }
    if (pathname === '/exists') return Response.json({ cached: store.has(prompt) });
    const hit = store.has(prompt);
    store.add(prompt);
    return Response.json({ url: `${WORKER}/i/x.png`, cached: hit });
  });
  return { fetch, calls, store, peak: () => peak };
}

const items = (...prompts) => prompts.map((prompt) => ({ ids: prompt, prompt }));

function run(list, worker, extra = {}) {
  return pregenerate(list, {
    workerUrl: `${WORKER}/`,
    secret: SECRET,
    fetch: worker.fetch,
    sleep: async () => {},
    log: () => {},
    ...extra,
  });
}

describe('enumeratePrompts', () => {
  it('builds exactly 10⁴ distinct prompts with the game’s own buildPrompt', () => {
    const list = enumeratePrompts(buildPrompt);
    expect(VISUAL_SLOTS.map((slot) => POOLS[slot].length)).toEqual([10, 10, 10, 10]);
    expect(list).toHaveLength(10_000);
    expect(new Set(list.map((item) => item.prompt)).size).toBe(10_000);
    expect(new Set(list.map((item) => item.ids)).size).toBe(10_000);
  });

  it('produces the same prompt the game sends for a given story', () => {
    const [first] = enumeratePrompts(buildPrompt);
    const answers = Array.from({ length: 7 }, () => null);
    for (const slot of VISUAL_SLOTS) answers[slot] = POOLS[slot][0].id;
    expect(first.prompt).toBe(buildPrompt({ answers, picture: null }));
  });
});

describe('pregenerate', () => {
  it('skips what exists and generates only the misses', async () => {
    const worker = fakeWorker({ cached: ['a', 'c'] });
    const summary = await run(items('a', 'b', 'c', 'd'), worker);
    expect(summary).toMatchObject({ total: 4, done: 4, existed: 2, generated: 2, missing: 0 });
    expect(summary.fatal).toBeUndefined();
    const generated = worker.calls.filter((c) => c.route === '/generate').map((c) => c.prompt);
    expect(generated.sort()).toEqual(['b', 'd']);
    expect(worker.calls.every((c) => c.secret === SECRET)).toBe(true);
  });

  it('is resumable: a second run generates nothing', async () => {
    const worker = fakeWorker();
    await run(items('a', 'b', 'c'), worker);
    worker.calls.length = 0;
    const summary = await run(items('a', 'b', 'c'), worker);
    expect(summary).toMatchObject({ existed: 3, generated: 0 });
    expect(worker.calls.some((c) => c.route === '/generate')).toBe(false);
  });

  it('never calls /generate on a dry run', async () => {
    const worker = fakeWorker({ cached: ['a'] });
    const summary = await run(items('a', 'b', 'c'), worker, { dryRun: true });
    expect(summary).toMatchObject({ existed: 1, missing: 2, generated: 0, estimatedUsd: 0 });
    expect(worker.calls.some((c) => c.route === '/generate')).toBe(false);
  });

  it('caps generations at --limit, even with parallel workers', async () => {
    const worker = fakeWorker();
    const list = items(...Array.from({ length: 20 }, (_, i) => `p${i}`));
    const summary = await run(list, worker, { limit: 5 });
    expect(summary).toMatchObject({ done: 20, generated: 5, missing: 15 });
    expect(worker.calls.filter((c) => c.route === '/generate')).toHaveLength(5);
  });

  it('keeps at most 4 requests in flight, whatever it is asked for', async () => {
    const worker = fakeWorker();
    const list = items(...Array.from({ length: 30 }, (_, i) => `p${i}`));
    await run(list, worker, { concurrency: 50 });
    expect(worker.peak()).toBe(MAX_CONCURRENCY);
  });

  it('retries 429, 5xx and network errors with growing backoff', async () => {
    const worker = fakeWorker({
      failures: { '/exists a': [429, 'network'], '/generate a': [503] },
    });
    const sleep = vi.fn(async () => {});
    const summary = await run(items('a'), worker, { sleep });
    expect(summary).toMatchObject({ generated: 1 });
    expect(summary.fatal).toBeUndefined();
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([1_000, 2_000, 1_000]);
  });

  it('stops on the first non-retryable error instead of walking on', async () => {
    const worker = fakeWorker({ failures: { '/exists b': [401] } });
    const list = items(...Array.from({ length: 50 }, (_, i) => (i === 1 ? 'b' : `p${i}`)));
    const summary = await run(list, worker, { concurrency: 1 });
    expect(summary.fatal).toMatch(/^b: \/exists → HTTP 401/);
    expect(summary.done).toBe(1);
    expect(worker.calls).toHaveLength(3); // p0 probe + generate, then b's probe
  });

  it('gives up after the retry budget and reports it as fatal', async () => {
    const worker = fakeWorker({
      failures: { '/generate a': Array.from({ length: MAX_ATTEMPTS }, () => 500) },
    });
    const summary = await run(items('a', 'b'), worker, { concurrency: 1 });
    expect(summary.fatal).toMatch(/gave up after 6 attempts/);
    expect(summary.generated).toBe(0);
    expect(worker.store.has('b')).toBe(false);
  });

  it('counts a /generate that raced a live game to the image as existing', async () => {
    const worker = fakeWorker();
    const race = worker.fetch.getMockImplementation();
    worker.fetch.mockImplementation(async (url, init) => {
      const res = await race(url, init);
      // A room generates 'a' just after this run's probe missed it.
      if (url.includes('/exists')) worker.store.add('a');
      return res;
    });
    const summary = await run(items('a'), worker);
    expect(summary).toMatchObject({ existed: 1, generated: 0 });
  });
});
