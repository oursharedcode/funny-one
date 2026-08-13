// SPDX-License-Identifier: AGPL-3.0-only
//
// Prints a spread of image prompts for the T-4.2 tuning step: design §7.1 says
// the skeleton is tuned once against real Flux output and then locked, because
// after that every edit orphans the whole R2 cache. This is the sampler for
// that pass — it assembles what the game would send, so what you look at is the
// real thing rather than a hand-typed approximation.
//
//   npm run prompts -w apps/funny-multi-server            # ids + prompts
//   npm run prompts -w apps/funny-multi-server -- --curl  # ready-to-run calls
//   npm run prompts -w apps/funny-multi-server -- --count 40
//
// `--curl` emits one `/generate` call per sample against $CLOUDFLARE_WORKER_URL
// with $CLOUDFLARE_WORKER_SECRET. Each one that misses the cache really does
// generate an image and really does bump the Worker's daily counter, so pipe it
// to a shell deliberately, not by reflex.
//
// The samples are a deterministic spread, not a random draw: the same command
// gives the same set every time, so two runs of the tuning pass are comparable
// and a regenerated batch can be diffed against the previous one.

import { POOLS, VISUAL_SLOTS } from '@funny/shared';
import { buildPrompt, MAX_PROMPT_LENGTH } from '../dist/prompt.js';

const args = process.argv.slice(2);
const asCurl = args.includes('--curl');
const countIndex = args.indexOf('--count');
const count = countIndex === -1 ? 20 : Number(args[countIndex + 1]);

if (!Number.isInteger(count) || count < 1) {
  console.error('--count needs a positive integer');
  process.exit(1);
}

// Mixed-radix walk over the whole combination space with a stride coprime to
// it, which spreads the samples across all four pools instead of varying one
// slot and holding the rest still. Generic in the pool sizes, so it survives a
// pool gaining an option.
const SIZES = VISUAL_SLOTS.map((slot) => POOLS[slot].length);
const TOTAL = SIZES.reduce((a, b) => a * b, 1);
const STRIDE = 5137; // odd, not a multiple of 5 → coprime with 10 000

function sampleAt(i) {
  let n = (i * STRIDE) % TOTAL;
  const answers = Array.from({ length: 7 }, () => null);
  VISUAL_SLOTS.forEach((slot, axis) => {
    const size = SIZES[axis];
    answers[slot] = POOLS[slot][n % size].id;
    n = Math.floor(n / size);
  });
  return { answers, picture: null };
}

const workerUrl = (process.env.CLOUDFLARE_WORKER_URL ?? '').replace(/\/$/, '');
const secret = process.env.CLOUDFLARE_WORKER_SECRET ?? '';
if (asCurl && (!workerUrl || !secret)) {
  console.error('--curl needs CLOUDFLARE_WORKER_URL and CLOUDFLARE_WORKER_SECRET in the env');
  process.exit(1);
}

let longest = 0;
for (let i = 0; i < count; i++) {
  const story = sampleAt(i);
  const prompt = buildPrompt(story);
  longest = Math.max(longest, prompt.length);

  if (asCurl) {
    console.log(
      `curl -sS -H "X-Secret: ${secret}" ` +
        `"${workerUrl}/generate?prompt=${encodeURIComponent(prompt)}"`,
    );
    continue;
  }
  const ids = VISUAL_SLOTS.map((slot) => story.answers[slot]).join(' + ');
  console.log(`\n[${String(i + 1).padStart(2, ' ')}] ${ids}`);
  console.log(`     ${prompt}`);
}

if (!asCurl) {
  console.log(
    `\n${count} samples of ${TOTAL} combinations · longest ${longest} chars ` +
      `(cap ${MAX_PROMPT_LENGTH})`,
  );
}
