// SPDX-License-Identifier: AGPL-3.0-only
//
// Post-build step: tsc only emits .js, so the i18n JSON files (questions +
// prose templates) are not carried into dist/. src/i18n/index.ts loads them at
// runtime via createRequire('./<code>.json'), so they must sit next to the
// compiled index.js. Run from the app workspace root (npm sets cwd).
//
// Copied from SRC/server/scripts/copy-i18n.mjs. Discovers files dynamically —
// adding a language is a single drop-in of src/i18n/<code>.json with no change
// to this script.
//
// Without this step the server typechecks, builds and starts, then throws
// `[i18n] Missing src/i18n/<code>.json` on boot from the compiled bundle only.
// The i18n boot check is what makes that failure loud instead of a mid-game 500.

import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';

mkdirSync('dist/i18n', { recursive: true });
const files = readdirSync('src/i18n').filter((f) => f.endsWith('.json'));
for (const file of files) {
  copyFileSync(`src/i18n/${file}`, `dist/i18n/${file}`);
}
console.log(`[build] copied ${files.length} i18n JSON file(s) -> dist/i18n`);
