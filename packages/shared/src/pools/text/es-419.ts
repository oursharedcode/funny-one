// SPDX-License-Identifier: AGPL-3.0-only

// Latin American Spanish pool display texts — machine-drafted for T-6.3 (FM-POOL-2/5).
// needs-es-419-review — machine-translated stub awaiting native Spanish (LatAm) review per CONTRIBUTING.md.
//
// Authored against the Spanish prose template:
//   "{0} con {1} {3} {2} {4} {5}. Al final, terminó con {6}."
//
// Per-slot authoring rules that fall out of that template:
//
//   0  bare subject noun phrase — the template supplies nothing before it
//   1  bare noun phrase, NOT "con ..." — the template hardcodes "con".
//   2  where — carries its own preposition: "en una fábrica de queso"
//   3  when — carries its own preposition/adverbial, and reads BEFORE slot 2
//      (order is {3}{2}, back to back with no glue word between them)
//   4  did — no auxiliary is supplied, so this MUST be a complete finite verb:
//      pretérito (simple past), 3rd person singular. The "con {1}" companion
//      phrase does not pluralize the Spanish verb, so slot 4 always agrees
//      with the singular slot-0 subject alone. Pretérito carries no gender
//      marking, so there is no gender-agreement risk here either.
//   5  why — no connective is hardcoded after slot 4, so slot 5 must supply
//      its own leading connective (para, porque, a causa de, por, ...).
//   6  ending — the template is "...terminó con {6}.", so {6} is the object
//      of "con" and MUST be a noun phrase, never a full independent clause.
//      Relative clauses modifying the head noun are fine ("una nube que ..."),
//      a bare second clause tacked on with "y" is not.
//
// Neutral Latin American Spanish throughout: no vosotros forms, no
// Spain-specific slang, consistent with the project's es-419 locale.
//
// Everything is lowercase, including slot 0, matching the caseless style used
// by the en/ru reference pools — capitalization is presentation, not content.

import type { PoolTextMap } from '../schema.js';

export const es419: PoolTextMap = {
  // ── 0 · who ───────────────────────────────────────────────────────────────
  'who.grumpy-pirate': 'un pirata gruñón',
  'who.sleepy-llama': 'una llama muy dormilona',
  'who.confused-penguin': 'un pingüino confundido',
  'who.overconfident-raccoon': 'un mapache demasiado confiado',
  'who.tiny-dragon': 'el dragón más pequeño del mundo',
  'who.cats-in-a-trench-coat': 'tres gatos con un abrigo largo',
  'who.retired-superhero': 'un superhéroe jubilado',
  'who.skating-grandma': 'una abuela en patines',
  'who.time-traveling-accountant': 'un contador viajero en el tiempo',
  'who.muddy-knight': 'un caballero muy embarrado',

  // ── 1 · withWhom — bare noun, no "con" (template supplies it) ─────────────
  'with.haunted-toaster': 'una tostadora embrujada',
  'with.angry-geese': 'tres gansos furiosos',
  'with.philosophical-goldfish': 'un pez dorado filósofo',
  'with.riddle-robot': 'un robot que solo habla en acertijos',
  'with.professor-goat': 'una cabra llamada Profesor Queso',
  'with.lost-tourist': 'un turista muy perdido',
  'with.giant-snail': 'un caracol gigante y alegre',
  'with.tuba-frog': 'una rana con tuba',
  'with.talking-mailbox': 'un buzón parlante',
  'with.opera-walrus': 'una morsa que canta ópera',

  // ── 2 · where — own preposition ────────────────────────────────────────────
  'where.cheese-factory': 'en una fábrica de queso',
  'where.underwater-canyon': 'en el fondo del océano',
  'where.cookbook-library': 'en una biblioteca que solo tiene libros de cocina',
  'where.giant-sock-drawer': 'dentro de un cajón gigante de calcetines',
  'where.gloomy-birthday': 'en una fiesta de cumpleaños muy triste',
  'where.cramped-elevator': 'en un ascensor extremadamente apretado',
  'where.cloud-castle': 'en un castillo hecho de nubes',
  'where.messy-kitchen': 'en una cocina espectacularmente desordenada',
  'where.snowy-mountain': 'en un paso de montaña nevado',
  'where.jungle-treehouse': 'en una casa del árbol en la selva',

  // ── 3 · when — own preposition/adverbial; reads before slot 2 ─────────────
  'when.small-earthquake': 'durante un pequeño terremoto',
  'when.solar-eclipse': 'en el momento exacto de un eclipse solar',
  'when.after-breakfast': 'justo después del desayuno pero antes del segundo desayuno',
  'when.someone-elses-wedding': 'durante la boda de otra persona',
  'when.wrong-feeling-tuesday': 'un martes que se sintió como miércoles',
  'when.clocks-stopped': 'el instante en que todos los relojes se detuvieron',
  'when.three-in-the-morning': 'a las tres de la madrugada sin ninguna buena razón',
  'when.hat-festival': 'durante el festival anual del sombrero',
  'when.internet-outage': 'mientras el internet estaba caído',
  'when.seagull-decision': 'el instante en que una gaviota tomó una decisión',
  'when.last-day-of-summer': 'el último día del verano',
  'when.thunderstorm': 'en medio de una tormenta eléctrica',
  'when.first-snow': 'en la mañana de la primera nevada',
  'when.school-holidays': 'a mitad de las vacaciones escolares',
  'when.full-moon': 'bajo una luna muy llena',
  'when.power-cut': 'durante un apagón en toda la ciudad',
  'when.just-before-dinner': 'cinco minutos antes de la cena',
  'when.longest-lesson': 'durante la clase más larga del año',
  'when.day-before-birthday': 'el día antes del cumpleaños de alguien',
  'when.rush-hour': 'en el punto más alto de la hora pico',
  'when.while-everyone-slept': 'mientras todos los demás dormían',
  'when.exactly-noon': 'exactamente al mediodía',

  // ── 4 · did — pretérito, 3rd singular, finite ────────────────────────────────
  'did.baking-giant-cake': 'horneó un pastel enorme y torcido',
  'did.juggling-pancakes': 'hizo malabares con una torre de panqueques',
  'did.painting-polka-dots': 'pintó lunares en cada pared',
  'did.sorting-clouds': 'reorganizó las nubes por tamaño',
  'did.dancing-tango': 'bailó un tango muy dramático',
  'did.stacking-chairs': 'construyó una torre tambaleante de sillas',
  'did.staring-contest': 'organizó un intenso concurso de miradas',
  'did.flying-kites': 'voló cometas enormes con hilos enredados',
  'did.eating-spaghetti': 'comió una montaña de espagueti',
  'did.digging-with-spoons': 'cavó un enorme hoyo con cucharitas',

  // ── 5 · why — own leading connective ────────────────────────────────────────
  'why.made-sense-then': 'por razones que en ese momento tenían sentido',
  'why.impress-a-pigeon': 'para impresionar a una paloma',
  'why.warranty-forbade-it': 'porque la garantía lo prohibía',
  'why.one-grape': 'a cambio de una sola uva',
  'why.never-back-down': 'porque nunca se rinden ante un reto',
  'why.pointless-point': 'para demostrar algo que nadie preguntó',
  'why.for-science': 'por la ciencia, probablemente',
  'why.pure-stubbornness': 'por pura terquedad',
  'why.horoscope-said-so': 'porque el horóscopo fue muy específico',
  'why.bet-with-themselves': 'para ganar una apuesta consigo mismo',
  'why.to-keep-warm': 'para mantenerse abrigado',
  'why.because-tuesday': 'porque era martes',
  'why.for-a-sticker': 'por una sola calcomanía brillante',
  'why.avoid-homework': 'para evitar hacer la tarea',
  'why.everyone-else-did': 'porque todos los demás lo hacían',
  'why.world-record': 'para romper un récord del que nadie había oído',
  'why.simply-hungry': 'porque tenían muchísima hambre',
  'why.impress-grandma': 'para impresionar a una abuela que no se impresionó',
  'why.forgot-the-plan': 'porque olvidaron el plan original',
  'why.instructions-said-so': 'porque las instrucciones lo insistían',
  'why.test-a-theory': 'para probar una teoría sobre la gravedad',
  'why.no-reason': 'sin ninguna razón en absoluto',

  // ── 6 · ending — noun phrase after "terminó con" ─────────────────────────────
  'end.feelings-about-pasta': 'sentimientos muy fuertes de todos sobre la pasta',
  'end.duck-complaint': 'una queja formal presentada por un pato',
  'end.nothing-made-sense': 'algo sin ningún sentido, que a todos les pareció perfecto',
  'end.lost-receipts': 'la pérdida de los recibos, probablemente para bien',
  'end.pigeon-certificates': 'varios certificados entregados a unas palomas',
  'end.fruit-basket': 'una canasta de frutas enviada por el alcalde',
  'end.instant-sequel': 'el anuncio inmediato de una secuela',
  'end.three-country-holiday': 'un feriado oficial en tres países',
  'end.cloud-looked-away': 'una nube que por fin dejó de mirar',
  'end.never-spoke-again': 'un acuerdo de no volver a hablar de eso',
  'end.ice-cream-for-all': 'helado para absolutamente todos',
  'end.someone-had-to-mop': 'alguien que tuvo que trapear todo el piso',
  'end.museum-exhibit': 'un lugar detrás de un vidrio en un pequeño museo',
  'end.a-song-about-it': 'una canción escrita sobre todo el asunto',
  'end.neighbors-applauded': 'un aplauso de los vecinos desde sus ventanas',
  'end.smelled-like-lemons': 'un aroma a limón por toda una semana',
  'end.new-holiday-invented': 'un nuevo feriado inventado en el momento',
  'end.cat-took-credit': 'todo el crédito para un gato que pasaba por ahí',
  'end.everyone-fell-asleep': 'una gran siesta colectiva',
  'end.indoor-rainbow': 'un arcoíris que apareció adentro y no quiso irse',
  'end.instructions-finally-clear': 'instrucciones que por fin tuvieron sentido',
  'end.home-for-soup': 'un regreso a casa para tomar sopa',
};
