// SPDX-License-Identifier: AGPL-3.0-only

// Step 126 (B-29 improvement #2, owner decision D3 A): the Christmas join
// link's preview. A messenger that is handed `/?room=CODE&lang=…` fetches that
// page and draws a card from its Open Graph tags. For a room whose Christmas
// switch is on, the page this route serves carries a title and a line from the
// invitation table (@funny/shared's PACK_INVITES — what the lobby's Invite
// button sends, so card and message agree), in the room's language, and one
// fixed picture: a 1200 × 630 crop of a chr26 scene, shipped in the client's
// public/ folder as og-christmas.jpg. The uptime alarm fetches the same file.
//
// Everything else — an ordinary room, a room switched off, an unknown or
// malformed code, a request with no room — gets the bundle's index.html
// untouched, exactly as the static wildcard would serve it. The tags name the
// game and the edition, never the room code, a price or an unlock code.
//
// The page is the SPA's own shell, so a person who opens the link lands in
// the game as before; only the head differs. Never cached as a Christmas page:
// a room's switch can change, and a room ends.

import { readFile } from 'node:fs/promises';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { PACK_INVITES, isLanguage } from '@funny/shared';
import type { Room } from './types.js';
import { getRoom } from './rooms.js';

/** The preview picture, relative to the base path (client public/). */
export const PREVIEW_IMAGE = 'og-christmas.jpg';
export const PREVIEW_WIDTH = 1200;
export const PREVIEW_HEIGHT = 630;

/** A room code as the join screen takes it; anything longer is not one. */
const MAX_CODE_LENGTH = 16;

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * The address the page was asked for, for the picture's absolute URL (Open
 * Graph wants one). Behind Caddy the Host is the game's own and
 * X-Forwarded-Proto says https; a Host that is not a plain host name gets no
 * preview at all.
 */
export function requestOrigin(request: FastifyRequest): string | null {
  const host = request.headers.host;
  if (typeof host !== 'string' || !/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host)) return null;
  const forwarded = request.headers['x-forwarded-proto'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  const proto = first === 'https' || first === 'http' ? first : request.protocol;
  return `${proto}://${host}`;
}

/** The head tags for a Christmas room's link, or null for any other room. */
export function christmasPreviewTags(room: Room | undefined, imageUrl: string): string | null {
  if (!room?.pack?.on) return null;
  const { title, line } = PACK_INVITES[isLanguage(room.language) ? room.language : 'en'];
  return [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(line)}" />`,
    `<meta name="description" content="${esc(line)}" />`,
    `<meta property="og:image" content="${esc(imageUrl)}" />`,
    `<meta property="og:image:type" content="image/jpeg" />`,
    `<meta property="og:image:width" content="${PREVIEW_WIDTH}" />`,
    `<meta property="og:image:height" content="${PREVIEW_HEIGHT}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ');
}

/** `html` with `tags` placed just before `</head>`; unchanged without one. */
export function injectHead(html: string, tags: string): string {
  const at = html.indexOf('</head>');
  if (at < 0) return html;
  return `${html.slice(0, at)}  ${tags}\n  ${html.slice(at)}`;
}

/**
 * Registers `GET {base}` ahead of @fastify/static's wildcard (find-my-way
 * prefers the exact path), which must already be registered: the ordinary
 * case is its `sendFile('index.html')`.
 */
export function registerInvitePreview(
  fastify: FastifyInstance,
  options: { base: string; indexFile: string },
): void {
  let shell: Promise<string> | null = null;

  fastify.get<{ Querystring: { room?: unknown } }>(options.base, async (request, reply) => {
    const raw = request.query.room;
    const code =
      typeof raw === 'string' && raw.length <= MAX_CODE_LENGTH ? raw.trim().toUpperCase() : '';
    const origin = code ? requestOrigin(request) : null;
    const tags = origin
      ? christmasPreviewTags(getRoom(code), `${origin}${options.base}${PREVIEW_IMAGE}`)
      : null;
    if (!tags) return reply.sendFile('index.html');

    shell ??= readFile(options.indexFile, 'utf8');
    let html: string;
    try {
      html = await shell;
    } catch (err) {
      shell = null;
      throw err;
    }
    return reply
      .header('cache-control', 'no-cache')
      .type('text/html; charset=utf-8')
      .send(injectHead(html, tags));
  });
}
