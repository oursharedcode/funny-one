// SPDX-License-Identifier: AGPL-3.0-only

// The Christmas invitation (Step 126, B-29 improvement #2): what a Christmas
// room's Invite button hands the share sheet, and what the join link's
// preview says when a messenger fetches it. One table for both, so the line a
// friend reads in the message and the card under it never disagree: the
// client's lobby takes the player's own language, the server's preview the
// room's.
//
// Every language the games ship, not only chr26's 20: a player reading the
// interface in ar, he or fa can sit in a Christmas room of another language
// (owner decision 4A) and still invite from it.
//
// `title` names the game as each catalogue's `home.title` does (a test holds
// them together); neither half carries a price or a code (rule 5A) — the link
// is the room's ordinary one. English and Russian are the agent's; the other
// 21 are machine drafts, needs-review, on B-3's pile.

import type { Language } from '../languages.js';

export interface PackInvite {
  /** The first sentence: the preview card's title. */
  readonly title: string;
  /** The rest: the preview card's description. */
  readonly line: string;
}

export const PACK_INVITES: Readonly<Record<Language, PackInvite>> = {
  en: {
    title: 'Join my Christmas game of Funny Multi!',
    line: 'We make up silly Christmas stories together, and each one becomes a cartoon 🎄',
  },
  ru: {
    title: 'Заходи в мою новогоднюю игру «Чепуха 37»!',
    line: 'Вместе сочиняем смешные новогодние истории, и каждая становится мультиком 🎄',
  },
  de: {
    title: 'Spiel mit bei meinem Weihnachtsspiel „Lustige Geschichten“!',
    line: 'Wir denken uns zusammen lustige Weihnachtsgeschichten aus, und jede wird ein Cartoon 🎄',
  },
  fr: {
    title: 'Rejoins ma partie de Noël d’Histoires Drôles !',
    line: 'On invente ensemble des histoires de Noël rigolotes, et chacune devient un dessin animé 🎄',
  },
  it: {
    title: 'Unisciti alla mia partita di Natale di Storie Divertenti!',
    line: 'Inventiamo insieme storie di Natale buffe, e ognuna diventa un cartone animato 🎄',
  },
  'es-es': {
    title: '¡Únete a mi partida de Navidad de Historias Divertidas!',
    line: 'Inventamos juntos historias de Navidad graciosas, y cada una se convierte en un dibujo animado 🎄',
  },
  'es-419': {
    title: '¡Únete a mi juego de Navidad de Historias Divertidas!',
    line: 'Inventamos juntos historias de Navidad chistosas, y cada una se convierte en una caricatura 🎄',
  },
  'pt-br': {
    title: 'Entra no meu jogo de Natal de Histórias Engraçadas!',
    line: 'A gente inventa junto histórias de Natal engraçadas, e cada uma vira um desenho animado 🎄',
  },
  uk: {
    title: 'Заходь у мою різдвяну гру «Кумедні історії»!',
    line: 'Разом вигадуємо смішні різдвяні історії, і кожна стає мультиком 🎄',
  },
  ko: {
    title: '제 「재미있는 이야기」 크리스마스 게임에 함께해요!',
    line: '같이 웃긴 크리스마스 이야기를 만들면, 이야기마다 만화가 돼요 🎄',
  },
  ja: {
    title: '「おもしろストーリー」のクリスマスゲームに参加しよう！',
    line: 'みんなでおかしなクリスマスの物語を作ると、ひとつずつ漫画になるよ 🎄',
  },
  zh: {
    title: '来加入我的「搞笑故事」圣诞游戏吧！',
    line: '我们一起编搞笑的圣诞故事，每个故事都会变成一幅漫画 🎄',
  },
  yue: {
    title: '嚟加入我嘅「無厘頭故事」聖誕遊戲啦！',
    line: '我哋一齊作搞笑聖誕故事，每個故事都會變成一幅漫畫 🎄',
  },
  id: {
    title: 'Ayo gabung ke permainan Natal Cerita Lucu-ku!',
    line: 'Kita bikin cerita Natal yang kocak bareng, dan setiap cerita jadi kartun 🎄',
  },
  sw: {
    title: 'Jiunge na mchezo wangu wa Krismasi wa Hadithi za Kuchekesha!',
    line: 'Tunatunga pamoja hadithi za Krismasi za kuchekesha, na kila moja inakuwa katuni 🎄',
  },
  yo: {
    title: 'Darapọ̀ mọ́ eré Kérésìmesì Ìtàn Àwàdà mi!',
    line: 'A jọ ń hùmọ̀ àwọn ìtàn Kérésìmesì alárinrin, ọ̀kọ̀ọ̀kan sì ń di àwòrán eré 🎄',
  },
  hi: {
    title: 'मेरे क्रिसमस खेल “मज़ेदार कहानियाँ” में आओ!',
    line: 'हम साथ मिलकर मज़ेदार क्रिसमस कहानियाँ बनाते हैं, और हर कहानी एक कार्टून बन जाती है 🎄',
  },
  ta: {
    title: 'என் “வேடிக்கையான கதைகள்” கிறிஸ்துமஸ் விளையாட்டில் சேர்ந்துகொள்!',
    line: 'நாம் சேர்ந்து வேடிக்கையான கிறிஸ்துமஸ் கதைகளை உருவாக்குகிறோம், ஒவ்வொன்றும் ஒரு கார்ட்டூன் ஆகிறது 🎄',
  },
  te: {
    title: 'నా “సరదా కథలు” క్రిస్మస్ ఆటలో చేరండి!',
    line: 'మనం కలిసి సరదా క్రిస్మస్ కథలు అల్లుతాం, ప్రతి కథ ఒక కార్టూన్ అవుతుంది 🎄',
  },
  bn: {
    title: 'আমার “মজার গল্প” বড়দিনের খেলায় চলে এসো!',
    line: 'আমরা একসাথে মজার বড়দিনের গল্প বানাই, আর প্রতিটা গল্প একটা কার্টুন হয়ে যায় 🎄',
  },
  ar: {
    title: 'انضمّ إلى لعبتي «حكايات مضحكة» بنسخة عيد الميلاد!',
    line: 'نؤلّف معًا حكايات مضحكة عن عيد الميلاد، وتصير كلّ حكاية رسمًا كرتونيًا 🎄',
  },
  he: {
    title: 'בואו להצטרף למשחק חג המולד שלי ב„סיפורים מצחיקים”!',
    line: 'ממציאים יחד סיפורי חג מולד מצחיקים, וכל סיפור הופך לסרט מצויר 🎄',
  },
  fa: {
    title: 'به بازی کریسمسی «قصه‌های بامزه» من بیا!',
    line: 'با هم قصه‌های بامزهٔ کریسمسی می‌سازیم و هر قصه یک کارتون می‌شود 🎄',
  },
};

/**
 * The whole invitation, as the share sheet sends it: the title, then the line
 * — after a space, but straight on after a full-width "！" (ja, zh, yue), as
 * those languages write it.
 */
export function inviteText(language: Language): string {
  const { title, line } = PACK_INVITES[language];
  return title.endsWith('！') ? `${title}${line}` : `${title} ${line}`;
}
