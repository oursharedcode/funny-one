// SPDX-License-Identifier: AGPL-3.0-only

// Spain Spanish pool display texts — machine-drafted for T-6.3 (FM-POOL-2/5).
// needs-es-es-review — machine-translated stub awaiting native Spanish (Spain)
// review per CONTRIBUTING.md.
//
// Authored against the Spanish prose template:
//   "{0} con {1} {3} {2} {4} {5}. Al final, terminó con {6}."
//
// Per-slot authoring rules that fall out of that template:
//
//   0  bare subject noun phrase — the template supplies nothing before it.
//   1  bare noun phrase, NOT "con ..." — the template hardcodes "con", so
//      repeating it here would render as "... con con una tostadora ...".
//   2  where — carries its own preposition ("en una fábrica de queso").
//   3  when — carries its own preposition/adverbial and reads BEFORE slot 2
//      with no glue word between them ("durante un terremoto en una fábrica").
//   4  did — no auxiliary is supplied, so this must be a complete FINITE verb
//      form: pretérito (simple past), 3rd person singular, agreeing with
//      slot 0 (the "con {1}" phrase does not pluralize the verb in Spanish).
//      Pretérito does not mark gender, so slot 0's gender is never at risk.
//   5  why — no connective is hardcoded after slot 4, so slot 5 must supply
//      its own leading connective (para / porque / a causa de / por / sin).
//   6  ending — the template is "... terminó con {6}.", so {6} is the object
//      of "con" and MUST be a noun phrase, never a full finite clause.
//
// Peninsular Spanish vocabulary throughout (e.g. "contable" rather than the
// LatAm "contador", "vitrina"/"cajón" usage typical of Spain), to keep this
// distinct from the es-419 pool rather than a copy with tildes moved around.
//
// Everything is lowercase, including slot 0, matching en.ts/ru.ts: presentation
// (capitalizing the story's opening word) is left to render time, not baked
// into the pool data.

import type { PoolTextMap } from '../schema.js';

export const esEs: PoolTextMap = {
  // ── 0 · who ───────────────────────────────────────────────────────────────
  'who.grumpy-pirate': 'un pirata gruñón',
  'who.sleepy-llama': 'una llama muy dormilona',
  'who.confused-penguin': 'un pingüino desconcertado',
  'who.overconfident-raccoon': 'un mapache demasiado confiado',
  'who.tiny-dragon': 'el dragón más pequeño del mundo',
  'who.cats-in-a-trench-coat': 'tres gatos con una gabardina',
  'who.retired-superhero': 'un superhéroe jubilado',
  'who.skating-grandma': 'una abuela sobre patines',
  'who.time-traveling-accountant': 'un contable viajero del tiempo',
  'who.muddy-knight': 'un caballero cubierto de barro',

  // ── 1 · withWhom — bare noun, no "con" (template supplies it) ─────────────
  'with.haunted-toaster': 'una tostadora embrujada',
  'with.angry-geese': 'tres gansos enfadados',
  'with.philosophical-goldfish': 'un pez de colores filósofo',
  'with.riddle-robot': 'un robot que solo habla en acertijos',
  'with.professor-goat': 'una cabra llamada Profesor Queso',
  'with.lost-tourist': 'un turista muy perdido',
  'with.giant-snail': 'un caracol gigante y alegre',
  'with.tuba-frog': 'una rana con una tuba',
  'with.talking-mailbox': 'un buzón parlanchín',
  'with.opera-walrus': 'una morsa que canta ópera',

  // ── 2 · where — own preposition ────────────────────────────────────────────
  'where.cheese-factory': 'en una fábrica de queso',
  'where.underwater-canyon': 'en el fondo del océano',
  'where.cookbook-library': 'en una biblioteca solo de libros de cocina',
  'where.giant-sock-drawer': 'dentro de un cajón gigante de calcetines',
  'where.gloomy-birthday': 'en una fiesta de cumpleaños muy triste',
  'where.cramped-elevator': 'en un ascensor extremadamente estrecho',
  'where.cloud-castle': 'en un castillo hecho de nubes',
  'where.messy-kitchen': 'en una cocina espectacularmente desordenada',
  'where.snowy-mountain': 'en un puerto de montaña nevado',
  'where.jungle-treehouse': 'en una casa en un árbol de la jungla',

  // ── 3 · when — own preposition/adverbial ───────────────────────────────────
  'when.small-earthquake': 'durante un pequeño terremoto',
  'when.solar-eclipse': 'en el momento exacto de un eclipse solar',
  'when.after-breakfast': 'justo después del desayuno pero antes del segundo desayuno',
  'when.someone-elses-wedding': 'durante la boda de otra persona',
  'when.wrong-feeling-tuesday': 'un martes que parecía miércoles',
  'when.clocks-stopped': 'el instante en que se pararon todos los relojes',
  'when.three-in-the-morning': 'a las tres de la madrugada sin ningún motivo',
  'when.hat-festival': 'durante el festival anual del sombrero',
  'when.internet-outage': 'mientras no había internet',
  'when.seagull-decision': 'el instante en que una gaviota tomó una decisión',
  'when.last-day-of-summer': 'el último día del verano',
  'when.thunderstorm': 'en plena tormenta eléctrica',
  'when.first-snow': 'la mañana de la primera nevada',
  'when.school-holidays': 'a mitad de las vacaciones escolares',
  'when.full-moon': 'bajo una luna llenísima',
  'when.power-cut': 'durante un apagón en toda la ciudad',
  'when.just-before-dinner': 'cinco minutos antes de cenar',
  'when.longest-lesson': 'durante la clase más larga del año',
  'when.day-before-birthday': 'el día antes del cumpleaños de alguien',
  'when.rush-hour': 'en plena hora punta',
  'when.while-everyone-slept': 'mientras todos los demás dormían',
  'when.exactly-noon': 'justo al mediodía',

  // ── 4 · did — pretérito, 3rd singular, finite ────────────────────────────────
  'did.baking-giant-cake': 'horneó una tarta enorme y torcida',
  'did.juggling-pancakes': 'hizo malabares con una torre de tortitas',
  'did.painting-polka-dots': 'pintó lunares en todas las paredes',
  'did.sorting-clouds': 'reorganizó las nubes por tamaño',
  'did.dancing-tango': 'bailó un tango muy dramático',
  'did.stacking-chairs': 'construyó una torre inestable de sillas',
  'did.staring-contest': 'organizó un intenso concurso de miradas',
  'did.flying-kites': 'voló cometas enormes con hilos enredados',
  'did.eating-spaghetti': 'comió una montaña de espaguetis',
  'did.digging-with-spoons': 'cavó un agujero enorme con cucharillas',

  // ── 5 · why — own leading connective ────────────────────────────────────────
  'why.made-sense-then': 'por razones que entonces tenían sentido',
  'why.impress-a-pigeon': 'para impresionar a una paloma',
  'why.warranty-forbade-it': 'porque la garantía lo prohibía',
  'why.one-grape': 'a cambio de una sola uva',
  'why.never-back-down': 'porque nunca se echan atrás en un reto',
  'why.pointless-point': 'para demostrar algo que nadie preguntó',
  'why.for-science': 'por la ciencia, probablemente',
  'why.pure-stubbornness': 'por pura terquedad',
  'why.horoscope-said-so': 'porque el horóscopo era muy concreto',
  'why.bet-with-themselves': 'para ganar una apuesta consigo mismos',
  'why.to-keep-warm': 'para entrar en calor',
  'why.because-tuesday': 'porque era martes',
  'why.for-a-sticker': 'por una sola pegatina brillante',
  'why.avoid-homework': 'para librarse de los deberes',
  'why.everyone-else-did': 'porque todos los demás lo hacían',
  'why.world-record': 'para batir un récord que nadie conocía',
  'why.simply-hungry': 'porque tenían muchísima hambre',
  'why.impress-grandma': 'para impresionar a una abuela que no se impresionó',
  'why.forgot-the-plan': 'porque olvidaron el plan original',
  'why.instructions-said-so': 'porque las instrucciones insistían en ello',
  'why.test-a-theory': 'para probar una teoría sobre la gravedad',
  'why.no-reason': 'sin ningún motivo en absoluto',

  // ── 6 · ending — noun phrase after "terminó con" ─────────────────────────────
  'end.feelings-about-pasta': 'sentimientos encontrados sobre la pasta',
  'end.duck-complaint': 'una queja formal de un pato',
  'end.nothing-made-sense': 'una historia sin sentido que a todos les pareció bien',
  'end.lost-receipts': 'la pérdida de los recibos, probablemente lo mejor',
  'end.pigeon-certificates': 'varios diplomas para unas palomas',
  'end.fruit-basket': 'una cesta de fruta enviada por el alcalde',
  'end.instant-sequel': 'el anuncio inmediato de una secuela',
  'end.three-country-holiday': 'un día festivo en tres países',
  'end.cloud-looked-away': 'una nube que por fin dejó de mirar',
  'end.never-spoke-again': 'un pacto de silencio entre todos',
  'end.ice-cream-for-all': 'helado para absolutamente todo el mundo',
  'end.someone-had-to-mop': 'alguien fregando todo el suelo',
  'end.museum-exhibit': 'una vitrina en un pequeño museo',
  'end.a-song-about-it': 'una canción sobre todo lo ocurrido',
  'end.neighbors-applauded': 'un aplauso de los vecinos desde sus ventanas',
  'end.smelled-like-lemons': 'un ligero olor a limón durante una semana',
  'end.new-holiday-invented': 'la invención de una fiesta completamente nueva',
  'end.cat-took-credit': 'un gato que se llevó todo el mérito',
  'end.everyone-fell-asleep': 'una siesta colectiva improvisada',
  'end.indoor-rainbow': 'un arcoíris que apareció dentro y no quiso irse',
  'end.instructions-finally-clear': 'unas instrucciones que por fin tuvieron sentido',
  'end.home-for-soup': 'una vuelta a casa para tomar sopa',
};
