// SPDX-License-Identifier: AGPL-3.0-only

import { defineConfig } from 'vitest/config';

// Four of this workspace's suites are integration tests: each spins a real
// Fastify + Socket.IO server on a real port and drives real clients over
// loopback. Vitest runs test files in parallel across all cores, so at peak
// several servers, their engine.io heartbeats and a couple of grace windows
// are competing for the same machine — and vitest's default 5 s test timeout
// is tight enough that a busy CI runner trips it on a test that is merely
// slow, not stuck. Raising the ceiling keeps a genuine hang failing (nothing
// here should take seconds) while removing the load-sensitivity.
export default defineConfig({
  test: {
    testTimeout: 20_000,
    // afterEach closes a live server and waits for its sockets to unwind.
    hookTimeout: 20_000,
  },
});
