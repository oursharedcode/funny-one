// SPDX-License-Identifier: AGPL-3.0-only

// The image-prompt builder (design §7.1, FM-IMG-2, DD-3/DD-4) moved to
// `packages/shared/src/prompt.ts` on 2026-10-05 (D-10), unchanged, so Funny
// One's client can address the picture library with the same cache keys this
// server asks the Worker for. This module stays as the server's import point:
// `game.ts`, `prompt.test.ts`, `scripts/samplePrompts.mjs` and
// `cloudflare/pregenerate.mjs` (through `dist/prompt.js`) all read it here.

export { MAX_PROMPT_LENGTH, SKELETON, STYLE_SUFFIX, buildPrompt } from '@funny/shared';
