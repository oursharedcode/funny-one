// SPDX-License-Identifier: AGPL-3.0-only

// Tamil pool display texts — machine-drafted for T-6.3 (FM-POOL-2/5).
// needs-ta-review — machine-translated stub awaiting native Tamil review per CONTRIBUTING.md.
//
// Authored against the Tamil prose template (SOV word order):
//   "{3} {2} {0} {1} {5} {4}. கடைசியில் {6}."
//
//   slot 3 when     — own postposition/adverbial, first in the sentence
//                     «ஒரு சிறிய பூகம்பத்தின் போது» (during a small earthquake)
//   slot 2 where    — locative «-இல்/-இல்/-க்குள்» attached, right after slot 3
//                     with no glue word between them  «ஒரு சீஸ் தொழிற்சாலையில்»
//   slot 0 who      — bare subject noun phrase  «ஒரு கோபமான கடற்கொள்ளையன்»
//   slot 1 withWhom — comitative «-உடன்/-ஓடு» attached (template has no
//                     hardcoded connector between slot 0 and slot 1)
//                     «பேயோட்டிய ஒரு டோஸ்டருடன்» (with a haunted toaster)
//   slot 5 why      — purpose postposition «-க்காக/-ஏ» attached (template has
//                     no hardcoded connector before slot 4 either)
//                     «ஒரு புறாவை கவரவே» (to impress a pigeon)
//   slot 4 did      — the sentence's final finite verb; plural/neutral
//                     «-ார்கள்» ending (never singular/gendered), so no slot-0
//                     choice gets misgendered  «ஒரு பெரிய கோணலான கேக் சுட்டார்கள்»
//   slot 6 ending   — a full clause following «கடைசியில்» (in the end)
//                     «எல்லோருக்கும் பாஸ்தா பற்றி வலுவான உணர்வுகள் இருந்தன»
//
// Slots 0–5 never end in an unclosed subordinate clause, since the template
// joins them with nothing but spaces; each text is a closed phrase carrying
// its own postposition where Tamil grammar requires one.

import type { PoolTextMap } from '../schema.js';

export const ta: PoolTextMap = {
  // ── 0 · who ───────────────────────────────────────────────────────────────
  'who.grumpy-pirate': 'ஒரு கோபமான கடற்கொள்ளையன்',
  'who.sleepy-llama': 'மிகவும் தூக்கம் வரும் ஒரு லாமா',
  'who.confused-penguin': 'ஒரு குழப்பமான பெங்குயின்',
  'who.overconfident-raccoon': 'அதிக நம்பிக்கை கொண்ட ஒரு ராக்கூன்',
  'who.tiny-dragon': 'உலகின் மிகச் சிறிய டிராகன்',
  'who.cats-in-a-trench-coat': 'ஒரு நீளங்கியில் ஒளிந்த மூன்று பூனைகள்',
  'who.retired-superhero': 'ஓய்வு பெற்ற ஒரு சூப்பர்ஹீரோ',
  'who.skating-grandma': 'ரோலர் ஸ்கேட்டில் இருக்கும் ஒரு பாட்டி',
  'who.time-traveling-accountant': 'காலப் பயணம் செய்யும் ஒரு கணக்காளர்',
  'who.muddy-knight': 'மிகவும் சேறு படிந்த ஒரு நைட்',

  // ── 1 · withWhom — comitative postposition attached ─────────────────────────
  'with.haunted-toaster': 'பேயோட்டிய ஒரு டோஸ்டருடன்',
  'with.angry-geese': 'கோபமான மூன்று வாத்துக்களுடன்',
  'with.philosophical-goldfish': 'தத்துவம் பேசும் ஒரு தங்கமீனுடன்',
  'with.riddle-robot': 'புதிர்கள் மட்டுமே பேசும் ஒரு ரோபோட்டுடன்',
  'with.professor-goat': '“புரொஃபசர் சீஸ்” என்ற வெள்ளாட்டுடன்',
  'with.lost-tourist': 'வழி தவறிய ஒரு சுற்றுலாப் பயணியுடன்',
  'with.giant-snail': 'மகிழ்ச்சியான ஒரு பெரிய நத்தையுடன்',
  'with.tuba-frog': 'டூபா இசைக்கருவி வாசிக்கும் ஒரு தவளையுடன்',
  'with.talking-mailbox': 'பேசும் ஒரு தபால் பெட்டியுடன்',
  'with.opera-walrus': 'ஓபரா பாடும் ஒரு வால்ரஸுடன்',

  // ── 2 · where — locative postposition attached ───────────────────────────────
  'where.cheese-factory': 'ஒரு சீஸ் தொழிற்சாலையில்',
  'where.underwater-canyon': 'கடலின் அடிப்பகுதியில்',
  'where.cookbook-library': 'சமையல் புத்தகங்கள் மட்டுமே உள்ள நூலகத்தில்',
  'where.giant-sock-drawer': 'ஒரு பெரிய சாக்ஸ் அலமாரிக்குள்',
  'where.gloomy-birthday': 'மிகவும் சோகமான ஒரு பிறந்தநாள் விழாவில்',
  'where.cramped-elevator': 'மிகவும் நெருக்கமான ஒரு லிஃப்ட்டில்',
  'where.cloud-castle': 'மேகங்களால் ஆன ஒரு கோட்டையில்',
  'where.messy-kitchen': 'கடுமையாகக் குழம்பிய ஒரு சமையலறையில்',
  'where.snowy-mountain': 'பனி மூடிய ஒரு மலைப் பாதையில்',
  'where.jungle-treehouse': 'காட்டில் உள்ள ஒரு மரவீட்டில்',

  // ── 3 · when — own postposition/adverbial ───────────────────────────────────
  'when.small-earthquake': 'ஒரு சிறிய பூகம்பத்தின் போது',
  'when.solar-eclipse': 'சூரிய கிரகணம் நடந்த அந்த நொடியில்',
  'when.after-breakfast': 'காலை உணவுக்குப் பின், இரண்டாம் காலை உணவுக்கு முன்',
  'when.someone-elses-wedding': 'வேறொருவரின் திருமணத்தின் போது',
  'when.wrong-feeling-tuesday': 'புதன்கிழமை போல் தோன்றிய ஒரு செவ்வாய்க்கிழமையன்று',
  'when.clocks-stopped': 'எல்லா கடிகாரங்களும் நின்ற அந்த நொடியில்',
  'when.three-in-the-morning': 'காரணமே இல்லாமல் அதிகாலை மூன்று மணிக்கு',
  'when.hat-festival': 'வருடாந்திர தொப்பி விழாவின் போது',
  'when.internet-outage': 'இணையம் துண்டிக்கப்பட்டிருந்த போது',
  'when.seagull-decision': 'ஒரு கடல்பறவை முடிவெடுத்த அந்த நொடியில்',
  'when.last-day-of-summer': 'கோடையின் கடைசி நாளில்',
  'when.thunderstorm': 'ஒரு இடி மழையின் நடுவில்',
  'when.first-snow': 'முதல் பனி பெய்த காலையில்',
  'when.school-holidays': 'பள்ளி விடுமுறையின் பாதியில்',
  'when.full-moon': 'முழு நிலா இருந்த ஒரு இரவில்',
  'when.power-cut': 'நகரம் முழுவதும் மின்வெட்டு இருந்த போது',
  'when.just-before-dinner': 'இரவு உணவுக்கு ஐந்து நிமிடம் முன்பு',
  'when.longest-lesson': 'வருடத்தின் மிக நீளமான பாடத்தின் போது',
  'when.day-before-birthday': 'யாருடையவோ பிறந்தநாளுக்கு முந்தைய நாளில்',
  'when.rush-hour': 'போக்குவரத்து நெரிசல் உச்சத்தில்',
  'when.while-everyone-slept': 'மற்ற எல்லோரும் தூங்கிக் கொண்டிருந்தபோது',
  'when.exactly-noon': 'சரியாக நண்பகலில்',

  // ── 4 · did — final finite verb, plural/neutral ending ────────────────────────
  'did.baking-giant-cake': 'ஒரு பெரிய கோணலான கேக் சுட்டார்கள்',
  'did.juggling-pancakes': 'உயரமான அடுக்கு தோசைகளை ஜுகுளிங் செய்தார்கள்',
  'did.painting-polka-dots': 'எல்லா சுவர்களிலும் புள்ளிகள் வரைந்தார்கள்',
  'did.sorting-clouds': 'மேகங்களை அளவின்படி வரிசைப்படுத்தினார்கள்',
  'did.dancing-tango': 'மிகவும் நாடகத்தனமான ஒரு டாங்கோ ஆடினார்கள்',
  'did.stacking-chairs': 'நாற்காலிகளால் ஒரு ஆடும் கோபுரம் கட்டினார்கள்',
  'did.staring-contest': 'ஒரு தீவிரமான பார்வைப் போட்டியில் ஈடுபட்டார்கள்',
  'did.flying-kites': 'சிக்கலான நூல்களில் பெரிய பட்டங்களைப் பறக்கவிட்டார்கள்',
  'did.eating-spaghetti': 'ஸ்பாகெட்டி மலை போல சாப்பிட்டார்கள்',
  'did.digging-with-spoons': 'சிறிய ஸ்பூன்களால் ஒரு பெரிய குழி தோண்டினார்கள்',

  // ── 5 · why — purpose postposition attached ──────────────────────────────────
  'why.made-sense-then': 'அப்போது நியாயமாகத் தோன்றிய காரணங்களுக்காக',
  'why.impress-a-pigeon': 'ஒரு புறாவை கவரவே',
  'why.warranty-forbade-it': 'உத்தரவாதப் பத்திரம் தடை செய்ததால்',
  'why.one-grape': 'ஒரே ஒரு திராட்சைப் பழத்திற்காக',
  'why.never-back-down': 'ஒருபோதும் பின்வாங்காத அவர்களின் குணத்தால்',
  'why.pointless-point': 'யாரும் கேட்காத ஒரு கருத்தை நிரூபிக்கவே',
  'why.for-science': 'அறிவியலுக்காக, ஒருவேளை',
  'why.pure-stubbornness': 'முழுமையான பிடிவாதத்தால்',
  'why.horoscope-said-so': 'ஜாதகம் மிகத் தெளிவாக இருந்ததால்',
  'why.bet-with-themselves': 'தங்களுக்குள் ஒரு பந்தயத்தை முடிக்கவே',
  'why.to-keep-warm': 'சூடாக இருக்கவே',
  'why.because-tuesday': 'அன்று செவ்வாய்க்கிழமை என்பதால்',
  'why.for-a-sticker': 'ஒரே ஒரு பளபளப்பான ஸ்டிக்கருக்காக',
  'why.avoid-homework': 'வீட்டுப்பாடத்தைத் தவிர்க்கவே',
  'why.everyone-else-did': 'மற்ற எல்லோரும் அப்படி செய்ததால்',
  'why.world-record': 'யாரும் கேள்விப்படாத ஒரு சாதனையை முறியடிக்கவே',
  'why.simply-hungry': 'மிகவும் பசியாக இருந்ததால்',
  'why.impress-grandma': 'திருப்தியடையாமலேயே இருந்த ஒரு பாட்டியை கவரவே',
  'why.forgot-the-plan': 'அசல் திட்டத்தை மறந்துவிட்டதால்',
  'why.instructions-said-so': 'வழிமுறைகள் அப்படிச் சொன்னதால்',
  'why.test-a-theory': 'புவியீர்ப்பு பற்றிய ஒரு கோட்பாட்டைச் சோதிக்கவே',
  'why.no-reason': 'எந்தக் காரணமும் இல்லாமல்',

  // ── 6 · ending — full clause after "கடைசியில்" ──────────────────────────────────
  'end.feelings-about-pasta': 'எல்லோருக்கும் பாஸ்தா பற்றி வலுவான உணர்வுகள் இருந்தன',
  'end.duck-complaint': 'ஒரு வாத்து முறையான புகார் அளித்தது',
  'end.nothing-made-sense': 'எதுவும் அர்த்தமாகவில்லை, ஆனாலும் எல்லோரும் மகிழ்ச்சியாக இருந்தனர்',
  'end.lost-receipts': 'ரசீதுகள் தொலைந்தன, அது ஒருவேளை நல்லதுக்கே',
  'end.pigeon-certificates': 'பல புறாக்களுக்குச் சான்றிதழ்கள் வழங்கப்பட்டன',
  'end.fruit-basket': 'மேயர் ஒரு பழக் கூடையை அனுப்பினார்',
  'end.instant-sequel': 'உடனடியாக ஒரு தொடர்ச்சி பாகம் அறிவிக்கப்பட்டது',
  'end.three-country-holiday': 'அது மூன்று நாடுகளில் பொது விடுமுறையானது',
  'end.cloud-looked-away': 'கவனித்துக் கொண்டிருந்த மேகம் இறுதியில் திரும்பிப் பார்த்தது',
  'end.never-spoke-again': 'இதைப் பற்றி மீண்டும் பேச வேண்டாம் என எல்லோரும் ஒப்புக்கொண்டனர்',
  'end.ice-cream-for-all': 'அனைவருக்கும் ஐஸ்கிரீம் போதுமான அளவு இருந்தது',
  'end.someone-had-to-mop': 'யாரோ ஒருவர் முழு தரையையும் துடைக்க வேண்டியிருந்தது',
  'end.museum-exhibit': 'அது ஒரு சிறிய அருங்காட்சியகத்தில் கண்ணாடிக்குள் இடம்பெற்றது',
  'end.a-song-about-it': 'இதைப் பற்றி ஒரு பாடல் எழுதப்பட்டது',
  'end.neighbors-applauded': 'அண்டை வீட்டார் ஜன்னல் வழியாக கைதட்டினார்கள்',
  'end.smelled-like-lemons': 'ஒரு வாரம் முழுவதும் எல்லாம் எலுமிச்சை போல மணந்தது',
  'end.new-holiday-invented': 'அப்போதே ஒரு புதிய விடுமுறை நாள் உருவாக்கப்பட்டது',
  'end.cat-took-credit': 'அருகில் சென்ற ஒரு பூனை எல்லாப் புகழையும் எடுத்துக்கொண்டது',
  'end.everyone-fell-asleep': 'எல்லோரும் ஒரு குவியலாகத் தூங்கிவிட்டனர்',
  'end.indoor-rainbow': 'வீட்டுக்குள் ஒரு வானவில் தோன்றி விட்டுச் செல்ல மறுத்தது',
  'end.instructions-finally-clear': 'வழிமுறைகள் இறுதியாக முழுமையாகப் புரிந்தன',
  'end.home-for-soup': 'எல்லோரும் சூப் சாப்பிட வீடு திரும்பினர்',
};
