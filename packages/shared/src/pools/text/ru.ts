// SPDX-License-Identifier: AGPL-3.0-only

// Russian pool display texts — the second hand-authored reference language
// (FM-POOL-5). Authored **pre-declined for each slot's grammatical case**
// (FM-POOL-3, ONE-12; non-negotiable), against the Russian prose template:
//   "{0} {1} {3} {2} {4} {5}. В итоге {6}."
//
//   slot 0 who      — nominative              «сердитый пират»
//   slot 1 withWhom — instrumental with «с/со» inline, so the template needs no
//                     synthetic prefix (design §9)  «с большой обезьяной»
//   slot 2 where    — prepositional with its preposition  «на кухне»
//   slot 3 when     — adverbial                «вчера»
//   slot 4 did      — past-tense verb phrase   «варили суп»
//   slot 5 why      — purpose clause           «чтобы согреться»
//   slot 6 ending   — clause following «В итоге …»
//
// ─── SCAFFOLD — content authored in T-1.5 ───────────────────────────────────

import type { PoolTextMap } from '../schema.js';

export const ru: PoolTextMap = {};
