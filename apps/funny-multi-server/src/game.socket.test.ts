// SPDX-License-Identifier: AGPL-3.0-only

// **Gate 2, automated.** The plan called for a manual 3-tab run to prove story
// assembly end to end, stubbed via a test client that no task ever created —
// and Phase 3 is where a real UI first exists. Rather than write a throwaway
// stub, that check lives here and runs on every CI build.
//
// `game.test.ts` already plays full games, but in-process: it calls the game
// functions directly, so it cannot see anything that only goes wrong on the
// wire. This suite drives real Socket.IO clients through a real Fastify server
// — create, join, start, seven rounds of `round:submit`, reveal — and asserts
// both what each client received and what the server actually stored.
//
// That covers the class of bug the manual run existed to catch: an answer
// landing in the wrong player's story, a broadcast reaching the wrong room, or
// a reveal going to the wrong socket. The genuinely visual checks (does the
// combobox look right, does the timer bar animate) wait for Gate 3.

import { afterEach, describe, expect, it } from 'vitest';
import { POOLS, POOL_TEXTS, storyIndex, type OptionId, type SlotIndex } from '@funny/shared';
import type { Socket } from 'socket.io-client';
import { __resetRoomsForTest, getRoom } from './rooms.js';
import { ROUNDS } from './game.js';
import { emitWithAck, once, startTestServer, type TestServer } from './testutils/socket.js';

let harness: TestServer | null = null;

afterEach(async () => {
  await harness?.close();
  harness = null;
  __resetRoomsForTest();
});

function optionAt(slot: number, n: number): OptionId {
  const pool = POOLS[slot as SlotIndex];
  return pool[n % pool.length]!.id;
}

interface RevealPayload {
  answers: string[];
  prose: string;
}

/**
 * Plays a complete game over real sockets and returns everything needed to
 * assert on it.
 *
 * Each client answers by reacting to `round:start` exactly as a real client
 * would — the server drives the pace, the test never assumes a round boundary.
 * Player p answers round r with `optionAt(r, p)`, so every pick is distinct
 * within a round and traceable to its author.
 */
async function playFullGame(
  playerCount: number,
  language: 'en' | 'ru' = 'en',
): Promise<{
  roomCode: string;
  sockets: Socket[];
  reveals: RevealPayload[];
  picks: OptionId[][];
}> {
  const h = await startTestServer();
  harness = h;

  const sockets: Socket[] = [];
  for (let i = 0; i < playerCount; i++) sockets.push(await h.connect());

  const { roomCode } = await emitWithAck<{ roomCode: string }>(sockets[0]!, 'room:create', {
    nickname: 'player0',
    language,
  });
  for (let i = 1; i < playerCount; i++) {
    const ack = await emitWithAck<{ error?: unknown }>(sockets[i]!, 'room:join', {
      roomCode,
      nickname: `player${i}`,
    });
    expect(ack.error, `player ${i} failed to join`).toBeUndefined();
  }

  // picks[round][player] — filled as each client answers, so the assertions
  // below compare against what was actually sent, not what we intended to send.
  const picks: OptionId[][] = Array.from({ length: ROUNDS }, () =>
    new Array<OptionId>(playerCount).fill(''),
  );

  const revealPromises = sockets.map((s) => once<RevealPayload>(s, 'reveal:start'));

  sockets.forEach((socket, player) => {
    socket.on('round:start', (payload: { roundNumber: number }) => {
      const id = optionAt(payload.roundNumber, player);
      picks[payload.roundNumber]![player] = id;
      socket.emit('round:submit', { optionId: id });
    });
  });

  sockets[0]!.emit('game:start');
  const reveals = await Promise.all(revealPromises);

  return { roomCode, sockets, reveals, picks };
}

describe('Gate 2 — full game over real sockets', () => {
  for (const playerCount of [3, 7]) {
    it(`assembles ${playerCount} stories with correct rotation placement`, async () => {
      const { roomCode, reveals, picks } = await playFullGame(playerCount);

      const room = getRoom(roomCode);
      expect(room, 'room should still exist at reveal').toBeDefined();
      expect(room!.phase).toBe('reveal');
      expect(room!.stories).toHaveLength(playerCount);

      // The assertion the manual 3-tab run existed to make: every answer landed
      // in the story the rotation formula says it should. A wrong storyIndex
      // still yields complete stories — just the wrong ones — so this is
      // invisible without checking placement explicitly.
      for (let round = 0; round < ROUNDS; round++) {
        for (let player = 0; player < playerCount; player++) {
          const target = storyIndex(player, round, playerCount);
          expect(
            room!.stories[target]!.answers[round],
            `round ${round}, player ${player} should land on story ${target}`,
          ).toBe(picks[round]![player]);
        }
      }

      // Every player got their own story, resolved to display text.
      expect(reveals).toHaveLength(playerCount);
      for (const reveal of reveals) {
        expect(reveal.answers).toHaveLength(ROUNDS);
        expect(reveal.answers.every((a) => a.length > 0)).toBe(true);
        expect(reveal.prose.length).toBeGreaterThan(0);
      }
      expect(new Set(reveals.map((r) => r.prose)).size, 'each story should differ').toBe(
        playerCount,
      );
    });
  }

  it('delivers each player the story at their own index, not someone else’s', async () => {
    // Pins the socket→story mapping. Swapping two players' reveals would leave
    // every assertion above intact.
    const { roomCode, sockets, reveals } = await playFullGame(3);
    const room = getRoom(roomCode)!;

    for (let i = 0; i < 3; i++) {
      const expected = room.stories[i]!.answers.map((id) => POOL_TEXTS.en[id!]);
      const playerIndex = room.players.findIndex((p) => p.id === sockets[i]!.id);
      expect(playerIndex).toBe(i);
      expect(reveals[i]!.answers).toEqual(expected);
    }
  });

  it('resolves to room-language text, so ids never reach the client', async () => {
    const { reveals } = await playFullGame(3, 'ru');
    const allText = reveals.flatMap((r) => r.answers).join(' ');
    expect(allText).toMatch(/[а-яё]/i);
    // An option id would look like `who.grumpy-pirate`.
    expect(allText).not.toMatch(/\b[a-z]+\.[a-z0-9-]+\b/);
  });

  it('capitalises the opening word of the delivered prose (T-1.5 carry-over)', async () => {
    const { reveals } = await playFullGame(3);
    for (const reveal of reveals) {
      expect(reveal.prose[0]).toBe(reveal.prose[0]!.toUpperCase());
      expect(reveal.prose.trimEnd()).toMatch(/[.!?…]$/);
    }
  });
});

describe('Gate 2 — round flow over real sockets', () => {
  it('rejects an out-of-pool id with INVALID_OPTION and does not advance', async () => {
    const h = await startTestServer();
    harness = h;
    const sockets = [await h.connect(), await h.connect(), await h.connect()];

    const { roomCode } = await emitWithAck<{ roomCode: string }>(sockets[0]!, 'room:create', {
      nickname: 'player0',
      language: 'en',
    });
    for (let i = 1; i < 3; i++) {
      await emitWithAck(sockets[i]!, 'room:join', { roomCode, nickname: `player${i}` });
    }

    const firstRound = once<{ roundNumber: number }>(sockets[0]!, 'round:start');
    sockets[0]!.emit('game:start');
    expect((await firstRound).roundNumber).toBe(0);

    const err = once<{ code: string }>(sockets[0]!, 'error');
    sockets[0]!.emit('round:submit', { optionId: 'who.not-a-real-option' });
    expect((await err).code).toBe('INVALID_OPTION');

    const room = getRoom(roomCode)!;
    expect(room.currentRound).toBe(0);
    expect(room.submittedThisRound.has(sockets[0]!.id!)).toBe(false);
    expect(room.stories[0]!.answers[0]).toBeNull();
  });

  it('broadcasts round:waiting only to the player who submitted', async () => {
    const h = await startTestServer();
    harness = h;
    const sockets = [await h.connect(), await h.connect(), await h.connect()];

    const { roomCode } = await emitWithAck<{ roomCode: string }>(sockets[0]!, 'room:create', {
      nickname: 'player0',
      language: 'en',
    });
    for (let i = 1; i < 3; i++) {
      await emitWithAck(sockets[i]!, 'room:join', { roomCode, nickname: `player${i}` });
    }

    const started = once(sockets[0]!, 'round:start');
    sockets[0]!.emit('game:start');
    await started;

    let otherSawWaiting = false;
    sockets[1]!.on('round:waiting', () => (otherSawWaiting = true));

    const waiting = once<{ submitted: number; total: number }>(sockets[0]!, 'round:waiting');
    sockets[0]!.emit('round:submit', { optionId: optionAt(0, 0) });
    expect(await waiting).toEqual({ submitted: 1, total: 3 });
    expect(otherSawWaiting, 'a player who has not submitted should see nothing').toBe(false);
  });

  it('refuses to start with fewer than 3 players', async () => {
    const h = await startTestServer();
    harness = h;
    const host = await h.connect();
    await emitWithAck(host, 'room:create', { nickname: 'player0', language: 'en' });

    const err = once<{ code: string }>(host, 'error');
    host.emit('game:start');
    expect((await err).code).toBe('NOT_ENOUGH_PLAYERS');
  });

  it('refuses a start from a non-host', async () => {
    const h = await startTestServer();
    harness = h;
    const sockets = [await h.connect(), await h.connect(), await h.connect()];
    const { roomCode } = await emitWithAck<{ roomCode: string }>(sockets[0]!, 'room:create', {
      nickname: 'player0',
      language: 'en',
    });
    for (let i = 1; i < 3; i++) {
      await emitWithAck(sockets[i]!, 'room:join', { roomCode, nickname: `player${i}` });
    }

    const err = once<{ code: string }>(sockets[1]!, 'error');
    sockets[1]!.emit('game:start');
    expect((await err).code).toBe('NOT_HOST');
    expect(getRoom(roomCode)!.phase).toBe('lobby');
  });

  it('locks the room once the game starts', async () => {
    const { roomCode } = await playFullGame(3);
    const latecomer = await harness!.connect();
    const ack = await emitWithAck<{ error?: { code: string } }>(latecomer, 'room:join', {
      roomCode,
      nickname: 'late',
    });
    expect(ack.error?.code).toBe('ROOM_LOCKED');
  });
});

describe('Gate 2 — restart into a second game', () => {
  it('replays a full game after game:restart', async () => {
    const { roomCode, sockets } = await playFullGame(3);
    const room = getRoom(roomCode)!;
    const firstStories = room.stories.map((s) => [...s.answers]);

    const restarted = sockets.map((s) => once<{ roundNumber: number }>(s, 'round:start'));
    sockets[0]!.emit('game:restart');
    for (const r of restarted) expect((await r).roundNumber).toBe(0);

    const fresh = getRoom(roomCode)!;
    expect(fresh.phase).toBe('playing');
    expect(fresh.currentRound).toBe(0);
    expect(fresh.stories.every((s) => s.answers.every((a) => a === null))).toBe(true);
    expect(firstStories.every((s) => s.every((a) => a !== null))).toBe(true);
  });
});
