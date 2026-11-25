// SPDX-License-Identifier: AGPL-3.0-only

// Step 124 (B-29, owner decisions D2 A of 2026-11-22 and D1–D5 of
// 2026-11-25): the owner's admin page — a private phone page behind a secret
// link, `/admin/<PACK_ADMIN_SECRET>`, plain HTML from this server, in English,
// no client bundle and nothing of it in the game's code. What it is for:
//
// - **Claimed, to match** — PayID codes whose buyer pressed "I've paid": the
//   code works for 48 hours (B-29 #5) and stops then unless the owner, seeing
//   the transfer in the bank's app (its reference is the code), presses
//   Received. Each shows its time left; a lapsed one stays listed, since a
//   late payment can still be matched.
// - **Paid without "I've paid"?** (D3 A) — PayID codes of the last 7 days that
//   nobody claimed: a buyer may pay and close the page first. Their code does
//   not work until Received.
// - **Block**, by B-29's four cases (refund, reversed, leaked, asked), and
//   **New code** — the owner's gift or a replacement, logged with the code it
//   replaces, shown with a link the buyer opens to keep it on their phone.
// - **Look up** — a lost code by any part of it, by a room code it opened, or
//   by the day it was issued (YYYY-MM-DD, UTC): its whole history.
//
// No alert reaches the owner (D2 A): the bank's own notice of a PayID
// transfer is the cue to open this page. Every view and action is computed
// from the receipt log (receipts.ts) and done through codes.ts, so this page
// knows nothing the log does not.
//
// The secret is its own (D1 A), at least 16 characters, so a leaked link is
// changed without voiding any code sold; without it the routes do not exist.
// A wrong key is answered as any unknown address is, and takes a token of a
// per-address limit, so the link cannot be guessed from one address.

import { createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { PACK_IDS, REFUND_POLICY_VERSION, isPackPaid, parseCode, type PackId } from '@funny/shared';
import { CLAIM_HOURS, type PackCodes } from './codes.js';
import type { BlockReason, ReceiptLog, ReceiptRail, ReceiptRecord } from './receipts.js';
import { WRONG_CODES_PER_HOUR, WRONG_CODE_WINDOW_MS, createRateLimiter } from './rateLimit.js';

export const ADMIN_MIN_SECRET_LENGTH = 16;
/** How far back the list of unclaimed PayID codes reaches (D3 A). */
export const UNCLAIMED_DAYS = 7;
/** At most this many codes answer a lookup. */
export const LOOKUP_LIMIT = 50;
/** Where the issue record says a code the owner gave was shown. */
export const OWNER_DELIVERED = 'by hand';

const CLAIM_MS = CLAIM_HOURS * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const BLOCK_REASONS: readonly BlockReason[] = ['refund', 'reversed', 'leaked', 'asked'];
const BLOCK_LABELS: Record<BlockReason, string> = {
  refund: 'refund',
  reversed: 'payment taken back',
  leaked: 'leaked in public',
  asked: 'the buyer asked',
};

/** One code's history, from the receipt log. */
export interface CodeRow {
  code: string;
  /** Null for a code the log saw only in use (one minted for a test). */
  rail: ReceiptRail | null;
  amount: string;
  ref: string;
  issuedAt: number | null;
  /** Still a PayID code waiting for its payment to be matched. */
  pending: boolean;
  /** The first claim's time. */
  claimedAt: number | null;
  receivedAt: number | null;
  blockedAt: number | null;
  blockReason: BlockReason | null;
  rooms: number;
  roomCodes: string[];
  countries: string[];
  games: number;
  lastUsedAt: number | null;
}

export type CodeState = 'claimed' | 'lapsed' | 'unclaimed' | 'good' | 'blocked';

export function stateOf(row: CodeRow, now: number): CodeState {
  if (row.blockReason) return 'blocked';
  if (!row.pending) return 'good';
  if (row.claimedAt === null) return 'unclaimed';
  return now < row.claimedAt + CLAIM_MS ? 'claimed' : 'lapsed';
}

/** Every code the log names, oldest first, with its history. */
export function codeRows(records: readonly ReceiptRecord[]): CodeRow[] {
  const rows = new Map<string, CodeRow>();
  function rowOf(code: string): CodeRow {
    let row = rows.get(code);
    if (!row) {
      row = {
        code,
        rail: null,
        amount: '',
        ref: '',
        issuedAt: null,
        pending: false,
        claimedAt: null,
        receivedAt: null,
        blockedAt: null,
        blockReason: null,
        rooms: 0,
        roomCodes: [],
        countries: [],
        games: 0,
        lastUsedAt: null,
      };
      rows.set(code, row);
    }
    return row;
  }
  for (const record of records) {
    const at = Date.parse(record.at);
    const row = rowOf(record.code);
    switch (record.type) {
      case 'issue':
        row.rail = record.rail;
        row.amount = record.amount;
        row.ref = record.ref;
        row.issuedAt = at;
        row.pending = record.state === 'pending';
        break;
      case 'claim':
        if (row.pending && row.claimedAt === null) row.claimedAt = at;
        break;
      case 'received':
        if (row.pending) {
          row.pending = false;
          row.receivedAt = at;
        }
        break;
      case 'block':
        if (!row.blockReason) {
          row.blockReason = record.reason;
          row.blockedAt = at;
        }
        break;
      case 'room':
        row.rooms++;
        if (!row.roomCodes.includes(record.room)) row.roomCodes.push(record.room);
        if (!row.countries.includes(record.country)) row.countries.push(record.country);
        row.lastUsedAt = at;
        break;
      case 'game':
        row.games++;
        row.lastUsedAt = at;
        break;
    }
  }
  return [...rows.values()];
}

export interface AdminView {
  /** Claimed PayID codes still to match, least time left first; lapsed ones last. */
  claimed: CodeRow[];
  /** Unclaimed PayID codes of the last UNCLAIMED_DAYS days, newest first (D3 A). */
  unclaimed: CodeRow[];
}

export function adminView(rows: readonly CodeRow[], now: number): AdminView {
  const claimed = rows
    .filter((r) => {
      const s = stateOf(r, now);
      return s === 'claimed' || s === 'lapsed';
    })
    .sort((a, b) => a.claimedAt! - b.claimedAt!);
  const unclaimed = rows
    .filter(
      (r) =>
        stateOf(r, now) === 'unclaimed' &&
        r.issuedAt !== null &&
        r.issuedAt >= now - UNCLAIMED_DAYS * DAY_MS,
    )
    .sort((a, b) => b.issuedAt! - a.issuedAt!);
  return { claimed, unclaimed };
}

/**
 * The codes a lookup finds: a day (YYYY-MM-DD) finds those issued on it, by
 * UTC; anything else is read as letters and digits — part of a code, in any
 * case and with or without its hyphens (three characters at least), or a room
 * code a code opened. Newest first, at most LOOKUP_LIMIT.
 */
export function lookup(rows: readonly CodeRow[], query: string): CodeRow[] {
  const q = query.trim();
  let found: CodeRow[];
  if (/^\d{4}-\d{2}-\d{2}$/u.test(q)) {
    found = rows.filter(
      (r) => r.issuedAt !== null && new Date(r.issuedAt).toISOString().startsWith(q),
    );
  } else {
    const bare = q.toUpperCase().replace(/[^0-9A-Z]/gu, '');
    if (bare.length < 3) return [];
    found = rows.filter(
      (r) => r.code.replace(/-/gu, '').includes(bare) || r.roomCodes.includes(bare),
    );
  }
  const latest = (r: CodeRow): number => Math.max(r.issuedAt ?? 0, r.lastUsedAt ?? 0);
  return found.sort((a, b) => latest(b) - latest(a)).slice(0, LOOKUP_LIMIT);
}

// ---- the page ---------------------------------------------------------------

function esc(text: string): string {
  return text.replace(/[&<>"']/gu, (c) => `&#${c.charCodeAt(0)};`);
}

/** "2 d 3 h", "5 h 12 min", "4 min". */
export function span(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return `${hours} h ${mins} min`;
  return `${mins} min`;
}

function time(at: number | null): string {
  if (at === null) return '—';
  const iso = new Date(at).toISOString();
  return `<time datetime="${iso}">${esc(iso.slice(0, 16).replace('T', ' '))} UTC</time>`;
}

/** A form that posts one action back to this page. */
function action(
  path: string,
  name: string,
  label: string,
  fields: Record<string, string>,
  extra = '',
  confirmText = '',
): string {
  const hidden = Object.entries(fields)
    .map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`)
    .join('');
  const confirmAttr = confirmText ? ` data-confirm="${esc(confirmText)}"` : '';
  return `<form method="post" action="${esc(path)}"${confirmAttr}><input type="hidden" name="action" value="${esc(name)}">${hidden}${extra}<button>${esc(label)}</button></form>`;
}

function blockForm(path: string, code: string): string {
  const options = BLOCK_REASONS.map(
    (r) => `<option value="${r}">${esc(BLOCK_LABELS[r])}</option>`,
  ).join('');
  return action(
    path,
    'block',
    'Block',
    { code },
    `<select name="reason" aria-label="Why">${options}</select>`,
    `Block ${code}? Its rooms play free from their next game.`,
  );
}

function card(row: CodeRow, path: string, now: number): string {
  const state = stateOf(row, now);
  const lines: string[] = [];
  let status: string;
  switch (state) {
    case 'claimed':
      status = `<b class="ok">works — ${esc(span(row.claimedAt! + CLAIM_MS - now))} left to match</b>`;
      break;
    case 'lapsed':
      status = `<b class="bad">off — claimed ${esc(span(now - row.claimedAt!))} ago, 48 h over; works again once Received</b>`;
      break;
    case 'unclaimed':
      status = '<b class="warn">no “I’ve paid” — off until Received</b>';
      break;
    case 'blocked':
      status = `<b class="bad">blocked: ${esc(BLOCK_LABELS[row.blockReason!])}</b>`;
      break;
    default:
      status = row.rail === 'payid' ? '<b class="ok">received</b>' : '<b class="ok">works</b>';
  }
  lines.push(`<p class="code">${esc(row.code)}</p>`, `<p>${status}</p>`);
  const what = [row.rail ?? 'not issued here (a test code)', row.amount]
    .filter(Boolean)
    .join(' · ');
  lines.push(`<p>${esc(what)}${row.ref ? ` · replaces ${esc(row.ref)}` : ''}</p>`);
  const times = [`issued ${time(row.issuedAt)}`];
  if (row.claimedAt !== null) times.push(`“I’ve paid” ${time(row.claimedAt)}`);
  if (row.receivedAt !== null) times.push(`received ${time(row.receivedAt)}`);
  if (row.blockedAt !== null) times.push(`blocked ${time(row.blockedAt)}`);
  lines.push(`<p class="small">${times.join('<br>')}</p>`);
  if (row.rooms > 0 || row.games > 0) {
    lines.push(
      `<p class="small">${row.rooms} room(s), ${row.games} game(s) · ${esc(row.countries.join(' '))} · last ${time(row.lastUsedAt)}</p>`,
    );
  }
  const buttons: string[] = [];
  if (state === 'claimed' || state === 'lapsed' || state === 'unclaimed') {
    buttons.push(action(path, 'received', 'Received', { code: row.code }));
  }
  if (state !== 'blocked') buttons.push(blockForm(path, row.code));
  buttons.push(action(path, 'new', 'New code for this buyer', { replaces: row.code }));
  lines.push(`<div class="row">${buttons.join('')}</div>`);
  return `<section class="card">${lines.join('')}</section>`;
}

export type AdminDone = 'received' | 'blocked' | 'new' | 'failed';

export interface AdminPage {
  /** This page's own path, the secret in it. */
  path: string;
  /** The game's address a buyer opens to keep a code: `https://host/`. */
  gameUrl: string;
  rows: readonly CodeRow[];
  now: number;
  query: string;
  done: AdminDone | null;
  doneCode: string | null;
}

export function renderAdminPage(page: AdminPage): string {
  const { path, gameUrl, rows, now, query, done, doneCode } = page;
  const view = adminView(rows, now);
  const parts: string[] = [];

  if (done === 'new' && doneCode) {
    const link = `${gameUrl}?code=${doneCode}`;
    parts.push(
      `<section class="card flash"><p>New code:</p><p class="code">${esc(doneCode)}</p><p class="small">For the buyer — opening this link keeps it on their phone:</p><p class="link">${esc(link)}</p><button type="button" data-copy="${esc(link)}">Copy link</button></section>`,
    );
  } else if (done === 'received' || done === 'blocked') {
    parts.push(
      `<p class="flash">${done === 'received' ? 'Received' : 'Blocked'}: ${esc(doneCode ?? '')}</p>`,
    );
  } else if (done === 'failed') {
    parts.push(
      '<p class="flash bad">That did not change anything (the code was not in that state).</p>',
    );
  }

  parts.push(`<h2>Claimed — match within ${CLAIM_HOURS} h (${view.claimed.length})</h2>`);
  parts.push(
    view.claimed.length
      ? view.claimed.map((r) => card(r, path, now)).join('')
      : '<p class="small">None waiting.</p>',
  );

  parts.push(`<h2>Paid without “I’ve paid”? (${view.unclaimed.length})</h2>`);
  parts.push(
    `<p class="small">PayID codes of the last ${UNCLAIMED_DAYS} days with no claim. A transfer whose reference is one of these: press Received.</p>`,
  );
  parts.push(
    view.unclaimed.length
      ? view.unclaimed.map((r) => card(r, path, now)).join('')
      : '<p class="small">None.</p>',
  );

  parts.push('<h2>Look up</h2>');
  parts.push(
    `<form method="get" action="${esc(path)}" class="row"><input name="q" value="${esc(query)}" placeholder="part of a code, a room code, or 2026-12-03" autocapitalize="characters"><button>Find</button></form>`,
  );
  if (query.trim() !== '') {
    const found = lookup(rows, query);
    parts.push(
      found.length
        ? found.map((r) => card(r, path, now)).join('')
        : '<p class="small">Nothing found.</p>',
    );
  }

  parts.push('<h2>New code</h2>');
  parts.push(
    action(
      path,
      'new',
      'Make a new code',
      {},
      '<input name="replaces" placeholder="the code it replaces (optional)" autocapitalize="characters">',
    ),
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>Codes — Funny Multi</title>
<style>
body{font:16px/1.4 system-ui,sans-serif;margin:0 auto;max-width:36rem;padding:12px;color:#222;background:#fafafa}
h1{font-size:1.3rem;margin:.2rem 0 .8rem}h2{font-size:1.05rem;margin:1.4rem 0 .5rem}
.card{background:#fff;border:1px solid #ddd;border-radius:8px;padding:10px;margin:8px 0}
.card p{margin:.25rem 0}.code{font:600 1.15rem ui-monospace,monospace;letter-spacing:.03em}
.small{font-size:.85rem;color:#555}.link{font:.8rem ui-monospace,monospace;word-break:break-all}
.row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px}
form{display:inline-flex;gap:4px;align-items:center;margin:0}
button,select,input{font:inherit;padding:8px 10px;border-radius:6px;border:1px solid #aaa;background:#fff}
button{background:#ec4899;color:#fff;border-color:#ec4899}input{flex:1;min-width:12rem}
.ok{color:#15803d}.warn{color:#b45309}.bad{color:#b91c1c}
.flash{background:#fef3c7;border-radius:8px;padding:8px}
</style>
</head>
<body>
<h1>Christmas codes</h1>
${parts.join('\n')}
<script>
document.querySelectorAll('time').forEach(function(t){t.textContent=new Date(t.dateTime).toLocaleString()});
document.querySelectorAll('form[data-confirm]').forEach(function(f){f.addEventListener('submit',function(e){if(!confirm(f.dataset.confirm))e.preventDefault()})});
document.querySelectorAll('button[data-copy]').forEach(function(b){b.addEventListener('click',function(){navigator.clipboard&&navigator.clipboard.writeText(b.dataset.copy).then(function(){b.textContent='Copied!'})})});
</script>
</body>
</html>
`;
}

// ---- the routes -------------------------------------------------------------

export interface AdminRoutesOptions {
  base: string;
  /** PACK_ADMIN_SECRET; unset or under 16 characters, there is no admin page. */
  secret: string | null | undefined;
  codes: PackCodes;
  receipts: ReceiptLog;
  ipOf: (request: FastifyRequest) => string;
  /** Clock injection point for tests. */
  now?: () => number;
}

function digest(text: string): Buffer {
  return createHash('sha256').update(text).digest();
}

function field(body: unknown, name: string): string {
  if (typeof body !== 'object' || body === null) return '';
  const value = (body as Record<string, unknown>)[name];
  return typeof value === 'string' ? value : '';
}

/** Registers the admin page; false when there is no usable secret. */
export function registerAdminRoutes(
  fastify: FastifyInstance,
  options: AdminRoutesOptions,
): boolean {
  const { base, codes, receipts, ipOf, now = Date.now } = options;
  const secret =
    typeof options.secret === 'string' && options.secret.length >= ADMIN_MIN_SECRET_LENGTH
      ? options.secret
      : null;
  if (!secret) return false;
  const secretDigest = digest(secret);
  const wrongKeyLimiter = createRateLimiter({
    capacity: WRONG_CODES_PER_HOUR,
    intervalMs: WRONG_CODE_WINDOW_MS,
  });
  fastify.addHook('onClose', async () => wrongKeyLimiter.stop());

  /** True for the right key from an address not locked out; a wrong one takes a token. */
  function allowed(request: FastifyRequest<{ Params: { key: string } }>): boolean {
    const ip = ipOf(request);
    if (!wrongKeyLimiter.peek(ip)) return false;
    if (timingSafeEqual(digest(request.params.key ?? ''), secretDigest)) return true;
    wrongKeyLimiter.take(ip);
    return false;
  }

  const route = `${base}admin/:key`;

  // Plain HTML forms post url-encoded: parsed for this page alone, refused
  // anywhere else. (On the root, not in an encapsulated plugin: a plugin
  // loading at fastify.ready() races buildServer's hooks added after it.)
  fastify.addContentTypeParser(
    'application/x-www-form-urlencoded',
    { parseAs: 'string', bodyLimit: 2048 },
    (request, text, done) => {
      if (!request.url.startsWith(`${base}admin/`)) {
        const err = new Error('Unsupported Media Type') as Error & { statusCode: number };
        err.statusCode = 415;
        done(err, undefined);
        return;
      }
      done(null, Object.fromEntries(new URLSearchParams(text as string)));
    },
  );

  function keepPrivate(reply: FastifyReply): FastifyReply {
    return reply
      .header('cache-control', 'no-store')
      .header('x-robots-tag', 'noindex, nofollow')
      .header('referrer-policy', 'no-referrer')
      .header('x-frame-options', 'DENY');
  }

  fastify.get<{
    Params: { key: string };
    Querystring: { q?: string; done?: string; code?: string };
  }>(route, async (request, reply) => {
    if (!allowed(request)) return reply.callNotFound();
    keepPrivate(reply);
    const { q = '', done = '', code = '' } = request.query;
    const known: readonly string[] = ['received', 'blocked', 'new', 'failed'];
    const host = request.headers.host ?? 'localhost';
    const proto =
      request.headers['x-forwarded-proto'] === 'http' || host.startsWith('localhost')
        ? 'http'
        : 'https';
    const html = renderAdminPage({
      path: `${base}admin/${request.params.key}`,
      gameUrl: `${proto}://${host}${base}`,
      rows: codeRows(receipts.records()),
      now: now(),
      query: typeof q === 'string' ? q : '',
      done: known.includes(done) ? (done as AdminDone) : null,
      doneCode: parseCode(code)?.code ?? null,
    });
    return reply.type('text/html; charset=utf-8').send(html);
  });

  fastify.post<{ Params: { key: string } }>(route, async (request, reply) => {
    if (!allowed(request)) return reply.callNotFound();
    keepPrivate(reply);
    const back = `${base}admin/${request.params.key}`;
    const kind = field(request.body, 'action');
    const code = parseCode(field(request.body, 'code'))?.code ?? '';
    let done: AdminDone = 'failed';
    let shown = code;
    if (kind === 'received') {
      if (codes.receive(code)) done = 'received';
    } else if (kind === 'block') {
      const reason = field(request.body, 'reason') as BlockReason;
      if (BLOCK_REASONS.includes(reason) && codes.block(code, reason)) done = 'blocked';
    } else if (kind === 'new') {
      const replaced = parseCode(field(request.body, 'replaces'));
      const at = now();
      const pack: PackId | undefined =
        replaced && isPackPaid(replaced.pack, at)
          ? replaced.pack
          : PACK_IDS.find((id) => isPackPaid(id, at));
      if (pack && codes.enabled) {
        shown = codes.issue({
          pack,
          rail: 'owner',
          ref: replaced?.code ?? '',
          amount: '',
          delivered: OWNER_DELIVERED,
          policy: REFUND_POLICY_VERSION,
          pending: false,
        });
        done = 'new';
      }
    }
    const params = new URLSearchParams({ done });
    if (shown && done !== 'failed') params.set('code', shown);
    return reply.redirect(`${back}?${params.toString()}`, 303);
  });
  return true;
}
