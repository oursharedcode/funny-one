// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `version.ts` reads two constants that `vite.config.ts` injects via `define`.
// They have to be declared here too, or anything importing `SourceFooter`
// throws `__APP_VERSION__ is not defined` at import time — which is how this
// was found. The date is fixed rather than `new Date()`: a build stamp has no
// business varying between two runs of the same test.
const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'),
) as { version: string };

// T-3.2 introduces the first tests in this workspace that render components,
// so the workspace needs a DOM. Deliberately a separate config rather than
// `vite.config.ts`'s `test` block: the app config carries `vite-plugin-pwa`,
// which would generate a service worker and precache manifest on every test
// run for no benefit.
//
// Gate 3 asks for three things. Two of them — "no free-text affordance
// anywhere" and "shuffle differs between players" — are properties of a
// rendered screen, which is exactly what this environment makes assertable;
// see the note on Gate 2 in tasks.md for why this project prefers an
// automated gate to a manual one.
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify('1970-01-01'),
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testSetup.ts'],
    // `restoreMocks` matters here specifically: every screen suite mocks the
    // socket module, and a leaked `emit` spy would let one test observe
    // another's payloads.
    restoreMocks: true,
  },
});
