// SPDX-License-Identifier: AGPL-3.0-only

// jsdom implements neither of these, and both are reached by code this
// workspace ships rather than by the tests themselves — so stubbing them here
// is closing a gap in the environment, not weakening a test.

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// `ScrollBox` observes its viewport and content to recompute the custom
// scrollbar thumb. The stub never fires a callback, which is the honest
// jsdom behaviour: nothing has a layout, so nothing ever resizes. The
// component's `recompute` reads zeroed metrics and renders no thumb — the
// thumb is decorative (`aria-hidden`), so nothing under test depends on it.
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

// framer-motion queries `prefers-reduced-motion` when `MotionConfig` is set to
// `reducedMotion="user"`. Reporting "no match" gives tests the full-motion
// path, which is the one users see by default.
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

// Testing Library's auto-cleanup only registers itself when a global `afterEach`
// exists, which vitest provides only under `globals: true`. This workspace does
// not enable globals, so unmount explicitly or each test renders into a document
// still holding the previous test's markup.
afterEach(() => {
  cleanup();
});
