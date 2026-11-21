// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — Telugu display texts (B-29), machine-drafted for
// Step 118 with B-29's brief.
// needs-te-review — machine-translated stub awaiting native Telugu review per CONTRIBUTING.md.
//
// Authored against the base Telugu template and its per-slot rules, which
// pools/text/te.ts sets out: "{3} {2} {0} {1} {5} {4}. చివరికి {6}." — slot 1
// closed by «-తో కలిసి», slot 5 a purpose or reason phrase («-డానికి»,
// «కోసం», «… కాబట్టి»), slot 4 the final verb in simple past «-ఆరు», slot 6 a
// full clause. A consonant-final loanword takes a ZWNJ before its suffix.
//
// A local gloss, not a translation (B-29): the presents come from క్రిస్మస్
// తాత, the treat is a slice of plum cake, the grandmother బామ్మ.

import type { PoolTextMap } from '../../../pools/schema.js';

export const te: PoolTextMap = {
  // ── 0 · who ──────────────────────────────────────────────────────────────
  'who.chr26-reindeer': 'క్రిస్మస్ స్వెటర్ వేసుకున్న ఒక రెయిన్‌డీర్',
  'who.chr26-snowman': 'చారల మఫ్లర్ కట్టుకున్న ఒక మంచు మనిషి',
  'who.chr26-gingerbread-man': 'ఒక జింజర్‌బ్రెడ్ బొమ్మ',
  'who.chr26-polar-bear': 'స్కేట్లు వేసుకున్న ఒక ధ్రువపు ఎలుగుబంటి',
  'who.chr26-nutcracker': 'చెక్క నట్‌క్రాకర్ సిపాయి',

  // ── 1 · withWhom — closed by «-తో కలిసి» ────────────────────────────────
  'with.chr26-grumpy-cat': 'కుచ్చు టోపీ పెట్టుకున్న ఒక చిరాకు పిల్లితో కలిసి',
  'with.chr26-sleeping-snow-maiden': 'నిద్రపోతున్న ఒక మంచు కన్యతో కలిసి',
  'with.chr26-winter-bird': 'ఎర్రటి రొమ్ము ఉన్న ఒక బొద్దు పిట్టతో కలిసి',
  'with.chr26-gnome': 'పెద్ద కొన టోపీ పెట్టుకున్న ఒక చిన్ని మరుగుజ్జుతో కలిసి',
  'with.chr26-cocoa-mug': 'వేడి కోకో నిండిన ఒక పెద్ద మగ్గుతో కలిసి',

  // ── 2 · where ────────────────────────────────────────────────────────────
  'where.chr26-snowy-square': 'మంచు కప్పిన క్రిస్మస్ సంతలో',
  'where.chr26-living-room': 'చలిమంట పక్కన ఒక వెచ్చని గదిలో',
  'where.chr26-festive-table': 'కేకులు నిండిన విందు బల్ల దగ్గర',
  'where.chr26-frozen-pond': 'అడవిలో గడ్డకట్టిన చెరువు మీద',
  'where.chr26-film-studio': 'క్రిస్మస్ సినిమా షూటింగ్ జరిగే స్టూడియోలో',

  // ── 3 · when — opens the story ───────────────────────────────────────────
  'when.chr26-waiting-for-presents': 'బహుమతుల కోసం ఎదురుచూస్తుండగా',
  'when.chr26-before-the-guests': 'అతిథులు రావడానికి గంట ముందు',
  'when.chr26-the-big-night': 'క్రిస్మస్ ముందు రాత్రి',
  'when.chr26-midnight-bells': 'అర్ధరాత్రి గంటలు మోగిన క్షణంలో',
  'when.chr26-morning-after': 'విందు తర్వాతి రోజు ఉదయం',

  // ── 4 · did — final verb in «-ఆరు» ──────────────────────────────────────
  'did.chr26-decorating-tree': 'చెట్టుకు మరీ ఎక్కువ బంతులు వేలాడదీశారు',
  'did.chr26-wrapping-presents': 'ఒక వంకర బహుమతిని టేప్ రోల్ మొత్తంతో చుట్టారు',
  'did.chr26-snowball-fight': 'భీకరమైన మంచు ఉండల యుద్ధం చేశారు',
  'did.chr26-watching-tv': 'బూజు పట్టిన టీవీలో క్రిస్మస్ సినిమా చూశారు',
  'did.chr26-singing': 'గొంతు చించుకుని క్రిస్మస్ పాటలు పాడారు',

  // ── 5 · why — «-డానికి» / «కోసం» / «కాబట్టి» ────────────────────────────
  'why.chr26-nice-list': 'క్రిస్మస్ తాత జాబితాలో మంచివాళ్లుగా ఉండటానికి',
  'why.chr26-one-more-treat': 'ఇంకో ప్లమ్ కేక్ ముక్క కోసం',
  'why.chr26-secret-wish': 'ఒక రహస్య కోరిక తీరడానికి',
  'why.chr26-beat-the-neighbors': 'పక్కింటివాళ్ల అలంకరణను మించడానికి',
  'why.chr26-family-tradition': 'అది కుటుంబ సంప్రదాయమని బామ్మ చెప్పింది కాబట్టి',

  // ── 6 · ending — full clause ─────────────────────────────────────────────
  'end.chr26-wrapping-paper': 'అంతా గిఫ్ట్ పేపర్ కొండ కింద మాయమైంది',
  'end.chr26-tangled-lights': 'అంతా అంతులేని దీపాల తీగలో చిక్కుకుపోయింది',
  'end.chr26-toppled-tree': 'క్రిస్మస్ చెట్టు చాలా చాలా నెమ్మదిగా కూలిపోయింది',
  'end.chr26-empty-sack': 'క్రిస్మస్ తాత ఖాళీ సంచి, ఒక ఉత్తరం మాత్రమే వదిలి వెళ్లారు',
  'end.chr26-melted-snowman': 'మంచు మనిషిలో నీటి గుంటలో ఒక క్యారెట్ మాత్రమే మిగిలింది',
};
