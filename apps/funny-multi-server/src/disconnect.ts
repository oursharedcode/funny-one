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
//   2. **A testable seam.** The production windows are 65 s in a game and
//      10 min in the lobby (Step 132). Driving those over real sockets is not
//      an option, and faking timers inside a socket test also stalls
//      Socket.IO's own heartbeats. The registry is exercised directly with
//      fake timers, and the socket tests pass short windows through
//      `buildServer`.
//
// Step 132: the window is chosen per drop. A host who goes to a messenger to
// send the invite closes the game socket on a phone, so a lobby seat waits
// longer than a game seat; the caller passes the window that fits the phase.
//
// The timers are deliberately *not* `unref()`d: a player must be removed
// because the window elapsed, never because the process happened to be busy.

export interface DisconnectRegistry {
  /**
   * Starts (or restarts) the grace window for a dropped socket: `windowMs`
   * when given, otherwise the registry's default.
   */
  schedule(socketId: string, windowMs?: number): void;
  /** Cancels a pending removal — the socket came back. True if one was armed. */
  cancel(socketId: string): boolean;
  /** Pending removals, for assertions. */
  pending(): number;
  /** Drops every pending timer without running it. Server shutdown only. */
  clearAll(): void;
}

export interface DisconnectRegistryOptions {
  /** The window when `schedule` names none. */
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
    schedule(socketId, windowMs = graceMs) {
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
        }, windowMs),
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
