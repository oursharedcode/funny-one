// SPDX-License-Identifier: AGPL-3.0-only

// Step 119 (B-29): the Christmas 2026 edition on the landing page, in the
// edition's 20 languages (every one the games ship but ar, he and fa).
//
//  - `play`: the two big buttons to Funny Multi, one under the header and one
//    above the footer, on every page in these languages from the deploy until
//    the free part's last day (owner decisions D1 C and D2, 2026-11-21). The
//    free half shows no price (5A); the paid half swaps in its own line.
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
    play: 'Christmas stories — play free',
    ended: 'The Christmas 2026 edition has ended. Thank you for playing!',
  },
  ru: {
    play: 'Новогодние истории — играйте бесплатно',
    ended: 'Выпуск «Новый год 2027» закончился. Спасибо, что играли!',
  },
  de: {
    play: 'Weihnachtsgeschichten — gratis spielen',
    ended: 'Die Weihnachtsausgabe 2026 ist vorbei. Danke fürs Spielen!',
  },
  fr: {
    play: 'Histoires de Noël — jouez gratuitement',
    ended: 'L’édition Noël 2026 est terminée. Merci d’avoir joué !',
  },
  it: {
    play: 'Storie di Natale — gioca gratis',
    ended: 'L’Edizione Natale 2026 è finita. Grazie per aver giocato!',
  },
  'es-es': {
    play: 'Historias de Navidad — juega gratis',
    ended: 'La Edición Navidad 2026 ha terminado. ¡Gracias por jugar!',
  },
  'es-419': {
    play: 'Historias de Navidad — juega gratis',
    ended: 'La Edición Navidad 2026 terminó. ¡Gracias por jugar!',
  },
  'pt-br': {
    play: 'Histórias de Natal — jogue grátis',
    ended: 'A Edição de Natal 2026 terminou. Obrigado por jogar!',
  },
  uk: {
    play: 'Різдвяні історії — грайте безкоштовно',
    ended: 'Видання «Різдво 2026» завершилося. Дякуємо, що грали!',
  },
  ko: {
    play: '크리스마스 이야기 — 무료로 플레이',
    ended: '2026 크리스마스 에디션이 끝났어요. 함께 놀아 주셔서 고마워요!',
  },
  ja: {
    play: 'クリスマスの物語 — 無料で遊ぶ',
    ended: '2026年クリスマス版は終了しました。遊んでくれてありがとう！',
  },
  zh: {
    play: '圣诞故事 — 免费玩',
    ended: '2026 圣诞特别版已结束。感谢你的游玩！',
  },
  yue: {
    play: '聖誕故事 — 免費玩',
    ended: '2026 聖誕特別版已經完咗。多謝你嚟玩！',
  },
  id: {
    play: 'Cerita Natal — main gratis',
    ended: 'Edisi Natal 2026 sudah berakhir. Terima kasih sudah bermain!',
  },
  sw: {
    play: 'Hadithi za Krismasi — cheza bure',
    ended: 'Toleo la Krismasi 2026 limekwisha. Asante kwa kucheza!',
  },
  yo: {
    play: 'Àwọn ìtàn Kérésìmesì — ṣeré lọ́fẹ̀ẹ́',
    ended: 'Ẹ̀dà Kérésìmesì 2026 ti parí. Ẹ ṣeun tí ẹ ṣeré!',
  },
  hi: {
    play: 'क्रिसमस कहानियाँ — मुफ़्त खेलें',
    ended: 'क्रिसमस 2026 संस्करण समाप्त हो गया है। खेलने के लिए धन्यवाद!',
  },
  ta: {
    play: 'கிறிஸ்துமஸ் கதைகள் — இலவசமாக விளையாடு',
    ended: 'கிறிஸ்துமஸ் 2026 பதிப்பு முடிந்தது. விளையாடியதற்கு நன்றி!',
  },
  te: {
    play: 'క్రిస్మస్ కథలు — ఉచితంగా ఆడండి',
    ended: 'క్రిస్మస్ 2026 ఎడిషన్ ముగిసింది. ఆడినందుకు ధన్యవాదాలు!',
  },
  bn: {
    play: 'বড়দিনের গল্প — বিনামূল্যে খেলো',
    ended: 'বড়দিন 2026 সংস্করণ শেষ হয়েছে। খেলার জন্য ধন্যবাদ!',
  },
};

/** True for a page that carries the edition's buttons. */
export function hasXmas(code: Language): code is XmasLanguage {
  return Object.hasOwn(XMAS_STRINGS, code);
}
