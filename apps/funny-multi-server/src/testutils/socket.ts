// SPDX-License-Identifier: AGPL-3.0-only

// Shared harness for tests that drive the server over a real Socket.IO
// connection rather than by calling handlers directly.
//
// Lives outside `*.test.ts` so two suites can share it, and is excluded from
// `tsconfig.build.json` so it never reaches `dist/`.

import type { AddressInfo } from 'node:net';
import { io as ioClient, type Socket } from 'socket.io-client';
import { buildServer, type BuiltServer } from '../index.js';

const DEFAULT_TIMEOUT_MS = 5000;

export interface TestServer {
  url: string;
  server: BuiltServer;
  /** Opens a client connection, tracked for teardown. */
  connect(): Promise<Socket>;
  /** Disconnects every client, then closes io + fastify. */
  close(): Promise<void>;
}

/** Boots on port 0 so concurrent runs cannot collide on a fixed port. */
export async function startTestServer(): Promise<TestServer> {
  const server = await buildServer({ logger: false });
  await server.fastify.listen({ port: 0, host: '127.0.0.1' });
  const { port } = server.fastify.server.address() as AddressInfo;
  const url = `http://127.0.0.1:${port}`;
  const clients: Socket[] = [];

  return {
    url,
    server,
    async connect() {
      const socket = ioClient(url, { transports: ['websocket'], forceNew: true });
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
