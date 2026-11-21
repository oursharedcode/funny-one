// SPDX-License-Identifier: AGPL-3.0-only

// A player's nickname, trimmed, takes NICKNAME_MIN to NICKNAME_MAX characters
// (spec §17, FM-CORE-4). The server's `validateNickname` and the client's
// Create/Join buttons read the same two numbers, so the two halves cannot
// drift apart — Gate 2 once found a client that allowed what the server
// refused only on the wire.
//
// Step 120 (B-29, owner decision D3 A, 2026-11-21): the minimum is 2, for
// everyone, so two-character names — ゆい, 王芳, 민수, Jo, Li — are taken.
// A character here is a UTF-16 unit, `String.length`, the same unit the
// field's `maxLength` counts; one emoji on its own (two units) passes.

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;
