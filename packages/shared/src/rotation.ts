// SPDX-License-Identifier: AGPL-3.0-only

// Story rotation (FM-CORE-6, spec §4) — extracted from SRC/server/src/game.ts so
// that every product in the family assembles stories the same way (FM-ARC-2).
// The function body is unchanged from the source project; only its home moved.
//
//   storyIndex(P, R, N) = (P - R + N) mod N
//
// P is the player's seat index in `room.players`, R the zero-based round, N the
// player count. At R=0 everyone writes on their own story; each round the
// stories shift one seat, so after N rounds the assignment is back to identity.
// Covered by rotation.test.ts, which was written before this file existed.

/**
 * Which story a player writes on in a given round.
 *
 * @param playerIndex Seat index of the player, 0-based.
 * @param round Zero-based round number.
 * @param playerCount Number of players in the room (the number of stories).
 * @returns Story index in `[0, playerCount)`.
 * @throws RangeError if any argument is not a suitable integer.
 */
export function storyIndex(playerIndex: number, round: number, playerCount: number): number {
  if (!Number.isInteger(playerCount) || playerCount <= 0) {
    throw new RangeError('playerCount must be a positive integer');
  }
  if (!Number.isInteger(playerIndex) || playerIndex < 0) {
    throw new RangeError('playerIndex must be a non-negative integer');
  }
  if (!Number.isInteger(round) || round < 0) {
    throw new RangeError('round must be a non-negative integer');
  }
  // Double modulo: JS `%` keeps the sign of the dividend, so (P - R) % N can be
  // negative. Adding N before the second modulo folds it back into [0, N).
  return (((playerIndex - round) % playerCount) + playerCount) % playerCount;
}
