// SPDX-License-Identifier: AGPL-3.0-only

// Shared harness for tests that drive the server over a real Socket.IO
// connection rather than by calling handlers directly.
//
// Lives outside `*.test.ts` so two suites can share it, and is excluded from
// `tsconfig.build.json` so it never reaches `dist/`.

import type { AddressInfo } from 'node:net';
import { io as ioClient, type Socket } from 'socket.io-client';
import { buildServer, type BuildServerOptions, type BuiltServer } from '../index.js';

const DEFAULT_TIMEOUT_MS = 5000;

export interface TestServer {
  url: string;
  server: BuiltServer;
  /**
   * Opens a client connection, tracked for teardown.
   *
   * `reconnection` is off by default: a test that calls `socket.disconnect()`
   * to simulate a drop must not have the client quietly reconnect underneath
   * it. Disconnect tests that *want* a return pass `{ reconnection: true }`.
   */
  connect(opts?: { reconnection?: boolean }): Promise<Socket>;
  /** Disconnects every client, then closes io + fastify. */
  close(): Promise<void>;
}

/** Boots on port 0 so concurrent runs cannot collide on a fixed port. */
export async function startTestServer(options: BuildServerOptions = {}): Promise<TestServer> {
  const server = await buildServer({ logger: false, ...options });
  await server.fastify.listen({ port: 0, host: '127.0.0.1' });
  const { port } = server.fastify.server.address() as AddressInfo;
  const url = `http://127.0.0.1:${port}`;
  const clients: Socket[] = [];

  return {
    url,
    server,
    async connect({ reconnection = false } = {}) {
      const socket = ioClient(url, {
        transports: ['websocket'],
        forceNew: true,
        reconnection,
        // Default is 1000 ms, which would outlast any grace window a test can
        // afford to wait for. Ignored unless `reconnection` is on.
        reconnectionDelay: 20,
      });
      clients.push(socket);
      await new Promise<void>((resolve, reject) => {
        socket.on('connect', () => resolve());
        socket.on('connect_error', reject);
        setTimeout(() => reject(new Error('timed out waiting for connect')), DEFAULT_TIMEOUT_MS);
      });
      return socket;
    },
    async close() {
      for (const c of clients.splice(0)) c.disconnect();
      await server.io.close();
      await server.fastify.close();
    },
  };
}

export function emitWithAck<T>(socket: Socket, event: string, payload?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (response: T) => resolve(response));
    setTimeout(() => reject(new Error(`timed out waiting for ${event} ack`)), DEFAULT_TIMEOUT_MS);
  });
}

export function once<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.once(event, (payload: T) => resolve(payload));
    setTimeout(() => reject(new Error(`timed out waiting for ${event}`)), DEFAULT_TIMEOUT_MS);
  });
}

/** Records every occurrence of an event for later assertion. */
export function collect<T>(socket: Socket, event: string): T[] {
  const seen: T[] = [];
  socket.on(event, (payload: T) => seen.push(payload));
  return seen;
}
