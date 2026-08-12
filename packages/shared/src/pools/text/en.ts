// SPDX-License-Identifier: AGPL-3.0-only

// English pool display texts — one of the two hand-authored reference languages
// (FM-POOL-5). Authored against the English prose template:
//   "{0} and {1} were {2} {3}. They {4} {5}. In the end, {6}."
// so slot 2 reads "in the kitchen", slot 3 "yesterday", slot 5 "to keep warm".
//
// Per-slot authoring rules that fall out of that template:
//
//   0  bare nominative noun phrase — the template supplies nothing before it
//   1  bare noun phrase, NOT "with a ..." — the template hardcodes "and".
//      (SRC's stand-in pool had "with a haunted toaster" here, which rendered
//      as "a llama and with a haunted toaster were ..."; the curated pool
//      simply doesn't contain the broken shape.)
//   2  carries its own preposition: "in a kitchen", "at the bottom of ..."
//   3  a time expression that reads after slot 2
//   4  simple past, plural — the subject is always two of them
//   5  MUST start for/to/because/so that/in order/in exchange/out of/since.
//      renderProse prepends a literal "for " to anything else (SRC i18n
//      index.ts, EN_SLOT5_LEADING_CONNECTIVE), which would produce "for out
//      of spite". Enforced by pools.test.ts.
//   6  a full clause that reads after "In the end, "
//
// Texts are independent of the `promptEn` fragments in options.ts: the prompt
// wants a present participle for Flux ("are baking a cake"), the prose wants a
// simple past ("baked a cake"). Same id, two registers, no shared string.
//
// US spelling throughout, matching SRC's English copy.
//
// Everything is lowercase, including slot 0, even though the EN template opens
// with it. Capitalization is presentation, not content — Russian already gets
// it at render time from polishRussianProse, and keeping the data caseless is
// what lets a language put any slot first. See the T-2.3 note in
// steering/tasks.md: EN prose currently opens lowercase, exactly as SRC's did.

import type { PoolTextMap } from '../schema.js';

export const en: PoolTextMap = {
  // ── 0 · who ───────────────────────────────────────────────────────────────
  'who.grumpy-pirate': 'a grumpy pirate',
  'who.sleepy-llama': 'a very sleepy llama',
  'who.confused-penguin': 'a confused penguin',
  'who.overconfident-raccoon': 'an overconfident raccoon',
  'who.tiny-dragon': "the world's smallest dragon",
  'who.cats-in-a-trench-coat': 'three cats in a trench coat',
  'who.retired-superhero': 'a retired superhero',
  'who.skating-grandma': 'a grandmother on roller skates',
  'who.time-traveling-accountant': 'a time-traveling accountant',
  'who.muddy-knight': 'a very muddy knight',

  // ── 1 · withWhom — bare noun phrase; the template supplies "and" ──────────
  'with.haunted-toaster': 'a haunted toaster',
  'with.angry-geese': 'three angry geese',
  'with.philosophical-goldfish': 'a philosophical goldfish',
  'with.riddle-robot': 'a robot who only speaks in riddles',
  'with.professor-goat': 'a goat named Professor Cheese',
  'with.lost-tourist': 'a very lost tourist',
  'with.giant-snail': 'an enormous cheerful snail',
  'with.tuba-frog': 'a frog with a tuba',
  'with.talking-mailbox': 'a talking mailbox',
  'with.opera-walrus': 'an opera-singing walrus',

  // ── 2 · where — carries its own preposition ──────────────────────────────
  'where.cheese-factory': 'inside a cheese factory',
  'where.underwater-canyon': 'at the bottom of the ocean',
  'where.cookbook-library': 'in a library that only holds cookbooks',
  'where.giant-sock-drawer': 'inside a giant sock drawer',
  'where.gloomy-birthday': 'at a very gloomy birthday party',
  'where.cramped-elevator': 'in an extremely cramped elevator',
  'where.cloud-castle': 'in a castle made of clouds',
  'where.messy-kitchen': 'in a spectacularly messy kitchen',
  'where.snowy-mountain': 'on a snowy mountain pass',
  'where.jungle-treehouse': 'in a jungle treehouse',

  // ── 3 · when ─────────────────────────────────────────────────────────────
  'when.small-earthquake': 'during a small earthquake',
  'when.solar-eclipse': 'at the exact moment of a solar eclipse',
  'when.after-breakfast': 'right after breakfast but before second breakfast',
  'when.someone-elses-wedding': "during somebody else's wedding",
  'when.wrong-feeling-tuesday': 'on a Tuesday that felt like a Wednesday',
  'when.clocks-stopped': 'the moment every clock stopped',
  'when.three-in-the-morning': 'at three in the morning for no good reason',
  'when.hat-festival': 'during the annual hat festival',
  'when.internet-outage': 'while the internet was down',
  'when.seagull-decision': 'the instant a seagull made a decision',
  'when.last-day-of-summer': 'on the last day of summer',
  'when.thunderstorm': 'in the middle of a thunderstorm',
  'when.first-snow': 'on the morning of the first snow',
  'when.school-holidays': 'halfway through the school holidays',
  'when.full-moon': 'under a very full moon',
  'when.power-cut': 'during a citywide power cut',
  'when.just-before-dinner': 'five minutes before dinner',
  'when.longest-lesson': 'during the longest lesson of the year',
  'when.day-before-birthday': "the day before somebody's birthday",
  'when.rush-hour': 'at the peak of rush hour',
  'when.while-everyone-slept': 'while everybody else was asleep',
  'when.exactly-noon': 'at exactly noon',

  // ── 4 · did — simple past, plural subject ────────────────────────────────
  'did.baking-giant-cake': 'baked an enormous lopsided cake',
  'did.juggling-pancakes': 'juggled a tall stack of pancakes',
  'did.painting-polka-dots': 'painted polka dots on every wall',
  'did.sorting-clouds': 'reorganized the clouds by size',
  'did.dancing-tango': 'danced a very dramatic tango',
  'did.stacking-chairs': 'built a wobbly tower of chairs',
  'did.staring-contest': 'held an intense staring contest',
  'did.flying-kites': 'flew enormous kites on tangled strings',
  'did.eating-spaghetti': 'ate a mountain of spaghetti',
  'did.digging-with-spoons': 'dug an enormous hole with tiny spoons',

  // ── 5 · why — must open with a connective (see header) ───────────────────
  'why.made-sense-then': 'for reasons that made sense at the time',
  'why.impress-a-pigeon': 'to impress a pigeon',
  'why.warranty-forbade-it': 'because the warranty said not to',
  'why.one-grape': 'in exchange for a single grape',
  'why.never-back-down': 'because they never back down from a dare',
  'why.pointless-point': 'to prove a point nobody asked about',
  'why.for-science': 'for science, probably',
  'why.pure-stubbornness': 'out of pure stubbornness',
  'why.horoscope-said-so': 'because the horoscope was very specific',
  'why.bet-with-themselves': 'to settle a bet with themselves',
  'why.to-keep-warm': 'to keep warm',
  'why.because-tuesday': 'because it was a Tuesday',
  'why.for-a-sticker': 'for a single shiny sticker',
  'why.avoid-homework': 'to avoid doing homework',
  'why.everyone-else-did': 'because everybody else was doing it',
  'why.world-record': 'to break a world record nobody had heard of',
  'why.simply-hungry': 'because they were extremely hungry',
  'why.impress-grandma': 'to impress a grandmother who stayed unimpressed',
  'why.forgot-the-plan': 'because they forgot the original plan',
  'why.instructions-said-so': 'because the instructions insisted',
  'why.test-a-theory': 'to test a theory about gravity',
  'why.no-reason': 'for no reason at all',

  // ── 6 · ending — reads after "In the end, " ──────────────────────────────
  'end.feelings-about-pasta': 'everybody had strong feelings about pasta',
  'end.duck-complaint': 'a duck filed a formal complaint',
  'end.nothing-made-sense': 'nothing made sense and everybody felt fine about it',
  'end.lost-receipts': 'the receipts were lost, which was probably for the best',
  'end.pigeon-certificates': 'several pigeons received certificates',
  'end.fruit-basket': 'the mayor sent a fruit basket',
  'end.instant-sequel': 'a sequel was immediately announced',
  'end.three-country-holiday': 'it became a public holiday in three countries',
  'end.cloud-looked-away': 'the cloud that had been watching finally looked away',
  'end.never-spoke-again': 'everybody agreed never to speak of it again',
  'end.ice-cream-for-all': 'there was ice cream for absolutely everybody',
  'end.someone-had-to-mop': 'somebody had to mop the whole floor',
  'end.museum-exhibit': 'it ended up behind glass in a small museum',
  'end.a-song-about-it': 'a song was written about the whole thing',
  'end.neighbors-applauded': 'the neighbors applauded from their windows',
  'end.smelled-like-lemons': 'everything smelled faintly of lemons for a week',
  'end.new-holiday-invented': 'a brand new holiday was invented on the spot',
  'end.cat-took-credit': 'a passing cat took all the credit',
  'end.everyone-fell-asleep': 'everybody fell asleep in a heap',
  'end.indoor-rainbow': 'a rainbow appeared indoors and refused to leave',
  'end.instructions-finally-clear': 'the instructions finally made perfect sense',
  'end.home-for-soup': 'everybody went home for soup',
};
