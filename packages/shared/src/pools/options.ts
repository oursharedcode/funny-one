// SPDX-License-Identifier: AGPL-3.0-only

// Canonical option ids and English image-prompt fragments (FM-POOL-1/6, FM-IMG-2).
//
// Authoring rules, all enforced by pools.test.ts:
//   • id is `<slot prefix>.<kebab-slug>` and permanent once shipped (DD-1)
//   • visual slots (0, 1, 2, 4) carry `promptEn`; prose slots (3, 5, 6) do not
//   • `promptEn` is printable ASCII, ≤ 120 chars, and phrased to drop into the
//     skeleton from design §7.1:
//       'two distinct subjects: {0} on the left and {1} on the right, in {2}. They {4}'
//     so slot 2 reads as a bare noun phrase ("a kitchen"), not "in the kitchen"
//     — the skeleton supplies the preposition, while the *display* text supplies
//     whatever its own language's prose template needs.
//   • family-friendly and absurd; no real people, no brands (FM-POOL-6) — the
//     one rule no test can check, so it is on the author.
//
// Decisions taken while authoring (T-1.4):
//
// **Pool sizes: 10 visual, 22 prose.** Both sit mid-range in the FM-POOL-1
// bands (9–12 / 20–30). 10 visual options give 10^4 = 10,000 distinct picture
// prompts — squarely inside the 6.5k–20k window design §4.3 sized the R2 cache
// against — and 10 > the 7-player room maximum, so `autoFillFor`'s same-slot
// exclusion (design §6) never runs out of unused options in a full room. 22
// prose options are free of cache cost (slots 3/5/6 never reach the prompt),
// and the ceiling on them is really the translation bill: every prose option
// costs 15 hand- or machine-authored texts at T-1.5 / T-6.3.
//
// **Slots 0 and 1 draw from disjoint kinds.** Slot 0 is animate leads (animals,
// people-ish figures); slot 1 is companions of a visibly different order —
// appliances, birds, machines, a mollusc. SRC needed `looksLikeSameSubject` and
// a "two of them" anchor at prompt-build time because two players could type
// "a cat" and "a cat" and Flux would render one cat-dog chimera (SRC prompt.ts,
// items 10 and 19). A curated pool can simply make that collision unreachable,
// which is why the adapted `prompt.ts` (T-4.2) carries no such hack. Keep the
// two lists disjoint by head noun when editing.
//
// **Slot 4 fragments are `are` + gerund.** The skeleton ends "They {4}", so a
// fragment must complete the predicate. Present participle is what image
// captions overwhelmingly use ("a llama juggling pancakes"), and CLIP weights
// it far more reliably than a simple past ("They juggled …"). If T-4.2 retunes
// the skeleton to "They are {4}", stripping the leading "are " here is a
// mechanical edit — but do it *before* v0.1.0, since changing a fragment
// changes the prompt and orphans that branch of the R2 cache (DD-3).
//
// **Slot 2 fragments all read after "in".** Locations that want a different
// preposition ("on top of a bus", "on a mountain top") are out; the skeleton is
// fixed and a fragment that fights it produces "in on top of a bus". The display
// text is free to say it however its own language's prose template prefers.
//
// **Worst case assembles to 481 chars**, against the 500-char prompt cap SRC's
// prompt.ts enforced (65 chars of skeleton + the longest fragment in each of
// the four visual slots = 287, plus the 194-char STYLE_SUFFIX). T-4.2 therefore
// inherits a builder that can never truncate — but the margin is 19 characters,
// so a longer fragment here has to be paid for elsewhere.

import type { Pools } from './schema.js';

export const POOLS: Pools = {
  // ── 0 · who — visual, rendered "on the left" ──────────────────────────────
  0: [
    { id: 'who.grumpy-pirate', promptEn: 'a grumpy pirate in an enormous feathered hat' },
    { id: 'who.sleepy-llama', promptEn: 'a very sleepy llama with droopy eyelids' },
    { id: 'who.confused-penguin', promptEn: 'a confused penguin holding a map upside down' },
    {
      id: 'who.overconfident-raccoon',
      promptEn: 'a raccoon in a tiny cape striking a heroic pose',
    },
    { id: 'who.tiny-dragon', promptEn: 'a tiny green dragon the size of a teacup' },
    { id: 'who.cats-in-a-trench-coat', promptEn: 'three cats stacked inside one long trench coat' },
    {
      id: 'who.retired-superhero',
      promptEn: 'an elderly superhero in a faded cape and fuzzy slippers',
    },
    { id: 'who.skating-grandma', promptEn: 'a grandmother zooming along on roller skates' },
    {
      id: 'who.time-traveling-accountant',
      promptEn: 'an accountant in a rumpled suit wearing a time-machine helmet',
    },
    { id: 'who.muddy-knight', promptEn: 'a short knight in dented armor covered in mud' },
  ],

  // ── 1 · withWhom — visual, rendered "on the right" ────────────────────────
  // Deliberately none of slot 0's head nouns; see the disjointness note above.
  1: [
    { id: 'with.haunted-toaster', promptEn: 'a battered toaster with glowing eyes' },
    { id: 'with.angry-geese', promptEn: 'three angry geese honking with wings spread' },
    {
      id: 'with.philosophical-goldfish',
      promptEn: 'a goldfish in a round bowl wearing tiny spectacles',
    },
    { id: 'with.riddle-robot', promptEn: 'a boxy tin robot with a question mark on its chest' },
    { id: 'with.professor-goat', promptEn: 'a goat in a tweed jacket and a crooked bow tie' },
    { id: 'with.lost-tourist', promptEn: 'a tourist in a loud shirt draped in cameras' },
    { id: 'with.giant-snail', promptEn: 'an enormous smiling snail with a swirly striped shell' },
    { id: 'with.tuba-frog', promptEn: 'a frog in a marching band uniform holding a brass tuba' },
    { id: 'with.talking-mailbox', promptEn: 'a dented mailbox with a wide grinning mouth' },
    { id: 'with.opera-walrus', promptEn: 'a walrus in a velvet opera cape mid-song' },
  ],

  // ── 2 · where — visual, rendered after "in" ───────────────────────────────
  2: [
    { id: 'where.cheese-factory', promptEn: 'a cheese factory stacked with giant cheese wheels' },
    {
      id: 'where.underwater-canyon',
      promptEn: 'a deep underwater canyon with bright coral and curious fish',
    },
    {
      id: 'where.cookbook-library',
      promptEn: 'a library where every shelf holds nothing but cookbooks',
    },
    {
      id: 'where.giant-sock-drawer',
      promptEn: 'a giant sock drawer stuffed with mismatched socks',
    },
    { id: 'where.gloomy-birthday', promptEn: 'a gloomy birthday party hall with sagging balloons' },
    { id: 'where.cramped-elevator', promptEn: 'a very cramped elevator lined with brass buttons' },
    { id: 'where.cloud-castle', promptEn: 'a fluffy cloud castle high in a bright blue sky' },
    {
      id: 'where.messy-kitchen',
      promptEn: 'a messy kitchen with pots and spilled flour everywhere',
    },
    { id: 'where.snowy-mountain', promptEn: 'a snowy mountain pass with wind-blown flags' },
    { id: 'where.jungle-treehouse', promptEn: 'a jungle treehouse tangled in thick green vines' },
  ],

  // ── 3 · when — prose only (DD-3: out of the picture prompt) ───────────────
  3: [
    { id: 'when.small-earthquake' },
    { id: 'when.solar-eclipse' },
    { id: 'when.after-breakfast' },
    { id: 'when.someone-elses-wedding' },
    { id: 'when.wrong-feeling-tuesday' },
    { id: 'when.clocks-stopped' },
    { id: 'when.three-in-the-morning' },
    { id: 'when.hat-festival' },
    { id: 'when.internet-outage' },
    { id: 'when.seagull-decision' },
    { id: 'when.last-day-of-summer' },
    { id: 'when.thunderstorm' },
    { id: 'when.first-snow' },
    { id: 'when.school-holidays' },
    { id: 'when.full-moon' },
    { id: 'when.power-cut' },
    { id: 'when.just-before-dinner' },
    { id: 'when.longest-lesson' },
    { id: 'when.day-before-birthday' },
    { id: 'when.rush-hour' },
    { id: 'when.while-everyone-slept' },
    { id: 'when.exactly-noon' },
  ],

  // ── 4 · did — visual, completes "They {4}" ────────────────────────────────
  4: [
    { id: 'did.baking-giant-cake', promptEn: 'are baking an enormous lopsided cake' },
    { id: 'did.juggling-pancakes', promptEn: 'are juggling a tall stack of pancakes' },
    { id: 'did.painting-polka-dots', promptEn: 'are painting bright polka dots on the walls' },
    { id: 'did.sorting-clouds', promptEn: 'are sorting clouds by size with a measuring tape' },
    { id: 'did.dancing-tango', promptEn: 'are dancing a dramatic tango' },
    { id: 'did.stacking-chairs', promptEn: 'are building a wobbly tower of chairs' },
    { id: 'did.staring-contest', promptEn: 'are locked in an intense staring contest' },
    { id: 'did.flying-kites', promptEn: 'are flying enormous kites on tangled strings' },
    { id: 'did.eating-spaghetti', promptEn: 'are eating a mountain of spaghetti' },
    { id: 'did.digging-with-spoons', promptEn: 'are digging an enormous hole with tiny spoons' },
  ],

  // ── 5 · why — prose only ──────────────────────────────────────────────────
  5: [
    { id: 'why.made-sense-then' },
    { id: 'why.impress-a-pigeon' },
    { id: 'why.warranty-forbade-it' },
    { id: 'why.one-grape' },
    { id: 'why.never-back-down' },
    { id: 'why.pointless-point' },
    { id: 'why.for-science' },
    { id: 'why.pure-stubbornness' },
    { id: 'why.horoscope-said-so' },
    { id: 'why.bet-with-themselves' },
    { id: 'why.to-keep-warm' },
    { id: 'why.because-tuesday' },
    { id: 'why.for-a-sticker' },
    { id: 'why.avoid-homework' },
    { id: 'why.everyone-else-did' },
    { id: 'why.world-record' },
    { id: 'why.simply-hungry' },
    { id: 'why.impress-grandma' },
    { id: 'why.forgot-the-plan' },
    { id: 'why.instructions-said-so' },
    { id: 'why.test-a-theory' },
    { id: 'why.no-reason' },
  ],

  // ── 6 · ending — prose only ───────────────────────────────────────────────
  6: [
    { id: 'end.feelings-about-pasta' },
    { id: 'end.duck-complaint' },
    { id: 'end.nothing-made-sense' },
    { id: 'end.lost-receipts' },
    { id: 'end.pigeon-certificates' },
    { id: 'end.fruit-basket' },
    { id: 'end.instant-sequel' },
    { id: 'end.three-country-holiday' },
    { id: 'end.cloud-looked-away' },
    { id: 'end.never-spoke-again' },
    { id: 'end.ice-cream-for-all' },
    { id: 'end.someone-had-to-mop' },
    { id: 'end.museum-exhibit' },
    { id: 'end.a-song-about-it' },
    { id: 'end.neighbors-applauded' },
    { id: 'end.smelled-like-lemons' },
    { id: 'end.new-holiday-invented' },
    { id: 'end.cat-took-credit' },
    { id: 'end.everyone-fell-asleep' },
    { id: 'end.indoor-rainbow' },
    { id: 'end.instructions-finally-clear' },
    { id: 'end.home-for-soup' },
  ],
};

/** Every option id across all slots, in slot order. */
export const ALL_OPTION_IDS: readonly string[] = Object.values(POOLS).flatMap((options) =>
  options.map((option) => option.id),
);
