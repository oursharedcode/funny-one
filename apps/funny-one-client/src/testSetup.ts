// SPDX-License-Identifier: AGPL-3.0-only

// jsdom implements neither of these, and both are reached by code this
// workspace ships rather than by the tests themselves — so stubbing them here
// is closing a gap in the environment, not weakening a test. Copied from
// apps/funny-multi-client/src/testSetup.ts (same design-system components,
// same gap).

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

globalThis.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as typeof globalThis.matchMedia;

afterEach(() => {
  cleanup();
});
