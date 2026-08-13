// SPDX-License-Identifier: AGPL-3.0-only

// Pending player-removal timers for the spec §7 grace window (T-2.4).
//
// SRC kept this as a bare `Map<string, NodeJS.Timeout>` inline in `main()`.
// Extracted here for two reasons this codebase has and SRC did not:
//
//   1. **Teardown.** SRC's server never shut down, so a pending 65 s timer
//      outliving it was inconceivable. Tests build and close a server per case;
//      a timer that survives `close()` fires `removePlayer` against a room store
//      the next test has already reset, and emits on a closed io. `clearAll()`
//      is wired to Fastify's `onClose`.
//
//   2. **A testable seam.** The production window is 65 s. Driving that over
//      real sockets is not an option, and faking timers inside a socket test
//      also stalls Socket.IO's own heartbeats. The registry is exercised
//      directly with fake timers, and the socket tests pass a short grace
//      through `buildServer`.
//
// The timers are deliberately *not* `unref()`d: a player must be removed
// because the window elapsed, never because the process happened to be busy.

export interface DisconnectRegistry {
  /** Starts (or restarts) the grace window for a dropped socket. */
  schedule(socketId: string): void;
  /** Cancels a pending removal — the socket came back. True if one was armed. */
  cancel(socketId: string): boolean;
  /** Pending removals, for assertions. */
  pending(): number;
  /** Drops every pending timer without running it. Server shutdown only. */
  clearAll(): void;
}

export interface DisconnectRegistryOptions {
  graceMs: number;
  /** Runs when a window elapses with no return. */
  onExpire: (socketId: string) => void;
}

export function createDisconnectRegistry({
  graceMs,
  onExpire,
}: DisconnectRegistryOptions): DisconnectRegistry {
  const timers = new Map<string, NodeJS.Timeout>();

  return {
    schedule(socketId) {
      const existing = timers.get(socketId);
      if (existing) clearTimeout(existing);
      timers.set(
        socketId,
        setTimeout(() => {
          // Delete before the callback: `onExpire` removes the player, and a
          // stale entry here would let a later `cancel` claim a removal that
          // has already happened.
          timers.delete(socketId);
          onExpire(socketId);
        }, graceMs),
      );
    },

    cancel(socketId) {
      const pending = timers.get(socketId);
      if (!pending) return false;
      clearTimeout(pending);
      timers.delete(socketId);
      return true;
    },

    pending() {
      return timers.size;
    },

    clearAll() {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    },
  };
}
