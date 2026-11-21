// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — Tamil display texts (B-29), machine-drafted for
// Step 118 with B-29's brief.
// needs-ta-review — machine-translated stub awaiting native Tamil review per CONTRIBUTING.md.
//
// Authored against the base Tamil template and its per-slot rules, which
// pools/text/ta.ts sets out: "{3} {2} {0} {1} {5} {4}. கடைசியில் {6}." —
// slot 1 closed by «-உடன்», slot 5 a purpose or reason phrase («-க்காக»),
// slot 4 the sentence's final verb in «-ார்கள்», slot 6 a full clause.
//
// A local gloss, not a translation (B-29): the presents come from
// கிறிஸ்துமஸ் தாத்தா, the treat is a slice of plum cake.

import type { PoolTextMap } from '../../../pools/schema.js';

export const ta: PoolTextMap = {
  // ── 0 · who ──────────────────────────────────────────────────────────────
  'who.chr26-reindeer': 'கிறிஸ்துமஸ் ஸ்வெட்டர் அணிந்த ஒரு கலைமான்',
  'who.chr26-snowman': 'கோடு போட்ட மஃப்ளர் கட்டிய ஒரு பனிமனிதன்',
  'who.chr26-gingerbread-man': 'ஒரு ஜிஞ்சர்பிரெட் மனிதன்',
  'who.chr26-polar-bear': 'ஸ்கேட்டிங் காலணி அணிந்த ஒரு பனிக்கரடி',
  'who.chr26-nutcracker': 'மரத்தாலான ஒரு நட்கிராக்கர் சிப்பாய்',

  // ── 1 · withWhom — closed by «-உடன்» ────────────────────────────────────
  'with.chr26-grumpy-cat': 'குஞ்சம் வைத்த தொப்பி அணிந்த ஒரு எரிச்சல் பூனையுடன்',
  'with.chr26-sleeping-snow-maiden': 'தூங்கும் ஒரு பனிப் பெண்ணுடன்',
  'with.chr26-winter-bird': 'சிவப்பு மார்புடைய ஒரு குண்டுக் குருவியுடன்',
  'with.chr26-gnome': 'பெரிய கூம்புத் தொப்பி அணிந்த ஒரு குட்டிக் குள்ளனுடன்',
  'with.chr26-cocoa-mug': 'சூடான கோகோ நிறைந்த ஒரு பெரிய குவளையுடன்',

  // ── 2 · where ────────────────────────────────────────────────────────────
  'where.chr26-snowy-square': 'பனி மூடிய கிறிஸ்துமஸ் சந்தையில்',
  'where.chr26-living-room': 'கணப்பு அருகே ஒரு கதகதப்பான அறையில்',
  'where.chr26-festive-table': 'கேக்குகள் நிறைந்த விருந்து மேசையில்',
  'where.chr26-frozen-pond': 'காட்டில் உறைந்த குளத்தின் மேல்',
  'where.chr26-film-studio': 'கிறிஸ்துமஸ் படப்பிடிப்பு நடக்கும் ஸ்டுடியோவில்',

  // ── 3 · when — opens the story ───────────────────────────────────────────
  'when.chr26-waiting-for-presents': 'பரிசுகளுக்காகக் காத்திருந்த போது',
  'when.chr26-before-the-guests': 'விருந்தினர்கள் வருவதற்கு ஒரு மணி நேரம் முன்பு',
  'when.chr26-the-big-night': 'கிறிஸ்துமஸ் முந்தைய இரவில்',
  'when.chr26-midnight-bells': 'நள்ளிரவு மணி ஒலித்த போது',
  'when.chr26-morning-after': 'விருந்துக்கு மறுநாள் காலையில்',

  // ── 4 · did — final verb in «-ார்கள்» ───────────────────────────────────
  'did.chr26-decorating-tree': 'மரத்தில் அளவுக்கு மீறிப் பந்துகளைத் தொங்கவிட்டார்கள்',
  'did.chr26-wrapping-presents': 'ஒரு கோணல் பரிசை முழு டேப் சுருளால் சுற்றினார்கள்',
  'did.chr26-snowball-fight': 'பயங்கரமான பனிப்பந்துச் சண்டை போட்டார்கள்',
  'did.chr26-watching-tv': 'சிலந்தி வலை மூடிய டிவியில் கிறிஸ்துமஸ் படம் பார்த்தார்கள்',
  'did.chr26-singing': 'தொண்டை கிழியக் கிறிஸ்துமஸ் பாடல்கள் பாடினார்கள்',

  // ── 5 · why — «-க்காக» ──────────────────────────────────────────────────
  'why.chr26-nice-list': 'தாத்தாவின் நல்ல பிள்ளைகள் பட்டியலில் இருப்பதற்காக',
  'why.chr26-one-more-treat': 'இன்னும் ஒரு பிளம் கேக் துண்டுக்காக',
  'why.chr26-secret-wish': 'ஒரு ரகசிய ஆசை நிறைவேறுவதற்காக',
  'why.chr26-beat-the-neighbors': 'பக்கத்து வீட்டு அலங்காரத்தை மிஞ்சுவதற்காக',
  'why.chr26-family-tradition': 'பாட்டி சொன்ன குடும்ப வழக்கத்திற்காக',

  // ── 6 · ending — full clause ─────────────────────────────────────────────
  'end.chr26-wrapping-paper': 'எல்லாம் பரிசுக் காகித மலைக்கு அடியில் மறைந்தது',
  'end.chr26-tangled-lights': 'எல்லாம் முடிவில்லா விளக்குச் சரத்தில் சிக்கியது',
  'end.chr26-toppled-tree': 'கிறிஸ்துமஸ் மரம் மிக மிக மெதுவாக விழுந்தது',
  'end.chr26-empty-sack': 'தாத்தா விட்டுச் சென்றது காலிப் பையும் கடிதமும் மட்டுமே',
  'end.chr26-melted-snowman': 'பனிமனிதனில் மிஞ்சியது குட்டையில் ஒரு கேரட் மட்டுமே',
};
