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
  ended: string;
}

export const XMAS_STRINGS: Readonly<Record<XmasLanguage, XmasStrings>> = {
  en: {
    play: 'Christmas pack — try it free',
    ended: 'The Christmas 2026 edition has ended. Thank you for playing!',
  },
  ru: {
    play: 'Новогодний набор — попробуйте бесплатно',
    ended: 'Выпуск «Новый год 2027» закончился. Спасибо, что играли!',
  },
  de: {
    play: 'Weihnachtspaket — gratis ausprobieren',
    ended: 'Die Weihnachtsausgabe 2026 ist vorbei. Danke fürs Spielen!',
  },
  fr: {
    play: 'Pack de Noël — essayez gratuitement',
    ended: 'L’édition Noël 2026 est terminée. Merci d’avoir joué !',
  },
  it: {
    play: 'Pacchetto di Natale — provalo gratis',
    ended: 'L’Edizione Natale 2026 è finita. Grazie per aver giocato!',
  },
  'es-es': {
    play: 'Paquete de Navidad — pruébalo gratis',
    ended: 'La Edición Navidad 2026 ha terminado. ¡Gracias por jugar!',
  },
  'es-419': {
    play: 'Paquete de Navidad — pruébalo gratis',
    ended: 'La Edición Navidad 2026 terminó. ¡Gracias por jugar!',
  },
  'pt-br': {
    play: 'Pacote de Natal — experimente grátis',
    ended: 'A Edição de Natal 2026 terminou. Obrigado por jogar!',
  },
  uk: {
    play: 'Різдвяний набір — спробуйте безкоштовно',
    ended: 'Видання «Різдво 2026» завершилося. Дякуємо, що грали!',
  },
  ko: {
    play: '크리스마스 팩 — 무료로 체험하기',
    ended: '2026 크리스마스 에디션이 끝났어요. 함께 놀아 주셔서 고마워요!',
  },
  ja: {
    play: 'クリスマスパック — 無料で試す',
    ended: '2026年クリスマス版は終了しました。遊んでくれてありがとう！',
  },
  zh: {
    play: '圣诞故事包 — 免费试玩',
    ended: '2026 圣诞特别版已结束。感谢你的游玩！',
  },
  yue: {
    play: '聖誕故事包 — 免費試玩',
    ended: '2026 聖誕特別版已經完咗。多謝你嚟玩！',
  },
  id: {
    play: 'Paket Natal — coba gratis',
    ended: 'Edisi Natal 2026 sudah berakhir. Terima kasih sudah bermain!',
  },
  sw: {
    play: 'Kifurushi cha Krismasi — kijaribu bure',
    ended: 'Toleo la Krismasi 2026 limekwisha. Asante kwa kucheza!',
  },
  yo: {
    play: 'Àpò Kérésìmesì — gbìyànjú rẹ̀ lọ́fẹ̀ẹ́',
    ended: 'Ẹ̀dà Kérésìmesì 2026 ti parí. Ẹ ṣeun tí ẹ ṣeré!',
  },
  hi: {
    play: 'क्रिसमस पैक — मुफ़्त में आज़माएँ',
    ended: 'क्रिसमस 2026 संस्करण समाप्त हो गया है। खेलने के लिए धन्यवाद!',
  },
  ta: {
    play: 'கிறிஸ்துமஸ் தொகுப்பு — இலவசமாக முயற்சி செய்',
    ended: 'கிறிஸ்துமஸ் 2026 பதிப்பு முடிந்தது. விளையாடியதற்கு நன்றி!',
  },
  te: {
    play: 'క్రిస్మస్ ప్యాక్ — ఉచితంగా ప్రయత్నించండి',
    ended: 'క్రిస్మస్ 2026 ఎడిషన్ ముగిసింది. ఆడినందుకు ధన్యవాదాలు!',
  },
  bn: {
    play: 'বড়দিনের প্যাক — বিনামূল্যে চেষ্টা করে দেখো',
    ended: 'বড়দিন 2026 সংস্করণ শেষ হয়েছে। খেলার জন্য ধন্যবাদ!',
  },
};

/** True for a page that carries the edition's buttons. */
export function hasXmas(code: Language): code is XmasLanguage {
  return Object.hasOwn(XMAS_STRINGS, code);
}
