// SPDX-License-Identifier: AGPL-3.0-only
//
// Step 1 of the picture-library review (T-FO-8.2, FO-ID-1): the list of every key
// the library holds, offline. One line per prompt: its index, the four option ids
// (slots 0, 1, 2, 4 — the visual slots, in prompt order), the R2 key and the prompt itself
// (the review compares each picture with the prompt it was drawn from).
//
//   node scripts/picture-review/manifest.mjs [out.jsonl]     (default .picture-review/manifest.jsonl)
//
// The prompt comes from the shared `buildPrompt` and the key is computed exactly as
// Funny One's `libraryPictureUrl` does (sha256 of the UTF-8 prompt, lower-case hex),
// so a key listed here is a key a player's phone would ask for.

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildPrompt } from '@funny/shared';
import { enumeratePrompts } from '../../cloudflare/pregenerate.mjs';

const out = process.argv[2] ?? '.picture-review/manifest.jsonl';

const rows = enumeratePrompts(buildPrompt).map(({ ids, prompt }, i) => ({
  i,
  ids: ids.split('+'),
  hash: createHash('sha256').update(prompt, 'utf8').digest('hex'),
  prompt,
}));

const distinct = new Set(rows.map((r) => r.hash)).size;
if (distinct !== rows.length) {
  console.error(`${rows.length} prompts but only ${distinct} distinct keys — refusing to write`);
  process.exit(1);
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
console.log(`${rows.length} keys written to ${out}`);
