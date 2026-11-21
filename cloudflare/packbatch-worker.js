// SPDX-License-Identifier: AGPL-3.0-only
//
// The pack batch's Worker (B-29, DD-16, design §4.4) — local only. Never
// deployed: `packbatch.mjs` runs it under `wrangler dev` on 127.0.0.1 from a
// config it writes outside the repository, with both bindings remote — real
// Flux Schnell and the real picture bucket — and a random secret per run.
// Production's Worker (worker.js) and its generation switch are untouched, so
// production never draws a picture (Play's AI-content policy, B-1e).
//
// Why a Worker of its own rather than worker.js's `/generate`:
//
//   - **WebP.** The pack's pictures are stored as WebP (B-29, 2026-11-05), not
//     as the model's ≈ 700 KB JPEG. A Worker cannot encode WebP, so the batch
//     draws here, encodes on the PC and stores the result here.
//   - **Redraws.** `/generate` answers a stored key from R2 and never draws it
//     again — right for a game, a dead end for a picture with a fake signature
//     in its corner. `/put` overwrites.
//
// The key is computed by the caller with production's own `imageKey` (the
// batch imports worker.js and asks it), and only checked for shape here.
//
// Routes, every one behind X-Secret:
//   GET  /ping            → {ai, r2}               both bindings present?
//   GET  /head?key=…      → {exists, contentType, width, height, size}
//   GET  /get?key=…       → the stored bytes        (a lost local copy, never via the public URL)
//   POST /draw  {prompt}  → the model's image bytes (nothing stored)
//   PUT  /put?key=…&width=…&height=…  WebP body → stored, immutable

const MODEL = '@cf/black-forest-labs/flux-1-schnell';
// worker.js's own: never raise (spec §18, §15).
const STEPS = 4;
const IMMUTABLE = 'public, max-age=31536000, immutable';
const KEY_PATTERN = /^i\/[0-9a-f]{64}\.png$/;
// Workers AI's answer once the free plan's daily neurons are spent. Retrying
// cannot help, so it comes back as 402 and stops the batch at once.
const ALLOCATION_SPENT = /\b4006\b|daily free allocation/i;

export default {
  async fetch(request, env) {
    const secret = request.headers.get('X-Secret');
    if (!env.WORKER_SECRET || secret !== env.WORKER_SECRET) {
      return new Response('Forbidden', { status: 403 });
    }
    const url = new URL(request.url);
    const route = `${request.method} ${url.pathname}`;
    if (route === 'GET /ping') return json({ ai: Boolean(env.AI), r2: Boolean(env.IMAGES) });
    if (route === 'GET /head') return head(url, env);
    if (route === 'GET /get') return get(url, env);
    if (route === 'POST /draw') return draw(request, env);
    if (route === 'PUT /put') return put(request, url, env);
    return new Response('Not found', { status: 404 });
  },
};

function keyFrom(url) {
  const key = url.searchParams.get('key') ?? '';
  return KEY_PATTERN.test(key) ? key : null;
}

async function head(url, env) {
  const key = keyFrom(url);
  if (!key) return new Response('Bad key', { status: 400 });
  const object = await env.IMAGES.head(key);
  if (!object) return json({ exists: false });
  const meta = object.customMetadata ?? {};
  return json({
    exists: true,
    contentType: object.httpMetadata?.contentType ?? null,
    width: Number(meta.width) || null,
    height: Number(meta.height) || null,
    size: object.size,
  });
}

async function get(url, env) {
  const key = keyFrom(url);
  if (!key) return new Response('Bad key', { status: 400 });
  const object = await env.IMAGES.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  return new Response(object.body, { headers });
}

async function draw(request, env) {
  if (!env.AI) return new Response('No AI binding', { status: 503 });
  const { prompt } = await request.json().catch(() => ({}));
  if (typeof prompt !== 'string' || !prompt) {
    return new Response('Missing prompt', { status: 400 });
  }
  let result;
  try {
    result = await env.AI.run(MODEL, { prompt, steps: STEPS });
  } catch (err) {
    const message = String(err?.message ?? err);
    return new Response(`AI error: ${message}`, {
      status: ALLOCATION_SPENT.test(message) ? 402 : 502,
    });
  }
  if (!result || typeof result.image !== 'string') {
    return new Response('AI returned no image', { status: 502 });
  }
  const bytes = Uint8Array.from(atob(result.image), (c) => c.charCodeAt(0));
  return new Response(bytes, { headers: { 'Content-Type': 'application/octet-stream' } });
}

async function put(request, url, env) {
  const key = keyFrom(url);
  if (!key) return new Response('Bad key', { status: 400 });
  const width = Number.parseInt(url.searchParams.get('width') ?? '', 10);
  const height = Number.parseInt(url.searchParams.get('height') ?? '', 10);
  if (!(width > 0 && height > 0)) return new Response('Bad size', { status: 400 });
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!isWebp(bytes)) return new Response('Not a WebP', { status: 400 });
  await env.IMAGES.put(key, bytes, {
    httpMetadata: { contentType: 'image/webp', cacheControl: IMMUTABLE },
    // worker.js's `describe()` reads these on every hit, as for its own pictures.
    customMetadata: { width: String(width), height: String(height) },
  });
  return json({ stored: key, bytes: bytes.length });
}

/** RIFF....WEBP. Not exported: the entry module's named exports are workerd entrypoints. */
function isWebp(bytes) {
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

function json(body) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}
