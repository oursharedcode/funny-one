// SPDX-License-Identifier: AGPL-3.0-only

// Christmas 2026 edition — Hindi display texts (B-29), machine-drafted for
// Step 118 with B-29's brief.
// needs-hi-review — machine-translated stub awaiting native Hindi review per CONTRIBUTING.md.
//
// Authored against the base Hindi template and its per-slot rules, which
// pools/text/hi.ts sets out: "{3}, {2} {0} {1} {5} {4}। आख़िर में {6}।" —
// slot 0 oblique and closed by «ने», slot 1 closed by «के साथ», slot 5 a
// postposition phrase («के लिए», «के नाते»; never «क्योंकि»), slot 4 a
// transitive perfective agreeing with its own object, slot 6 a full clause;
// no text ends in punctuation.
//
// A local gloss, not a translation (B-29): the presents come from सांता
// क्लॉज़, the treat is a slice of plum cake, the songs क्रिसमस कैरल.

import type { PoolTextMap } from '../../../pools/schema.js';

export const hi: PoolTextMap = {
  // ── 0 · who — oblique, closed by «ने» ───────────────────────────────────
  'who.chr26-reindeer': 'क्रिसमस स्वेटर पहने एक रेनडियर ने',
  'who.chr26-snowman': 'धारीदार मफ़लर वाले एक स्नोमैन ने',
  'who.chr26-gingerbread-man': 'एक जिंजरब्रेड मैन ने',
  'who.chr26-polar-bear': 'स्केट्स पहने एक ध्रुवीय भालू ने',
  'who.chr26-nutcracker': 'लकड़ी के एक नटक्रैकर सिपाही ने',

  // ── 1 · withWhom — closed by «के साथ» ───────────────────────────────────
  'with.chr26-grumpy-cat': 'फुंदने वाली टोपी पहने एक चिड़चिड़ी बिल्ली के साथ',
  'with.chr26-sleeping-snow-maiden': 'एक सोई हुई हिम-कन्या के साथ',
  'with.chr26-winter-bird': 'लाल सीने वाली एक गोल-मटोल चिड़िया के साथ',
  'with.chr26-gnome': 'बड़ी नुकीली टोपी वाले एक नन्हे बौने के साथ',
  'with.chr26-cocoa-mug': 'गरम कोको के एक विशाल मग के साथ',

  // ── 2 · where ────────────────────────────────────────────────────────────
  'where.chr26-snowy-square': 'बर्फ़ से ढके एक क्रिसमस बाज़ार में',
  'where.chr26-living-room': 'अंगीठी के पास एक आरामदेह बैठक में',
  'where.chr26-festive-table': 'केक और मिठाइयों से सजी मेज़ पर',
  'where.chr26-frozen-pond': 'जंगल के एक जमे हुए तालाब पर',
  'where.chr26-film-studio': 'क्रिसमस फ़िल्म की शूटिंग वाले एक स्टूडियो में',

  // ── 3 · when — opens the story ───────────────────────────────────────────
  'when.chr26-waiting-for-presents': 'तोहफ़ों का इंतज़ार करते हुए',
  'when.chr26-before-the-guests': 'मेहमानों के आने से एक घंटा पहले',
  'when.chr26-the-big-night': 'क्रिसमस की पूर्व संध्या पर',
  'when.chr26-midnight-bells': 'आधी रात के घंटे बजते ही',
  'when.chr26-morning-after': 'दावत के अगले दिन सुबह',

  // ── 4 · did — transitive perfective, agreeing with its object ────────────
  'did.chr26-decorating-tree': 'पेड़ पर ज़रूरत से ज़्यादा गेंदें टाँगीं',
  'did.chr26-wrapping-presents': 'टेप के पूरे रोल से एक बेढंगा तोहफ़ा लपेटा',
  'did.chr26-snowball-fight': 'बर्फ़ के गोलों से ज़बरदस्त लड़ाई लड़ी',
  'did.chr26-watching-tv': 'जालों से ढके टीवी पर क्रिसमस फ़िल्म देखी',
  'did.chr26-singing': 'गला फाड़कर क्रिसमस कैरल गाए',

  // ── 5 · why — postposition phrase ────────────────────────────────────────
  'why.chr26-nice-list': 'सांता की अच्छे बच्चों की सूची में बने रहने के लिए',
  'why.chr26-one-more-treat': 'प्लम केक के एक और टुकड़े के लिए',
  'why.chr26-secret-wish': 'एक गुप्त इच्छा पूरी करवाने के लिए',
  'why.chr26-beat-the-neighbors': 'पड़ोसियों की सजावट को मात देने के लिए',
  'why.chr26-family-tradition': 'दादी की बताई पारिवारिक परंपरा के नाते',

  // ── 6 · ending — full clause ─────────────────────────────────────────────
  'end.chr26-wrapping-paper': 'सब कुछ रंगीन काग़ज़ के पहाड़ के नीचे गायब हो गया',
  'end.chr26-tangled-lights': 'सब कुछ रोशनी की एक अंतहीन लड़ी में उलझ गया',
  'end.chr26-toppled-tree': 'क्रिसमस ट्री बहुत धीरे-धीरे गिर पड़ा',
  'end.chr26-empty-sack': 'सांता क्लॉज़ बस एक ख़ाली थैला और एक विनम्र चिट्ठी छोड़ गए',
  'end.chr26-melted-snowman': 'स्नोमैन की बस एक गाजर पानी के गड्ढे में बची',
};
