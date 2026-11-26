// SPDX-License-Identifier: AGPL-3.0-only

// Step 130 (B-29 #1, owner decisions D1 A and D2 A, 2026-11-26): seat bots.
//
// A game needs at least MIN_SEATS seats for its stories to rotate (FM-ID-1,
// FM-BOT-3). A room with fewer humans — one host alone, a couple on two
// phones — still starts: at the host's Start, bots take the empty seats, one
// each, and play as a disconnected player's bot does (FM-BOT-1/2). They join
// at the start, never in the lobby, so a friend who joins first simply means
// one bot fewer; "one more game" drops them with every other bot and fills
// the seats again.
//
// A seat bot's id is `bot:<n>`, which no Socket.IO id can be (those are 20
// characters of base64url, with no colon). Its nickname on the server is the
// English "Bot <n>"; each client shows it in its own player's language from the
// number alone, so a multi-language room reads it right on every phone.

export const MIN_SEATS = 3;

const PREFIX = 'bot:';

/** How many seat bots a game started by `humans` people gets. */
export function seatBotsNeeded(humans: number): number {
  return Math.max(0, MIN_SEATS - humans);
}

/** The id of seat bot `n` (1-based). */
export function seatBotId(n: number): string {
  return `${PREFIX}${n}`;
}

/** Seat bot `n`'s number, or null when `id` is not a seat bot's. */
export function seatBotNumber(id: string): number | null {
  if (!id.startsWith(PREFIX)) return null;
  const n = Number(id.slice(PREFIX.length));
  return Number.isInteger(n) && n >= 1 ? n : null;
}
