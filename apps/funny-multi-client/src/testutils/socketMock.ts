// SPDX-License-Identifier: AGPL-3.0-only

// Shared socket double for the screen suites.
//
// `src/socket.ts` calls `io()` at module scope, so importing any screen opens a
// real connection attempt unless the module is mocked. Mirrors the server's
// `src/testutils/socket.ts` in intent: keep the plumbing in one place so the
// suites read as behaviour.
//
// The double records every `emit` and lets a test answer an ack explicitly,
// which matters here — an ack that is never answered is not a broken test but a
// real state the app is in today (`stats:get` has no server handler until
// T-5.3), and the suites assert on that.

import { vi } from 'vitest';
import { act } from '@testing-library/react';

export interface EmittedEvent {
  event: string;
  args: unknown[];
}

export interface SocketMock {
  emit: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  /** Every emit in call order. */
  emitted: EmittedEvent[];
  /** All emits of one event name. */
  emitsOf(event: string): EmittedEvent[];
  /** The single emit of one event name; throws unless there is exactly one. */
  onlyEmitOf(event: string): EmittedEvent;
  /**
   * The ack callback passed with an emit — the last argument, when callable.
   * The returned function is `act`-wrapped: a socket callback is a React state
   * update arriving from outside React, and without the wrap the re-render is
   * not flushed by the time the next assertion runs. That silently turns every
   * "…is not shown" assertion into a vacuous pass, which is exactly what
   * happened on the first run of this suite.
   */
  ackFor(event: string): (...args: unknown[]) => void;
  /** Invoke every server→client listener registered for an event (`act`-wrapped). */
  fire(event: string, payload: unknown): void;
  reset(): void;
}

export function createSocketMock(): SocketMock {
  const emitted: EmittedEvent[] = [];
  const listeners = new Map<string, Set<(payload: unknown) => void>>();

  const emit = vi.fn((event: string, ...args: unknown[]) => {
    emitted.push({ event, args });
  });
  const on = vi.fn((event: string, handler: (payload: unknown) => void) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)?.add(handler);
  });
  const off = vi.fn((event: string, handler: (payload: unknown) => void) => {
    listeners.get(event)?.delete(handler);
  });

  function emitsOf(event: string): EmittedEvent[] {
    return emitted.filter((e) => e.event === event);
  }

  return {
    emit,
    on,
    off,
    emitted,
    emitsOf,
    onlyEmitOf(event) {
      const found = emitsOf(event);
      if (found.length !== 1) {
        throw new Error(`expected exactly 1 "${event}" emit, saw ${found.length}`);
      }
      return found[0];
    },
    ackFor(event) {
      const last = this.onlyEmitOf(event).args.at(-1);
      if (typeof last !== 'function') {
        throw new Error(`"${event}" was emitted without an ack callback`);
      }
      const ack = last as (...args: unknown[]) => void;
      return (...args: unknown[]) => {
        act(() => {
          ack(...args);
        });
      };
    },
    fire(event, payload) {
      act(() => {
        for (const handler of listeners.get(event) ?? []) handler(payload);
      });
    },
    reset() {
      emitted.length = 0;
      listeners.clear();
      emit.mockClear();
      on.mockClear();
      off.mockClear();
    },
  };
}

/** Point the browser at a URL so `?room=` / `?lang=` parsing has something to read. */
export function setUrl(search: string): void {
  window.history.replaceState(null, '', `/${search}`);
}
