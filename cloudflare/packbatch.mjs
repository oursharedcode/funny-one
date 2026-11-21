// SPDX-License-Identifier: AGPL-3.0-only
//
// Draws a pack's pictures into the real picture bucket (B-29, DD-16, design
// §4.4): for chr26, 5⁴ = 625 scenes and 5 places × 5 endings = 25 aftermaths.
//
//   npm run packbatch -w cloudflare -- plan              # prompts and keys; no network
//   npm run packbatch -w cloudflare -- status            # what the bucket holds
//   npm run packbatch -w cloudflare -- draw --limit 5    # smoke: at most 5 drawings
//   npm run packbatch -w cloudflare -- draw              # every missing picture
//   npm run packbatch -w cloudflare -- redraw S017 A03   # draw these again, overwriting
//   npm run packbatch -w cloudflare -- crop S097 S109    # cut the signed bottom away, overwriting
//   npm run packbatch -w cloudflare -- crop S197:1       # …of an earlier draw, kept in rejected/
//   npm run packbatch -w cloudflare -- keep A02:9        # store an earlier draw as it was
//   npm run packbatch -w cloudflare -- sheets            # review sheets from the local copies
//
// Options: --pack chr26 (the default), --out DIR (default .picture-review/packs/<pack>,
// gitignored), --python PATH (default the picture-review venv), --restore (status:
// fetch any missing local copy from the bucket), --only S001,A02 --name NAME (sheets).
//
// How it differs from pregenerate.mjs, which fills the base library through the
// deployed Worker's `/generate`: nothing is deployed and production's generation
// switch stays off (Play's AI-content policy, B-1e). The batch starts its own
// Worker, `packbatch-worker.js`, under `wrangler dev` on 127.0.0.1 with Workers
// AI and the bucket both remote, from a config it writes to a temp folder — so
// no file in the repository can ever deploy it. The pictures are stored as WebP
// (B-29, 2026-11-05), encoded on this PC by the picture-review venv's Pillow,
// and a picture can be drawn again over its own key: that is the redraw path
// past the prompt-hash cache that Step 114 asked for.
//
// Auth (owner decision 2B, 2026-11-20): funnyone's scoped token in
// ~/.cloudflare/funny-ai-token — Workers AI, Workers Scripts, Account
// Settings, and Workers R2 Storage Edit for this batch (owner decision 1A,
// 2026-11-21; removed again after it). The shell's ambient
// CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID belong to another project and
// are replaced for the wrangler child only. The token is never printed.
//
// Every key is computed by production's own worker.js, imported and asked in
// process, so a picture lands exactly where the game will look for it.
//
// Resumable: `draw` heads every key first, and a stored WebP is skipped. The
// local manifest records each picture's draws; a manifest whose prompt for a
// picture no longer matches the code stops the run, because the fragments are
// frozen once drawn (FM-PACK-1, Step 114).

import { execFile, execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import {
  AFTERMATH_SLOTS,
  PACKS,
  VISUAL_SLOTS,
  buildAftermathPrompt,
  buildPrompt,
} from '@funny/shared';
import worker from './worker.js';
import { MAX_ATTEMPTS, MAX_CONCURRENCY, USD_PER_IMAGE } from './pregenerate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

// The machine's ports register (C:/Mark/Dev/machine/ports.md): funnyone's
// 5189 and 5182, the same pair B-29's D3 test used.
export const PORT = 5189;
export const INSPECTOR_PORT = 5182;
// Pinned and run through npx, as for D3: not a devDependency of the repo.
const WRANGLER = 'wrangler@4.160.1';
const TOKEN_FILE = join(homedir(), '.cloudflare', 'funny-ai-token');
const HELPER = join(REPO, 'scripts', 'picture-review', 'packimages.py');
const VENV_PYTHON = join(REPO, '.picture-review', 'venv', 'Scripts', 'python.exe');
const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 60_000;
const PROGRESS_EVERY = 25;

export class FatalError extends Error {}

// ---------------------------------------------------------------------------
// What to draw
// ---------------------------------------------------------------------------

/** `who.chr26-polar-bear` → `polar-bear` */
const slug = (id) => id.slice(id.indexOf('-') + 1);
const pad = (n, width) => String(n).padStart(width, '0');

function* product(lists) {
  if (lists.length === 0) {
    yield [];
    return;
  }
  const [first, ...rest] = lists;
  for (const head of first) for (const tail of product(rest)) yield [head, ...tail];
}

/**
 * Every picture of a pack, in review order: the scenes grouped by their two
 * characters (the first two visual slots, slowest), so one review sheet holds
 * one pair in every place and action — a merged pair or a lost costume shows
 * up as the odd one out; then the aftermaths, place by ending.
 */
export function packItems(packId, build = { buildPrompt, buildAftermathPrompt }) {
  const pack = PACKS[packId];
  if (!pack) throw new FatalError(`no pack "${packId}"`);
  const pools = pack.pools;
  const [lead, companion, ...rest] = VISUAL_SLOTS;
  const items = [];

  let scene = 0;
  let pair = 0;
  for (const who of pools[lead]) {
    for (const withWhom of pools[companion]) {
      const sheet = `${packId}-s${pad(++pair, 2)}-${slug(who.id)}--${slug(withWhom.id)}`;
      for (const others of product(rest.map((slot) => pools[slot]))) {
        const answers = Array.from({ length: 7 }, () => null);
        answers[lead] = who.id;
        answers[companion] = withWhom.id;
        rest.forEach((slot, i) => (answers[slot] = others[i].id));
        const n = `S${pad(++scene, 3)}`;
        items.push({
          n,
          kind: 'scene',
          ids: VISUAL_SLOTS.map((slot) => answers[slot]),
          sheet,
          file: `scenes/${n}.webp`,
          prompt: build.buildPrompt({ answers, picture: null }),
        });
      }
    }
  }

  const [placeSlot, endingSlot] = AFTERMATH_SLOTS;
  let aftermath = 0;
  for (const place of pools[placeSlot]) {
    for (const ending of pools[endingSlot]) {
      const answers = Array.from({ length: 7 }, () => null);
      answers[placeSlot] = place.id;
      answers[endingSlot] = ending.id;
      const n = `A${pad(++aftermath, 2)}`;
      items.push({
        n,
        kind: 'aftermath',
        ids: [place.id, ending.id],
        sheet: `${packId}-aftermaths`,
        file: `aftermaths/${n}.webp`,
        prompt: build.buildAftermathPrompt({ answers, picture: null }),
      });
    }
  }
  return items;
}

/**
 * The key production's Worker files a prompt under, from production's own
 * code: worker.js's `/exists`, run in process against a bucket that records
 * the key it is asked about.
 */
export async function productionKey(prompt) {
  let asked = null;
  const env = {
    WORKER_SECRET: 'in-process',
    IMAGES: {
      head: async (key) => {
        asked = key;
        return null;
      },
    },
  };
  const request = new Request(`http://in-process/exists?prompt=${encodeURIComponent(prompt)}`, {
    headers: { 'X-Secret': 'in-process' },
  });
  const res = await worker.fetch(request, env);
  if (!res.ok || !asked) throw new FatalError(`worker.js gave no key (HTTP ${res.status})`);
  return asked;
}

export async function withKeys(items) {
  return Promise.all(
    items.map(async (item) => ({ ...item, key: await productionKey(item.prompt) })),
  );
}

// ---------------------------------------------------------------------------
// The local manifest
// ---------------------------------------------------------------------------

/**
 * Merges the code's items with the manifest of earlier runs, keeping each
 * picture's draw history. A picture whose prompt or key has changed since it
 * was drawn stops everything: its fragments were frozen (Step 114), so a
 * change means the code moved under a bucket already filled.
 */
export function mergeManifest(items, previous) {
  const before = new Map((previous?.items ?? []).map((it) => [it.n, it]));
  return items.map((item) => {
    const old = before.get(item.n);
    if (!old) return { ...item, draws: 0 };
    if (old.key !== item.key || old.prompt !== item.prompt) {
      throw new FatalError(
        `${item.n}: its prompt changed since it was drawn — the pack's fragments are frozen`,
      );
    }
    return { ...old, ...item, draws: old.draws ?? 0 };
  });
}

function readManifest(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}

function writeManifest(path, packId, items) {
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify({ pack: packId, items }, null, 2));
  renameRetrying(tmp, path);
}

const LOCKED = new Set(['EPERM', 'EACCES', 'EBUSY']);

/**
 * `renameSync`, tried again for about two seconds when the target is locked.
 * Windows lets another process (an antivirus scan, an editor's file watcher)
 * hold a just-written file for a moment, and a rename over it fails with
 * EPERM meanwhile: chr26's first redraw round stopped on one at its fourth
 * picture.
 */
export function renameRetrying(
  from,
  to,
  { rename = renameSync, wait = sleepSync, tries = 20 } = {},
) {
  for (let attempt = 1; ; attempt++) {
    try {
      return rename(from, to);
    } catch (err) {
      if (attempt >= tries || !LOCKED.has(err.code)) throw err;
      wait(100);
    }
  }
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// ---------------------------------------------------------------------------
// Talking to the batch Worker
// ---------------------------------------------------------------------------

/**
 * One request to the batch Worker, retrying 429, 5xx and network errors with
 * exponential backoff. Any other non-2xx is fatal — a wrong secret, a bad key,
 * 402 for a spent free allocation — because retrying cannot fix it.
 */
export async function call(opts, method, path, { body, headers = {} } = {}) {
  let lastProblem = '';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res;
    try {
      res = await opts.fetch(`${opts.base}${path}`, {
        method,
        body,
        headers: { 'X-Secret': opts.secret, ...headers },
      });
    } catch (err) {
      lastProblem = `network error: ${err?.message ?? err}`;
    }
    if (res) {
      if (res.ok) return res;
      const text = (await res.text().catch(() => '')).slice(0, 300);
      lastProblem = `HTTP ${res.status}${text ? ` ${text}` : ''}`;
      if (res.status !== 429 && res.status < 500) {
        throw new FatalError(`${method} ${path.split('?')[0]} → ${lastProblem}`);
      }
    }
    if (attempt < MAX_ATTEMPTS) {
      await opts.sleep(Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS));
    }
  }
  throw new FatalError(
    `${method} ${path.split('?')[0]} → ${lastProblem} (gave up after ${MAX_ATTEMPTS} attempts)`,
  );
}

const keyQuery = (key) => `key=${encodeURIComponent(key)}`;

export function client(opts) {
  return {
    head: async (key) => (await call(opts, 'GET', `/head?${keyQuery(key)}`)).json(),
    get: async (key) =>
      Buffer.from(await (await call(opts, 'GET', `/get?${keyQuery(key)}`)).arrayBuffer()),
    draw: async (prompt) =>
      Buffer.from(
        await (
          await call(opts, 'POST', '/draw', {
            body: JSON.stringify({ prompt }),
            headers: { 'Content-Type': 'application/json' },
          })
        ).arrayBuffer(),
      ),
    put: async (key, bytes, { width, height }) =>
      (
        await call(opts, 'PUT', `/put?${keyQuery(key)}&width=${width}&height=${height}`, {
          body: bytes,
          headers: { 'Content-Type': 'image/webp' },
        })
      ).json(),
  };
}

// ---------------------------------------------------------------------------
// The batch
// ---------------------------------------------------------------------------

/**
 * Walks `items`: a key the bucket already holds as WebP is skipped, unless
 * named in `redraw`; any other is drawn, encoded to WebP, stored over its key
 * and kept locally for review. An earlier local copy of a redrawn picture goes
 * to `rejected/`. At most `concurrency` pictures are in flight; the first fatal
 * error stops new work and comes back as `summary.fatal`.
 *
 * `api` is `client(...)`'s shape; `encode(jpegPath, webpPath)` returns
 * `{ width, height, bytes }`. `save()` is called after every picture, so a
 * stopped run loses nothing it paid for.
 */
export async function runBatch(items, options) {
  const opts = {
    concurrency: MAX_CONCURRENCY,
    dryRun: false,
    limit: Infinity,
    redraw: new Set(),
    restore: false,
    log: console.log,
    save: () => {},
    now: () => new Date().toISOString(),
    ...options,
  };
  const concurrency = Math.max(1, Math.min(opts.concurrency, MAX_CONCURRENCY));
  const summary = {
    total: items.length,
    done: 0,
    existed: 0,
    drawn: 0,
    missing: 0,
    restored: 0,
  };
  let next = 0;
  let stopped = false;
  for (const dir of ['tmp', 'rejected', 'scenes', 'aftermaths']) {
    mkdirSync(join(opts.out, dir), { recursive: true });
  }

  const one = async (item) => {
    const local = join(opts.out, item.file);
    if (!opts.redraw.has(item.n)) {
      const stored = await opts.api.head(item.key);
      if (stored.exists && stored.contentType === 'image/webp') {
        summary.existed++;
        if (opts.restore && !existsSync(local)) {
          writeFileSync(local, await opts.api.get(item.key));
          summary.restored++;
        }
        return;
      }
    }
    if (opts.dryRun || summary.drawn >= opts.limit) {
      summary.missing++;
      return;
    }
    // Counted before the awaits, so parallel workers cannot overshoot `limit`.
    summary.drawn++;
    const jpeg = await opts.api.draw(item.prompt);
    const tmpJpeg = join(opts.out, 'tmp', `${item.n}.jpg`);
    const tmpWebp = join(opts.out, 'tmp', `${item.n}.webp`);
    writeFileSync(tmpJpeg, jpeg);
    const encoded = await opts.encode(tmpJpeg, tmpWebp);
    await opts.api.put(item.key, readFileSync(tmpWebp), encoded);
    // Only a stored picture replaces the local copy, so a run stopped between
    // the draw and the put leaves the local copy still matching the bucket.
    if (existsSync(local)) {
      // A cut or kept copy is named apart: `crop` and `keep` already moved the
      // latest draw to its own name in rejected/, which must not be overwritten.
      const tag = item.cropped ? '.cut' : item.keptDraw ? '.kept' : '';
      renameRetrying(
        local,
        join(opts.out, 'rejected', `${item.n}.draw${item.draws ?? 0}${tag}.webp`),
      );
    }
    renameRetrying(tmpWebp, local);
    rmSync(tmpJpeg, { force: true });
    item.draws = (item.draws ?? 0) + 1;
    for (const field of ['cropped', 'cutDraw', 'kept', 'keptDraw']) delete item[field];
    Object.assign(item, {
      width: encoded.width,
      height: encoded.height,
      bytes: encoded.bytes,
      drawnAt: opts.now(),
    });
    opts.save();
  };

  const loop = async () => {
    while (!stopped && next < items.length) {
      const item = items[next++];
      try {
        await one(item);
      } catch (err) {
        // Any error stops the batch, but the other workers first finish the
        // pictures they hold: thrown on, it would stop wrangler under them.
        if (!stopped) {
          summary.fatal = `${item.n}: ${err instanceof FatalError ? err.message : (err.stack ?? err)}`;
        }
        stopped = true;
        return;
      }
      summary.done++;
      if (summary.done % PROGRESS_EVERY === 0 || summary.done === summary.total) {
        opts.log(
          `${summary.done}/${summary.total} · in the bucket ${summary.existed} · ` +
            (opts.dryRun ? `missing ${summary.missing}` : `drawn ${summary.drawn}`),
        );
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, loop));
  summary.estimatedUsd = summary.drawn * USD_PER_IMAGE;
  return summary;
}

/** The K-th draw of a picture once a later one replaced it, kept in `rejected/`. */
const drawnFile = (out, item, k) => join(out, 'rejected', `${item.n}.draw${k}.webp`);

/** The file `crop` cuts or `keep` stores: the earlier draw named in `from`, else the latest. */
const sourceDraw = (item, { out, from }) =>
  from.has(item.n) ? drawnFile(out, item, from.get(item.n)) : join(out, item.file);

/**
 * Stops a crop or keep before anything is stored — and, called by `main`,
 * before wrangler starts: a picture already cut or kept (a redraw undoes
 * that), a keep with no earlier draw named, an earlier draw that never was,
 * or a file that is not on this PC.
 */
export function checkReplace(items, { out, from = new Map(), keep = false }) {
  const names = (list) => list.map((it) => it.n).join(', ');
  const again = items.filter((it) => it.cropped || it.keptDraw);
  if (again.length) throw new FatalError(`already cut or kept: ${names(again)}`);
  const unnamed = keep ? items.filter((it) => !from.has(it.n)) : [];
  if (unnamed.length) {
    throw new FatalError(`keep needs the draw to keep, e.g. ${unnamed[0].n}:2 — ${names(unnamed)}`);
  }
  const never = items.filter((it) => {
    const k = from.get(it.n);
    return k !== undefined && !(Number.isInteger(k) && k >= 1 && k < (it.draws ?? 0));
  });
  if (never.length) throw new FatalError(`no such earlier draw: ${names(never)}`);
  const lost = items.filter((it) => !existsSync(join(out, it.file)));
  if (lost.length) {
    throw new FatalError(`no local copy of ${names(lost)}: status --restore fetches it`);
  }
  const gone = items.filter((it) => from.has(it.n) && !existsSync(sourceDraw(it, { out, from })));
  if (gone.length) throw new FatalError(`the earlier draw is not in rejected/: ${names(gone)}`);
}

/**
 * Stores, for each picture, a file made from one of its draws over its key;
 * the latest draw joins the earlier ones in `rejected/` (put first, so a
 * failed put leaves the local copy matching the bucket). `make(src, dst)`
 * returns `{ width, height, bytes }`; `mark(item)` the manifest fields that
 * record what was done.
 */
async function replaceLatest(items, opts, make, mark) {
  checkReplace(items, opts);
  for (const dir of ['tmp', 'rejected']) mkdirSync(join(opts.out, dir), { recursive: true });
  let done = 0;
  for (const item of items) {
    const local = join(opts.out, item.file);
    const tmpWebp = join(opts.out, 'tmp', `${item.n}.webp`);
    const made = await make(sourceDraw(item, opts), tmpWebp);
    await opts.api.put(item.key, readFileSync(tmpWebp), made);
    const marks = mark(item);
    renameRetrying(local, drawnFile(opts.out, item, item.draws ?? 0));
    renameRetrying(tmpWebp, local);
    Object.assign(item, marks, { width: made.width, height: made.height, bytes: made.bytes });
    opts.save();
    done++;
  }
  return done;
}

const withDefaults = (options) => ({
  from: new Map(),
  save: () => {},
  now: () => new Date().toISOString(),
  ...options,
});

/**
 * Cuts the bottom of each picture away, where Flux Schnell signs, and stores
 * the cut copy over its key: the last resort for a picture still signed after
 * its redraws (owner decision A, 2026-11-21). The cut is made from the latest
 * draw — the local copy, which matches the bucket — or, named in `from`, from
 * an earlier draw kept in `rejected/` whose only fault was its signature; the
 * latest draw, uncut, joins the others in `rejected/`. A picture is cut once:
 * a second cut would take another tenth, so one already cut stops the run
 * before anything is stored.
 *
 * `crop(webpPath, outPath)` returns `{ width, height, bytes }`, as `encode`
 * does; `from` maps a picture to the draw to cut, e.g. `S197 → 1`.
 */
export async function cropPictures(items, options) {
  const opts = withDefaults(options);
  const cropped = await replaceLatest(items, opts, opts.crop, (item) => ({
    cropped: opts.now(),
    cutDraw: opts.from.get(item.n) ?? item.draws ?? 0,
  }));
  return { cropped };
}

/**
 * Stores an earlier draw, as it was, over each picture's key: for a picture
 * no draw of which came out clean, the least flawed one, picked by the owner
 * (decision A, 2026-11-21). `from` names the draw of every picture;
 * `copy(webpPath, outPath)` returns `{ width, height, bytes }`.
 */
export async function keepDraws(items, options) {
  const opts = withDefaults({ ...options, keep: true });
  const kept = await replaceLatest(items, opts, opts.copy, (item) => ({
    kept: opts.now(),
    keptDraw: opts.from.get(item.n),
  }));
  return { kept };
}

// ---------------------------------------------------------------------------
// The PC side: token, wrangler, Pillow
// ---------------------------------------------------------------------------

function readToken() {
  if (!existsSync(TOKEN_FILE)) throw new FatalError(`no token file at ${TOKEN_FILE}`);
  const token = readFileSync(TOKEN_FILE, 'utf8').trim();
  if (!/^[A-Za-z0-9_-]{30,}$/.test(token)) {
    throw new FatalError('the token file does not hold one token on one line');
  }
  return token;
}

async function accountOf(token) {
  const res = await fetch('https://api.cloudflare.com/client/v4/accounts', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!body.success) throw new FatalError(`token refused: ${JSON.stringify(body.errors)}`);
  if (body.result.length !== 1) {
    throw new FatalError(`the token sees ${body.result.length} accounts, expected 1`);
  }
  return body.result[0].id;
}

/** The bucket and compatibility date production's own wrangler.toml names. */
export function productionConfig(toml = readFileSync(join(HERE, 'wrangler.toml'), 'utf8')) {
  const bucket = toml.match(/^\s*bucket_name\s*=\s*"([^"]+)"/m)?.[1];
  const date = toml.match(/^\s*compatibility_date\s*=\s*"([^"]+)"/m)?.[1];
  if (!bucket || !date) throw new FatalError('wrangler.toml names no bucket or no date');
  return { bucket, date };
}

export function batchConfig({ bucket, date }) {
  const main = join(HERE, 'packbatch-worker.js').replaceAll('\\', '/');
  return [
    '# Written by cloudflare/packbatch.mjs for one run, outside the repository.',
    '# Local `wrangler dev` only: never deploy this.',
    'name = "funny-multi-packbatch"',
    `main = "${main}"`,
    `compatibility_date = "${date}"`,
    '',
    '[ai]',
    'binding = "AI"',
    'remote = true',
    '',
    '[[r2_buckets]]',
    'binding = "IMAGES"',
    `bucket_name = "${bucket}"`,
    'remote = true',
    '',
  ].join('\n');
}

async function startWrangler(out) {
  const token = readToken();
  const accountId = await accountOf(token);
  const { bucket, date } = productionConfig();
  const dir = mkdtempSync(join(tmpdir(), 'funnyone-packbatch-'));
  const config = join(dir, 'wrangler.toml');
  writeFileSync(config, batchConfig({ bucket, date }));
  const secret = randomBytes(24).toString('hex');

  const env = { ...process.env };
  for (const k of Object.keys(env)) {
    if (/^CLOUDFLARE_(API_TOKEN|ACCOUNT_ID)$/i.test(k)) delete env[k];
  }
  env.CLOUDFLARE_API_TOKEN = token;
  env.CLOUDFLARE_ACCOUNT_ID = accountId;

  const log = createWriteStream(join(out, 'wrangler.log'), { flags: 'a' });
  const args = [
    '--yes',
    WRANGLER,
    'dev',
    '--config',
    config,
    '--port',
    String(PORT),
    '--inspector-port',
    String(INSPECTOR_PORT),
    '--ip',
    '127.0.0.1',
    '--var',
    `WORKER_SECRET:${secret}`,
  ];
  const child = spawn('npx', args, { cwd: dir, env, shell: true, windowsHide: true });
  child.stdout.pipe(log);
  child.stderr.pipe(log);

  const base = `http://127.0.0.1:${PORT}`;
  const stop = () => {
    try {
      execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      // already gone
    }
    rmSync(dir, { recursive: true, force: true });
  };

  const until = Date.now() + 240_000;
  while (Date.now() < until) {
    if (child.exitCode !== null) {
      stop();
      throw new FatalError(`wrangler exited ${child.exitCode}; see ${join(out, 'wrangler.log')}`);
    }
    try {
      const res = await fetch(`${base}/ping`, { headers: { 'X-Secret': secret } });
      if (res.ok) {
        const ping = await res.json();
        if (!ping.ai || !ping.r2) {
          stop();
          throw new FatalError(`a binding is missing: ${JSON.stringify(ping)}`);
        }
        return { base, secret, bucket, stop };
      }
    } catch (err) {
      if (err instanceof FatalError) throw err;
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  stop();
  throw new FatalError(`wrangler dev not ready in 4 minutes; see ${join(out, 'wrangler.log')}`);
}

function python(opts) {
  return opts.python ?? (existsSync(VENV_PYTHON) ? VENV_PYTHON : 'python');
}

/** packimages.py's `encode`, `crop` or `keep`, as `(src, dst) → { width, height, bytes }`. */
function helper(opts, command) {
  const run = promisify(execFile);
  return async (src, dst) => {
    const { stdout } = await run(python(opts), ['-I', HELPER, command, src, dst]);
    return JSON.parse(stdout);
  };
}

// ---------------------------------------------------------------------------
// The command line
// ---------------------------------------------------------------------------

export function parseArgs(argv) {
  const [command = 'plan', ...rest] = argv;
  const args = {
    command,
    pack: 'chr26',
    limit: Infinity,
    names: [],
    from: new Map(),
    restore: false,
  };
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    const value = () => {
      const v = rest[++i];
      if (v === undefined) throw new FatalError(`${arg} needs a value`);
      return v;
    };
    if (arg === '--pack') args.pack = value();
    else if (arg === '--out') args.out = resolve(value());
    else if (arg === '--python') args.python = value();
    else if (arg === '--only') args.only = value();
    else if (arg === '--name') args.name = value();
    else if (arg === '--restore') args.restore = true;
    else if (arg === '--limit') {
      args.limit = Number(value());
      if (!Number.isInteger(args.limit) || args.limit < 0) {
        throw new FatalError('--limit needs a non-negative integer');
      }
    } else if (arg.startsWith('--')) throw new FatalError(`unknown option ${arg}`);
    else {
      // `S197:1` — for crop and keep only — names S197's first draw.
      const [, n, k] = /^([^:]+)(?::(\d+))?$/.exec(arg) ?? [];
      if (!n || (k !== undefined && !['crop', 'keep'].includes(command))) {
        throw new FatalError(`"${arg}" is not a picture name`);
      }
      args.names.push(n);
      if (k !== undefined) args.from.set(n, Number(k));
    }
  }
  if (!['plan', 'status', 'draw', 'redraw', 'crop', 'keep', 'sheets'].includes(args.command)) {
    throw new FatalError(`unknown command "${args.command}"`);
  }
  if (args.command === 'redraw' && args.names.length === 0) {
    throw new FatalError('redraw needs the pictures to draw again, e.g. S017 A03');
  }
  if (args.command === 'crop' && args.names.length === 0) {
    throw new FatalError('crop needs the pictures to cut, e.g. S097 S109');
  }
  const unnamed = args.names.filter((n) => !args.from.has(n));
  if (args.command === 'keep' && (args.names.length === 0 || unnamed.length)) {
    throw new FatalError('keep needs each picture with the draw to keep, e.g. A02:9');
  }
  args.out ??= join(REPO, '.picture-review', 'packs', args.pack);
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(args.out, { recursive: true });
  const manifestPath = join(args.out, 'manifest.json');
  const items = mergeManifest(await withKeys(packItems(args.pack)), readManifest(manifestPath));
  const save = () => writeManifest(manifestPath, args.pack, items);
  save();

  const scenes = items.filter((it) => it.kind === 'scene');
  const longest = Math.max(...items.map((it) => it.prompt.length));
  console.log(
    `${args.pack}: ${scenes.length} scenes + ${items.length - scenes.length} aftermaths = ` +
      `${items.length} pictures · longest prompt ${longest} · ≈ $${(items.length * USD_PER_IMAGE).toFixed(2)} to draw all`,
  );

  if (args.command === 'plan') {
    for (const it of [items[0], items.at(-1)]) console.log(`${it.n} ${it.key}\n  ${it.prompt}`);
    console.log(`manifest: ${manifestPath}`);
    return;
  }

  if (args.command === 'sheets') {
    const helperArgs = ['-I', HELPER, 'sheets', manifestPath, join(args.out, 'sheets')];
    if (args.only) helperArgs.push('--only', args.only);
    if (args.name) helperArgs.push('--name', args.name);
    const { stdout } = await promisify(execFile)(python(args), helperArgs, {
      maxBuffer: 1 << 20,
    });
    for (const path of JSON.parse(stdout)) console.log(path);
    return;
  }

  const unknown = args.names.filter((n) => !items.some((it) => it.n === n));
  if (unknown.length) throw new FatalError(`no such picture: ${unknown.join(', ')}`);
  const named = new Set(args.names);
  const replacing = ['crop', 'keep'].includes(args.command);
  const todo =
    replacing || args.command === 'redraw' ? items.filter((it) => named.has(it.n)) : items;
  // Checked before wrangler starts too, so a slip costs no start-up.
  if (replacing) {
    checkReplace(todo, { out: args.out, from: args.from, keep: args.command === 'keep' });
  }

  const session = await startWrangler(args.out);
  console.log(`wrangler dev ready on ${session.base}, bucket ${session.bucket}`);
  const api = client({
    base: session.base,
    secret: session.secret,
    fetch: globalThis.fetch,
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  });
  if (replacing) {
    try {
      const common = { api, out: args.out, from: args.from, save };
      if (args.command === 'crop') {
        const { cropped } = await cropPictures(todo, { ...common, crop: helper(args, 'crop') });
        console.log(`\ndone: ${cropped} cut and stored`);
      } else {
        const { kept } = await keepDraws(todo, { ...common, copy: helper(args, 'keep') });
        console.log(`\ndone: ${kept} earlier draws stored as they were`);
      }
    } finally {
      save();
      session.stop();
    }
    return;
  }
  let summary;
  try {
    summary = await runBatch(todo, {
      api,
      encode: helper(args, 'encode'),
      out: args.out,
      dryRun: args.command === 'status',
      limit: args.limit,
      redraw: args.command === 'redraw' ? named : new Set(),
      restore: args.restore,
      save,
    });
  } finally {
    save();
    session.stop();
  }
  console.log(
    `\ndone: ${summary.existed} in the bucket, ${summary.drawn} drawn ` +
      `(≈ $${summary.estimatedUsd.toFixed(2)}), ${summary.missing} missing` +
      (summary.restored ? `, ${summary.restored} local copies restored` : ''),
  );
  if (summary.fatal) {
    console.error(`stopped on a fatal error — ${summary.fatal}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err instanceof FatalError ? `error: ${err.message}` : err);
    process.exit(1);
  });
}
