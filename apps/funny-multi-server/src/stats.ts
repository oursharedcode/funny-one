// SPDX-License-Identifier: AGPL-3.0-only

// Copied from SRC/server/src/stats.ts (design §3: "copy"). No behaviour
// change — `roomCount`, `imagesGeneratedToday` and `maxImagesPerDay` are the
// same process-global counters T-2.2/T-4.3 already ported, so this module is
// just the shape that wraps them plus the broadcast helper. → FM-CORE-12
// One field is this repo's, not SRC's: `liveGeneration` (B-13).

import type { Server as SocketIOServer } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, StatsPayload } from './types.js';
import { roomCount } from './rooms.js';
import { imagesGeneratedToday, liveGeneration, maxImagesPerDay } from './image.js';

type IO = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

// Builds the StatsPayload from the live process-global counters (spec §26).
// Same shape used by the one-shot `stats:get` ack and the live `stats:update`
// broadcast.
export function buildStats(): StatsPayload {
  return {
    openRooms: roomCount(),
    imagesGeneratedToday: imagesGeneratedToday(),
    imagesLimit: maxImagesPerDay(),
    liveGeneration: liveGeneration(),
  };
}

// Broadcasts the current stats to every connected socket. Called whenever an
// action changes the room counter (room created / destroyed) — see index.ts's
// call sites. Item 22 of BUGS_AND_IMPROVEMENTS_01.md: pairs with the one-shot
// `stats:get` fetch so the host's Home-screen counter reflects the live
// process state, not just the snapshot at mount time. Non-Home-screen clients
// receive the event but ignore it.
//
// Not wired to the image-reservation moment (SRC's `game.ts` also called this
// right after `reserveImageSlot()` succeeded, so the counter ticked mid-
// generation rather than only on remount). T-4.3 moved reservation inside
// `image.ts`'s `generateImage()`, which deliberately owns the whole exists→
// reserve→generate→refund flow with no socket.io dependency; adding one here
// to recover that one tick would re-couple a module that flow intentionally
// decoupled, for a live-ness gain the TTL-bounded `maybeSyncImageCounter` in
// the `stats:get` ack already approximates on every mount. Left as a
// follow-up if a live per-generation tick turns out to matter in practice.
//
// Note: this does NOT survive a Render free-tier spin-down. The in-memory
// counter resets to 0 on each container start; a full fix requires
// persistence (Cloudflare KV via the Worker — option B in the item 22
// analysis), which is left as a follow-up.
export function broadcastStats(io: IO): void {
  io.emit('stats:update', buildStats());
}
