// SPDX-License-Identifier: AGPL-3.0-only

// German pool display texts — machine-drafted for T-6.3 (FM-POOL-2/5).
// needs-de-review — machine-translated stub awaiting native German review per CONTRIBUTING.md.
//
// Authored against the German prose template:
//   "{0} mit {1} {3} {2} {4} {5}. Am Ende endete es mit {6}."
//
// Per-slot authoring rules that fall out of that template:
//
//   0  bare nominative subject noun phrase — the template supplies nothing
//      before it («ein mürrischer Pirat»).
//   1  bare DATIVE noun phrase, NOT prefixed with "mit" — the template
//      already hardcodes "mit" right before this slot («einem verhexten
//      Toaster», not «mit einem verhexten Toaster»).
//   2  where — carries its OWN preposition («in einer Käsefabrik»); it
//      renders directly after slot 3 with no glue word between them.
//   3  when — carries its OWN preposition/adverbial too, and renders
//      immediately before slot 2 («während eines kleinen Erdbebens»).
//   4  did — the ONLY finite verb in the whole sentence (the template has no
//      separate "waren"/"were"). Finite, PAST tense, PLURAL, agreeing with
//      the combined subject "{0} mit {1}" («backten einen riesigen Kuchen»).
//      Plural sidesteps gender agreement with whatever slot 0 supplies.
//   5  why — no connective is hardcoded after slot 4, so slot 5 must open
//      with its own ("um … zu", "weil", "aus", "für", …).
//   6  ending — "Am Ende endete es mit {6}." puts slot 6 in the DATIVE as
//      the object of "mit", so every text here MUST be a noun phrase (never
//      a finite clause), e.g. «einem lauten Feuerwerk».
//
// Everything is lowercase-initial where grammatically neutral (nouns keep
// their required German capitalization; sentence-initial capitalization is
// presentation, applied at render time, not stored here) — consistent with
// how en.ts and ru.ts keep slot 0 caseless at the start of the string.

import type { PoolTextMap } from '../schema.js';

export const de: PoolTextMap = {
  // ── 0 · who — nominative ────────────────────────────────────────────────
  'who.grumpy-pirate': 'ein mürrischer Pirat',
  'who.sleepy-llama': 'ein sehr verschlafenes Lama',
  'who.confused-penguin': 'ein verwirrter Pinguin',
  'who.overconfident-raccoon': 'ein übermütiger Waschbär',
  'who.tiny-dragon': 'der kleinste Drache der Welt',
  'who.cats-in-a-trench-coat': 'drei Katzen in einem Trenchcoat',
  'who.retired-superhero': 'ein pensionierter Superheld',
  'who.skating-grandma': 'eine Oma auf Rollschuhen',
  'who.time-traveling-accountant': 'ein zeitreisender Buchhalter',
  'who.muddy-knight': 'ein sehr schlammiger Ritter',

  // ── 1 · withWhom — dative, no "mit" (template supplies it) ────────────────
  'with.haunted-toaster': 'einem verhexten Toaster',
  'with.angry-geese': 'drei wütenden Gänsen',
  'with.philosophical-goldfish': 'einem philosophischen Goldfisch',
  'with.riddle-robot': 'einem Roboter, der nur in Rätseln spricht',
  'with.professor-goat': 'einer Ziege namens Professor Käse',
  'with.lost-tourist': 'einem sehr verirrten Touristen',
  'with.giant-snail': 'einer riesigen fröhlichen Schnecke',
  'with.tuba-frog': 'einem Frosch mit einer Tuba',
  'with.talking-mailbox': 'einem sprechenden Briefkasten',
  'with.opera-walrus': 'einem opernsingenden Walross',

  // ── 2 · where — own preposition ────────────────────────────────────────────
  'where.cheese-factory': 'in einer Käsefabrik',
  'where.underwater-canyon': 'auf dem Grund des Ozeans',
  'where.cookbook-library': 'in einer Bibliothek voller Kochbücher',
  'where.giant-sock-drawer': 'in einer riesigen Sockenschublade',
  'where.gloomy-birthday': 'auf einer sehr tristen Geburtstagsfeier',
  'where.cramped-elevator': 'in einem extrem engen Aufzug',
  'where.cloud-castle': 'in einem Schloss aus Wolken',
  'where.messy-kitchen': 'in einer spektakulär unordentlichen Küche',
  'where.snowy-mountain': 'auf einem verschneiten Bergpass',
  'where.jungle-treehouse': 'in einem Baumhaus im Dschungel',

  // ── 3 · when — own preposition/adverbial ───────────────────────────────────
  'when.small-earthquake': 'während eines kleinen Erdbebens',
  'when.solar-eclipse': 'genau im Moment einer Sonnenfinsternis',
  'when.after-breakfast': 'gleich nach dem Frühstück, aber vor dem zweiten Frühstück',
  'when.someone-elses-wedding': 'während der Hochzeit von jemand anderem',
  'when.wrong-feeling-tuesday': 'an einem Dienstag, der sich wie ein Mittwoch anfühlte',
  'when.clocks-stopped': 'in dem Moment, als alle Uhren stehenblieben',
  'when.three-in-the-morning': 'um drei Uhr morgens ohne guten Grund',
  'when.hat-festival': 'während des jährlichen Hutfestivals',
  'when.internet-outage': 'während eines Internetausfalls',
  'when.seagull-decision': 'in dem Augenblick, als eine Möwe eine Entscheidung traf',
  'when.last-day-of-summer': 'am letzten Tag des Sommers',
  'when.thunderstorm': 'mitten in einem Gewitter',
  'when.first-snow': 'am Morgen des ersten Schnees',
  'when.school-holidays': 'mitten in den Schulferien',
  'when.full-moon': 'bei einem sehr vollen Mond',
  'when.power-cut': 'während eines stadtweiten Stromausfalls',
  'when.just-before-dinner': 'fünf Minuten vor dem Abendessen',
  'when.longest-lesson': 'während der längsten Schulstunde des Jahres',
  'when.day-before-birthday': 'am Tag vor jemandes Geburtstag',
  'when.rush-hour': 'auf dem Höhepunkt des Berufsverkehrs',
  'when.while-everyone-slept': 'während alle anderen schliefen',
  'when.exactly-noon': 'genau um Mittag',

  // ── 4 · did — finite past-tense plural verb phrase ─────────────────────────
  'did.baking-giant-cake': 'backten einen riesigen schiefen Kuchen',
  'did.juggling-pancakes': 'jonglierten mit einem hohen Stapel Pfannkuchen',
  'did.painting-polka-dots': 'bemalten jede Wand mit Punkten',
  'did.sorting-clouds': 'sortierten die Wolken nach Größe',
  'did.dancing-tango': 'tanzten einen sehr dramatischen Tango',
  'did.stacking-chairs': 'bauten einen wackligen Turm aus Stühlen',
  'did.staring-contest': 'veranstalteten einen intensiven Starrwettbewerb',
  'did.flying-kites': 'ließen riesige Drachen an verhedderten Schnüren steigen',
  'did.eating-spaghetti': 'aßen einen Berg Spaghetti',
  'did.digging-with-spoons': 'gruben mit winzigen Löffeln ein riesiges Loch',

  // ── 5 · why — own leading connective ────────────────────────────────────────
  'why.made-sense-then': 'aus Gründen, die damals sinnvoll erschienen',
  'why.impress-a-pigeon': 'um eine Taube zu beeindrucken',
  'why.warranty-forbade-it': 'weil die Garantie es verbot',
  'why.one-grape': 'im Tausch gegen eine einzige Weintraube',
  'why.never-back-down': 'weil sie nie zurückweichen',
  'why.pointless-point': 'um einen Punkt zu beweisen, den niemand infrage gestellt hatte',
  'why.for-science': 'für die Wissenschaft, vermutlich',
  'why.pure-stubbornness': 'aus purer Sturheit',
  'why.horoscope-said-so': 'weil das Horoskop sehr eindeutig war',
  'why.bet-with-themselves': 'um eine Wette mit sich selbst zu gewinnen',
  'why.to-keep-warm': 'um sich warmzuhalten',
  'why.because-tuesday': 'weil gerade Dienstag war',
  'why.for-a-sticker': 'für einen einzigen glänzenden Aufkleber',
  'why.avoid-homework': 'um die Hausaufgaben zu vermeiden',
  'why.everyone-else-did': 'weil alle anderen es auch taten',
  'why.world-record': 'um einen Weltrekord zu brechen, von dem niemand gehört hatte',
  'why.simply-hungry': 'weil sie furchtbar hungrig waren',
  'why.impress-grandma': 'um eine Oma zu beeindrucken, die unbeeindruckt blieb',
  'why.forgot-the-plan': 'weil sie den ursprünglichen Plan vergessen hatten',
  'why.instructions-said-so': 'weil die Anleitung darauf bestand',
  'why.test-a-theory': 'um eine Theorie über die Schwerkraft zu testen',
  'why.no-reason': 'aus keinem bestimmten Grund',

  // ── 6 · ending — dative noun phrase after "endete es mit" ──────────────────
  'end.feelings-about-pasta': 'starken Gefühlen gegenüber Pasta',
  'end.duck-complaint': 'einer offiziellen Beschwerde einer Ente',
  'end.nothing-made-sense': 'völliger Verwirrung, mit der alle zufrieden waren',
  'end.lost-receipts': 'verlorenen Quittungen, was wohl das Beste war',
  'end.pigeon-certificates': 'mehreren Urkunden für Tauben',
  'end.fruit-basket': 'einem Obstkorb vom Bürgermeister',
  'end.instant-sequel': 'der sofortigen Ankündigung einer Fortsetzung',
  'end.three-country-holiday': 'einem Feiertag in drei Ländern',
  'end.cloud-looked-away': 'einer Wolke, die endlich wegschaute',
  'end.never-spoke-again': 'einer Abmachung, nie wieder darüber zu sprechen',
  'end.ice-cream-for-all': 'Eis für absolut alle',
  'end.someone-had-to-mop': 'jemandem, der den ganzen Boden wischen musste',
  'end.museum-exhibit': 'einem Platz hinter Glas in einem kleinen Museum',
  'end.a-song-about-it': 'einem Lied über die ganze Sache',
  'end.neighbors-applauded': 'applaudierenden Nachbarn an ihren Fenstern',
  'end.smelled-like-lemons': 'einem Zitronenduft, der eine Woche blieb',
  'end.new-holiday-invented': 'einem spontan erfundenen neuen Feiertag',
  'end.cat-took-credit': 'einer Katze, die sich das Verdienst schnappte',
  'end.everyone-fell-asleep': 'einem großen Haufen schlafender Leute',
  'end.indoor-rainbow': 'einem Regenbogen, der drinnen blieb',
  'end.instructions-finally-clear': 'einer endlich verständlichen Anleitung',
  'end.home-for-soup': 'einer Suppe für alle zu Hause',
};
