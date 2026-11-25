// SPDX-License-Identifier: AGPL-3.0-only

// Step 125 (B-29, owner decisions D5 A and D6 A of 2026-11-22, D1–D3 A of
// 2026-11-25): paying through GitHub Sponsors, the rail outside Australia.
// GitHub is the merchant of record, so abroad the pack is a thank-you for a
// one-time sponsorship of the pack's own tier ("Christmas 2026 edition",
// US$2), not a sale. Three routes, all uncached:
//
//   POST /pay/sponsors       the buyer typed the GitHub user name they will
//                            pay with and pressed "Pay on GitHub": the server
//                            issues a pending code for that name and answers
//                            with the checkout to open — the tier, with the
//                            code in the link's `metadata_code` as well, which
//                            GitHub keeps in its export of the sponsorships.
//   POST /pay/sponsors/hook  GitHub's webhook. Its signature is checked
//                            (X-Hub-Signature-256, HMAC-SHA256 of the body as
//                            sent, with SPONSORS_WEBHOOK_SECRET); a one-time
//                            sponsorship of at least the pack's price switches
//                            on the newest code waiting for the sponsor's
//                            name — the code works from then on (D2 A).
//   POST /pay/status         the pay page asks whether its waiting code works
//                            yet; it asks every few seconds and when the
//                            buyer comes back to the tab.
//
// What GitHub's documentation leaves open: its sponsorship webhook names the
// sponsor and the tier, but nothing says the link's metadata comes with it.
// So the name is how a payment finds its code (D1 A); a `metadata.code` in
// the payload, if GitHub ever sends one, is taken first.
//
// A sponsorship the server cannot match — no code waiting for that name, or
// one made once the pack is no longer on sale (from 1 July 2027, D6 A: the
// tier is retired that day) — switches nothing on. It goes in the receipt log
// and on the admin page, where the owner makes the buyer a code by hand or
// refunds the sponsorship on GitHub. A code whose webhook never comes stays
// waiting; the admin page lists it, and Received switches it on.
//
// Nothing is on sale through Sponsors without a code secret, with the packs
// off, after the free part, or without DEPLOYER_SPONSORS_URL (whose last part
// is the sponsored account), SPONSORS_TIER_ID and SPONSORS_WEBHOOK_SECRET.

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  PACKS,
  REFUND_POLICY_VERSION,
  parseCode,
  parseGitHubLogin,
  type PayClaimAnswer,
  type PayError,
  type PaySponsorsAnswer,
} from '@funny/shared';
import type { PackCodes } from './codes.js';
import type { ReceiptLog, ReceiptRecord, SponsorshipOutcome } from './receipts.js';
import { packOnSale } from './rooms.js';
import {
  SPONSORS_CODES_PER_HOUR,
  WRONG_CODES_PER_HOUR,
  WRONG_CODE_WINDOW_MS,
  createRateLimiter,
} from './rateLimit.js';

/** Where the issue record says a Sponsors code was shown. */
export const SPONSORS_DELIVERED = 'pay page';

/** GitHub's webhook payload is a few kilobytes; this is ample. */
const HOOK_BODY_LIMIT = 256 * 1024;
const POLICY_VERSION = /^\d{4}-\d{2}-\d{2}$/u;
const TIER_ID = /^\d{1,12}$/u;
const SPONSORS_PAGE = /^https:\/\/github\.com\/sponsors\/([A-Za-z0-9-]{1,39})\/?$/u;

export interface SponsorsSettings {
  /** DEPLOYER_SPONSORS_URL: `https://github.com/sponsors/<account>`. */
  sponsorsUrl: string | null | undefined;
  /** SPONSORS_TIER_ID: the pack's one-time tier, the number in its checkout link. */
  tierId: string | null | undefined;
  /** SPONSORS_WEBHOOK_SECRET: the secret set on the webhook at GitHub. */
  webhookSecret: string | null | undefined;
}

export interface SponsorsRail {
  /** The sponsored account, in lower case. */
  account: string;
  tierId: string;
  webhookSecret: string;
}

/** The rail when all three settings are usable, else null: nothing sells through Sponsors. */
export function sponsorsRail(settings: SponsorsSettings): SponsorsRail | null {
  const account = SPONSORS_PAGE.exec(settings.sponsorsUrl?.trim() ?? '')?.[1];
  const tierId = settings.tierId?.trim() ?? '';
  const webhookSecret = settings.webhookSecret ?? '';
  if (!account || !TIER_ID.test(tierId) || webhookSecret === '') return null;
  return { account: account.toLowerCase(), tierId, webhookSecret };
}

/** The checkout of the pack's tier, the code in its metadata. */
export function checkoutUrl(rail: SponsorsRail, code: string): string {
  const query = new URLSearchParams({ tier_id: rail.tierId, metadata_code: code });
  return `https://github.com/sponsors/${rail.account}/sponsorships?${query.toString()}`;
}

/** True when `header` is GitHub's `sha256=<hex>` of `body` with `secret`. */
export function signatureOk(secret: string, body: Buffer, header: unknown): boolean {
  if (typeof header !== 'string' || !header.startsWith('sha256=')) return false;
  const given = Buffer.from(header.slice('sha256='.length), 'hex');
  const expected = createHmac('sha256', secret).update(body).digest();
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** `US$2`, `US$2.50`: cents as the receipt log writes an amount. */
export function usd(cents: number): string {
  return cents % 100 === 0 ? `US$${cents / 100}` : `US$${(cents / 100).toFixed(2)}`;
}

/** The pack's Sponsors price in cents, from its `US$2`. */
function priceCents(amount: string): number {
  const match = /^US\$(\d+)(?:\.(\d{2}))?$/u.exec(amount);
  if (!match) throw new Error(`not a US dollar price: ${amount}`);
  return Number(match[1]) * 100 + Number(match[2] ?? 0);
}

/**
 * The Sponsors codes still waiting for their payment, newest first, from the
 * receipt log: issued pending, not received, not blocked, not switched on by
 * a sponsorship.
 */
export function waitingSponsorsCodes(
  records: readonly ReceiptRecord[],
): { code: string; login: string; at: number }[] {
  const waiting = new Map<string, { code: string; login: string; at: number }>();
  for (const record of records) {
    if (record.type === 'issue') {
      if (record.rail === 'sponsors' && record.state === 'pending' && record.login) {
        waiting.set(record.code, {
          code: record.code,
          login: record.login,
          at: Date.parse(record.at),
        });
      }
    } else if (
      record.type === 'received' ||
      record.type === 'block' ||
      record.type === 'sponsorship'
    ) {
      waiting.delete(record.code);
    }
  }
  // Reversed first, so codes issued in the same millisecond keep the log's
  // order newest first through the (stable) sort.
  return [...waiting.values()].reverse().sort((a, b) => b.at - a.at);
}

/** What the webhook reads of GitHub's `sponsorship` event; null when it is not one to act on. */
export interface Sponsorship {
  ref: string;
  login: string;
  account: string;
  cents: number;
  oneTime: boolean;
  /** A code in the payload's metadata, if GitHub sends the link's. */
  metadataCode: string | null;
}

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** A `created` sponsorship from the webhook's JSON, or null. */
export function readSponsorship(payload: unknown): Sponsorship | null {
  const root = object(payload);
  if (root?.action !== 'created') return null;
  const sponsorship = object(root.sponsorship);
  const tier = object(sponsorship?.tier);
  const login = parseGitHubLogin(object(sponsorship?.sponsor)?.login);
  const account = parseGitHubLogin(object(sponsorship?.sponsorable)?.login);
  const ref = sponsorship?.node_id;
  const cents = tier?.monthly_price_in_cents;
  if (!login || !account || typeof ref !== 'string' || ref === '') return null;
  if (typeof cents !== 'number' || !Number.isInteger(cents) || cents < 0) return null;
  const metadata = object(sponsorship?.metadata) ?? object(root.metadata);
  return {
    ref,
    login,
    account,
    cents,
    oneTime: tier?.is_one_time === true,
    metadataCode: parseCode(metadata?.code)?.code ?? null,
  };
}

export interface SponsorsRoutesOptions {
  base: string;
  codes: PackCodes;
  receipts: ReceiptLog;
  /** Null: nothing sells through Sponsors, and the webhook is not there. */
  rail: SponsorsRail | null;
  ipOf: (request: FastifyRequest) => string;
  /** Where a webhook's outcome is noted for the owner's log. */
  onSponsorship?: (outcome: SponsorshipOutcome, login: string) => void;
}

function body(request: FastifyRequest): Record<string, unknown> {
  return object(request.body) ?? {};
}

function refuse(
  reply: FastifyReply,
  status: number,
  error: PayError,
): { ok: false; error: PayError } {
  reply.code(status);
  return { ok: false, error };
}

/** What GitHub's webhook changes: the sponsorship's record, and the code it switches on. */
export function takeSponsorship(
  sponsorship: Sponsorship,
  options: Pick<SponsorsRoutesOptions, 'codes' | 'receipts' | 'rail'>,
): SponsorshipOutcome | null {
  const { codes, receipts, rail } = options;
  if (!rail || sponsorship.account !== rail.account) return null;
  // The pack's tier is one-time and costs the pack's price; any other
  // sponsorship — a monthly one, a smaller gift — is a gift, nothing more.
  const pack = codes.enabled ? packOnSale() : null;
  const least = priceCents(PACKS[pack ?? 'chr26'].prices.sponsors);
  if (!sponsorship.oneTime || sponsorship.cents < least) return null;
  const records = receipts.records();
  // GitHub delivers again when it hears nothing back: a second delivery changes nothing.
  if (records.some((r) => r.type === 'sponsorship' && r.ref === sponsorship.ref)) return null;
  let code = '';
  let outcome: SponsorshipOutcome = pack ? 'no code' : 'not on sale';
  if (pack) {
    const waiting = waitingSponsorsCodes(records);
    const found =
      waiting.find((w) => w.code === sponsorship.metadataCode) ??
      waiting.find((w) => w.login === sponsorship.login);
    if (found) {
      code = found.code;
      outcome = 'matched';
    }
  }
  receipts.append({
    type: 'sponsorship',
    code,
    ref: sponsorship.ref,
    login: sponsorship.login,
    amount: usd(sponsorship.cents),
    outcome,
  });
  if (code) codes.receive(code);
  return outcome;
}

export function registerSponsorsRoutes(
  fastify: FastifyInstance,
  options: SponsorsRoutesOptions,
): void {
  const { base, codes, receipts, rail, ipOf, onSponsorship } = options;
  const issueLimiter = createRateLimiter({
    capacity: SPONSORS_CODES_PER_HOUR,
    intervalMs: WRONG_CODE_WINDOW_MS,
  });
  const wrongStatusLimiter = createRateLimiter({
    capacity: WRONG_CODES_PER_HOUR,
    intervalMs: WRONG_CODE_WINDOW_MS,
  });
  fastify.addHook('onClose', async () => {
    issueLimiter.stop();
    wrongStatusLimiter.stop();
  });

  fastify.post(
    `${base}pay/sponsors`,
    { bodyLimit: 1024 },
    async (request, reply): Promise<PaySponsorsAnswer> => {
      reply.header('cache-control', 'no-store');
      const { pack: asked, policy, login: typed } = body(request);
      const pack = codes.enabled ? packOnSale() : null;
      if (!pack || asked !== pack || !rail) return refuse(reply, 409, 'NOT_ON_SALE');
      const login = parseGitHubLogin(typed);
      if (!login) return refuse(reply, 400, 'LOGIN_INVALID');
      if (!issueLimiter.take(ipOf(request))) return refuse(reply, 429, 'RATE_LIMITED');
      const amount = PACKS[pack].prices.sponsors;
      const code = codes.issue({
        pack,
        rail: 'sponsors',
        ref: '',
        amount,
        delivered: SPONSORS_DELIVERED,
        policy:
          typeof policy === 'string' && POLICY_VERSION.test(policy)
            ? policy
            : REFUND_POLICY_VERSION,
        login,
        pending: true,
      });
      return { ok: true, code, url: checkoutUrl(rail, code), amount, login };
    },
  );

  fastify.post(
    `${base}pay/status`,
    { bodyLimit: 1024 },
    async (request, reply): Promise<PayClaimAnswer> => {
      reply.header('cache-control', 'no-store');
      const ip = ipOf(request);
      if (!wrongStatusLimiter.peek(ip)) return refuse(reply, 429, 'RATE_LIMITED');
      const verdict = codes.check(body(request).code);
      if (verdict.ok) return { ok: true };
      // Waiting is the answer the page expects every few seconds, not a
      // failure: a 200, so the buyer's console fills with no red lines.
      if (verdict.error === 'CODE_PENDING') return { ok: false, error: verdict.error };
      if (verdict.error === 'CODE_INVALID') wrongStatusLimiter.take(ip);
      return refuse(reply, 409, verdict.error);
    },
  );

  if (!rail) return;
  // The signature is over the body exactly as GitHub sent it, so the server's
  // JSON parser keeps this one route's body as it came, and parses every
  // other route's as Fastify always has. (On the root, as the admin page's
  // parser is: a plugin loading at ready() would race buildServer's hooks.)
  const hookUrl = `${base}pay/sponsors/hook`;
  const parseJson = fastify.getDefaultJsonParser('error', 'error');
  fastify.removeContentTypeParser('application/json');
  fastify.addContentTypeParser('application/json', { parseAs: 'buffer' }, (request, raw, done) => {
    if (request.url.split('?')[0] === hookUrl) done(null, raw);
    else parseJson(request, (raw as Buffer).toString('utf8'), done);
  });
  fastify.post(hookUrl, { bodyLimit: HOOK_BODY_LIMIT }, async (request, reply) => {
    reply.header('cache-control', 'no-store');
    const raw = request.body;
    if (
      !Buffer.isBuffer(raw) ||
      !signatureOk(rail.webhookSecret, raw, request.headers['x-hub-signature-256'])
    ) {
      return reply.code(401).send();
    }
    // `ping` when the webhook is made, and any event not a sponsorship's.
    if (request.headers['x-github-event'] !== 'sponsorship') return reply.code(204).send();
    let payload: unknown;
    try {
      payload = JSON.parse(raw.toString('utf8'));
    } catch {
      return reply.code(400).send();
    }
    const sponsorship = readSponsorship(payload);
    if (sponsorship) {
      const outcome = takeSponsorship(sponsorship, { codes, receipts, rail });
      if (outcome) onSponsorship?.(outcome, sponsorship.login);
    }
    return reply.code(204).send();
  });
}
