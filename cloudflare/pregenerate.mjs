// SPDX-License-Identifier: AGPL-3.0-only
//
// Pre-generates the whole picture library into R2 (T-9.2, design §10.1, DD-11,
// FM-TIER-2). Run once from the deploying PC after the Worker is live, and again
// after any pool edit:
//
//   npm run pregenerate -w cloudflare -- --dry-run     # /exists only — free
//   npm run pregenerate -w cloudflare -- --limit 5     # smoke: at most 5 generations
//   npm run pregenerate -w cloudflare                  # the whole library
//
// Needs CLOUDFLARE_WORKER_URL and CLOUDFLARE_WORKER_SECRET in the env, the same
// pair the server reads. Every miss really generates on the paid Workers AI plan
// and really bumps the Worker's daily counter, so a full run belongs on a day the
// game is quiet — or on a deployment whose MAX_IMAGES_PER_DAY cap has room.
//
// The prompts come from the server's own `buildPrompt`, imported from its build
// output rather than re-assembled here: the R2 key is the sha256 of the prompt
// bytes, so a copy of the skeleton that drifted by one character would fill R2
// with 10⁴ images the game never asks for.
//
// Resumable by construction: every prompt is probed with `/exists` first, and a
// hit costs nothing. Stopping it (Ctrl-C, a fatal error, a closed laptop) and
// running it again picks up where it left off.

import { pathToFileURL } from 'node:url';
import { POOLS, VISUAL_SLOTS } from '@funny/shared';

export const MAX_CONCURRENCY = 4;
export const MAX_ATTEMPTS = 6;
const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 60_000;
const PROGRESS_EVERY = 100;
// Measured on the first full run (2026-10-02): 1.89M neurons for 9,938 images,
// ≈ 190 neurons each at $0.011 per 1,000 — 10⁴ images ≈ $21 (design §10.1). An
// estimate for the summary line, not a bill — the Cloudflare dashboard is the
// real number.
export const USD_PER_IMAGE = 0.0021;

/**
 * Every combination of the visual slots, in a fixed mixed-radix order, as the
 * `Story` shape `buildPrompt` reads. Generic in the pool sizes, so a pool that
 * gains an option grows the walk instead of breaking it.
 */
export function* enumerateStories(pools = POOLS, visualSlots = VISUAL_SLOTS) {
  const sizes = visualSlots.map((slot) => pools[slot].length);
  const total = sizes.reduce((a, b) => a * b, 1);
  for (let i = 0; i < total; i++) {
    let n = i;
    const answers = Array.from({ length: 7 }, () => null);
    visualSlots.forEach((slot, axis) => {
      answers[slot] = pools[slot][n % sizes[axis]].id;
      n = Math.floor(n / sizes[axis]);
    });
    yield { answers, picture: null };
  }
}

/** `[{ ids, prompt }]` for the whole library, built with the given `buildPrompt`. */
export function enumeratePrompts(buildPrompt, pools = POOLS, visualSlots = VISUAL_SLOTS) {
  return Array.from(enumerateStories(pools, visualSlots), (story) => ({
    ids: visualSlots.map((slot) => story.answers[slot]).join('+'),
    prompt: buildPrompt(story),
  }));
}

class FatalError extends Error {}

/**
 * GET a Worker route, retrying 429/5xx and network errors with exponential
 * backoff. Anything else that is not a 200 — a wrong secret, a missing prompt —
 * is fatal: retrying cannot fix it, and 10⁴ more requests would only repeat it.
 */
async function call(route, prompt, opts) {
  const url = `${opts.workerUrl}/${route}?prompt=${encodeURIComponent(prompt)}`;
  let lastProblem = '';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res;
    try {
      res = await opts.fetch(url, { headers: { 'X-Secret': opts.secret } });
    } catch (err) {
      lastProblem = `network error: ${err?.message ?? err}`;
    }
    if (res) {
      if (res.ok) return res.json();
      const body = (await res.text().catch(() => '')).slice(0, 200);
      lastProblem = `HTTP ${res.status}${body ? ` ${body}` : ''}`;
      if (res.status !== 429 && res.status < 500) {
        throw new FatalError(`/${route} → ${lastProblem}`);
      }
    }
    if (attempt < MAX_ATTEMPTS) {
      await opts.sleep(Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS));
    }
  }
  throw new FatalError(`/${route} → ${lastProblem} (gave up after ${MAX_ATTEMPTS} attempts)`);
}

/**
 * Walks `items`, probing each with `/exists` and generating the misses. At most
 * `concurrency` requests are in flight; the first fatal error stops new work,
 * lets the in-flight ones settle, and comes back as `summary.fatal`.
 *
 * `limit` caps *generations* (not probes), so `--limit 5` is a safe first look
 * at real output on a mostly-empty bucket.
 */
export async function pregenerate(items, options) {
  const opts = {
    concurrency: MAX_CONCURRENCY,
    dryRun: false,
    limit: Infinity,
    fetch: globalThis.fetch,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    log: console.log,
    ...options,
  };
  opts.workerUrl = opts.workerUrl.replace(/\/$/, '');
  const concurrency = Math.max(1, Math.min(opts.concurrency, MAX_CONCURRENCY));

  const summary = { total: items.length, done: 0, existed: 0, generated: 0, missing: 0 };
  let next = 0;
  let stopped = false;

  const progress = () => {
    if (summary.done % PROGRESS_EVERY === 0 || summary.done === summary.total) {
      opts.log(
        `${summary.done}/${summary.total} · existed ${summary.existed} · ` +
          (opts.dryRun ? `missing ${summary.missing}` : `generated ${summary.generated}`),
      );
    }
  };

  const worker = async () => {
    while (!stopped && next < items.length) {
      const item = items[next++];
      try {
        const probe = await call('exists', item.prompt, opts);
        if (probe.cached) {
          summary.existed++;
        } else if (opts.dryRun || summary.generated >= opts.limit) {
          summary.missing++;
        } else {
          // Counted before the await so parallel workers cannot overshoot `limit`.
          summary.generated++;
          const made = await call('generate', item.prompt, opts).catch((err) => {
            summary.generated--;
            throw err;
          });
          // Another caller (a live game) generated it between probe and call.
          if (made.cached) {
            summary.generated--;
            summary.existed++;
          }
        }
      } catch (err) {
        if (!(err instanceof FatalError)) throw err;
        if (!stopped) summary.fatal = `${item.ids}: ${err.message}`;
        stopped = true;
        return;
      }
      summary.done++;
      progress();
    }
  };

  await Promise.all(Array.from({ length: concurrency }, worker));
  summary.estimatedUsd = summary.generated * USD_PER_IMAGE;
  return summary;
}

function parseArgs(argv) {
  const args = { dryRun: argv.includes('--dry-run'), limit: Infinity };
  const at = argv.indexOf('--limit');
  if (at !== -1) {
    args.limit = Number(argv[at + 1]);
    if (!Number.isInteger(args.limit) || args.limit < 0) {
      throw new Error('--limit needs a non-negative integer');
    }
  }
  return args;
}

async function main() {
  const { dryRun, limit } = parseArgs(process.argv.slice(2));
  const workerUrl = process.env.CLOUDFLARE_WORKER_URL ?? '';
  const secret = process.env.CLOUDFLARE_WORKER_SECRET ?? '';
  if (!workerUrl || !secret) {
    console.error('needs CLOUDFLARE_WORKER_URL and CLOUDFLARE_WORKER_SECRET in the env');
    process.exit(1);
  }

  // Dynamic so the tests can import this module without a server build.
  const { buildPrompt } = await import('../apps/funny-multi-server/dist/prompt.js');
  const items = enumeratePrompts(buildPrompt);
  console.log(
    `${items.length} prompts · ${dryRun ? 'dry run (/exists only)' : 'generating misses'}` +
      (Number.isFinite(limit) ? ` · limit ${limit}` : ''),
  );

  const summary = await pregenerate(items, { workerUrl, secret, dryRun, limit });
  const cost = `≈ $${summary.estimatedUsd.toFixed(2)}`;
  console.log(
    dryRun
      ? `\ndone: ${summary.existed} in R2, ${summary.missing} missing ` +
          `(≈ $${(summary.missing * USD_PER_IMAGE).toFixed(2)} to fill)`
      : `\ndone: ${summary.existed} already in R2, ${summary.generated} generated (${cost}), ` +
          `${summary.missing} left by --limit`,
  );
  if (summary.fatal) {
    console.error(`stopped on a fatal error — ${summary.fatal}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
