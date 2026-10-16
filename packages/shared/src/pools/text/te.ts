// SPDX-License-Identifier: AGPL-3.0-only

// Telugu pool display texts — machine-drafted in Step 73 (FM-POOL-2/5), on the
// model of the Tamil texts.
// needs-te-review — machine-translated stub awaiting native Telugu review per CONTRIBUTING.md.
//
// Authored against the Telugu prose template (SOV word order):
//   "{3} {2} {0} {1} {5} {4}. చివరికి {6}."
//
//   slot 3 when     — a closed time adverbial, first in the sentence: a
//                     noun with its own case or postposition, or a clause
//                     closed by -అప్పుడు / -ఉండగా / క్షణంలో
//                     «ఒక చిన్న భూకంపం వచ్చినప్పుడు» (when a small earthquake came)
//   slot 2 where    — locative «-లో» or «లోపల» attached, right after slot 3
//                     with no glue word between them  «ఒక చీజ్ ఫ్యాక్టరీలో»
//   slot 0 who      — bare subject noun phrase  «ఒక ముక్కోపి సముద్రపు దొంగ»
//   slot 1 withWhom — comitative «-తో కలిసి» (together with) attached; the
//                     template has no connector between slot 0 and slot 1.
//                     «కలిసి» is kept on every text: a bare «-తో» after a
//                     subject also reads as an instrument ("using a toaster")
//                     «దెయ్యం పట్టిన ఒక టోస్టర్‌తో కలిసి» (together with a haunted toaster)
//   slot 5 why      — a purpose or reason adverbial with its own ending:
//                     infinitive of purpose «-డానికి», «కోసం» (for), «వల్ల»
//                     (owing to), or a finite clause closed by «కాబట్టి»
//                     (because)  «ఒక పావురాన్ని మెప్పించడానికి» (to please a pigeon)
//   slot 4 did      — the sentence's final finite verb, always simple past
//                     in «-ఆరు» (చేశారు, కట్టారు, తవ్వారు …)
//                     «బుల్లి చెంచాలతో ఒక పెద్ద గొయ్యి తవ్వారు»
//   slot 6 ending   — a full clause following «చివరికి» (in the end), its verb
//                     agreeing with its own subject
//                     «ఒక బాతు అధికారికంగా ఫిర్యాదు చేసింది»
//
// Why «-ఆరు» on every slot-4 verb. Slot 0 mixes people of both genders (a
// pirate, a grandma, a knight), single animals and a plural (three cats), and
// slot 1 always adds a companion, so the actor is a pair or a group. Telugu
// past verbs agree in gender and number: «-ఆడు» is masculine singular,
// «-ఇంది» covers feminine singular and every non-human singular, «-ఆయి» is the
// non-human plural, «-ఆరు» the human plural. «-ఆరు» is the one form that
// never misfires: it reads as "they" for the pair, it doubles as the polite
// singular for any one person whatever their gender, and for animals and
// objects it personifies them, which suits a story where a goldfish talks
// philosophy. «-ఆయి» would demote the grandma or the pirate to things;
// «-ఆడు»/«-ఇంది» would pick a gender for half the cast. The two slot-5 texts
// with a finite verb about the actors (why.never-back-down,
// why.forgot-the-plan) use the same human plural.
//
// Slots 0–5 never end in an unclosed subordinate clause, since the template
// joins them with nothing but spaces; each text is a closed phrase carrying
// its own case suffix or postposition where Telugu grammar requires one.
// English loanwords that end in a consonant take their suffix after a ZWNJ
// (టోస్టర్‌తో, లిఫ్ట్‌లో), the usual modern spelling.

import type { PoolTextMap } from '../schema.js';

export const te: PoolTextMap = {
  // ── 0 · who ───────────────────────────────────────────────────────────────
  'who.grumpy-pirate': 'ఒక ముక్కోపి సముద్రపు దొంగ',
  'who.sleepy-llama': 'నిద్రమత్తులో జోగుతున్న ఒక లామా',
  'who.confused-penguin': 'అయోమయంలో పడిన ఒక పెంగ్విన్',
  'who.overconfident-raccoon': 'మితిమీరిన ధీమాతో ఉన్న ఒక రాకూన్',
  'who.tiny-dragon': 'ప్రపంచంలోనే అతి చిన్న డ్రాగన్',
  'who.cats-in-a-trench-coat': 'పొడవాటి కోటులో దాక్కున్న మూడు పిల్లులు',
  'who.retired-superhero': 'రిటైర్ అయిన ఒక సూపర్‌హీరో',
  'who.skating-grandma': 'రోలర్ స్కేట్లు వేసుకున్న ఒక బామ్మ',
  'who.time-traveling-accountant': 'కాలంలో ప్రయాణించే ఒక అకౌంటెంట్',
  'who.muddy-knight': 'ఒళ్ళంతా బురద అంటిన ఒక యోధుడు',

  // ── 1 · withWhom — comitative «-తో కలిసి» attached ──────────────────────────
  'with.haunted-toaster': 'దెయ్యం పట్టిన ఒక టోస్టర్‌తో కలిసి',
  'with.angry-geese': 'కోపంతో బుసలు కొడుతున్న మూడు బాతులతో కలిసి',
  'with.philosophical-goldfish': 'వేదాంతం మాట్లాడే ఒక బంగారు చేపతో కలిసి',
  'with.riddle-robot': 'పొడుపు కథల్లో మాత్రమే మాట్లాడే ఒక రోబోతో కలిసి',
  'with.professor-goat': '“ప్రొఫెసర్ చీజ్” అనే ఒక మేకతో కలిసి',
  'with.lost-tourist': 'దారి పూర్తిగా తప్పిపోయిన ఒక టూరిస్టుతో కలిసి',
  'with.giant-snail': 'ఉల్లాసంగా ఉన్న ఒక భారీ నత్తతో కలిసి',
  'with.tuba-frog': 'టూబా వాయించే ఒక కప్పతో కలిసి',
  'with.talking-mailbox': 'మాట్లాడే ఒక పోస్ట్‌బాక్స్‌తో కలిసి',
  'with.opera-walrus': 'ఒపెరా పాటలు పాడే ఒక వాల్‌రస్‌తో కలిసి',

  // ── 2 · where — locative «-లో» / «లోపల» attached ──────────────────────────
  'where.cheese-factory': 'ఒక చీజ్ ఫ్యాక్టరీలో',
  'where.underwater-canyon': 'సముద్రం అట్టడుగున',
  'where.cookbook-library': 'వంటల పుస్తకాలు మాత్రమే ఉండే ఒక లైబ్రరీలో',
  'where.giant-sock-drawer': 'సాక్సులు దాచే ఒక భారీ సొరుగు లోపల',
  'where.gloomy-birthday': 'బాగా దిగులుగా సాగిన ఒక పుట్టినరోజు పార్టీలో',
  'where.cramped-elevator': 'ఊపిరి ఆడనంత ఇరుకైన ఒక లిఫ్ట్‌లో',
  'where.cloud-castle': 'మేఘాలతో కట్టిన ఒక కోటలో',
  'where.messy-kitchen': 'అంతా చిందరవందరగా ఉన్న ఒక వంటగదిలో',
  'where.snowy-mountain': 'మంచు కప్పిన ఒక కొండ దారిలో',
  'where.jungle-treehouse': 'అడవిలో ఒక చెట్టు మీది ఇంట్లో',

  // ── 3 · when — closed time adverbial ───────────────────────────────────────
  'when.small-earthquake': 'ఒక చిన్న భూకంపం వచ్చినప్పుడు',
  'when.solar-eclipse': 'సరిగ్గా సూర్యగ్రహణం పట్టిన క్షణంలో',
  'when.after-breakfast': 'టిఫిన్ అయిన వెంటనే, రెండో టిఫిన్‌కి ముందు',
  'when.someone-elses-wedding': 'వేరే ఎవరిదో పెళ్ళి జరుగుతుండగా',
  'when.wrong-feeling-tuesday': 'బుధవారంలా అనిపించిన ఒక మంగళవారం నాడు',
  'when.clocks-stopped': 'గడియారాలన్నీ ఆగిపోయిన క్షణంలో',
  'when.three-in-the-morning': 'ఎందుకో తెలీదు గానీ తెల్లవారుజామున మూడింటికి',
  'when.hat-festival': 'ఏటా జరిగే టోపీల పండుగ సమయంలో',
  'when.internet-outage': 'ఇంటర్నెట్ పోయిన సమయంలో',
  'when.seagull-decision': 'ఒక సీగల్ పక్షి ఏదో నిర్ణయం తీసుకున్న క్షణంలో',
  'when.last-day-of-summer': 'వేసవి చివరి రోజున',
  'when.thunderstorm': 'ఉరుములు మెరుపుల వాన మధ్యలో',
  'when.first-snow': 'తొలి మంచు కురిసిన రోజు ఉదయాన',
  'when.school-holidays': 'బడి సెలవులు సగం అయ్యేసరికి',
  'when.full-moon': 'నిండు పున్నమి వెన్నెల్లో',
  'when.power-cut': 'ఊరంతా కరెంటు పోయినప్పుడు',
  'when.just-before-dinner': 'రాత్రి భోజనానికి ఐదు నిమిషాల ముందు',
  'when.longest-lesson': 'ఏడాదిలోనే అతి పొడవైన క్లాసు జరుగుతుండగా',
  'when.day-before-birthday': 'ఎవరిదో పుట్టినరోజుకు ముందు రోజున',
  'when.rush-hour': 'ట్రాఫిక్ రద్దీ తారస్థాయిలో ఉన్నప్పుడు',
  'when.while-everyone-slept': 'మిగతా అందరూ నిద్రపోతుండగా',
  'when.exactly-noon': 'సరిగ్గా మిట్టమధ్యాహ్నం',

  // ── 4 · did — final finite verb, human plural «-ఆరు» ───────────────────────
  'did.baking-giant-cake': 'వంకరటింకరగా ఒక భారీ కేక్ బేక్ చేశారు',
  'did.juggling-pancakes': 'ఎత్తైన దోసెల దొంతరతో గారడీ చేశారు',
  'did.painting-polka-dots': 'ప్రతి గోడ మీదా రంగురంగుల చుక్కలు వేశారు',
  'did.sorting-clouds': 'మేఘాలను సైజుల వారీగా సర్దారు',
  'did.dancing-tango': 'బోలెడంత డ్రామాతో టాంగో డాన్స్ చేశారు',
  'did.stacking-chairs': 'కుర్చీలతో ఊగిపోయే ఒక టవర్ కట్టారు',
  'did.staring-contest': 'రెప్ప వాల్చకుండా చూసే హోరాహోరీ పోటీ పెట్టుకున్నారు',
  'did.flying-kites': 'చిక్కుపడిన దారాలతో భారీ గాలిపటాలు ఎగరేశారు',
  'did.eating-spaghetti': 'కొండంత స్పగెట్టీ తినేశారు',
  'did.digging-with-spoons': 'బుల్లి చెంచాలతో ఒక పెద్ద గొయ్యి తవ్వారు',

  // ── 5 · why — purpose or reason ending attached ────────────────────────────
  'why.made-sense-then': 'అప్పటికి సబబుగా అనిపించిన కారణాల వల్ల',
  'why.impress-a-pigeon': 'ఒక పావురాన్ని మెప్పించడానికి',
  'why.warranty-forbade-it': 'వారంటీలో వద్దని రాసి ఉంది కాబట్టి',
  'why.one-grape': 'ఒకే ఒక్క ద్రాక్ష పండు కోసం',
  'why.never-back-down': 'ఏ సవాలుకూ వెనక్కి తగ్గరు కాబట్టి',
  'why.pointless-point': 'ఎవరూ అడగని ఒక విషయాన్ని నిరూపించడానికి',
  'why.for-science': 'బహుశా సైన్స్ కోసం',
  'why.pure-stubbornness': 'కేవలం మొండి పట్టుదలతో',
  'why.horoscope-said-so': 'జాతకం మరీ వివరంగా చెప్పింది కాబట్టి',
  'why.bet-with-themselves': 'తమతో తామే కట్టిన పందెం తేల్చడానికి',
  'why.to-keep-warm': 'చలి కాచుకోవడానికి',
  'why.because-tuesday': 'ఆ రోజు మంగళవారం కాబట్టి',
  'why.for-a-sticker': 'ఒకే ఒక్క మెరిసే స్టిక్కర్ కోసం',
  'why.avoid-homework': 'హోంవర్క్ తప్పించుకోవడానికి',
  'why.everyone-else-did': 'మిగతా అందరూ అలాగే చేస్తున్నారు కాబట్టి',
  'why.world-record': 'ఎవరూ వినని ఒక ప్రపంచ రికార్డు బద్దలు కొట్టడానికి',
  'why.simply-hungry': 'కడుపులో ఎలుకలు పరిగెడుతున్నాయి కాబట్టి',
  'why.impress-grandma': 'ఏం చేసినా మెచ్చని ఒక బామ్మను మెప్పించడానికి',
  'why.forgot-the-plan': 'అసలు ప్లాన్ మర్చిపోయారు కాబట్టి',
  'why.instructions-said-so': 'సూచనలు అలాగే చేయమని పట్టుబట్టాయి కాబట్టి',
  'why.test-a-theory': 'గురుత్వాకర్షణ మీద ఒక సిద్ధాంతాన్ని పరీక్షించడానికి',
  'why.no-reason': 'ఏ కారణమూ లేకుండానే',

  // ── 6 · ending — full clause after «చివరికి» ───────────────────────────────
  'end.feelings-about-pasta': 'అందరికీ పాస్తా మీద గట్టి అభిప్రాయాలు ఏర్పడ్డాయి',
  'end.duck-complaint': 'ఒక బాతు అధికారికంగా ఫిర్యాదు చేసింది',
  'end.nothing-made-sense': 'ఏమీ అర్థం కాలేదు, అయినా అందరూ హాయిగానే ఉన్నారు',
  'end.lost-receipts': 'రసీదులన్నీ పోయాయి, బహుశా అదే మంచిదైంది',
  'end.pigeon-certificates': 'కొన్ని పావురాలకు సర్టిఫికెట్లు అందాయి',
  'end.fruit-basket': 'మేయర్ గారు ఒక పండ్ల బుట్ట పంపించారు',
  'end.instant-sequel': 'వెంటనే దీనికి రెండో భాగం ప్రకటించారు',
  'end.three-country-holiday': 'అది మూడు దేశాల్లో సెలవు దినంగా మారింది',
  'end.cloud-looked-away': 'అంతసేపూ చూస్తున్న మేఘం ఎట్టకేలకు ముఖం తిప్పుకుంది',
  'end.never-spoke-again': 'దీని గురించి మళ్ళీ మాట్లాడకూడదని అందరూ ఒట్టేసుకున్నారు',
  'end.ice-cream-for-all': 'ప్రతి ఒక్కరికీ ఐస్‌క్రీమ్ దొరికింది',
  'end.someone-had-to-mop': 'ఎవరో ఒకరు నేలంతా తుడవాల్సి వచ్చింది',
  'end.museum-exhibit': 'అది ఒక చిన్న మ్యూజియంలో అద్దాల పెట్టెలోకి చేరింది',
  'end.a-song-about-it': 'ఈ మొత్తం వ్యవహారం మీద ఒక పాట కట్టారు',
  'end.neighbors-applauded': 'ఇరుగుపొరుగువాళ్ళు కిటికీల్లోంచి చప్పట్లు కొట్టారు',
  'end.smelled-like-lemons': 'వారం రోజుల పాటు అంతటా లీలగా నిమ్మకాయ వాసన వచ్చింది',
  'end.new-holiday-invented': 'అక్కడికక్కడే ఒక కొత్త పండుగ పుట్టింది',
  'end.cat-took-credit': 'అటుగా వెళ్తున్న ఒక పిల్లి క్రెడిట్ అంతా కొట్టేసింది',
  'end.everyone-fell-asleep': 'అందరూ ఒకరి మీద ఒకరు పడి గుర్రుపెట్టి నిద్రపోయారు',
  'end.indoor-rainbow': 'ఇంట్లో ఒక ఇంద్రధనుస్సు వచ్చి, వెళ్ళనని మొండికేసింది',
  'end.instructions-finally-clear': 'సూచనలు ఎట్టకేలకు పూర్తిగా అర్థమయ్యాయి',
  'end.home-for-soup': 'అందరూ సూప్ తాగడానికి ఇంటికి వెళ్ళిపోయారు',
};
