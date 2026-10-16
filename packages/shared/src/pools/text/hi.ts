// SPDX-License-Identifier: AGPL-3.0-only

// Hindi pool display texts — machine-drafted for Step 73 (FM-POOL-2/5).
// needs-hi-review — machine-translated stub awaiting native Hindi review per CONTRIBUTING.md.
//
// Authored against the Hindi prose template (SOV word order, like Tamil):
//   "{3}, {2} {0} {1} {5} {4}। आख़िर में {6}।"
//
//   slot 3 when     — own postposition/adverbial or a closed «जब …» clause,
//                     first in the sentence; the template puts the comma after it
//                     «एक छोटे-से भूकंप के दौरान» (during a small earthquake)
//   slot 2 where    — locative «में / पर / के अंदर» attached
//                     «एक पनीर फ़ैक्टरी के अंदर» (inside a cheese factory)
//   slot 0 who      — the subject in the oblique case WITH the ergative «ने»
//                     attached: «एक चिड़चिड़े समुद्री डाकू ने» (a grumpy pirate).
//                     The question is «किसने?», whose natural answer is «… ने».
//   slot 1 withWhom — comitative «के साथ» attached (the template has no
//                     connector between slot 0 and slot 1)
//                     «एक भूतिया टोस्टर के साथ» (with a haunted toaster)
//   slot 5 why      — purpose/cause postposition attached: «के लिए / की वजह से /
//                     के कारण / के मारे / की ख़ातिर / के बदले / के नाते …»
//                     «एक कबूतर पर रौब जमाने के लिए» (to impress a pigeon).
//                     Never a «क्योंकि …» clause: that wants to follow the main
//                     clause and would break the sentence before the verb.
//   slot 4 did      — the sentence's final finite verb, ERGATIVE PERFECTIVE:
//                     a transitive verb in the perfective whose object sits
//                     inside this same text. With «ने» on the subject, Hindi
//                     makes the verb agree with that object (or default to
//                     masculine singular when the object takes «को»), never
//                     with the subject. So the verb is fixed per text and is
//                     right for every slot-0 choice — a pirate (m), a grandma
//                     (f), three cats in a coat (f pl) — and every companion:
//                       «… केक बनाया» (केक m sg) · «… पतंगें उड़ाईं» (f pl) ·
//                       «… मीनार खड़ी की» (f sg) · «… बादलों को … छाँटा» (को →
//                       m sg default) · «… टैंगो डांस किया» (डांस m sg).
//                     The alternative, a plural verb («… बनाने लगे»), would
//                     still agree with the subject, so a grandma would come out
//                     masculine; the ergative is the only construction where
//                     no combination is ever misgendered or mis-numbered.
//                     Every did.* text is therefore transitive + perfective;
//                     an intransitive verb («नाचे», «सो गए») must not appear here.
//   slot 6 ending   — a full independent clause with its own subject,
//                     following «आख़िर में» (in the end)
//                     «एक बत्तख ने बाक़ायदा शिकायत दर्ज कराई»
//
// Slots 0–5 never end in an unclosed subordinate clause, since the template
// joins them with nothing but spaces; each text carries its own postposition.
// No text ends in punctuation: the template supplies «,» after slot 3 and «।»
// after slots 4 and 6.
//
// A few nouns are localised the way Tamil did (pancakes → parathas, cheese →
// paneer, oven → tandoor in the UI): the picture prompts are English and
// separate (options.ts), and these read as the same objects on the cartoon.

import type { PoolTextMap } from '../schema.js';

export const hi: PoolTextMap = {
  // ── 0 · who — oblique subject + ergative «ने» ─────────────────────────────
  'who.grumpy-pirate': 'एक चिड़चिड़े समुद्री डाकू ने',
  'who.sleepy-llama': 'एक ऊँघते हुए ऊनी लामा ने',
  'who.confused-penguin': 'एक हैरान-परेशान पेंगुइन ने',
  'who.overconfident-raccoon': 'ख़ुद को तीसमारख़ाँ समझने वाले एक रैकून ने',
  'who.tiny-dragon': 'दुनिया के सबसे छोटे ड्रैगन ने',
  'who.cats-in-a-trench-coat': 'एक लंबे ओवरकोट में छिपी तीन बिल्लियों ने',
  'who.retired-superhero': 'एक रिटायर्ड सुपरहीरो ने',
  'who.skating-grandma': 'रोलर स्केट्स पर सवार एक दादी ने',
  'who.time-traveling-accountant': 'टाइम-ट्रैवल करने वाले एक मुनीम जी ने',
  'who.muddy-knight': 'कीचड़ से लथपथ एक शूरवीर ने',

  // ── 1 · withWhom — comitative «के साथ» attached ──────────────────────────
  'with.haunted-toaster': 'एक भूतिया टोस्टर के साथ',
  'with.angry-geese': 'तीन ग़ुस्सैल हंसों के साथ',
  'with.philosophical-goldfish': 'ज्ञान बघारती एक सुनहरी मछली के साथ',
  'with.riddle-robot': 'सिर्फ़ पहेलियों में बोलने वाले एक रोबोट के साथ',
  'with.professor-goat': '“प्रोफ़ेसर पनीर” नाम की एक बकरी के साथ',
  'with.lost-tourist': 'बुरी तरह रास्ता भटके एक सैलानी के साथ',
  'with.giant-snail': 'एक विशाल ख़ुशमिज़ाज घोंघे के साथ',
  'with.tuba-frog': 'भोंपू बजाते एक मेंढक के साथ',
  'with.talking-mailbox': 'एक बातूनी लेटरबॉक्स के साथ',
  'with.opera-walrus': 'ओपेरा गाने वाले एक वॉलरस के साथ',

  // ── 2 · where — locative postposition attached ───────────────────────────
  'where.cheese-factory': 'एक पनीर फ़ैक्टरी के अंदर',
  'where.underwater-canyon': 'समंदर की तलहटी में',
  'where.cookbook-library': 'सिर्फ़ पकवानों की किताबों वाली एक लाइब्रेरी में',
  'where.giant-sock-drawer': 'मोज़ों की एक विशाल दराज़ के अंदर',
  'where.gloomy-birthday': 'एक बेहद उदास बर्थडे पार्टी में',
  'where.cramped-elevator': 'एक ठसाठस भरी लिफ़्ट में',
  'where.cloud-castle': 'बादलों से बने एक महल में',
  'where.messy-kitchen': 'एक ग़ज़ब की बिखरी हुई रसोई में',
  'where.snowy-mountain': 'बर्फ़ से ढके एक पहाड़ी दर्रे पर',
  'where.jungle-treehouse': 'जंगल में पेड़ पर बने एक घर में',

  // ── 3 · when — own postposition/adverbial, or a closed «जब …» clause ─────
  'when.small-earthquake': 'एक छोटे-से भूकंप के दौरान',
  'when.solar-eclipse': 'सूर्यग्रहण के ऐन मौक़े पर',
  'when.after-breakfast': 'नाश्ते के ठीक बाद पर दूसरे नाश्ते से पहले',
  'when.someone-elses-wedding': 'किसी और की शादी के दौरान',
  'when.wrong-feeling-tuesday': 'बुधवार जैसे लगते एक मंगलवार को',
  'when.clocks-stopped': 'ठीक उस पल जब सारी घड़ियाँ थम गईं',
  'when.three-in-the-morning': 'बेवजह रात के तीन बजे',
  'when.hat-festival': 'सालाना टोपी मेले के दौरान',
  'when.internet-outage': 'जब इंटरनेट बंद पड़ा था',
  'when.seagull-decision': 'जिस घड़ी एक समुद्री चिड़िया ने फ़ैसला किया',
  'when.last-day-of-summer': 'गर्मियों के आख़िरी दिन',
  'when.thunderstorm': 'गरजते-बरसते तूफ़ान के बीचों-बीच',
  'when.first-snow': 'पहली बर्फ़बारी वाली सुबह',
  'when.school-holidays': 'स्कूल की आधी छुट्टियाँ बीत जाने पर',
  'when.full-moon': 'एकदम गोल-मटोल पूरे चाँद के नीचे',
  'when.power-cut': 'जब पूरे शहर की बत्ती गुल थी',
  'when.just-before-dinner': 'रात के खाने से पाँच मिनट पहले',
  'when.longest-lesson': 'साल की सबसे लंबी क्लास के दौरान',
  'when.day-before-birthday': 'किसी के जन्मदिन से एक दिन पहले',
  'when.rush-hour': 'ट्रैफ़िक की सबसे भारी भीड़ के बीच',
  'when.while-everyone-slept': 'जब बाक़ी सब सो रहे थे',
  'when.exactly-noon': 'ठीक दोपहर बारह बजे',

  // ── 4 · did — transitive perfective; verb agrees with its own object ─────
  'did.baking-giant-cake': 'एक बहुत बड़ा टेढ़ा-मेढ़ा केक बनाया',
  'did.juggling-pancakes': 'पराँठों के ऊँचे ढेर से करतब दिखाए',
  'did.painting-polka-dots': 'हर दीवार पर रंग-बिरंगी बिंदियाँ बनाईं',
  'did.sorting-clouds': 'सारे बादलों को साइज़ के हिसाब से छाँटा',
  'did.dancing-tango': 'बड़े फ़िल्मी अंदाज़ में टैंगो डांस किया',
  'did.stacking-chairs': 'कुर्सियों की एक डगमगाती मीनार खड़ी की',
  'did.staring-contest': 'बिना पलक झपकाए घूरने का कड़ा मुक़ाबला किया',
  'did.flying-kites': 'उलझी डोरों पर बड़ी-बड़ी पतंगें उड़ाईं',
  'did.eating-spaghetti': 'नूडल्स का पूरा पहाड़ चट कर डाला',
  'did.digging-with-spoons': 'छोटे-छोटे चम्मचों से एक बहुत बड़ा गड्ढा खोदा',

  // ── 5 · why — purpose/cause postposition attached ────────────────────────
  'why.made-sense-then': 'उस वक़्त ठीक लगने वाली वजहों से',
  'why.impress-a-pigeon': 'एक कबूतर पर रौब जमाने के लिए',
  'why.warranty-forbade-it': 'वारंटी कार्ड के मना करने की वजह से',
  'why.one-grape': 'सिर्फ़ एक अंगूर के बदले',
  'why.never-back-down': 'कभी पीछे न हटने के अपने उसूल के चलते',
  'why.pointless-point': 'बेमतलब की एक बात साबित करने के लिए',
  'why.for-science': 'शायद विज्ञान की ख़ातिर',
  'why.pure-stubbornness': 'निरी ज़िद के मारे',
  'why.horoscope-said-so': 'राशिफल की बिल्कुल पक्की सलाह पर',
  'why.bet-with-themselves': 'ख़ुद से लगी एक शर्त निपटाने के लिए',
  'why.to-keep-warm': 'ख़ुद को गरम रखने के लिए',
  'why.because-tuesday': 'मंगलवार होने के नाते',
  'why.for-a-sticker': 'सिर्फ़ एक चमकीले स्टिकर के लिए',
  'why.avoid-homework': 'होमवर्क से बचने के लिए',
  'why.everyone-else-did': 'बाक़ी सबकी देखा-देखी',
  'why.world-record': 'एक अनसुना वर्ल्ड रिकॉर्ड तोड़ने के लिए',
  'why.simply-hungry': 'पेट में चूहे कूदने के कारण',
  'why.impress-grandma': 'कभी ख़ुश न होने वाली एक नानी को रिझाने के लिए',
  'why.forgot-the-plan': 'असली प्लान भूल जाने की वजह से',
  'why.instructions-said-so': 'निर्देशों के ज़ोर देने पर',
  'why.test-a-theory': 'गुरुत्वाकर्षण का एक सिद्धांत परखने के लिए',
  'why.no-reason': 'बिल्कुल बिना किसी वजह के',

  // ── 6 · ending — full clause after «आख़िर में» ──────────────────────────
  'end.feelings-about-pasta': 'सबके मन में पास्ता को लेकर गहरी भावनाएँ जाग उठीं',
  'end.duck-complaint': 'एक बत्तख ने बाक़ायदा शिकायत दर्ज कराई',
  'end.nothing-made-sense': 'कुछ भी समझ नहीं आया, पर सब मज़े में थे',
  'end.lost-receipts': 'रसीदें खो गईं, और शायद यही अच्छा हुआ',
  'end.pigeon-certificates': 'कई कबूतरों को सर्टिफ़िकेट मिले',
  'end.fruit-basket': 'मेयर ने फलों की एक टोकरी भेजी',
  'end.instant-sequel': 'फ़ौरन इसके पार्ट 2 का ऐलान हो गया',
  'end.three-country-holiday': 'तीन देशों में इसके नाम पर सरकारी छुट्टी घोषित हो गई',
  'end.cloud-looked-away': 'इतनी देर से ताक रहे बादल ने भी मुँह फेर लिया',
  'end.never-spoke-again': 'सबने तय किया कि इस बारे में फिर कभी बात नहीं होगी',
  'end.ice-cream-for-all': 'बिल्कुल हर किसी के लिए आइसक्रीम थी',
  'end.someone-had-to-mop': 'किसी को पूरे फ़र्श पर पोछा लगाना पड़ा',
  'end.museum-exhibit': 'यह सब एक छोटे-से म्यूज़ियम में शीशे के पीछे सज गया',
  'end.a-song-about-it': 'इस पूरे क़िस्से पर एक गाना लिखा गया',
  'end.neighbors-applauded': 'पड़ोसियों ने खिड़कियों से तालियाँ बजाईं',
  'end.smelled-like-lemons': 'हफ़्ते भर हर चीज़ से हल्की-हल्की नींबू की महक आती रही',
  'end.new-holiday-invented': 'हाथों-हाथ एक नया-नवेला त्योहार ईजाद हो गया',
  'end.cat-took-credit': 'पास से गुज़रती एक बिल्ली सारा श्रेय ले उड़ी',
  'end.everyone-fell-asleep': 'सब के सब एक-दूसरे पर लुढ़ककर सो गए',
  'end.indoor-rainbow': 'घर के अंदर इंद्रधनुष निकल आया और टस से मस न हुआ',
  'end.instructions-finally-clear': 'निर्देश अचानक पूरी तरह समझ में आ गए',
  'end.home-for-soup': 'सब सूप पीने घर चले गए',
};
