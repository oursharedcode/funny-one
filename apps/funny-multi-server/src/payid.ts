// SPDX-License-Identifier: AGPL-3.0-only

// Step 124 (B-29): paying by PayID, the Australian rail. Two routes, both
// JSON, both uncached:
//
//   POST /pay/payid  the buyer pressed "Pay by PayID": the server issues a
//                    pending code (codes.ts), which is the transfer's
//                    reference (D4 of 2026-11-05), and answers with the PayID,
//                    its account name and the amount — the transfer to make.
//                    Step 134: with `gift: true` the code is bought for a
//                    friend; the issue record says so, nothing else differs.
//   POST /pay/claim  the buyer's "I've paid": the pending code works at once,
//                    for 48 hours (B-29 #5), unless the owner matches the
//                    payment on the admin page first (admin.ts), which makes it
//                    work for good.
//
// A pending code nobody claims does not work until the owner matches its
// payment: a buyer who pays and closes the page before "I've paid" is found on
// the admin page's list of unclaimed codes (owner decision D3 A, 2026-11-25),
// and the pay page warns them before they go.
//
// Limits (D4 A): three PayID codes per address per hour — the phone keeps its
// one waiting code and shows it again, so an honest buyer asks once — and a
// claim on what is not a code takes a token of the wrong-code limit, as
// room:unlock does. Nothing is on sale by PayID without a code secret, with
// the packs off, after the free part, or without DEPLOYER_PAYID and
// DEPLOYER_PAYID_NAME (the Support sheet's own PayID).

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  PACKS,
  REFUND_POLICY_VERSION,
  type PayClaimAnswer,
  type PayError,
  type PayIdAnswer,
} from '@funny/shared';
import type { PackCodes } from './codes.js';
import { packOnSale } from './rooms.js';
import {
  PAYID_CODES_PER_HOUR,
  WRONG_CODES_PER_HOUR,
  WRONG_CODE_WINDOW_MS,
  createRateLimiter,
} from './rateLimit.js';
import type { SupportConfig } from './types.js';

/** Where the issue record says a PayID code was shown. */
export const PAYID_DELIVERED = 'pay page';

const POLICY_VERSION = /^\d{4}-\d{2}-\d{2}$/u;

export interface PayRoutesOptions {
  base: string;
  codes: PackCodes;
  support: SupportConfig;
  /** The caller's address, as the rest of the server reads it. */
  ipOf: (request: FastifyRequest) => string;
}

function body(request: FastifyRequest): Record<string, unknown> {
  const raw = request.body;
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

function refuse(
  reply: FastifyReply,
  status: number,
  error: PayError,
): { ok: false; error: PayError } {
  reply.code(status);
  return { ok: false, error };
}

export function registerPayRoutes(fastify: FastifyInstance, options: PayRoutesOptions): void {
  const { base, codes, support, ipOf } = options;
  const issueLimiter = createRateLimiter({
    capacity: PAYID_CODES_PER_HOUR,
    intervalMs: WRONG_CODE_WINDOW_MS,
  });
  const wrongClaimLimiter = createRateLimiter({
    capacity: WRONG_CODES_PER_HOUR,
    intervalMs: WRONG_CODE_WINDOW_MS,
  });
  fastify.addHook('onClose', async () => {
    issueLimiter.stop();
    wrongClaimLimiter.stop();
  });

  fastify.post(
    `${base}pay/payid`,
    { bodyLimit: 1024 },
    async (request, reply): Promise<PayIdAnswer> => {
      reply.header('cache-control', 'no-store');
      const { pack: asked, policy, gift } = body(request);
      const pack = codes.enabled ? packOnSale() : null;
      const { payId, payIdName } = support;
      if (!pack || asked !== pack || !payId || !payIdName) return refuse(reply, 409, 'NOT_ON_SALE');
      if (!issueLimiter.take(ipOf(request))) return refuse(reply, 429, 'RATE_LIMITED');
      const amount = PACKS[pack].prices.payid;
      const code = codes.issue({
        pack,
        rail: 'payid',
        ref: '',
        amount,
        delivered: PAYID_DELIVERED,
        policy:
          typeof policy === 'string' && POLICY_VERSION.test(policy)
            ? policy
            : REFUND_POLICY_VERSION,
        pending: true,
        ...(gift === true ? { gift: true as const } : {}),
      });
      return { ok: true, code, payId, payIdName, amount };
    },
  );

  fastify.post(
    `${base}pay/claim`,
    { bodyLimit: 1024 },
    async (request, reply): Promise<PayClaimAnswer> => {
      reply.header('cache-control', 'no-store');
      const ip = ipOf(request);
      if (!wrongClaimLimiter.peek(ip)) return refuse(reply, 429, 'RATE_LIMITED');
      const { code } = body(request);
      // A second claim, or a claim on a code the owner has matched already,
      // changes nothing; the answer is the code's verdict either way.
      codes.claim(code);
      const verdict = codes.check(code);
      if (verdict.ok) return { ok: true };
      if (verdict.error === 'CODE_INVALID') wrongClaimLimiter.take(ip);
      return refuse(reply, 409, verdict.error);
    },
  );
}
