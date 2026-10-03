// SPDX-License-Identifier: AGPL-3.0-only
//
// Cloudflare Worker — image generation, cache and delivery (design §7.2,
// FM-IMG-3). Deployed separately from the Render service via `wrangler
// deploy`; see wrangler.toml for the bindings it needs.
//
// Rewritten from SRC/cloudflare/worker.js. SRC generated on every call and
// streamed the bytes back to the server, which re-broadcast them as base64
// over the socket. Here the Worker owns a content-addressed R2 cache and hands
// back a URL instead (DD-5, the MUL-2 socket-size mandate), so the same story
// picked twice — in any of the 15 languages, since prompts are English
// fragments (DD-4) — costs one generation for the whole world.
//
// Routes:
//   GET /generate?prompt=…  X-Secret  → {url,width,height,cached} — generates on a miss
//   GET /exists?prompt=…    X-Secret  → {cached:false} | {url,width,height,cached:true}
//   GET /stats              X-Secret  → {date,count,generation} — SRC's, plus the switch
//   GET /i/<hash>.png       public    → the image bytes, immutable, CORS-open
//
// `/i/*` is the one public route: the keys are sha256 digests of prompts the
// caller never sees, the images contain no user data (FM-IMG-4), and a phone
// rendering a cartoon has no secret to present. Everything else is gated on
// the shared secret, as in SRC (spec §15, §18).
//
// The `AI` binding is the generation switch (wrangler.toml). The secret is the
// only thing between a stranger and the model, and a paid Workers AI plan has
// no spending cap, so a deployment whose library is complete (design §10.1)
// runs without the binding: hits are served exactly as before, a miss is a
// 503, and a leaked secret can spend nothing.
//
// POST /entitlement arrives with the premium phase (design §10), which is why
// routing dispatches on pathname first and leaves method checks to the routes.

const MODEL = '@cf/black-forest-labs/flux-1-schnell';
// Minimum cost on the free tier — never raise (spec §18, §15).
const STEPS = 4;

const KEY_PREFIX = 'i/';
const KEY_SUFFIX = '.png';
/** The exact shape of every key this Worker writes, and the only one it serves. */
const KEY_PATTERN = /^i\/[0-9a-f]{64}\.png$/;

// A year, immutable: the key is a hash of the prompt, so a given URL's bytes
// can never change meaning. This is what makes the second reveal of a repeated
// story instant (Gate 4).
const IMMUTABLE = 'public, max-age=31536000, immutable';

// Flux Schnell's documented output size, used only when the bytes turn out to
// be unreadable (see imageSize). Real dimensions come from the image itself.
const FALLBACK_WIDTH = 1024;
const FALLBACK_HEIGHT = 768;

const KV_KEY_PREFIX = 'count:';
// 48 h — yesterday's key is garbage-collected without ever being read.
const KV_TTL_SECONDS = 60 * 60 * 48;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Public route first: the secret check below must not stand in front of it.
    if (url.pathname.startsWith(`/${KEY_PREFIX}`)) return serveImage(url, env);

    // Shared-secret check — prevents public abuse of the free tier (spec §15, §18).
    const secret = request.headers.get('X-Secret');
    if (!secret || secret !== env.WORKER_SECRET) {
      return new Response('Forbidden', { status: 403 });
    }

    if (url.pathname === '/stats') return serveStats(env);
    if (url.pathname === '/exists') return serveExists(url, env);
    if (url.pathname === '/generate') return serveGenerate(url, env);
    return new Response('Not found', { status: 404 });
  },
};

// ---------------------------------------------------------------------------
// GET /i/<hash>.png — deliver a cached image
// ---------------------------------------------------------------------------

/**
 * Streams the object straight out of R2. Public and CORS-open, because the
 * download/share path re-encodes the picture through a canvas (design §8.3)
 * and a tainted canvas cannot be read back.
 *
 * No OPTIONS handler: every request we make for these URLs is a plain `GET`
 * with no custom headers — `<img src>` and `fetch(url)` — which browsers never
 * preflight. Add one the day a request here carries a header.
 */
async function serveImage(url, env) {
  const key = url.pathname.slice(1);
  // Reject anything that is not a key we could have written, rather than
  // asking R2 about it. Also states the URL contract in one place.
  if (!KEY_PATTERN.test(key)) return new Response('Not found', { status: 404 });

  const object = await env.IMAGES.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', IMMUTABLE);
  headers.set('ETag', object.httpEtag);
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(object.body, { headers });
}

// ---------------------------------------------------------------------------
// GET /exists?prompt=… — the R2 head, and nothing else
// ---------------------------------------------------------------------------

/**
 * The cheap probe design §7.3 needs: the server calls this *before* reserving a
 * daily cap slot, so a cache hit costs no slot at all. Deliberately incapable
 * of generating — a probe that could spend the day's budget would defeat its
 * own purpose.
 */
async function serveExists(url, env) {
  const prompt = url.searchParams.get('prompt');
  if (!prompt) return new Response('Missing prompt', { status: 400 });

  const key = await imageKey(prompt);
  const head = await env.IMAGES.head(key);
  if (!head) return json({ cached: false });
  return json({ ...describe(url, key, head), cached: true });
}

// ---------------------------------------------------------------------------
// GET /generate?prompt=… — cache hit, or generate and cache
// ---------------------------------------------------------------------------

async function serveGenerate(url, env) {
  const prompt = url.searchParams.get('prompt');
  if (!prompt) return new Response('Missing prompt', { status: 400 });

  const key = await imageKey(prompt);

  // Checked here as well as in /exists, and not only as an optimisation: two
  // rooms can land on the same story between the server's probe and this call,
  // and `cached:true` is what tells the server to refund the slot it reserved
  // (design §7.3). The cap must count generations, not requests.
  const head = await env.IMAGES.head(key);
  if (head) return json({ ...describe(url, key, head), cached: true });

  // The generation switch (see the header): no binding, no model call. Below
  // the head check on purpose — switching generation off must not cost a
  // single picture that already exists.
  if (!env.AI) {
    return new Response('Generation is switched off: no AI binding (wrangler.toml)', {
      status: 503,
    });
  }

  let result;
  try {
    result = await env.AI.run(MODEL, { prompt, steps: STEPS });
  } catch (err) {
    return new Response(`AI error: ${err}`, { status: 502 });
  }

  // Flux Schnell returns `{ image: "<base64>" }`. SRC also handled older models
  // that returned a raw byte stream; that branch is dropped, because a stream
  // cannot be sniffed for its type or its size before it is stored, and this
  // Worker now has to store it. The model is pinned three lines above, so an
  // unexpected shape is a deploy-time surprise worth failing loudly on.
  if (!result || typeof result.image !== 'string') {
    return new Response('AI returned no image', { status: 502 });
  }
  const bytes = Uint8Array.from(atob(result.image), (c) => c.charCodeAt(0));
  const size = imageSize(bytes);

  try {
    // Two servers racing the same prompt both generate and both put. Harmless:
    // the key is the prompt's hash, so either image is a correct answer for it
    // and last-write-wins costs one wasted generation, not a wrong picture.
    await env.IMAGES.put(key, bytes, {
      httpMetadata: { contentType: contentTypeOf(bytes), cacheControl: IMMUTABLE },
      // Read back by `describe()` on every later hit, so a cached response
      // carries the same dimensions the fresh one did.
      customMetadata: { width: String(size.width), height: String(size.height) },
    });
  } catch (err) {
    // The image exists only in this response's memory; reporting success would
    // hand the player a URL that 404s.
    return new Response(`R2 error: ${err}`, { status: 502 });
  }

  await bumpCount(env);
  return json({ url: imageUrl(url, key), ...size, cached: false });
}

/** The response body for an object already in R2. */
function describe(url, key, head) {
  const meta = head.customMetadata ?? {};
  const width = Number.parseInt(meta.width ?? '', 10);
  const height = Number.parseInt(meta.height ?? '', 10);
  return {
    url: imageUrl(url, key),
    width: Number.isFinite(width) && width > 0 ? width : FALLBACK_WIDTH,
    height: Number.isFinite(height) && height > 0 ? height : FALLBACK_HEIGHT,
  };
}

/**
 * Built from the incoming request's own origin rather than a configured host:
 * whatever address the server reached this Worker on is, by construction, one
 * that resolves — and the same URL then goes out to every phone in the room.
 */
function imageUrl(url, key) {
  return `${url.origin}/${key}`;
}

// ---------------------------------------------------------------------------
// GET /stats — SRC's {date,count}, plus the generation switch
// ---------------------------------------------------------------------------

/**
 * The server polls this lazily (30 s TTL) to recover the day-total after a
 * Render restart. Returns 0 when the KV binding is unconfigured or the key is
 * absent — neither is an error condition.
 *
 * `generation` reports whether the `AI` binding is deployed, so the state of
 * the switch can be read for free — the only other probe is a `/generate` miss,
 * which costs an image exactly when the answer is the unwelcome one. The server
 * reads `date` and `count` and ignores the rest.
 */
async function serveStats(env) {
  const date = utcDayKey();
  const count = env.STATS_KV ? await readCount(env.STATS_KV, date) : 0;
  return json({ date, count, generation: Boolean(env.AI) });
}

/**
 * Best-effort daily counter, bumped only when an image was really generated —
 * a cache hit costs no AI call and must not show up as one.
 *
 * KV has no atomic increment, so two concurrent generations can under-count by
 * one in the rare race; the server tracks its own local counter and surfaces
 * max(local, kv), so the visible count stays monotonic. A KV failure must never
 * break image generation, hence the swallowed catch.
 */
async function bumpCount(env) {
  if (!env.STATS_KV) return;
  try {
    const date = utcDayKey();
    const current = await readCount(env.STATS_KV, date);
    await env.STATS_KV.put(`${KV_KEY_PREFIX}${date}`, String(current + 1), {
      expirationTtl: KV_TTL_SECONDS,
    });
  } catch {
    // Intentional: KV is observational, not authoritative for reservation.
  }
}

async function readCount(kv, date) {
  const raw = await kv.get(`${KV_KEY_PREFIX}${date}`);
  const n = Number.parseInt(raw ?? '0', 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function utcDayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Image identity and shape
// ---------------------------------------------------------------------------

/**
 * The cache key: `i/<sha256(prompt) as hex>.png`.
 *
 * This is the single most load-bearing function here — every deploy must
 * produce byte-identical keys for the same prompt, or the whole cache is
 * orphaned. It is also why prompt text is locked once shipped (design §7.1).
 */
async function imageKey(prompt) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(prompt));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${KEY_PREFIX}${hex}${KEY_SUFFIX}`;
}

/** PNG signature, else assume the JPEG the model actually returns. */
function contentTypeOf(bytes) {
  return isPng(bytes) ? 'image/png' : 'image/jpeg';
}

function isPng(bytes) {
  return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
}

/**
 * Reads the real dimensions out of the encoded bytes.
 *
 * Design §7.2 said to return the size we asked for; there is no size to ask
 * for — Flux Schnell takes `prompt` and `steps` and nothing else — so that
 * would mean returning a constant nobody verifies. RevealScreen reserves layout
 * space from these numbers (T-4.4), so a wrong constant is a visible jump on
 * every phone, and it would go wrong silently the day the model's output size
 * changes. Twenty lines of header reading make it a fact instead.
 *
 * Both formats are read from their headers only; nothing here decodes pixels.
 */
function imageSize(bytes) {
  return (
    (isPng(bytes) ? pngSize(bytes) : jpegSize(bytes)) ?? {
      width: FALLBACK_WIDTH,
      height: FALLBACK_HEIGHT,
    }
  );
}

/** PNG: an 8-byte signature, then IHDR, whose first two fields are the size. */
function pngSize(bytes) {
  if (bytes.length < 24) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

/**
 * JPEG: walk the marker chain to the frame header (SOF0…SOF15, minus the four
 * markers in that range that are not frames) and read its size fields.
 */
function jpegSize(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  let offset = 2;
  while (offset + 3 < bytes.length) {
    if (view.getUint8(offset) !== 0xff) return null; // out of step with the chain
    const marker = view.getUint8(offset + 1);
    // Standalone markers carry no length field.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const length = view.getUint16(offset + 2);
    const isFrame =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isFrame) {
      if (offset + 9 > bytes.length) return null;
      // SOF payload: precision byte, then height, then width.
      return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
    }
    if (length < 2) return null;
    offset += 2 + length;
  }
  return null;
}

function json(body) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}
