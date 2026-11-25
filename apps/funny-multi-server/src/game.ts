// SPDX-License-Identifier: AGPL-3.0-only

// Round flow, adapted from SRC/server/src/game.ts per design §6.
// → FM-CORE-5..8, FM-BOT-1/2, FM-ANS-2/4/5
//
// The shape of the round loop is SRC's and is deliberately unchanged: bots fill
// at the top of each round, humans submit, the round advances on the last
// submission or on the 60 s timer, and after 7 rounds every non-bot player gets
// their own assembled story. What changed is what an answer *is*.
//
// Deltas from SRC:
//
//  1. **`storyIndex` is imported, not defined.** T-1.2 extracted it to
//     `@funny/shared` (FM-ARC-2) so the client can compute the same rotation.
//     SRC's copy stays in SRC.
//
//  2. **`submitAnswer` validates an option id** against the current round's
//     pool (FM-ANS-2, DD-1). Invalid → `INVALID_OPTION` and *no* submitted
//     mark, so a dishonest client is timer-autofilled like anyone who never
//     answered. There is no truncation and no profanity filter: SRC needed both
//     because answers were free text, and DD-8 deletes that stack outright.
//
//  3. **Auto-fill picks from the pool, not a stand-in list.** SRC's
//     `pickStandin` returned one of a handful of canned strings per language;
//     bots now draw uniformly from the same pool humans pick from, excluding
//     ids already used at this slot in this room this round (design §6) so a
//     room of bots does not produce seven identical stories.
//
//  4. **Reveal resolves ids to display texts** in the room language before
//     rendering prose. `Story.answers` holds ids; `RevealStartPayload.answers`
//     holds the resolved texts the client highlights inside the prose, and
//     its `optionIds` the ids again, for a client that reads the story in
//     another language (B-15).
//
//  5. **Picture generation goes through `image.ts`'s `generateImage`**, which
//     owns the whole exists→reserve→generate→refund flow (design §7.3, T-4.3)
//     and returns a `PictureRef` — not a base64 data URL — so `story.picture`
//     replaces SRC's `story.pictureUrl`. There is no translation, no CSAM/
//     hard-block guard and no `translationFailed` branch: `buildPrompt` is a
//     pure, synchronous function of four option ids (DD-8, FM-ANS-1), so the
//     only two outcomes here are "generated" and "the Worker/cap failed".
//
//  6. **Packs in rooms** (Step 117, B-29, DD-16). A room offered a pack and
//     left on by its host plays one golden story — the pack in every slot,
//     the ending drawn too — and the slice in every other (`freeGameContents`).
//     Each story carries its `content`, so a pick is checked and a bot fills
//     against `optionsFor(slot, content)`, `round:start` goes to each player
//     with the content of the story it writes, and the texts resolve through
//     `optionTexts`, which reads the pack's words in English where the room
//     language has none. A golden story gets its aftermath right after its
//     scene, and the gallery lists the golden story last.
//
//  7. **A paid game** (Step 122, B-29). A room a code has opened plays the
//     whole pack in every story (`paidGameContents`, content `paid`): every
//     ending drawn as a golden story's is (`drawsEnding`), none of them golden.
//     The game's counts — its players, the picks they made — go into its
//     receipt record (`takePaidGameRecord`, receipts.ts) when it is left.
//
// Also not here, by deliberate choice rather than boundary: SRC also called
// `broadcastStats` from this pipeline, right after `reserveImageSlot()`
// succeeded, so the Home-screen image counter ticked live mid-generation
// rather than only on remount. T-5.3 added `stats.ts` but did not wire it
// here — `image.ts`'s `generateImage` (T-4.3) owns reservation internally and
// has no socket.io dependency by design; recovering that one tick would mean
// threading `io` into a module that deliberately has none, for a live-ness
// gain the `stats:get` ack's TTL-bounded `maybeSyncImageCounter` already
// approximates on every mount. Left as a follow-up if it turns out to matter.

import type { Server as SocketIOServer } from 'socket.io';
import {
  BASE_CONTENT,
  QUESTIONS,
  SLOT_COUNT,
  drawsEnding,
  freeGameContents,
  isGolden,
  isPackFree,
  isPackPaid,
  optionTexts,
  optionsFor,
  paidGameContents,
  polishProse,
  renderProse,
  requireAuthoredLanguage,
  storyIndex,
  type OptionId,
  type SlotIndex,
  type StoryContent,
} from '@funny/shared';
import type {
  ClientToServerEvents,
  ErrorPayload,
  GalleryReadyPayload,
  PictureRef,
  Room,
  RoomStory,
  ServerToClientEvents,
} from './types.js';
import { buildAftermathPrompt, buildPrompt } from './prompt.js';
import { ImageCapReachedError, generateImage } from './image.js';
import type { ReceiptInput } from './receipts.js';

// One round per pool slot. Tied to the shared schema rather than restated, so
// adding a slot cannot silently leave a round unplayed.
export const ROUNDS = SLOT_COUNT;
export const ROUND_DURATION_MS = Number(process.env.ROUND_DURATION_MS ?? 60_000);

type IO = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

// Membership lookup per content and slot, built once per content. `submitAnswer`
// runs once per round per player, so this stays O(1) rather than scanning a
// 22-element array.
const OPTION_IDS = new Map<string, readonly ReadonlySet<OptionId>[]>();

function optionIdsFor(slot: SlotIndex, content: StoryContent): ReadonlySet<OptionId> {
  const key = content.kind === 'base' ? 'base' : `${content.kind}:${content.pack}`;
  let sets = OPTION_IDS.get(key);
  if (!sets) {
    sets = Array.from(
      { length: SLOT_COUNT },
      (_, i) => new Set(optionsFor(i as SlotIndex, content).map((o) => o.id)),
    );
    OPTION_IDS.set(key, sets);
  }
  return sets[slot]!;
}

/**
 * Each story's content for a game starting now (Step 117): one golden story
 * (two until 2026-11-25) and the slice when the room's pack is on and its free
 * part has not ended (FM-PACK-6, checked here as well as at the room's
 * creation, for a lobby left open across the cut-off), the base pools
 * otherwise. Drawn afresh at every
 * start, "one more game" included, so the golden story moves between games.
 *
 * Step 122: the whole pack in every story when a code has opened it and its
 * paid part has not ended — the code itself is checked again by the caller
 * just before (index.ts), for one blocked or lapsed since.
 */
function contentsFor(room: Room): StoryContent[] {
  const pack = room.pack;
  const now = Date.now();
  if (pack?.on && pack.paid && isPackPaid(pack.id, now)) {
    return paidGameContents(pack.id, room.players.length);
  }
  if (pack?.on && isPackFree(pack.id, now)) {
    return freeGameContents(pack.id, room.players.length);
  }
  return room.players.map(() => BASE_CONTENT);
}

// The story player `playerIdx` writes in this round (spec §4 rotation).
function storyWrittenBy(room: Room, playerIdx: number): RoomStory | undefined {
  return room.stories[storyIndex(playerIdx, room.currentRound, room.players.length)];
}

function slotOf(round: number): SlotIndex {
  return round as SlotIndex;
}

// ============================================================================
// Game lifecycle
// ============================================================================

export function startGame(room: Room, io: IO): void {
  room.phase = 'playing';
  room.currentRound = 0;
  room.galleryShared = false; // reset for a restarted game
  const contents = contentsFor(room);
  room.stories = contents.map<RoomStory>((content) => ({
    answers: new Array<OptionId | null>(ROUNDS).fill(null),
    picture: null,
    content,
    ending: null,
  }));
  // A paid game's counts for its receipt record (Step 122); the caller has
  // taken the last game's record already.
  const paid = room.packCode !== null && contents.some((c) => c.kind === 'paid');
  room.paidGame = paid
    ? { startedAt: Date.now(), players: room.players.length, picks: 0, downloads: 0, shares: 0 }
    : null;
  startRound(room, io);
}

function startRound(room: Room, io: IO): void {
  room.submittedThisRound = new Set();

  // Bots get auto-filled at the top of every round (spec §17).
  for (const p of room.players) {
    if (p.isBot) autoFillFor(room, p.id);
  }

  room.roundDeadline = Date.now() + ROUND_DURATION_MS;

  // To each player on its own (Step 117): the story it writes this round may
  // be golden, the slice or the base pools, and its options follow.
  const question = QUESTIONS[requireAuthoredLanguage(room.language)][room.currentRound] ?? '???';
  const deadline = room.roundDeadline;
  room.players.forEach((player, i) => {
    if (player.isBot) return;
    io.to(player.id).emit('round:start', {
      roundNumber: room.currentRound,
      question,
      deadline,
      content: storyWrittenBy(room, i)?.content ?? BASE_CONTENT,
    });
  });

  clearRoundTimer(room);
  room.roundTimer = setTimeout(() => {
    advanceRound(room, io);
  }, ROUND_DURATION_MS);

  // If every slot is a bot they are all filled already — advance immediately.
  maybeAdvance(room, io);
}

/**
 * Handles `round:submit` (FM-ANS-2). Returns nothing; errors reach the player
 * on the `error` event.
 *
 * An out-of-pool id is rejected *without* a submitted mark. An honest client
 * cannot produce one — its options come from the same `@funny/shared` build the
 * server validates against, deployed as one unit (DD-2) — so the case only
 * arises from a tampered client, which then gets auto-filled at the deadline
 * exactly like a silent one. Marking it submitted would let a crafted payload
 * skip a slot and leave a hole in someone's story.
 */
export function submitAnswer(room: Room, socketId: string, optionId: unknown, io: IO): void {
  if (room.phase !== 'playing') return;
  if (room.submittedThisRound.has(socketId)) return;

  const playerIdx = room.players.findIndex((p) => p.id === socketId);
  if (playerIdx === -1) return;
  const player = room.players[playerIdx]!;
  if (player.isBot) return; // already auto-filled at round start

  const slot = slotOf(room.currentRound);
  const story = storyWrittenBy(room, playerIdx);
  if (!story) return;
  if (typeof optionId !== 'string' || !optionIdsFor(slot, story.content).has(optionId)) {
    io.to(socketId).emit('error', {
      code: 'INVALID_OPTION',
      message: 'That answer is not one of this round’s options.',
    });
    return;
  }

  story.answers[room.currentRound] = optionId;
  room.submittedThisRound.add(socketId);
  if (room.paidGame) room.paidGame.picks++;

  broadcastWaiting(room, io);
  maybeAdvance(room, io);
}

/**
 * Bot and timer-expiry fill (FM-BOT-2, design §6).
 *
 * Draws uniformly from the pool this story offers at this round's slot
 * (`optionsFor`, Step 117), preferring ids not already used at
 * this slot by another story in this room this round. Without that exclusion a
 * room with several bots would routinely hand out the same "who" to three
 * different stories, which reads as a bug on the reveal screen even though the
 * draw was fair.
 *
 * The exclusion cannot run dry in a base game: the smallest base pool is 10
 * (visual slots) against a 7-player maximum. A pack slot holds 5 (FM-PACK-1),
 * so in a room of 6 or 7 it can: the fallback to the whole pool then repeats
 * a pick, as SRC's plain-uniform draw did, rather than throwing.
 */
function autoFillFor(room: Room, socketId: string): void {
  if (room.submittedThisRound.has(socketId)) return;
  const playerIdx = room.players.findIndex((p) => p.id === socketId);
  if (playerIdx === -1) return;

  const slot = slotOf(room.currentRound);
  const story = storyWrittenBy(room, playerIdx);
  if (!story) return;
  const pool = optionsFor(slot, story.content);
  const used = new Set<OptionId>();
  for (const story of room.stories) {
    const taken = story.answers[room.currentRound];
    if (taken) used.add(taken);
  }
  const candidates = pool.filter((o) => !used.has(o.id));
  const from = candidates.length > 0 ? candidates : pool;
  const pick = from[Math.floor(Math.random() * from.length)]!;

  story.answers[room.currentRound] = pick.id;
  room.submittedThisRound.add(socketId);
}

function broadcastWaiting(room: Room, io: IO): void {
  const total = room.players.length;
  const submitted = room.submittedThisRound.size;
  for (const p of room.players) {
    if (p.isBot) continue;
    if (!room.submittedThisRound.has(p.id)) continue;
    io.to(p.id).emit('round:waiting', { submitted, total });
  }
}

function maybeAdvance(room: Room, io: IO): void {
  if (room.submittedThisRound.size >= room.players.length) {
    advanceRound(room, io);
  }
}

function advanceRound(room: Room, io: IO): void {
  clearRoundTimer(room);

  // Timer-expiry path: auto-fill anyone still missing.
  for (const p of room.players) autoFillFor(room, p.id);

  room.currentRound++;
  if (room.currentRound >= ROUNDS) {
    enterRevealPhase(room, io);
    return;
  }
  startRound(room, io);
}

function clearRoundTimer(room: Room): void {
  if (room.roundTimer) {
    clearTimeout(room.roundTimer as NodeJS.Timeout);
    room.roundTimer = null;
  }
}

// ============================================================================
// Reveal (prose only — pictures arrive with T-4.4)
// ============================================================================

/**
 * Turns a story's 7 option ids into display texts in the room's language
 * (DD-1). This is the point where the language-neutral wire format becomes
 * readable, and it is why a room's content language can differ from any
 * player's UI language.
 *
 * A pack id resolves through `optionTexts`, in English where the room language
 * has none of the pack's texts — not reached today, since a room is offered a
 * pack only in a language with its texts (`packForRoom`).
 *
 * An unfilled slot resolves to '' rather than throwing: every slot is filled by
 * `advanceRound` before reveal, so a null here would mean a bug upstream, and
 * an empty slot degrades to a slightly odd sentence rather than a crash on the
 * payoff screen. `polishProse` collapses the double space it leaves behind.
 */
export function resolveAnswers(room: Room, story: RoomStory | undefined): string[] {
  const texts = optionTexts(requireAuthoredLanguage(room.language));
  return Array.from({ length: ROUNDS }, (_, i) => {
    const id = story?.answers[i];
    return id ? (texts[id] ?? '') : '';
  });
}

// The same story as option ids, always ROUNDS long, for the client to render
// in a language of its own (B-15). A copy, so a payload never aliases the
// room's live story.
export function storyOptionIds(story: RoomStory | undefined): (OptionId | null)[] {
  return Array.from({ length: ROUNDS }, (_, i) => story?.answers[i] ?? null);
}

// Renders a story's prose and runs the offline polish pass: Russian gets its
// clause commas, and every language gets the opening capital and terminal
// period (see `@funny/shared`'s `i18n/grammar.ts` — the T-1.5 carry-over,
// promoted to shared by T-FO-2.1). Synchronous and instant, so it never
// delays the reveal.
export function revealProse(room: Room, answers: readonly string[]): string {
  const prose = renderProse(requireAuthoredLanguage(room.language), answers);
  return polishProse(room.language, prose);
}

// stories[i] belongs to players[i] (spec §4): each non-bot player receives
// their own assembled story as private prose. Bots have no client to send to.
export function enterRevealPhase(room: Room, io: IO): void {
  room.phase = 'reveal';
  // Bot-owned stories never fire reveal:requestPicture — there is no client —
  // so without this their picture stays null forever and the room gallery
  // shows a permanent gap. Fire-and-forget, before any prose is sent: the
  // request must not wait on text rendering. Failures fall back to the same
  // null-picture state a human's failed generation leaves.
  void generateBotStoryPictures(room, io);
  room.players.forEach((player, i) => {
    if (player.isBot) return;
    const answers = resolveAnswers(room, room.stories[i]);
    io.to(player.id).emit('reveal:start', {
      answers,
      prose: revealProse(room, answers),
      optionIds: storyOptionIds(room.stories[i]),
      content: room.stories[i]?.content ?? BASE_CONTENT,
    });
  });
}

// ============================================================================
// Reveal — picture generation (design §7.3, FM-IMG-1)
// ============================================================================

// Outcome of a single picture-generation attempt. Lets the caller decide
// whether to notify a specific socket (human path) or stay silent (bot path).
type PictureOutcome =
  | { kind: 'cached'; picture: PictureRef; imagePrompt: string; ending: PictureRef | null }
  | { kind: 'ready'; picture: PictureRef; imagePrompt: string; ending: PictureRef | null }
  | { kind: 'capped' }
  | { kind: 'failed' };

/**
 * Core picture-generation pipeline, shared by the human request path
 * (`handlePictureRequest`) and the server-side bot-owned-story path
 * (`generateBotStoryPictures`).
 *
 * `buildPrompt` is synchronous and, per its own contract, only throws on an
 * invariant that cannot hold for a story reaching reveal (every visual slot
 * is filled by `advanceRound` before `currentRound` reaches `ROUNDS`) — caught
 * here anyway rather than left to crash the request, because "unreachable"
 * is a claim about today's callers, not a guarantee `game.ts` can enforce by
 * itself. `generateImage` owns the whole exists→reserve→generate→refund flow
 * (design §7.3, T-4.3); this function's only job is to route its outcome.
 */
async function generateStoryPicture(story: RoomStory): Promise<PictureOutcome> {
  let prompt: string;
  try {
    prompt = buildPrompt(story);
  } catch {
    return { kind: 'failed' };
  }

  // Write-once cache (spec-carried behaviour): a retry after a picture
  // already landed just re-serves it rather than spending a second slot.
  if (story.picture) {
    const ending = await endingFor(story);
    return { kind: 'cached', picture: story.picture, imagePrompt: prompt, ending };
  }

  let picture: PictureRef;
  try {
    picture = await generateImage(prompt);
    story.picture = picture;
  } catch (err) {
    if (err instanceof ImageCapReachedError) return { kind: 'capped' };
    return { kind: 'failed' };
  }
  const ending = await endingFor(story);
  return { kind: 'ready', picture, imagePrompt: prompt, ending };
}

/**
 * A golden story's ending picture, its aftermath (Step 117, FM-PACK-3) — and,
 * since Step 122, every paid story's (`drawsEnding`): asked
 * for after the scene, never instead of it, and sent with it. Every pack's
 * aftermaths are drawn before it ships (chr26's 25 at Step 116), so this is an
 * `/exists` hit that spends no cap slot. Any failure — a miss with generation
 * off, the cap, the Worker — leaves it null, and the client shows the ending
 * as the text card every other story has; the scene is still sent. Write-once
 * like the scene: a retry asks again only while it is null.
 */
async function endingFor(story: RoomStory): Promise<PictureRef | null> {
  if (!drawsEnding(story.content) || story.ending) return story.ending;
  try {
    story.ending = await generateImage(buildAftermathPrompt(story));
  } catch {
    // The text card.
  }
  return story.ending;
}

/**
 * Handles `reveal:requestPicture` / `reveal:retryPicture` — identical
 * handler, per spec §11: a retry is just another request against the same
 * write-once story.
 */
export async function handlePictureRequest(room: Room, socketId: string, io: IO): Promise<void> {
  if (room.phase !== 'reveal') return;

  const story = getStoryForPlayer(room, socketId);
  if (!story) return;

  const outcome = await generateStoryPicture(story);
  switch (outcome.kind) {
    case 'cached':
    case 'ready':
      io.to(socketId).emit('reveal:pictureReady', {
        picture: outcome.picture,
        imagePrompt: outcome.imagePrompt,
        ending: outcome.ending,
      });
      // A late picture keeps an already-shared gallery fresh (spec §24). Only
      // 'ready' — a picture generated by *this* call — can change the
      // gallery's view of this story: 'cached' means the picture already
      // existed before this call, which means it already went through
      // 'ready' once, which already re-broadcast it if the gallery was
      // shared at that point.
      if (outcome.kind === 'ready' && room.galleryShared && room.phase === 'reveal') {
        io.to(room.code).emit('gallery:ready', buildGallery(room));
      }
      return;
    case 'capped':
      // The `code` discriminator lets the client switch to its i18n'd
      // "oven is full, new cartoons in ~N hours" caption and derive the
      // hours-until-reset from UTC midnight locally. The English `message`
      // is a wire fallback for any client that doesn't know `code`.
      io.to(socketId).emit('reveal:pictureError', {
        message: 'The cartoon oven is full for today. Try again tomorrow!',
        code: 'CAP_REACHED',
      });
      return;
    case 'failed':
      io.to(socketId).emit('reveal:pictureError', {
        message: 'Generation failed. Try again.',
        code: 'GENERIC',
      });
      return;
  }
}

/**
 * Bot-owned stories never receive `reveal:requestPicture` from any client, so
 * the server fires their generation here. Sequential rather than parallel:
 * humans race bots on the shared daily cap, and serialising bot work keeps a
 * multi-bot room from burning the last few slots in a single tick.
 *
 * Called from `enterRevealPhase` for players who were already bots at reveal
 * time, and from the disconnect path (T-2.4/index.ts) when a player botifies
 * *during* reveal, so their story still gets a picture.
 *
 * Idempotent: a story with a picture already set is skipped by
 * `generateStoryPicture`'s write-once cache, so calling this twice for the
 * same room is harmless.
 *
 * Takes `io` only to re-broadcast an already-shared gallery on a freshly
 * generated bot picture (spec §24) — bots have no client of their own to
 * notify.
 */
export async function generateBotStoryPictures(room: Room, io: IO): Promise<void> {
  for (const [i, player] of room.players.entries()) {
    if (!player.isBot) continue;
    if (room.phase !== 'reveal') return;
    const story = room.stories[i];
    if (!story || story.picture) continue;

    const outcome = await generateStoryPicture(story);
    // Cap exhausted — stop trying so a human still waiting on a slot isn't
    // pre-empted by a stream of further bot attempts, and so this loop
    // doesn't keep paying the no-op check for the rest of the room.
    if (outcome.kind === 'capped') return;
    if (outcome.kind === 'ready' && room.galleryShared && room.phase === 'reveal') {
      io.to(room.code).emit('gallery:ready', buildGallery(room));
    }
  }
}

// ============================================================================
// Room gallery (spec §24)
// ============================================================================

// Builds the whole-room gallery: one entry per player slot in players[]
// order, the golden stories moved to the end (Step 117, owner decision 1C:
// "revealed last"), pairing each story (stories[i] ↔ players[i], spec §4) with its owner
// and any generated picture. Bot slots and ungenerated stories carry
// picture: null. Reuses resolveAnswers/revealProse (above) rather than
// SRC's inline `.map((a) => a ?? '')`, since this repo's answers are option
// ids that still need resolving to display text — SRC's were already text.
export function buildGallery(room: Room): GalleryReadyPayload {
  const golden = (i: number): boolean => isGolden(room.stories[i]?.content ?? BASE_CONTENT);
  const slots = room.players.map((_, i) => i);
  const revealOrder = [...slots.filter((i) => !golden(i)), ...slots.filter(golden)];
  return {
    entries: revealOrder.map((i) => {
      const player = room.players[i]!;
      const story = room.stories[i];
      const answers = resolveAnswers(room, story);
      return {
        nickname: player.nickname,
        isBot: player.isBot,
        answers,
        // Same offline-polished prose the reveal screen shows, so the
        // downloadable image and video (T-5.2) embed the story with the same
        // punctuation the player already saw.
        prose: revealProse(room, answers),
        optionIds: storyOptionIds(story),
        picture: story?.picture ?? null,
        content: story?.content ?? BASE_CONTENT,
        ending: story?.ending ?? null,
      };
    }),
  };
}

// Handles gallery:share — host only. Marks the gallery shared and broadcasts
// it to every player. Late pictures keep it fresh via the re-broadcasts in
// handlePictureRequest and generateBotStoryPictures above.
export function shareGallery(room: Room, socketId: string, io: IO): void {
  if (room.phase !== 'reveal') return;
  if (room.hostId !== socketId) {
    io.to(socketId).emit('error', {
      code: 'NOT_HOST',
      message: 'Only the host can share the gallery.',
    });
    return;
  }
  room.galleryShared = true;
  io.to(room.code).emit('gallery:ready', buildGallery(room));
}

// stories[i] belongs to players[i] (spec §4). A player's own story is at
// their index in the players array.
export function getStoryForPlayer(room: Room, socketId: string): RoomStory | null {
  const idx = room.players.findIndex((p) => p.id === socketId);
  if (idx === -1) return null;
  return room.stories[idx] ?? null;
}

// ============================================================================
// Mid-game disconnect — called from the socket disconnect handler when a
// player who was in a 'playing' room becomes a bot. Wired up by T-2.4.
// ============================================================================

export function handleMidGameBotification(room: Room, socketId: string, io: IO): void {
  if (room.phase !== 'playing') return;
  autoFillFor(room, socketId);
  maybeAdvance(room, io);
}

// ============================================================================
// End screen — "one more game" readiness and restart (spec §4, §5, §16 step 10)
// ============================================================================

// Toggles a non-bot player's "ready for another game" flag and broadcasts the
// full ready set so every client (and the host's restart button) stays in sync.
export function handleReadyToggle(room: Room, socketId: string, ready: boolean, io: IO): void {
  if (room.phase !== 'reveal') return;
  const player = room.players.find((p) => p.id === socketId);
  if (!player || player.isBot) return;

  if (ready) room.readyForRestart.add(socketId);
  else room.readyForRestart.delete(socketId);

  io.to(room.code).emit('game:restartReady', {
    readyIds: [...room.readyForRestart],
  });
}

/**
 * The receipt record of the paid game being left (Step 122) — at "one more
 * game", the host's end, the room's last player gone, the server's shutdown —
 * with the room's counts cleared; null when the game was not paid. Its rounds
 * are those begun, all of them once the reveal is reached; its cartoons the
 * stories with a picture.
 */
export function takePaidGameRecord(room: Room): ReceiptInput | null {
  const game = room.paidGame;
  room.paidGame = null;
  if (!game || !room.packCode) return null;
  return {
    type: 'game',
    code: room.packCode,
    room: room.code,
    players: game.players,
    rounds: room.phase === 'playing' ? room.currentRound + 1 : ROUNDS,
    picks: game.picks,
    cartoons: room.stories.filter((story) => story.picture !== null).length,
    downloads: game.downloads,
    shares: game.shares,
  };
}

// Validates a host's restart request and, on success, resets the room to a
// fresh pre-game state per spec §4 "One more game" reset: drops bots, rebuilds
// the host if needed, clears the ready set. The caller then broadcasts the new
// roster and calls startGame to rebuild stories and begin round 0.
export function prepareRestart(
  room: Room,
  socketId: string,
): { ok: true } | { ok: false; error: ErrorPayload } {
  if (room.phase !== 'reveal') {
    return { ok: false, error: { code: 'ROOM_LOCKED', message: 'Game is not over yet.' } };
  }
  if (room.hostId !== socketId) {
    return { ok: false, error: { code: 'NOT_HOST', message: 'Only the host can restart.' } };
  }
  const nonBots = room.players.filter((p) => !p.isBot);
  if (nonBots.length < 3) {
    return {
      ok: false,
      error: { code: 'NOT_ENOUGH_PLAYERS', message: 'Need at least 3 players.' },
    };
  }

  room.players = nonBots;
  if (!room.players.some((p) => p.id === room.hostId)) {
    room.hostId = room.players[0]!.id;
  }
  room.readyForRestart.clear();
  return { ok: true };
}
