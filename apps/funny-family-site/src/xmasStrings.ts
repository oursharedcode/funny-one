// SPDX-License-Identifier: AGPL-3.0-only

// Step 119 (B-29): the Christmas 2026 edition on the landing page, in the
// edition's 20 languages (every one the games ship but ar, he and fa).
//
//  - `play`: the two big buttons to Funny Multi, one under the header and one
//    above the footer, on every page in these languages from the deploy until
//    the free part's last day (owner decisions D1 C and D2, 2026-11-21). The
//    free half said "Christmas stories — play free"; from Step 126 they say
//    the paid half's "Christmas pack — try it free", still with no price,
//    the pack named with the games' own word for it (`home.packCode`).
//  - `hint`: the tooltip either button shows on hover and keyboard focus,
//    what the free part gives (owner request 2026-11-26, his wording made
//    plainer; the game's own words, "Create a new room" and "a Christmas
//    story" — the lobby's — not the code's "golden").
//  - `ended`: what the page says in their place, from the cut-off, to a
//    visitor sent by /x26 — the QR code on a golden story's download keeps
//    leading to a working page (decisions of 2026-11-21, first set).
//
// English and Russian are the agent's (ru keeps the games' «новогодние
// истории», the edition being «Новый год 2027» there). The other eighteen are
// machine drafts, needs-review, on B-3's pile like the games' own Christmas
// lines, whose words they reuse (apps/funny-multi-client/src/i18n: the lobby's
// Christmas lines and the download's `edition`).

import type { Language } from '@funny/shared';

/** The languages the edition is offered in: chr26's, held to them by a test. */
export type XmasLanguage = Exclude<Language, 'ar' | 'he' | 'fa'>;

export interface XmasStrings {
  play: string;
  hint: string;
  ended: string;
}

export const XMAS_STRINGS: Readonly<Record<XmasLanguage, XmasStrings>> = {
  en: {
    play: 'Christmas pack — try it free',
    hint: 'Create a new room: one of its stories will be a Christmas story. Free, no sign-up.',
    ended: 'The Christmas 2026 edition has ended. Thank you for playing!',
  },
  ru: {
    play: 'Новогодний набор — попробуйте бесплатно',
    hint: 'Создайте новую комнату — одна из её историй будет новогодней. Бесплатно и без регистрации.',
    ended: 'Выпуск «Новый год 2027» закончился. Спасибо, что играли!',
  },
  de: {
    play: 'Weihnachtspaket — gratis ausprobieren',
    hint: 'Erstelle einen neuen Raum: Eine seiner Geschichten wird eine Weihnachtsgeschichte. Kostenlos, ohne Anmeldung.',
    ended: 'Die Weihnachtsausgabe 2026 ist vorbei. Danke fürs Spielen!',
  },
  fr: {
    play: 'Pack de Noël — essayez gratuitement',
    hint: 'Créez une nouvelle salle : l’une de ses histoires sera une histoire de Noël. Gratuit, sans inscription.',
    ended: 'L’édition Noël 2026 est terminée. Merci d’avoir joué !',
  },
  it: {
    play: 'Pacchetto di Natale — provalo gratis',
    hint: 'Crea una nuova stanza: una delle sue storie sarà una storia di Natale. Gratis, senza registrazione.',
    ended: 'L’Edizione Natale 2026 è finita. Grazie per aver giocato!',
  },
  'es-es': {
    play: 'Paquete de Navidad — pruébalo gratis',
    hint: 'Crea una sala nueva: una de sus historias será una historia de Navidad. Gratis y sin registro.',
    ended: 'La Edición Navidad 2026 ha terminado. ¡Gracias por jugar!',
  },
  'es-419': {
    play: 'Paquete de Navidad — pruébalo gratis',
    hint: 'Crea una nueva sala: una de sus historias será una historia de Navidad. Gratis y sin registro.',
    ended: 'La Edición Navidad 2026 terminó. ¡Gracias por jugar!',
  },
  'pt-br': {
    play: 'Pacote de Natal — experimente grátis',
    hint: 'Crie uma nova sala: uma das histórias será uma história de Natal. Grátis, sem cadastro.',
    ended: 'A Edição de Natal 2026 terminou. Obrigado por jogar!',
  },
  uk: {
    play: 'Різдвяний набір — спробуйте безкоштовно',
    hint: 'Створіть нову кімнату — одна з її історій буде різдвяною. Безкоштовно й без реєстрації.',
    ended: 'Видання «Різдво 2026» завершилося. Дякуємо, що грали!',
  },
  ko: {
    play: '크리스마스 팩 — 무료로 체험하기',
    hint: '새 방을 만들면 이야기 하나가 크리스마스 이야기가 돼요. 무료, 가입 없이.',
    ended: '2026 크리스마스 에디션이 끝났어요. 함께 놀아 주셔서 고마워요!',
  },
  ja: {
    play: 'クリスマスパック — 無料で試す',
    hint: '新しいルームを作成すると、物語の1つがクリスマスの物語になります。無料・登録不要。',
    ended: '2026年クリスマス版は終了しました。遊んでくれてありがとう！',
  },
  zh: {
    play: '圣诞故事包 — 免费试玩',
    hint: '创建新房间，其中一个故事会是圣诞故事。免费，无需注册。',
    ended: '2026 圣诞特别版已结束。感谢你的游玩！',
  },
  yue: {
    play: '聖誕故事包 — 免費試玩',
    hint: '建立新房間，其中一個故事會係聖誕故事。免費，唔使登記。',
    ended: '2026 聖誕特別版已經完咗。多謝你嚟玩！',
  },
  id: {
    play: 'Paket Natal — coba gratis',
    hint: 'Buat ruangan baru: salah satu ceritanya akan menjadi cerita Natal. Gratis, tanpa daftar.',
    ended: 'Edisi Natal 2026 sudah berakhir. Terima kasih sudah bermain!',
  },
  sw: {
    play: 'Kifurushi cha Krismasi — kijaribu bure',
    hint: 'Unda chumba kipya: mojawapo ya hadithi zake itakuwa hadithi ya Krismasi. Bure, bila kujisajili.',
    ended: 'Toleo la Krismasi 2026 limekwisha. Asante kwa kucheza!',
  },
  yo: {
    play: 'Àpò Kérésìmesì — gbìyànjú rẹ̀ lọ́fẹ̀ẹ́',
    hint: 'Ṣẹ̀dá yàrá tuntun: ọ̀kan nínú àwọn ìtàn rẹ̀ yóò jẹ́ ìtàn Kérésìmesì. Ọ̀fẹ́ ni, kò sí ìforúkọsílẹ̀.',
    ended: 'Ẹ̀dà Kérésìmesì 2026 ti parí. Ẹ ṣeun tí ẹ ṣeré!',
  },
  hi: {
    play: 'क्रिसमस पैक — मुफ़्त में आज़माएँ',
    hint: 'नया रूम बनाएँ: उसकी कहानियों में से एक क्रिसमस कहानी होगी। मुफ़्त, बिना साइन-अप।',
    ended: 'क्रिसमस 2026 संस्करण समाप्त हो गया है। खेलने के लिए धन्यवाद!',
  },
  ta: {
    play: 'கிறிஸ்துமஸ் தொகுப்பு — இலவசமாக முயற்சி செய்',
    hint: 'புதிய அறையை உருவாக்குங்கள்: அதன் கதைகளில் ஒன்று கிறிஸ்துமஸ் கதையாக இருக்கும். இலவசம், பதிவு தேவையில்லை.',
    ended: 'கிறிஸ்துமஸ் 2026 பதிப்பு முடிந்தது. விளையாடியதற்கு நன்றி!',
  },
  te: {
    play: 'క్రిస్మస్ ప్యాక్ — ఉచితంగా ప్రయత్నించండి',
    hint: 'కొత్త రూమ్ సృష్టించండి: అందులో ఒక కథ క్రిస్మస్ కథ అవుతుంది. ఉచితం, సైన్-అప్ అక్కర్లేదు.',
    ended: 'క్రిస్మస్ 2026 ఎడిషన్ ముగిసింది. ఆడినందుకు ధన్యవాదాలు!',
  },
  bn: {
    play: 'বড়দিনের প্যাক — বিনামূল্যে চেষ্টা করে দেখো',
    hint: 'নতুন রুম তৈরি করো: তার একটি গল্প হবে বড়দিনের গল্প। বিনামূল্যে, সাইন-আপ ছাড়াই।',
    ended: 'বড়দিন 2026 সংস্করণ শেষ হয়েছে। খেলার জন্য ধন্যবাদ!',
  },
};

/** True for a page that carries the edition's buttons. */
export function hasXmas(code: Language): code is XmasLanguage {
  return Object.hasOwn(XMAS_STRINGS, code);
}
