// SPDX-License-Identifier: AGPL-3.0-only

// Copied from SRC/client/src/socket.ts; only the package name changes
// (`shared` → `@funny/shared`).

import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@funny/shared';

// Dev: client at :5173, server at :3000. Prod: same origin.
const SERVER_URL = import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin;

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  transports: ['websocket'],
  autoConnect: true,
});
