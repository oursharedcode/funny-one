// SPDX-License-Identifier: AGPL-3.0-only

// French pool display texts — machine-drafted for T-6.3 (FM-POOL-2/5).
// needs-fr-review — machine-translated stub awaiting native French review per CONTRIBUTING.md.
//
// Authored against the French prose template:
//   "{0} avec {1} {3} {2} a {4} {5}. Finalement, ça s'est terminé par {6}."
//
// Per-slot authoring rules that fall out of that template:
//
//   0  bare subject noun phrase — the template supplies nothing before it
//   1  bare noun phrase, NO "avec" — the template already hardcodes "avec"
//      immediately before this slot (e.g. "un grille-pain hanté", not
//      "avec un grille-pain hanté")
//   2  where — carries its own preposition ("dans une usine de fromage");
//      renders AFTER slot 3 in the sentence, with no glue word between them
//   3  when — carries its own preposition/adverbial ("pendant un petit
//      tremblement de terre"); renders BEFORE slot 2, back-to-back with it
//   4  bare PAST PARTICIPLE phrase only — the template hardcodes the
//      auxiliary as "a" (3rd person SINGULAR avoir) immediately before this
//      slot, so slot 4 must not repeat an auxiliary and the participle stays
//      invariant (no gender agreement needed with "avoir"). Same limitation
//      as es-es.ts/it.ts's slot 4 (always singular agreement): the one
//      plural subject, 'who.cats-in-a-trench-coat' ("trois chats..."), reads
//      with a singular verb ("a cuit" rather than "ont cuit") until B-3's
//      native review.
//   5  why — must supply its own leading connective (pour, parce que, à
//      cause de, afin de, ...) since nothing links it to slot 4
//   6  ending — a bare NOUN PHRASE, not a clause: it is the object of
//      "...terminé par {6}."
//
// Everything is lowercase; capitalization is presentation, not content.

import type { PoolTextMap } from '../schema.js';

export const fr: PoolTextMap = {
  // ── 0 · who ───────────────────────────────────────────────────────────────
  'who.grumpy-pirate': 'un pirate grincheux',
  'who.sleepy-llama': 'un lama très somnolent',
  'who.confused-penguin': 'un pingouin perplexe',
  'who.overconfident-raccoon': 'un raton laveur trop sûr de lui',
  'who.tiny-dragon': 'le plus petit dragon du monde',
  'who.cats-in-a-trench-coat': 'trois chats dans un imperméable',
  'who.retired-superhero': 'un super-héros à la retraite',
  'who.skating-grandma': 'une grand-mère en patins à roulettes',
  'who.time-traveling-accountant': 'un comptable voyageur du temps',
  'who.muddy-knight': 'un chevalier très boueux',

  // ── 1 · withWhom — bare noun, no "avec" (template supplies it) ────────────
  'with.haunted-toaster': 'un grille-pain hanté',
  'with.angry-geese': 'trois oies furieuses',
  'with.philosophical-goldfish': 'un poisson rouge philosophe',
  'with.riddle-robot': "un robot qui ne parle qu'en énigmes",
  'with.professor-goat': 'une chèvre nommée Professeur Fromage',
  'with.lost-tourist': 'un touriste complètement perdu',
  'with.giant-snail': 'un énorme escargot jovial',
  'with.tuba-frog': 'une grenouille avec un tuba',
  'with.talking-mailbox': 'une boîte aux lettres parlante',
  'with.opera-walrus': "un morse chanteur d'opéra",

  // ── 2 · where — own preposition ────────────────────────────────────────────
  'where.cheese-factory': 'dans une usine de fromage',
  'where.underwater-canyon': "au fond de l'océan",
  'where.cookbook-library': 'dans une bibliothèque qui ne contient que des livres de cuisine',
  'where.giant-sock-drawer': 'dans un tiroir à chaussettes géant',
  'where.gloomy-birthday': 'à un anniversaire particulièrement lugubre',
  'where.cramped-elevator': 'dans un ascenseur extrêmement exigu',
  'where.cloud-castle': 'dans un château fait de nuages',
  'where.messy-kitchen': 'dans une cuisine spectaculairement en désordre',
  'where.snowy-mountain': 'sur un col de montagne enneigé',
  'where.jungle-treehouse': 'dans une cabane perchée dans la jungle',

  // ── 3 · when — own preposition/adverbial ───────────────────────────────────
  'when.small-earthquake': 'pendant un petit tremblement de terre',
  'when.solar-eclipse': "au moment exact d'une éclipse solaire",
  'when.after-breakfast': 'juste après le petit-déjeuner mais avant le second',
  'when.someone-elses-wedding': "pendant le mariage de quelqu'un d'autre",
  'when.wrong-feeling-tuesday': 'un mardi qui ressemblait à un mercredi',
  'when.clocks-stopped': "à l'instant où toutes les horloges se sont arrêtées",
  'when.three-in-the-morning': 'à trois heures du matin sans aucune raison',
  'when.hat-festival': 'pendant le festival annuel du chapeau',
  'when.internet-outage': "pendant une panne d'internet",
  'when.seagull-decision': "à l'instant où un goéland a pris une décision",
  'when.last-day-of-summer': "le dernier jour de l'été",
  'when.thunderstorm': "en plein milieu d'un orage",
  'when.first-snow': 'le matin de la première neige',
  'when.school-holidays': 'au milieu des vacances scolaires',
  'when.full-moon': 'sous une pleine lune particulièrement pleine',
  'when.power-cut': 'pendant une coupure de courant générale',
  'when.just-before-dinner': 'cinq minutes avant le dîner',
  'when.longest-lesson': "pendant le cours le plus long de l'année",
  'when.day-before-birthday': "la veille de l'anniversaire de quelqu'un",
  'when.rush-hour': "au plus fort de l'heure de pointe",
  'when.while-everyone-slept': 'pendant que tout le monde dormait',
  'when.exactly-noon': 'à midi pile',

  // ── 4 · did — bare past participle, no auxiliary, invariant ────────────────
  'did.baking-giant-cake': 'cuit un gâteau énorme et tout de travers',
  'did.juggling-pancakes': 'jonglé avec une haute pile de crêpes',
  'did.painting-polka-dots': 'peint des pois sur chaque mur',
  'did.sorting-clouds': 'réorganisé les nuages par taille',
  'did.dancing-tango': 'dansé un tango très dramatique',
  'did.stacking-chairs': 'construit une tour de chaises bancale',
  'did.staring-contest': 'organisé un concours de regard intense',
  'did.flying-kites': "fait voler d'immenses cerfs-volants aux fils emmêlés",
  'did.eating-spaghetti': 'mangé une montagne de spaghettis',
  'did.digging-with-spoons': 'creusé un énorme trou avec de petites cuillères',

  // ── 5 · why — own leading connective ────────────────────────────────────────
  'why.made-sense-then': "pour des raisons qui semblaient logiques à l'époque",
  'why.impress-a-pigeon': 'pour impressionner un pigeon',
  'why.warranty-forbade-it': "parce que la garantie l'interdisait",
  'why.one-grape': "en échange d'un seul grain de raisin",
  'why.never-back-down': "parce qu'ils ne reculent jamais devant un défi",
  'why.pointless-point': "pour prouver un point que personne n'avait demandé",
  'why.for-science': 'pour la science, probablement',
  'why.pure-stubbornness': 'par pure entêtement',
  'why.horoscope-said-so': "parce que l'horoscope était très précis",
  'why.bet-with-themselves': 'pour régler un pari avec eux-mêmes',
  'why.to-keep-warm': 'pour se réchauffer',
  'why.because-tuesday': "parce que c'était un mardi",
  'why.for-a-sticker': 'pour un seul autocollant brillant',
  'why.avoid-homework': 'pour éviter de faire ses devoirs',
  'why.everyone-else-did': 'parce que tout le monde le faisait',
  'why.world-record': "pour battre un record du monde dont personne n'avait entendu parler",
  'why.simply-hungry': "parce qu'ils avaient extrêmement faim",
  'why.impress-grandma': 'pour impressionner une grand-mère restée impassible',
  'why.forgot-the-plan': "parce qu'ils avaient oublié le plan initial",
  'why.instructions-said-so': "parce que les instructions l'exigeaient",
  'why.test-a-theory': 'pour tester une théorie sur la gravité',
  'why.no-reason': 'sans aucune raison',

  // ── 6 · ending — noun phrase after "terminé par" ────────────────────────────
  'end.feelings-about-pasta': 'des sentiments très forts envers les pâtes chez tout le monde',
  'end.duck-complaint': 'une plainte officielle déposée par un canard',
  'end.nothing-made-sense': "un non-sens général que personne n'a semblé regretter",
  'end.lost-receipts': 'la perte des reçus, sans doute pour le mieux',
  'end.pigeon-certificates': 'des certificats remis à plusieurs pigeons',
  'end.fruit-basket': 'un panier de fruits envoyé par le maire',
  'end.instant-sequel': "l'annonce immédiate d'une suite",
  'end.three-country-holiday': 'un jour férié dans trois pays',
  'end.cloud-looked-away': 'le nuage qui observait tout, détournant enfin le regard',
  'end.never-spoke-again': 'un accord unanime pour ne plus jamais en reparler',
  'end.ice-cream-for-all': 'de la glace pour absolument tout le monde',
  'end.someone-had-to-mop': "un grand nettoyage du sol par quelqu'un",
  'end.museum-exhibit': 'une place sous vitrine dans un petit musée',
  'end.a-song-about-it': "une chanson écrite sur toute l'histoire",
  'end.neighbors-applauded': 'des applaudissements venus des fenêtres des voisins',
  'end.smelled-like-lemons': 'une odeur de citron persistante pendant une semaine',
  'end.new-holiday-invented': 'une toute nouvelle fête inventée sur-le-champ',
  'end.cat-took-credit': 'tout le mérite attribué à un chat de passage',
  'end.everyone-fell-asleep': 'tout le monde endormi en un seul tas',
  'end.indoor-rainbow': "un arc-en-ciel apparu à l'intérieur et refusant de partir",
  'end.instructions-finally-clear': 'des instructions enfin parfaitement claires',
  'end.home-for-soup': 'un retour à la maison pour manger de la soupe',
};
