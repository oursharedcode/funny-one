// SPDX-License-Identifier: AGPL-3.0-only

// Italian pool display texts — machine-drafted for T-6.3 (FM-POOL-2/5).
// needs-it-review — machine-translated stub awaiting native Italian review per CONTRIBUTING.md.
//
// Authored against the Italian prose template:
//   "{0} con {1} {3} {2} {4} {5}. Alla fine, è finita con {6}."
//
// Per-slot authoring rules that fall out of that template:
//
//   0  bare subject noun phrase — the template supplies nothing before it.
//   1  bare noun phrase, NOT "con ..." — the template hardcodes "con", so a
//      leading "con" here would double up ("con con un tostapane infestato").
//   2  where — carries its OWN preposition ("in una fabbrica di formaggio").
//      Reads right after slot 3 with no glue word between them.
//   3  when — carries its OWN preposition/adverbial too ("durante un piccolo
//      terremoto"); the template puts it immediately before slot 2, so the
//      two must each be self-contained ("durante X" + "in Y" reads cleanly
//      back to back with nothing in between).
//   4  did — the template supplies no auxiliary, so this MUST be a complete
//      finite verb form on its own: passato remoto, 3rd person singular,
//      agreeing with slot 0 (the "con {1}" phrase never pluralizes the verb
//      in Italian). Passato remoto marks no gender, so there is no
//      gender-agreement risk from slot 0's noun.
//   5  why — no connective is hardcoded after slot 4, so slot 5 must supply
//      its own leading connective ("per", "perché", "a causa di", ...).
//   6  ending — the template is "...è finita con {6}.", so {6} is the object
//      of "con" and MUST be a noun phrase, never a full independent clause
//      (a relative/participial modifier hanging off the head noun is fine).
//
// Everything is lowercase; capitalization is presentation, not content, the
// same convention EN and RU use so any language can put any slot first.

import type { PoolTextMap } from '../schema.js';

export const it: PoolTextMap = {
  // ── 0 · who ───────────────────────────────────────────────────────────────
  'who.grumpy-pirate': 'un pirata scontroso',
  'who.sleepy-llama': 'un lama molto assonnato',
  'who.confused-penguin': 'un pinguino confuso',
  'who.overconfident-raccoon': 'un procione troppo sicuro di sé',
  'who.tiny-dragon': 'il drago più piccolo del mondo',
  'who.cats-in-a-trench-coat': 'tre gatti in un trench',
  'who.retired-superhero': 'un supereroe in pensione',
  'who.skating-grandma': 'una nonna sui pattini a rotelle',
  'who.time-traveling-accountant': 'un contabile viaggiatore nel tempo',
  'who.muddy-knight': 'un cavaliere coperto di fango',

  // ── 1 · withWhom — bare noun, no "con" (template supplies it) ─────────────
  'with.haunted-toaster': 'un tostapane infestato',
  'with.angry-geese': 'tre oche furiose',
  'with.philosophical-goldfish': 'un pesce rosso filosofo',
  'with.riddle-robot': 'un robot che parla solo per indovinelli',
  'with.professor-goat': 'una capra di nome Professor Formaggio',
  'with.lost-tourist': 'un turista molto disorientato',
  'with.giant-snail': 'una lumaca enorme e allegra',
  'with.tuba-frog': 'una rana con la tuba',
  'with.talking-mailbox': 'una cassetta della posta parlante',
  'with.opera-walrus': "un tricheco che canta l'opera",

  // ── 2 · where — own preposition ────────────────────────────────────────────
  'where.cheese-factory': 'in una fabbrica di formaggio',
  'where.underwater-canyon': "sul fondo dell'oceano",
  'where.cookbook-library': 'in una biblioteca di soli libri di cucina',
  'where.giant-sock-drawer': 'dentro un enorme cassetto di calzini',
  'where.gloomy-birthday': 'a una festa di compleanno molto triste',
  'where.cramped-elevator': 'in un ascensore strettissimo',
  'where.cloud-castle': 'in un castello di nuvole',
  'where.messy-kitchen': 'in una cucina spaventosamente disordinata',
  'where.snowy-mountain': 'su un passo di montagna innevato',
  'where.jungle-treehouse': "in una casa sull'albero nella giungla",

  // ── 3 · when — own preposition/adverbial ───────────────────────────────────
  'when.small-earthquake': 'durante un piccolo terremoto',
  'when.solar-eclipse': "nell'esatto istante di un'eclissi solare",
  'when.after-breakfast': 'subito dopo colazione ma prima della seconda colazione',
  'when.someone-elses-wedding': 'durante il matrimonio di qualcun altro',
  'when.wrong-feeling-tuesday': 'in un martedì che sembrava un mercoledì',
  'when.clocks-stopped': "nell'istante in cui si fermarono tutti gli orologi",
  'when.three-in-the-morning': 'alle tre del mattino senza alcun motivo',
  'when.hat-festival': 'durante il festival annuale dei cappelli',
  'when.internet-outage': 'mentre internet era fuori uso',
  'when.seagull-decision': "nell'istante in cui un gabbiano prese una decisione",
  'when.last-day-of-summer': "nell'ultimo giorno d'estate",
  'when.thunderstorm': 'nel bel mezzo di un temporale',
  'when.first-snow': 'la mattina della prima neve',
  'when.school-holidays': 'a metà delle vacanze scolastiche',
  'when.full-moon': 'sotto una luna pienissima',
  'when.power-cut': 'durante un blackout in tutta la città',
  'when.just-before-dinner': 'cinque minuti prima di cena',
  'when.longest-lesson': "durante la lezione più lunga dell'anno",
  'when.day-before-birthday': 'il giorno prima del compleanno di qualcuno',
  'when.rush-hour': "nel pieno dell'ora di punta",
  'when.while-everyone-slept': 'mentre tutti gli altri dormivano',
  'when.exactly-noon': 'esattamente a mezzogiorno',

  // ── 4 · did — passato remoto, 3rd singular, finite ──────────────────────────
  'did.baking-giant-cake': 'sfornò una torta enorme e storta',
  'did.juggling-pancakes': "giocolò con un'alta pila di frittelle",
  'did.painting-polka-dots': 'dipinse pois su ogni muro',
  'did.sorting-clouds': 'riorganizzò le nuvole per dimensione',
  'did.dancing-tango': 'ballò un tango molto drammatico',
  'did.stacking-chairs': 'costruì una torre traballante di sedie',
  'did.staring-contest': "organizzò un'intensa gara di sguardi",
  'did.flying-kites': 'fece volare enormi aquiloni con i fili aggrovigliati',
  'did.eating-spaghetti': 'mangiò una montagna di spaghetti',
  'did.digging-with-spoons': 'scavò una buca enorme con piccoli cucchiaini',

  // ── 5 · why — own leading connective ────────────────────────────────────────
  'why.made-sense-then': 'per ragioni che allora sembravano sensate',
  'why.impress-a-pigeon': 'per impressionare un piccione',
  'why.warranty-forbade-it': 'perché la garanzia lo vietava',
  'why.one-grape': "in cambio di un solo acino d'uva",
  'why.never-back-down': 'perché non si tira mai indietro davanti a una sfida',
  'why.pointless-point': 'per dimostrare un punto che nessuno aveva chiesto',
  'why.for-science': 'per la scienza, probabilmente',
  'why.pure-stubbornness': 'per pura testardaggine',
  'why.horoscope-said-so': "perché l'oroscopo era molto specifico",
  'why.bet-with-themselves': 'per vincere una scommessa con se stesso',
  'why.to-keep-warm': 'per tenersi al caldo',
  'why.because-tuesday': 'perché era martedì',
  'why.for-a-sticker': 'per un solo adesivo scintillante',
  'why.avoid-homework': 'per evitare i compiti',
  'why.everyone-else-did': 'perché lo facevano tutti gli altri',
  'why.world-record': 'per battere un record di cui nessuno aveva mai sentito parlare',
  'why.simply-hungry': 'perché aveva moltissima fame',
  'why.impress-grandma': 'per impressionare una nonna rimasta impassibile',
  'why.forgot-the-plan': 'perché aveva dimenticato il piano originale',
  'why.instructions-said-so': 'perché le istruzioni lo imponevano',
  'why.test-a-theory': 'per testare una teoria sulla gravità',
  'why.no-reason': 'senza alcun motivo',

  // ── 6 · ending — noun phrase after "è finita con" ───────────────────────────
  'end.feelings-about-pasta': 'forti sentimenti di tutti verso la pasta',
  'end.duck-complaint': "un reclamo ufficiale presentato da un'anatra",
  'end.nothing-made-sense': 'una situazione senza senso che andava bene a tutti',
  'end.lost-receipts': 'gli scontrini perduti, probabilmente per il meglio',
  'end.pigeon-certificates': 'alcuni piccioni premiati con un certificato',
  'end.fruit-basket': 'un cesto di frutta inviato dal sindaco',
  'end.instant-sequel': "l'annuncio immediato di un sequel",
  'end.three-country-holiday': 'una nuova festa nazionale in tre paesi',
  'end.cloud-looked-away': 'la nuvola che osservava, finalmente girata altrove',
  'end.never-spoke-again': 'la promessa di tutti di non parlarne mai più',
  'end.ice-cream-for-all': 'un gelato per assolutamente tutti',
  'end.someone-had-to-mop': 'qualcuno costretto a lavare tutto il pavimento',
  'end.museum-exhibit': 'un posto dietro una vetrina in un piccolo museo',
  'end.a-song-about-it': 'una canzone scritta su tutta la faccenda',
  'end.neighbors-applauded': 'gli applausi dei vicini dalle finestre',
  'end.smelled-like-lemons': 'un vago profumo di limone per una settimana',
  'end.new-holiday-invented': 'una festa completamente nuova inventata sul momento',
  'end.cat-took-credit': 'tutto il merito preso da un gatto di passaggio',
  'end.everyone-fell-asleep': 'un mucchio di persone tutte addormentate insieme',
  'end.indoor-rainbow': 'un arcobaleno in casa che si rifiutava di andarsene',
  'end.instructions-finally-clear': 'istruzioni che finalmente avevano un senso perfetto',
  'end.home-for-soup': 'un ritorno a casa di tutti per la zuppa',
};
