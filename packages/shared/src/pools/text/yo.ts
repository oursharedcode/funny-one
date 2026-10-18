// SPDX-License-Identifier: AGPL-3.0-only

// Yoruba (Nigeria) pool display texts, Step 81. Authored against the Yoruba
// prose template in ../../i18n/yo.ts:
//   "{3}, {0} àti {1} wà {2}. Wọ́n {4} {5}. Níkẹyìn, {6}."
// e.g. «Ní òwúrọ̀ ọjọ́ tí òjò àkọ́rọ̀ rọ̀, pẹ́ńgúìn kan tí orí rẹ̀ dàrú àti
// pẹ́pẹ́yẹ ńlá mẹ́ta tí inú ń bí wà nínú ilé-iṣẹ́ wàràkàṣì kan. Wọ́n jẹ
// sípágẹ́ẹ̀tì tó ga bí òkè kí òtútù má bàa mú wọn. Níkẹyìn, ọba ìlú fi agbọ̀n
// èso ránṣẹ́ sí wọn.»
//
// needs-yo-review — machine-translated stub awaiting native Yoruba review per CONTRIBUTING.md.
//
// Per-slot grammar that falls out of that template (only spaces between slots):
//
//   0  bare noun phrase, the subject, in Yoruba order: noun, adjective, then
//      «kan» ("a") or a numeral, then any relative clause («tí …», «tó …» =
//      «tí ó …»): «ajalèlókun oníkanra kan», «ológbò mẹ́ta tí wọ́n …».
//   1  the same shape; the template joins it to slot 0 with «àti» ("and").
//   2  carries its own place word, read after «wà» ("were, at"): «nínú …»
//      (inside), «ní ìsàlẹ̀ …» (at the bottom of), «níbi …» (at an event),
//      «lórí …» (on).
//   3  a time phrase that opens the story: «nígbà tí …» (when), «ní …» (on,
//      at), «lásìkò …» (during), «gẹ́rẹ́ tí …» (just as); the template adds the
//      comma. A text may use an impersonal «wọ́n» («wọ́n mú iná lọ»).
//   4  a bare verb phrase after «Wọ́n» ("they"). Verbs never inflect, so one
//      form fits every pair of actors, and an action verb with no aspect marker
//      reads as done and past.
//   5  read straight after slot 4, so it opens with its own connective: «láti …»
//      (to), «nítorí (pé) …» (because), «fún …» (for), «kí … má bàa …» (so as
//      not to), «ní pàṣípààrọ̀ …» (in exchange for), «láìsí …» (without).
//   6  a full clause read after «Níkẹyìn,» ("in the end"). «wọn/wọ́n» there are
//      the actors; reported speech uses the logophoric «àwọn».
//
// Orthography: standard Yoruba as written in Nigeria (BBC News Yorùbá style):
// every high and low tone marked (acute and grave; mid unmarked), the
// dot-below letters ẹ ọ ṣ, and the syllabic nasals «ń» «ǹ» precomposed (U+0144,
// U+01F9). Text is NFC: a toned ẹ or ọ is the dot-below letter plus a combining
// U+0301 or U+0300, so it costs 2 of the 70 code points, and U+0323 never
// appears. Object pronouns follow the tone rule: high after a mid or low verb
// («ebi ń pa wọ́n», «wò wọ́n»), mid after a high one («mú wọn», «sí wọn»); and
// «wọn» is mid before «kì í». Loanwords are spelled the Yoruba way (sípágẹ́ẹ̀tì,
// áìsìkírìmù, sáyẹ́ǹsì); numbers are words (mẹ́ta, méjìlá).
//
// Cultural swaps where the joke survives: pasta is jollof rice (the jollof
// argument), soup is àmàlà and ewédú, the grape a single groundnut, lemons are
// lime (ọsàn wẹ́wẹ́), the mayor is the town's king (ọba ìlú), and the duck
// complains to the local government. The first snow is the first rains (òjò
// àkọ́rọ̀), summer the hot season (ẹ̀ẹ̀rùn), rush hour the Lagos go-slow
// (sún-kẹrẹ-fà-kẹrẹ), a power cut «wọ́n mú iná lọ» ("they took the light"),
// the hat festival a festival of caps (fìlà), the seagull a cattle egret
// (lékèélékèé), cheese wàràkàṣì, and the staring contest a no-blinking
// contest. Tuesday and Wednesday are Ọjọ́ Ìṣẹ́gun and Ọjọ́rú.

import type { PoolTextMap } from '../schema.js';

export const yo: PoolTextMap = {
  // ── 0 · who ───────────────────────────────────────────────────────────────
  'who.grumpy-pirate': 'ajalèlókun oníkanra kan',
  'who.sleepy-llama': 'lámà kan tí oorun ń kùn gidigidi',
  'who.confused-penguin': 'pẹ́ńgúìn kan tí orí rẹ̀ dàrú',
  'who.overconfident-raccoon': 'rakúùnù kan tó dá ara rẹ̀ lójú jù',
  'who.tiny-dragon': 'dírágónì tó kéré jù lọ láyé',
  'who.cats-in-a-trench-coat': 'ológbò mẹ́ta tí wọ́n jọ wọ kóòtù gígùn kan',
  'who.retired-superhero': 'akọni alágbára kan tó ti fẹ̀yìntì',
  'who.skating-grandma': 'ìyá àgbà kan tó wọ bàtà oníkẹ̀kẹ́',
  'who.time-traveling-accountant': 'oníṣirò owó kan tó ń rin ìrìn-àjò nínú àkókò',
  'who.muddy-knight': 'jagunjagun kan tí ẹrẹ̀ bò láti orí dé ẹsẹ̀',

  // ── 1 · withWhom — bare noun phrase; the template supplies «àti» ───────────
  'with.haunted-toaster': 'tósítà kan tí iwin ń gbé inú rẹ̀',
  'with.angry-geese': 'pẹ́pẹ́yẹ ńlá mẹ́ta tí inú ń bí',
  'with.philosophical-goldfish': 'ẹja wúrà kan tó ń ronú jinlẹ̀',
  'with.riddle-robot': 'róbọ́ọ̀tì kan tí kì í sọ̀rọ̀ àfi ní àlọ́ àpamọ̀',
  'with.professor-goat': 'ewúrẹ́ kan tí wọ́n ń pè ní Ọ̀jọ̀gbọ́n Wàràkàṣì',
  'with.lost-tourist': 'arìnrìn-àjò afẹ́ kan tí ọ̀nà rú lójú pátápátá',
  'with.giant-snail': 'ìgbín ńlá kan tó ń rẹ́rìn-ín músẹ́',
  'with.tuba-frog': 'àkèré kan tó ń fọn fèrè ńlá',
  'with.talking-mailbox': 'àpótí lẹ́tà kan tó ń sọ̀rọ̀',
  'with.opera-walrus': 'wọ́rọ̀sì kan tó ń kọ orin ópérà',

  // ── 2 · where — carries its own place word ─────────────────────────────────
  'where.cheese-factory': 'nínú ilé-iṣẹ́ wàràkàṣì kan',
  'where.underwater-canyon': 'ní ìsàlẹ̀ òkun',
  'where.cookbook-library': 'nínú ilé-ìkàwé kan tó ní ìwé ìdáná nìkan',
  'where.giant-sock-drawer': 'nínú àpótí ìbọ̀sẹ̀ kan tó tóbi bí ilé',
  'where.gloomy-birthday': 'níbi àríyá ọjọ́ìbí kan tí kò ní ayọ̀ kankan',
  'where.cramped-elevator': 'nínú lífìtì kan tó há débi pé kò sí ààyè láti mí',
  'where.cloud-castle': 'nínú ààfin kan tí wọ́n fi ìkùukùu kọ́',
  'where.messy-kitchen': 'nínú ilé ìdáná kan tó rí jákujàku kọjá àfẹnusọ',
  'where.snowy-mountain': 'lórí ọ̀nà òkè kan tí yìnyín bò',
  'where.jungle-treehouse': 'nínú ilé orí igi kan láàárín igbó kìjikìji',

  // ── 3 · when — opens the story; the template adds the comma ────────────────
  'when.small-earthquake': 'nígbà ìmìtìtì ilẹ̀ kékeré kan',
  'when.solar-eclipse': 'gẹ́rẹ́ tí òṣùpá bò oòrùn mọ́lẹ̀',
  'when.after-breakfast': 'lẹ́yìn oúnjẹ àárọ̀ ṣùgbọ́n kí oúnjẹ àárọ̀ kejì tó dé',
  'when.someone-elses-wedding': 'nígbà tí ẹlòmíràn ń ṣe ìgbéyàwó',
  'when.wrong-feeling-tuesday': 'ní Ọjọ́ Ìṣẹ́gun kan tó dà bí Ọjọ́rú',
  'when.clocks-stopped': 'nígbà tí gbogbo aago dúró lójijì',
  'when.three-in-the-morning': 'ní aago mẹ́ta òru láìnídìí gidi',
  'when.hat-festival': 'lásìkò àjọ̀dún fìlà ọdọọdún',
  'when.internet-outage': 'nígbà tí ẹ̀rọ ayélujára kò ṣiṣẹ́',
  'when.seagull-decision': 'ní kété tí lékèélékèé kan ṣe ìpinnu',
  'when.last-day-of-summer': 'ní ọjọ́ ìkẹyìn ìgbà ẹ̀ẹ̀rùn',
  'when.thunderstorm': 'láàárín ìjì òjò àti àrá',
  'when.first-snow': 'ní òwúrọ̀ ọjọ́ tí òjò àkọ́rọ̀ rọ̀',
  'when.school-holidays': 'ní agbedeméjì ìsinmi ilé-ìwé',
  'when.full-moon': 'lábẹ́ òṣùpá tó rí ròbòtò bí àwo',
  'when.power-cut': 'nígbà tí wọ́n mú iná lọ ní gbogbo ìlú',
  'when.just-before-dinner': 'ìṣẹ́jú márùn-ún ṣáájú oúnjẹ alẹ́',
  'when.longest-lesson': 'lásìkò ẹ̀kọ́ tó gùn jù lọ lọ́dún',
  'when.day-before-birthday': 'ní ọjọ́ tó ṣáájú ọjọ́ìbí ẹnì kan',
  'when.rush-hour': 'nígbà tí sún-kẹrẹ-fà-kẹrẹ le jù lọ',
  'when.while-everyone-slept': 'nígbà tí gbogbo èèyàn yòókù ń sùn',
  'when.exactly-noon': 'ní aago méjìlá ọ̀sán gangan',

  // ── 4 · did — a bare verb phrase after «Wọ́n» ───────────────────────────────
  'did.baking-giant-cake': 'yan kéèkì ràbàtà kan tó wọ́',
  'did.juggling-pancakes': 'fi òkìtì pánkéèkì gíga kan ṣeré bí onídán',
  'did.painting-polka-dots': 'kun gbogbo ògiri ní àmì róbótó aláràbarà',
  'did.sorting-clouds': 'tò àwọn ìkùukùu lẹ́sẹẹsẹ láti kékeré dé ńlá',
  'did.dancing-tango': 'jó tángò bí ẹni pé gbogbo ayé ń wò wọ́n',
  'did.stacking-chairs': 'fi àga kọ́ ilé gogoro kan tó ń mì jìgìjìgì',
  'did.staring-contest': 'tẹjú mọ́ ara wọn nínú ìdíje àìṣẹ́jú tó le koko',
  'did.flying-kites': 'mú kí àwòdì-ìwé ńláńlá fò lórí okùn tó wé mọ́ra',
  'did.eating-spaghetti': 'jẹ sípágẹ́ẹ̀tì tó ga bí òkè',
  'did.digging-with-spoons': 'fi ṣíbí kéékèèké gbẹ́ ihò ràbàtà kan',

  // ── 5 · why — opens with its own connective (see header) ───────────────────
  'why.made-sense-then': 'nítorí ìdí kan tó bọ́gbọ́n mu nígbà yẹn',
  'why.impress-a-pigeon': 'láti wú ẹyẹlé kan lórí',
  'why.warranty-forbade-it': 'nítorí pé ìwé ìdánilójú ní kí wọ́n má ṣe é',
  'why.one-grape': 'ní pàṣípààrọ̀ ẹ̀pà kan ṣoṣo',
  'why.never-back-down': 'nítorí pé wọn kì í sá fún ìpèníjà',
  'why.pointless-point': 'láti jẹ́rìí sí ohun tí ẹnikẹ́ni kò béèrè',
  'why.for-science': 'nítorí ìmọ̀ sáyẹ́ǹsì, bóyá',
  'why.pure-stubbornness': 'nítorí orí kunkun lásán',
  'why.horoscope-said-so': 'nítorí pé ìràwọ̀ wọn sọ bẹ́ẹ̀ fínnífínní',
  'why.bet-with-themselves': 'láti parí àríyànjiyàn wọn pẹ̀lú ara wọn',
  'why.to-keep-warm': 'kí òtútù má bàa mú wọn',
  'why.because-tuesday': 'nítorí pé Ọjọ́ Ìṣẹ́gun ni',
  'why.for-a-sticker': 'fún sítíkà dídán kan ṣoṣo',
  'why.avoid-homework': 'kí wọ́n má bàa ṣe iṣẹ́ àṣetiléwá',
  'why.everyone-else-did': 'nítorí pé gbogbo èèyàn ló ń ṣe bẹ́ẹ̀',
  'why.world-record': 'láti fọ́ rẹ́kọ́ọ̀dù àgbáyé tí ẹnikẹ́ni kò gbọ́ rí',
  'why.simply-hungry': 'nítorí pé ebi ń pa wọ́n gidigidi',
  'why.impress-grandma': 'láti wú ìyá àgbà kan lórí, àmọ́ kò tilẹ̀ wò wọ́n',
  'why.forgot-the-plan': 'nítorí pé wọ́n gbàgbé ètò àkọ́kọ́',
  'why.instructions-said-so': 'nítorí pé ìwé ìtọ́ni tẹnu mọ́ ọn',
  'why.test-a-theory': 'láti dán àbá kan wò nípa òòfà ilẹ̀',
  'why.no-reason': 'láìsí ìdí kankan rárá',

  // ── 6 · ending — a full clause read after «Níkẹyìn,» ───────────────────────
  'end.feelings-about-pasta': 'gbogbo èèyàn ní èrò líle nípa ìrẹsì jọ̀lọ́ọ̀fù',
  'end.duck-complaint': 'pẹ́pẹ́yẹ kan kọ ìwé ẹ̀sùn sí ìjọba ìbílẹ̀',
  'end.nothing-made-sense': 'kò sí nǹkan tó yé ẹnikẹ́ni, inú gbogbo èèyàn sì dùn',
  'end.lost-receipts': 'gbogbo rìsíìtì sọnù, bóyá ìyẹn ló dára jù',
  'end.pigeon-certificates': 'ẹyẹlé mélòó kan gba ìwé ẹ̀rí',
  'end.fruit-basket': 'ọba ìlú fi agbọ̀n èso ránṣẹ́ sí wọn',
  'end.instant-sequel': 'wọ́n kéde lẹ́sẹ̀kẹsẹ̀ pé apá kejì ń bọ̀',
  'end.three-country-holiday': 'ọjọ́ náà di ọjọ́ ìsinmi ní orílẹ̀-èdè mẹ́ta',
  'end.cloud-looked-away': 'ìkùukùu tó ti ń wò wọ́n yíjú sí ibòmíì',
  'end.never-spoke-again': 'gbogbo èèyàn gbà pé àwọn kò ní sọ̀rọ̀ nípa rẹ̀ mọ́ láé',
  'end.ice-cream-for-all': 'áìsìkírìmù wà fún gbogbo èèyàn pátápátá',
  'end.someone-had-to-mop': 'ẹnì kan ní láti fọ gbogbo ilẹ̀ náà',
  'end.museum-exhibit': 'wọ́n gbé e sínú àpótí gíláàsì ní ilé ìṣẹ̀ǹbáyé kékeré kan',
  'end.a-song-about-it': 'wọ́n kọ orin kan nípa gbogbo ìṣẹ̀lẹ̀ náà',
  'end.neighbors-applauded': 'àwọn aládùúgbò pàtẹ́wọ́ láti ojú fèrèsé wọn',
  'end.smelled-like-lemons': 'òórùn ọsàn wẹ́wẹ́ díẹ̀ wà lára gbogbo nǹkan fún ọ̀sẹ̀ kan',
  'end.new-holiday-invented': 'wọ́n dá àjọ̀dún tuntun kan sílẹ̀ lójú ẹsẹ̀',
  'end.cat-took-credit': 'ológbò kan tó ń kọjá lọ gba gbogbo ògo',
  'end.everyone-fell-asleep': 'gbogbo wọn sùn lọ lórí ara wọn bí òkìtì aṣọ',
  'end.indoor-rainbow': 'òṣùmàrè yọ nínú ilé, ó sì kọ̀ láti lọ',
  'end.instructions-finally-clear': 'ìwé ìtọ́ni náà wá yé wọn yékéyéké',
  'end.home-for-soup': 'gbogbo èèyàn lọ sílé lọ jẹ àmàlà àti ewédú',
};
