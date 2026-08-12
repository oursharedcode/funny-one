// SPDX-License-Identifier: AGPL-3.0-only
//
// Loads the repo-root .env into process.env for local development.
// MUST be imported before any module that reads process.env (it is the first
// import in index.ts). In production (Render) the platform injects env vars
// directly and no .env file exists — the try/catch handles that.
//
// Uses Node's built-in process.loadEnvFile (Node 20.12+) — no dotenv
// dependency, keeping the supply-chain surface small for a process that
// holds the Cloudflare Worker secret.
//
// Adapted from SRC/server/src/env.ts. The ONLY change is the path depth:
// SRC resolved '../../.env' from server/dist/env.js; this app sits one level
// deeper (apps/funny-multi-server/), so the repo root is three levels up.
// The depth is the same under tsx (src/env.ts) and after tsc (dist/env.js)
// because both directories are one level below the app root.
//
// Note the failure mode: the catch below is deliberately silent, so a wrong
// path does not throw — it surfaces as env vars that are simply unset. The
// env.test.ts assertion on the resolved path is what actually guards this.

import { fileURLToPath } from 'node:url';

export const ENV_PATH = fileURLToPath(new URL('../../../.env', import.meta.url));

try {
  process.loadEnvFile(ENV_PATH);
} catch {
  // No .env file (production, or not created yet) — fine.
}
