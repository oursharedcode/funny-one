// SPDX-License-Identifier: AGPL-3.0-only

// Swahili pool display texts, Step 81. Authored against the Swahili prose
// template in ../../i18n/sw.ts:
//   "{0} na {1} walikuwa {2} {3}. Kisha {4} {5}. Mwishowe, {6}."
// e.g. «Pengwini aliyechanganyikiwa na bata bukini watatu wenye hasira walikuwa
// ndani ya kiwanda cha jibini siku ya mwisho ya kiangazi. Kisha walikula mlima
// wa tambi ili kujipasha joto. Mwishowe, meya alituma kikapu cha matunda.»
//
// needs-sw-review — machine-translated stub awaiting native Swahili review per CONTRIBUTING.md.
//
// Per-slot grammar that falls out of that template (only spaces between slots):
//
//   0  bare noun phrase, the subject, always an animate being. Its modifiers
//      take class 1/2 agreement whatever the noun's class («paka watatu»,
//      «dragoni mdogo», «lama mwenye …»). Nothing before it.
//   1  bare noun phrase after «na» ("and"), NOT «pamoja na …». The pair is the
//      subject of «walikuwa» (wa-). Animals and the robot take class 1/2
//      («roboti anayezungumza»); the two objects keep their own class inside
//      the text («kibaniko … chenye», «sanduku … linalozungumza») and, as
//      personified characters beside an animate partner, still pair with wa-.
//   2  carries its own locative: «ndani ya», «katika», «kwenye», «chini ya»,
//      or a -ni noun with a locative relative («jikoni kulikojaa …»).
//   3  a time phrase read after the place: «wakati wa …», «siku …», «saa …»,
//      «katikati ya …», or a -po- clause («wakati umeme ulipokatika …»).
//   4  wali- + verb + object: simple past, 3rd person plural, the same subject
//      prefix for all ten, since the actors are always two at least.
//   5  opens with its own connective, the template adds none: «ili» + ku-
//      infinitive or subjunctive, «kwa sababu …», «kwa ajili ya …», «kwa …»,
//      «bila …». Any verb inside whose subject is the actors takes wa-/hawa-.
//   6  a full clause with its own subject, read after «Mwishowe,».
//
// Orthography: standard Swahili spelling; ng' with an ASCII apostrophe
// («kinachong'aa»); weekdays capitalised (Jumanne, Jumatano); clock time in
// Swahili hours, counted from 6 o'clock («saa tisa usiku» = 3 a.m., «saa sita
// kamili mchana» = exactly noon). Loanwords in their settled Swahili spelling
// (pengwini, roboti, lifti, droo, aiskrimu, intaneti); rakuni, dragoni and
// walrasi are rarer and want a reviewer's eye.
//
// Light cultural swaps where the joke survives: pancakes are «chapati»;
// breakfast and second breakfast are «chai» and «chai ya pili», as East
// Africans say; summer is the dry season «kiangazi»; the robot speaks in
// «vitendawili», the riddles of a Swahili evening; the tuba is a «tarumbeta
// kubwa»; the knight an «askari wa deraya» (soldier in mail); soup is drunk.

import type { PoolTextMap } from '../schema.js';

export const sw: PoolTextMap = {
  // ── 0 · who — an animate subject; class 1/2 agreement ─────────────────────
  'who.grumpy-pirate': 'haramia wa baharini aliyenuna',
  'who.sleepy-llama': 'lama mwenye usingizi mwingi',
  'who.confused-penguin': 'pengwini aliyechanganyikiwa',
  'who.overconfident-raccoon': 'rakuni anayejiamini kupita kiasi',
  'who.tiny-dragon': 'dragoni mdogo kuliko wote duniani',
  'who.cats-in-a-trench-coat': 'paka watatu ndani ya koti moja refu',
  'who.retired-superhero': 'shujaa mstaafu mwenye nguvu za ajabu',
  'who.skating-grandma': 'bibi kizee aliyevaa viatu vya magurudumu',
  'who.time-traveling-accountant': 'mhasibu anayesafiri kupitia wakati',
  'who.muddy-knight': 'askari wa deraya aliyejaa matope mwili mzima',

  // ── 1 · withWhom — bare noun phrase; the template supplies «na» ───────────
  'with.haunted-toaster': 'kibaniko cha mkate chenye mzimu',
  'with.angry-geese': 'bata bukini watatu wenye hasira',
  'with.philosophical-goldfish': 'samaki wa dhahabu mwanafalsafa',
  'with.riddle-robot': 'roboti anayezungumza kwa vitendawili tu',
  'with.professor-goat': 'mbuzi anayeitwa Profesa Jibini',
  'with.lost-tourist': 'mtalii aliyepotea kabisa',
  'with.giant-snail': 'konokono mkubwa mno mchangamfu',
  'with.tuba-frog': 'chura mwenye tarumbeta kubwa',
  'with.talking-mailbox': 'sanduku la barua linalozungumza',
  'with.opera-walrus': 'walrasi anayeimba opera',

  // ── 2 · where — carries its own locative ─────────────────────────────────
  'where.cheese-factory': 'ndani ya kiwanda cha jibini',
  'where.underwater-canyon': 'chini kabisa ya bahari',
  'where.cookbook-library': 'katika maktaba yenye vitabu vya mapishi tu',
  'where.giant-sock-drawer': 'ndani ya droo kubwa ajabu ya soksi',
  'where.gloomy-birthday': 'kwenye sherehe ya kuzaliwa iliyojaa huzuni',
  'where.cramped-elevator': 'ndani ya lifti finyu kupindukia',
  'where.cloud-castle': 'katika ngome iliyojengwa kwa mawingu',
  'where.messy-kitchen': 'jikoni kulikojaa fujo za ajabu',
  'where.snowy-mountain': 'kwenye njia ya mlimani iliyojaa theluji',
  'where.jungle-treehouse': 'katika kibanda juu ya mti msituni',

  // ── 3 · when — a time phrase read after the place ────────────────────────
  'when.small-earthquake': 'wakati wa tetemeko dogo la ardhi',
  'when.solar-eclipse': 'dakika ile ile jua lilipopatwa',
  'when.after-breakfast': 'mara tu baada ya chai, lakini kabla ya chai ya pili',
  'when.someone-elses-wedding': 'wakati wa harusi ya mtu mwingine',
  'when.wrong-feeling-tuesday': 'siku ya Jumanne iliyoonekana kama Jumatano',
  'when.clocks-stopped': 'pale saa zote za ukutani ziliposimama',
  'when.three-in-the-morning': 'saa tisa usiku bila sababu ya maana',
  'when.hat-festival': 'wakati wa tamasha la kofia la kila mwaka',
  'when.internet-outage': 'wakati intaneti ilipokuwa imekatika',
  'when.seagull-decision': 'sekunde ile ile shakwe alipofanya uamuzi',
  'when.last-day-of-summer': 'siku ya mwisho ya kiangazi',
  'when.thunderstorm': 'katikati ya mvua kubwa ya radi',
  'when.first-snow': 'asubuhi ya theluji ya kwanza',
  'when.school-holidays': 'katikati ya likizo ya shule',
  'when.full-moon': 'chini ya mwezi mpevu kabisa',
  'when.power-cut': 'wakati umeme ulipokatika mji mzima',
  'when.just-before-dinner': 'dakika tano kabla ya chakula cha jioni',
  'when.longest-lesson': 'wakati wa somo refu zaidi la mwaka',
  'when.day-before-birthday': 'siku moja kabla ya siku ya kuzaliwa ya mtu fulani',
  'when.rush-hour': 'wakati wa kilele cha msongamano wa magari',
  'when.while-everyone-slept': 'wakati wengine wote walipokuwa wamelala',
  'when.exactly-noon': 'saa sita kamili mchana',

  // ── 4 · did — wali- + verb: simple past, "they" ──────────────────────────
  'did.baking-giant-cake': 'walioka keki kubwa sana iliyoinama upande mmoja',
  'did.juggling-pancakes': 'walirusharusha hewani rundo refu la chapati',
  'did.painting-polka-dots': 'walipaka madoadoa kwenye kuta zote',
  'did.sorting-clouds': 'walipanga upya mawingu kulingana na ukubwa',
  'did.dancing-tango': 'walicheza dansi ya tango kwa mbwembwe nyingi',
  'did.stacking-chairs': 'walijenga mnara wa viti uliokuwa ukiyumbayumba',
  'did.staring-contest': 'walifanya shindano kali la kukodoleana macho',
  'did.flying-kites': 'walirusha tiara kubwa sana zenye nyuzi zilizosokotana',
  'did.eating-spaghetti': 'walikula mlima wa tambi',
  'did.digging-with-spoons': 'walichimba shimo kubwa sana kwa vijiko vya chai',

  // ── 5 · why — opens with its own connective ──────────────────────────────
  'why.made-sense-then': 'kwa sababu zilizoleta maana wakati ule',
  'why.impress-a-pigeon': 'ili kumvutia njiwa',
  'why.warranty-forbade-it': 'kwa sababu kadi ya dhamana ilisema wasifanye hivyo',
  'why.one-grape': 'kwa malipo ya zabibu moja tu',
  'why.never-back-down': 'kwa sababu hawarudi nyuma kamwe wakichokozwa',
  'why.pointless-point': 'ili kuthibitisha jambo ambalo hakuna aliyeuliza',
  'why.for-science': 'kwa ajili ya sayansi, pengine',
  'why.pure-stubbornness': 'kwa ukaidi mtupu',
  'why.horoscope-said-so': 'kwa sababu utabiri wa nyota ulisema hivyo waziwazi',
  'why.bet-with-themselves': 'ili kumaliza ubishi waliojiwekea wenyewe',
  'why.to-keep-warm': 'ili kujipasha joto',
  'why.because-tuesday': 'kwa sababu ilikuwa Jumanne',
  'why.for-a-sticker': "kwa ajili ya kibandiko kimoja kinachong'aa",
  'why.avoid-homework': 'ili kukwepa kufanya kazi ya nyumbani',
  'why.everyone-else-did': 'kwa sababu wengine wote walikuwa wakifanya hivyo',
  'why.world-record': 'ili kuvunja rekodi ya dunia ambayo hakuna aliyewahi kuisikia',
  'why.simply-hungry': 'kwa sababu walikuwa na njaa kali mno',
  'why.impress-grandma': 'ili kumvutia bibi ambaye hakuvutiwa hata kidogo',
  'why.forgot-the-plan': 'kwa sababu walisahau mpango wa awali',
  'why.instructions-said-so': 'kwa sababu maelekezo yalisisitiza hivyo',
  'why.test-a-theory': 'ili kujaribu nadharia ya mvuto wa dunia',
  'why.no-reason': 'bila sababu yoyote ile',

  // ── 6 · ending — a full clause read after «Mwishowe,» ────────────────────
  'end.feelings-about-pasta': 'kila mtu alikuwa na hisia kali kuhusu tambi',
  'end.duck-complaint': 'bata mmoja aliwasilisha malalamiko rasmi',
  'end.nothing-made-sense': 'hakuna kilichoeleweka, na kila mtu aliridhika na hilo',
  'end.lost-receipts': 'risiti zilipotea, na pengine ilikuwa heri',
  'end.pigeon-certificates': 'njiwa kadhaa walipewa vyeti',
  'end.fruit-basket': 'meya alituma kikapu cha matunda',
  'end.instant-sequel': 'mwendelezo wake ulitangazwa mara moja',
  'end.three-country-holiday': 'siku hiyo ilitangazwa sikukuu katika nchi tatu',
  'end.cloud-looked-away': 'wingu lililokuwa likiwatazama muda wote lilitazama pembeni',
  'end.never-spoke-again': 'wote walikubaliana kutolitaja jambo hilo tena',
  'end.ice-cream-for-all': 'kulikuwa na aiskrimu kwa kila mtu, bila kumsahau yeyote',
  'end.someone-had-to-mop': 'mtu mmoja alilazimika kupiga deki sakafu nzima',
  'end.museum-exhibit': 'yote hayo yaliishia nyuma ya kioo katika makumbusho madogo',
  'end.a-song-about-it': 'wimbo ulitungwa kuhusu kisa kizima',
  'end.neighbors-applauded': 'majirani walipiga makofi wakiwa madirishani mwao',
  'end.smelled-like-lemons': 'kila kitu kilinukia limau kwa mbali kwa wiki nzima',
  'end.new-holiday-invented': 'sikukuu mpya kabisa ilibuniwa papo hapo',
  'end.cat-took-credit': 'paka aliyekuwa akipita alijichukulia sifa zote',
  'end.everyone-fell-asleep': 'wote walilala fofofo wakiwa wamerundikana',
  'end.indoor-rainbow': 'upinde wa mvua ulitokea ndani ya nyumba na ukakataa kuondoka',
  'end.instructions-finally-clear': 'maelekezo yalieleweka kikamilifu kwa mara ya kwanza',
  'end.home-for-soup': 'kila mtu alirudi nyumbani kunywa supu',
};
