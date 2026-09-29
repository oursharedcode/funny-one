// SPDX-License-Identifier: AGPL-3.0-only

// Copied from SRC/client/src/socket.ts; the package name changes
// (`shared` → `@funny/shared`) and the Socket.IO path follows BASE_PATH
// (T-8.1, D-5) — the server listens at `${base}socket.io` and nowhere else.

import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@funny/shared';
import { baseUrl, serverOrigin } from './basePath';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverOrigin(), {
  path: `${baseUrl()}socket.io`,
  transports: ['websocket'],
  autoConnect: true,
});
