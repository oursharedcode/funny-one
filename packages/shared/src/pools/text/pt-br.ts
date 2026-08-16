// SPDX-License-Identifier: AGPL-3.0-only

// Brazilian Portuguese pool display texts — machine-drafted for T-6.3 (FM-POOL-2/5).
// needs-pt-br-review — machine-translated stub awaiting native Portuguese (Brazil) review per CONTRIBUTING.md.
//
// Authored against the Portuguese prose template:
//   "{0} com {1} {3} {2} {4} {5}. No final, terminou com {6}."
//
// Per-slot authoring rules that fall out of that template:
//
//   0  bare subject noun phrase — the template supplies nothing before it
//   1  bare noun phrase, NOT "com ..." — the template hardcodes "com" already,
//      so this slot must not repeat it (e.g. "uma torradeira assombrada").
//   2  where — carries its own preposition, e.g. "em uma fábrica de queijo".
//      Rendered AFTER slot 3 (when reads first, then where), back-to-back
//      with no glue word between them.
//   3  when — carries its own preposition/adverbial, e.g. "durante um
//      pequeno terremoto". Rendered before slot 2, with no glue word after.
//   4  did — no auxiliary is supplied, so this must be a complete FINITE verb
//      form: pretérito perfeito, 3rd person singular, agreeing with slot 0
//      only (the "com {1}" phrase never pluralizes the verb). Pretérito
//      perfeito does not mark gender, so there is no gender-agreement risk.
//   5  why — no connective is hardcoded after slot 4, so this slot must
//      supply its own leading connective (para, porque, por causa de, ...).
//   6  ending — the template reads "...terminou com {6}.", so {6} is the
//      object of "com" and MUST be a noun phrase, never a full clause.
//
// Everything is lowercase; capitalization of the story's opening word is a
// presentation concern handled at render time, not part of the pool data.

import type { PoolTextMap } from '../schema.js';

export const ptBr: PoolTextMap = {
  // ── 0 · who ───────────────────────────────────────────────────────────────
  'who.grumpy-pirate': 'um pirata rabugento',
  'who.sleepy-llama': 'uma lhama muito sonolenta',
  'who.confused-penguin': 'um pinguim confuso',
  'who.overconfident-raccoon': 'um guaxinim convencido demais',
  'who.tiny-dragon': 'o menor dragão do mundo',
  'who.cats-in-a-trench-coat': 'três gatos vestindo um sobretudo',
  'who.retired-superhero': 'um super-herói aposentado',
  'who.skating-grandma': 'uma vovó de patins',
  'who.time-traveling-accountant': 'um contador viajante do tempo',
  'who.muddy-knight': 'um cavaleiro coberto de lama',

  // ── 1 · withWhom — bare noun, no "com" (template supplies it) ─────────────
  'with.haunted-toaster': 'uma torradeira assombrada',
  'with.angry-geese': 'três gansos furiosos',
  'with.philosophical-goldfish': 'um peixinho dourado filósofo',
  'with.riddle-robot': 'um robô que só fala em charadas',
  'with.professor-goat': 'uma cabra chamada Professor Queijo',
  'with.lost-tourist': 'um turista completamente perdido',
  'with.giant-snail': 'um caracol gigante e alegre',
  'with.tuba-frog': 'um sapo com uma tuba',
  'with.talking-mailbox': 'uma caixa de correio falante',
  'with.opera-walrus': 'uma morsa cantora de ópera',

  // ── 2 · where — own preposition ────────────────────────────────────────────
  'where.cheese-factory': 'dentro de uma fábrica de queijo',
  'where.underwater-canyon': 'no fundo do oceano',
  'where.cookbook-library': 'em uma biblioteca só de livros de receitas',
  'where.giant-sock-drawer': 'dentro de uma gaveta gigante de meias',
  'where.gloomy-birthday': 'em uma festa de aniversário muito triste',
  'where.cramped-elevator': 'em um elevador extremamente apertado',
  'where.cloud-castle': 'em um castelo feito de nuvens',
  'where.messy-kitchen': 'em uma cozinha espetacularmente bagunçada',
  'where.snowy-mountain': 'em uma trilha de montanha nevada',
  'where.jungle-treehouse': 'em uma casa na árvore na selva',

  // ── 3 · when — own preposition/adverbial ───────────────────────────────────
  'when.small-earthquake': 'durante um pequeno terremoto',
  'when.solar-eclipse': 'no exato momento de um eclipse solar',
  'when.after-breakfast': 'logo após o café da manhã, mas antes do segundo',
  'when.someone-elses-wedding': 'durante o casamento de outra pessoa',
  'when.wrong-feeling-tuesday': 'em uma terça que parecia uma quarta',
  'when.clocks-stopped': 'no instante em que todos os relógios pararam',
  'when.three-in-the-morning': 'às três da manhã sem nenhum bom motivo',
  'when.hat-festival': 'durante o festival anual do chapéu',
  'when.internet-outage': 'enquanto a internet estava fora do ar',
  'when.seagull-decision': 'no instante em que uma gaivota se decidiu',
  'when.last-day-of-summer': 'no último dia do verão',
  'when.thunderstorm': 'no meio de uma tempestade de raios',
  'when.first-snow': 'na manhã da primeira neve',
  'when.school-holidays': 'no meio das férias escolares',
  'when.full-moon': 'sob uma lua muito cheia',
  'when.power-cut': 'durante um apagão na cidade inteira',
  'when.just-before-dinner': 'cinco minutos antes do jantar',
  'when.longest-lesson': 'durante a aula mais longa do ano',
  'when.day-before-birthday': 'no dia anterior ao aniversário de alguém',
  'when.rush-hour': 'no auge do horário de pico',
  'when.while-everyone-slept': 'enquanto todo mundo dormia',
  'when.exactly-noon': 'exatamente ao meio-dia',

  // ── 4 · did — pretérito perfeito, 3rd singular, finite ───────────────────────
  'did.baking-giant-cake': 'assou um bolo enorme e torto',
  'did.juggling-pancakes': 'fez malabarismo com uma pilha de panquecas',
  'did.painting-polka-dots': 'pintou bolinhas em todas as paredes',
  'did.sorting-clouds': 'reorganizou as nuvens por tamanho',
  'did.dancing-tango': 'dançou um tango muito dramático',
  'did.stacking-chairs': 'construiu uma torre bamba de cadeiras',
  'did.staring-contest': 'promoveu um intenso concurso de encarar',
  'did.flying-kites': 'soltou pipas enormes com linhas enroladas',
  'did.eating-spaghetti': 'comeu uma montanha de espaguete',
  'did.digging-with-spoons': 'cavou um buraco enorme com colherzinhas',

  // ── 5 · why — own leading connective ────────────────────────────────────────
  'why.made-sense-then': 'por razões que faziam sentido na época',
  'why.impress-a-pigeon': 'para impressionar um pombo',
  'why.warranty-forbade-it': 'porque a garantia dizia que não podia',
  'why.one-grape': 'em troca de uma única uva',
  'why.never-back-down': 'porque nunca recuam de uma aposta',
  'why.pointless-point': 'para provar algo que ninguém perguntou',
  'why.for-science': 'em nome da ciência, provavelmente',
  'why.pure-stubbornness': 'por pura teimosia',
  'why.horoscope-said-so': 'porque o horóscopo foi bem específico',
  'why.bet-with-themselves': 'para resolver uma aposta consigo mesmo',
  'why.to-keep-warm': 'para se aquecer',
  'why.because-tuesday': 'porque era terça-feira',
  'why.for-a-sticker': 'por um único adesivo brilhante',
  'why.avoid-homework': 'para evitar fazer a lição de casa',
  'why.everyone-else-did': 'porque todo mundo estava fazendo isso',
  'why.world-record': 'para bater um recorde mundial desconhecido',
  'why.simply-hungry': 'porque estava com muita fome',
  'why.impress-grandma': 'para impressionar uma vó que não se impressionou',
  'why.forgot-the-plan': 'porque esqueceu o plano original',
  'why.instructions-said-so': 'porque as instruções insistiam nisso',
  'why.test-a-theory': 'para testar uma teoria sobre a gravidade',
  'why.no-reason': 'sem nenhum motivo especial',

  // ── 6 · ending — noun phrase after "terminou com" ────────────────────────────
  'end.feelings-about-pasta': 'sentimentos fortes de todos sobre macarrão',
  'end.duck-complaint': 'uma reclamação formal de um pato',
  'end.nothing-made-sense': 'nada fazendo sentido e todos achando ótimo',
  'end.lost-receipts': 'os recibos perdidos, o que foi um alívio',
  'end.pigeon-certificates': 'certificados entregues a vários pombos',
  'end.fruit-basket': 'uma cesta de frutas enviada pelo prefeito',
  'end.instant-sequel': 'uma continuação anunciada na hora',
  'end.three-country-holiday': 'um feriado novo em três países',
  'end.cloud-looked-away': 'a nuvem que vigiava finalmente olhando pra outro lado',
  'end.never-spoke-again': 'um acordo silencioso de nunca mais falar disso',
  'end.ice-cream-for-all': 'sorvete de sobra para todo mundo',
  'end.someone-had-to-mop': 'um chão inteiro que alguém teve que esfregar',
  'end.museum-exhibit': 'um lugar atrás de um vidro em um museu pequeno',
  'end.a-song-about-it': 'uma música composta sobre tudo aquilo',
  'end.neighbors-applauded': 'aplausos dos vizinhos nas janelas',
  'end.smelled-like-lemons': 'um cheiro de limão por toda parte durante uma semana',
  'end.new-holiday-invented': 'um feriado novinho inventado na hora',
  'end.cat-took-credit': 'todo o crédito levado por um gato de passagem',
  'end.everyone-fell-asleep': 'todo mundo caindo no sono em um monte só',
  'end.indoor-rainbow': 'um arco-íris dentro de casa que não foi embora',
  'end.instructions-finally-clear': 'instruções que finalmente fizeram sentido',
  'end.home-for-soup': 'todo mundo indo pra casa comer sopa',
};
