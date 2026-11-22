// SPDX-License-Identifier: AGPL-3.0-only
//
// Step 122 (B-29): mints paid codes by hand, for a test or the owner's own
// phone. Each is signed with PACK_CODE_SECRET exactly as the server signs one
// (src/codes.ts) and is logged nowhere: the server takes a signed code its
// receipt log has never seen as good. The codes a buyer gets are issued by
// the server itself and logged (Steps 124 and 125).
//
//   npm run mint-code -w apps/funny-multi-server               # one chr26 code
//   npm run mint-code -w apps/funny-multi-server -- --count 3
//
// The secret comes from the repo-root .env (src/env.ts), or the environment.
// A code works only on a server holding the same secret, so a code for the
// live game is minted where the live secret already is, never by copying it
// onto another machine.

import '../dist/env.js';
import { PACK_IDS } from '@funny/shared';
import { createPackCodes } from '../dist/codes.js';
import { openReceiptLog } from '../dist/receipts.js';

const args = process.argv.slice(2);
const countIndex = args.indexOf('--count');
const count = countIndex === -1 ? 1 : Number(args[countIndex + 1]);
const packIndex = args.indexOf('--pack');
const pack = packIndex === -1 ? PACK_IDS[0] : args[packIndex + 1];

if (!Number.isInteger(count) || count < 1 || count > 100) {
  console.error('--count needs a whole number from 1 to 100');
  process.exit(1);
}
if (!PACK_IDS.includes(pack)) {
  console.error(`--pack needs one of: ${PACK_IDS.join(', ')}`);
  process.exit(1);
}

const codes = createPackCodes({
  secret: process.env.PACK_CODE_SECRET,
  log: openReceiptLog({ file: null }),
});
if (!codes.enabled) {
  console.error('PACK_CODE_SECRET is unset or shorter than 16 characters (see .env.example)');
  process.exit(1);
}

// Two random ids can meet; a set keeps the codes of one run apart.
const minted = new Set();
while (minted.size < count) minted.add(codes.mint(pack));
for (const code of minted) console.log(code);
