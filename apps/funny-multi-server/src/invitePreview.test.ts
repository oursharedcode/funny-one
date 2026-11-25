// SPDX-License-Identifier: AGPL-3.0-only

// Step 126: the Christmas join link's preview. A Fastify with the static
// bundle on a temp folder, as production mounts it, and rooms made the way
// the socket handlers make them.

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { PACK_INVITES } from '@funny/shared';
import type { Language } from '@funny/shared';
import { __resetRoomsForTest, createRoom } from './rooms.js';
import { christmasPreviewTags, injectHead, registerInvitePreview } from './invitePreview.js';

const SHELL =
  '<!doctype html>\n<html lang="en">\n  <head>\n    <title>Funny Multi</title>\n  </head>\n  <body><div id="root"></div></body>\n</html>\n';

let dir: string;
let app: FastifyInstance;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'funny-preview-'));
  writeFileSync(join(dir, 'index.html'), SHELL);
  app = Fastify({ logger: false });
  await app.register(fastifyStatic, { root: dir, prefix: '/' });
  registerInvitePreview(app, { base: '/', indexFile: join(dir, 'index.html') });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  rmSync(dir, { recursive: true, force: true });
});

afterEach(() => __resetRoomsForTest());

function room(language: Language, pack: 'on' | 'off' | 'paid' | null) {
  const r = createRoom('Host', language, 'sock-1');
  r.pack = pack === null ? null : { id: 'chr26', on: pack !== 'off', paid: pack === 'paid' };
  return r;
}

function get(url: string, headers: Record<string, string> = {}) {
  return app.inject({
    method: 'GET',
    url,
    headers: { host: 'www.funny37.example', 'x-forwarded-proto': 'https', ...headers },
  });
}

function meta(html: string, key: string): string | null {
  const m = new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)" />`).exec(html);
  return m ? m[1]! : null;
}

describe('the Christmas join link (Step 126)', () => {
  it("dresses a Christmas room's link in the room's language, with the fixed picture", async () => {
    const r = room('ru', 'on');
    const res = await get(`/?room=${r.code}&lang=ru`);
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/^text\/html/);
    expect(res.headers['cache-control']).toBe('no-cache');
    expect(meta(res.body, 'og:title')).toBe(PACK_INVITES.ru.title);
    expect(meta(res.body, 'og:description')).toBe(PACK_INVITES.ru.line);
    expect(meta(res.body, 'og:image')).toBe('https://www.funny37.example/og-christmas.jpg');
    expect(meta(res.body, 'og:image:width')).toBe('1200');
    expect(meta(res.body, 'og:image:height')).toBe('630');
    expect(meta(res.body, 'twitter:card')).toBe('summary_large_image');
    // Still the game's own shell, with the tags inside its head.
    expect(res.body.indexOf('og:title')).toBeLessThan(res.body.indexOf('</head>'));
    expect(res.body).toContain('<div id="root"></div>');
  });

  it('dresses a paid room too, and takes a code in any case', async () => {
    const r = room('en', 'paid');
    const res = await get(`/?room=${r.code.toLowerCase()}&lang=en`);
    expect(meta(res.body, 'og:title')).toBe(PACK_INVITES.en.title);
  });

  it('names no room code, price or unlock code', async () => {
    const r = room('en', 'paid');
    r.packCode = 'XMAS26-K7QM-3FPA';
    const res = await get(`/?room=${r.code}&lang=en`);
    const head = res.body.slice(0, res.body.indexOf('</head>'));
    expect(head).not.toContain(r.code);
    expect(head).not.toMatch(/XMAS26|A\$|\$\d/);
  });

  it.each([
    ['an ordinary room', () => room('en', null).code],
    ['a room switched off', () => room('en', 'off').code],
    ['an unknown code', () => 'ZZZZ'],
    ['an over-long code', () => 'A'.repeat(40)],
  ])('leaves the shell untouched for %s', async (_what, code) => {
    const res = await get(`/?room=${code()}&lang=en`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(SHELL);
  });

  it('leaves the plain home untouched', async () => {
    const res = await get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(SHELL);
  });

  it('serves no preview to a request with an odd Host', async () => {
    const r = room('en', 'on');
    const res = await get(`/?room=${r.code}`, { host: 'evil"><script>' });
    expect(res.body).toBe(SHELL);
  });

  it('follows the request when no proxy names the scheme', async () => {
    const r = room('en', 'on');
    const res = await app.inject({
      method: 'GET',
      url: `/?room=${r.code}`,
      headers: { host: 'localhost:3000' },
    });
    expect(meta(res.body, 'og:image')).toBe('http://localhost:3000/og-christmas.jpg');
  });
});

describe('the preview helpers', () => {
  it('escapes what it writes into an attribute', () => {
    const r = createRoom('Host', 'en', 'sock-2');
    r.pack = { id: 'chr26', on: true, paid: false };
    const tags = christmasPreviewTags(r, 'https://x.example/a"b<c>.jpg')!;
    expect(tags).toContain('content="https://x.example/a&quot;b&lt;c&gt;.jpg"');
  });

  it('leaves a page with no head alone', () => {
    expect(injectHead('<p>no head</p>', '<meta />')).toBe('<p>no head</p>');
  });
});
