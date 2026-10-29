// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: the landing page's text in every language the games ship
// (@funny/shared LANGUAGES). English is the master. Russian is reviewed and
// uses the binding names: «Семейная Чепуха» for the family of games,
// «Чепуха 37» and «Одна Чепуха: по кругу» for the two games. The other
// twenty-one are machine-quality drafts awaiting a native speaker, exactly like
// the games' own catalogs (FM-POOL-5, task B-3).
//
// A game's name is never written here: GAME_NAMES copies what each game calls
// itself, and strings.test.ts fails when a game's catalog changes and this
// copy does not.

import type { Language } from '@funny/shared';

export interface HubStrings {
  /** The family of games — the site's name in the header and link previews. */
  brand: string;
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroLead: string;
  gamesTitle: string;
  /** Who plays Funny Multi and how, in a few words. */
  fmTag: string;
  fmText: string;
  /** Who plays Funny One and how, in a few words. */
  foTag: string;
  foText: string;
  play: string;
  howTitle: string;
  how1: string;
  how2: string;
  how3: string;
  /** Variant A: the trailer card's play button, for screen readers. */
  videoPlay: string;
  videoCaption: string;
  /** Variant B: the background loop's pause and play button. */
  videoPause: string;
  videoResume: string;
  ghTitle: string;
  ghText: string;
  langLabel: string;
  privacyNote: string;
  privacyLink: string;
  /** `{link}` is the author's site. */
  footerMore: string;
  skip: string;
}

export interface GameNames {
  /** Funny Multi's home.title. */
  fm: string;
  /** Funny One's home.title. */
  fo: string;
  /** Funny Multi's footer.source: what a screen reader hears before each repository tile. */
  source: string;
}

export const GAME_NAMES: Record<Language, GameNames> = {
  en: { fm: 'Funny Multi', fo: 'Funny One', source: 'Source on GitHub' },
  fr: { fm: 'Histoires Drôles', fo: 'Une Histoire à la Ronde', source: 'Source sur GitHub' },
  de: { fm: 'Lustige Geschichten', fo: 'Unsinn im Kreis', source: 'Quelle auf GitHub' },
  ru: { fm: 'Чепуха 37', fo: 'Одна Чепуха: по кругу', source: 'Исходный код на GitHub' },
  id: { fm: 'Cerita Lucu', fo: 'Cerita Berputar', source: 'Sumber di GitHub' },
  it: { fm: 'Storie Divertenti', fo: 'Storia a Catena', source: 'Sorgente su GitHub' },
  zh: { fm: '搞笑故事', fo: '故事接龙', source: 'GitHub 上的源代码' },
  yue: { fm: '無厘頭故事', fo: '輪流講故仔', source: 'GitHub 上嘅原始碼' },
  ja: { fm: 'おもしろストーリー', fo: 'パスストーリー', source: 'GitHub のソース' },
  ko: { fm: '재미있는 이야기', fo: '패스 스토리', source: 'GitHub 소스' },
  'pt-br': { fm: 'Histórias Engraçadas', fo: 'Conta e Passa', source: 'Fonte no GitHub' },
  'es-419': { fm: 'Historias Divertidas', fo: 'Contá y Pasá', source: 'Fuente en GitHub' },
  'es-es': { fm: 'Historias Divertidas', fo: 'Cuenta y Pasa', source: 'Fuente en GitHub' },
  uk: { fm: 'Кумедні історії', fo: 'Історія по колу', source: 'Вихідний код на GitHub' },
  he: { fm: 'סיפורים מצחיקים', fo: 'סיפור מתגלגל', source: 'קוד המקור ב-GitHub' },
  fa: { fm: 'قصه‌های بامزه', fo: 'قصهٔ دست‌به‌دست', source: 'کد منبع در GitHub' },
  ta: { fm: 'வேடிக்கையான கதைகள்', fo: 'சுற்றுக் கதை', source: 'GitHub இல் மூலக் குறியீடு' },
  hi: { fm: 'मज़ेदार कहानियाँ', fo: 'बारी-बारी कहानी', source: 'GitHub पर सोर्स कोड' },
  te: { fm: 'సరదా కథలు', fo: 'గొలుసు కథ', source: 'GitHubలో సోర్స్ కోడ్' },
  bn: { fm: 'মজার গল্প', fo: 'হাতে হাতে গল্প', source: 'GitHub-এ সোর্স কোড' },
  ar: { fm: 'حكايات مضحكة', fo: 'حكاية بالدور', source: 'الشيفرة المصدرية على GitHub' },
  sw: {
    fm: 'Hadithi za Kuchekesha',
    fo: 'Hadithi ya Kupokezana',
    source: 'Msimbo chanzo kwenye GitHub',
  },
  yo: { fm: 'Ìtàn Àwàdà', fo: 'Ìtàn Yíká Tábìlì', source: 'Kóòdù orísun lórí GitHub' },
};

export const STRINGS: Record<Language, HubStrings> = {
  en: {
    brand: 'Funny Family',
    metaTitle: 'Funny Family — silly story games to play together',
    metaDescription:
      'Two free party games for friends and family: pick absurd answers, get silly stories, and watch each one become a cartoon. Play in your browser, in 23 languages.',
    heroTitle: 'Silly stories, made together',
    heroLead:
      'Two free party games for friends and family. Everyone picks absurd answers, the game mixes them into stories, and each story becomes a cartoon.',
    gamesTitle: 'Pick a game',
    fmTag: '3–7 players · each on their own phone',
    fmText:
      'Create a room and share the link or QR code. Everyone answers on their own phone, then the stories are revealed one by one — each with its own cartoon.',
    foTag: '2–7 players · one phone, passed around',
    foText:
      "No room, no sign-up, no internet needed. Pass the phone around the table, and add virtual players if you're short of people.",
    play: 'Play now',
    howTitle: 'How it works',
    how1: 'Each round brings a playful question — pick an answer from a list of funny options.',
    how2: "The game mixes everyone's answers into absurd little stories.",
    how3: 'Each story becomes a cartoon. Read them out loud and laugh together.',
    videoPlay: 'Play the video',
    videoCaption: 'Watch the trailer (6 s)',
    videoPause: 'Pause background video',
    videoResume: 'Play background video',
    ghTitle: 'Free and open source',
    ghText:
      'Both games are open source under the AGPL-3.0 licence. Read the code, suggest a fix or run your own server.',
    langLabel: 'Language',
    privacyNote: 'No cookies and no ads. This page counts visits and clicks, never who you are.',
    privacyLink: 'Privacy policy',
    footerMore: 'More free things at {link}',
    skip: 'Skip to content',
  },
  fr: {
    brand: 'Drôle de famille',
    metaTitle: "Drôle de famille — des jeux d'histoires loufoques à jouer ensemble",
    metaDescription:
      "Deux jeux d'ambiance gratuits pour les amis et la famille : choisissez des réponses absurdes, obtenez des histoires loufoques, et chacune devient un dessin. Dans le navigateur, en 23 langues.",
    heroTitle: 'Des histoires loufoques, inventées ensemble',
    heroLead:
      "Deux jeux d'ambiance gratuits pour les amis et la famille. Chacun choisit des réponses absurdes, le jeu les mélange en histoires, et chaque histoire devient un dessin.",
    gamesTitle: 'Choisissez un jeu',
    fmTag: '3 à 7 joueurs · chacun sur son téléphone',
    fmText:
      'Créez une salle et partagez le lien ou le QR code. Chacun répond sur son propre téléphone, puis les histoires sont dévoilées une à une — chacune avec son dessin.',
    foTag: '2 à 7 joueurs · un seul téléphone qui circule',
    foText:
      "Pas de salle, pas d'inscription, pas besoin d'internet. Faites circuler le téléphone autour de la table, et ajoutez des joueurs virtuels s'il manque du monde.",
    play: 'Jouer',
    howTitle: 'Comment ça marche',
    how1: "Chaque manche pose une question amusante : choisissez une réponse dans une liste d'options drôles.",
    how2: 'Le jeu mélange les réponses de tous en petites histoires absurdes.',
    how3: 'Chaque histoire devient un dessin. Lisez-les à voix haute et riez ensemble.',
    videoPlay: 'Lire la vidéo',
    videoCaption: 'Voir la bande-annonce (6 s)',
    videoPause: "Mettre en pause la vidéo d'arrière-plan",
    videoResume: "Lire la vidéo d'arrière-plan",
    ghTitle: 'Gratuit et open source',
    ghText:
      'Les deux jeux sont open source sous licence AGPL-3.0. Lisez le code, proposez une correction ou hébergez votre propre serveur.',
    langLabel: 'Langue',
    privacyNote:
      'Pas de cookies, pas de publicité. Cette page compte les visites et les clics, jamais qui vous êtes.',
    privacyLink: 'Politique de confidentialité',
    footerMore: "D'autres choses gratuites sur {link}",
    skip: 'Aller au contenu',
  },
  de: {
    brand: 'Familienquatsch',
    metaTitle: 'Familienquatsch – lustige Geschichtenspiele für alle zusammen',
    metaDescription:
      'Zwei kostenlose Partyspiele für Freunde und Familie: Wählt absurde Antworten, bekommt verrückte Geschichten – und jede wird zum Cartoon. Im Browser, in 23 Sprachen.',
    heroTitle: 'Verrückte Geschichten, gemeinsam erfunden',
    heroLead:
      'Zwei kostenlose Partyspiele für Freunde und Familie. Alle wählen absurde Antworten, das Spiel mischt sie zu Geschichten, und jede Geschichte wird zum Cartoon.',
    gamesTitle: 'Wählt ein Spiel',
    fmTag: '3–7 Spieler · jeder am eigenen Handy',
    fmText:
      'Erstellt einen Raum und teilt den Link oder QR-Code. Jeder antwortet am eigenen Handy, dann werden die Geschichten nacheinander enthüllt – jede mit ihrem eigenen Cartoon.',
    foTag: '2–7 Spieler · ein Handy, das reihum geht',
    foText:
      'Kein Raum, keine Anmeldung, kein Internet nötig. Gebt das Handy reihum weiter und nehmt virtuelle Mitspieler dazu, wenn ihr zu wenige seid.',
    play: 'Jetzt spielen',
    howTitle: 'So funktioniert’s',
    how1: 'Jede Runde bringt eine verspielte Frage – wählt eine Antwort aus einer Liste lustiger Möglichkeiten.',
    how2: 'Das Spiel mischt die Antworten aller zu kleinen absurden Geschichten.',
    how3: 'Jede Geschichte wird zum Cartoon. Lest sie laut vor und lacht zusammen.',
    videoPlay: 'Video abspielen',
    videoCaption: 'Trailer ansehen (6 s)',
    videoPause: 'Hintergrundvideo anhalten',
    videoResume: 'Hintergrundvideo abspielen',
    ghTitle: 'Kostenlos und Open Source',
    ghText:
      'Beide Spiele sind Open Source unter der Lizenz AGPL-3.0. Lest den Code, schlagt Verbesserungen vor oder betreibt euren eigenen Server.',
    langLabel: 'Sprache',
    privacyNote:
      'Keine Cookies, keine Werbung. Diese Seite zählt Besuche und Klicks – aber nie, wer ihr seid.',
    privacyLink: 'Datenschutzerklärung',
    footerMore: 'Mehr Kostenloses auf {link}',
    skip: 'Zum Inhalt springen',
  },
  ru: {
    brand: 'Семейная Чепуха',
    metaTitle: 'Семейная Чепуха — смешные истории, которые сочиняют вместе',
    metaDescription:
      'Две бесплатные игры для друзей и семьи: выбирайте нелепые ответы, получайте смешные истории — и каждая превращается в рисунок. Играйте в браузере, на 23 языках.',
    heroTitle: 'Смешные истории — вместе',
    heroLead:
      'Две бесплатные игры для компании и семьи. Каждый выбирает нелепые ответы, игра собирает из них истории, и каждая история превращается в рисунок.',
    gamesTitle: 'Выберите игру',
    fmTag: '3–7 игроков · у каждого свой телефон',
    fmText:
      'Создайте комнату и поделитесь ссылкой или QR-кодом. Каждый отвечает на своём телефоне, а потом истории открываются одна за другой — и у каждой свой рисунок.',
    foTag: '2–7 игроков · один телефон по кругу',
    foText:
      'Без комнаты, без регистрации, без интернета. Передавайте телефон по кругу, а если людей не хватает — добавьте виртуальных игроков.',
    play: 'Играть',
    howTitle: 'Как играть',
    how1: 'В каждом раунде — шутливый вопрос: выберите ответ из списка смешных вариантов.',
    how2: 'Игра смешивает ответы всех игроков в короткие нелепые истории.',
    how3: 'Каждая история превращается в рисунок. Читайте вслух и смейтесь вместе.',
    videoPlay: 'Смотреть видео',
    videoCaption: 'Трейлер (6 с)',
    videoPause: 'Остановить фоновое видео',
    videoResume: 'Включить фоновое видео',
    ghTitle: 'Бесплатно и с открытым кодом',
    ghText:
      'Обе игры — с открытым исходным кодом по лицензии AGPL-3.0. Читайте код, предлагайте исправления или запустите свой сервер.',
    langLabel: 'Язык',
    privacyNote:
      'Без cookies и без рекламы. Страница считает посещения и клики, но не узнаёт, кто вы.',
    privacyLink: 'Политика конфиденциальности',
    footerMore: 'Ещё бесплатное — на {link}',
    skip: 'Перейти к содержимому',
  },
  id: {
    brand: 'Keluarga Lucu',
    metaTitle: 'Keluarga Lucu — game cerita konyol untuk dimainkan bersama',
    metaDescription:
      'Dua game pesta gratis untuk teman dan keluarga: pilih jawaban absurd, dapatkan cerita konyol, dan lihat setiap cerita menjadi kartun. Main di browser, dalam 23 bahasa.',
    heroTitle: 'Cerita konyol, dibuat bersama',
    heroLead:
      'Dua game pesta gratis untuk teman dan keluarga. Semua memilih jawaban absurd, game meraciknya menjadi cerita, dan setiap cerita menjadi kartun.',
    gamesTitle: 'Pilih game',
    fmTag: '3–7 pemain · masing-masing di ponselnya sendiri',
    fmText:
      'Buat ruang dan bagikan tautan atau kode QR. Setiap orang menjawab di ponselnya sendiri, lalu cerita dibuka satu per satu — masing-masing dengan kartunnya.',
    foTag: '2–7 pemain · satu ponsel, bergiliran',
    foText:
      'Tanpa ruang, tanpa daftar, tanpa internet. Oper ponsel keliling meja, dan tambahkan pemain virtual kalau orangnya kurang.',
    play: 'Main sekarang',
    howTitle: 'Cara bermain',
    how1: 'Setiap ronde ada pertanyaan jenaka — pilih jawaban dari daftar pilihan yang lucu.',
    how2: 'Game mencampur jawaban semua pemain menjadi cerita-cerita pendek yang absurd.',
    how3: 'Setiap cerita menjadi kartun. Bacakan keras-keras dan tertawa bersama.',
    videoPlay: 'Putar video',
    videoCaption: 'Tonton trailernya (6 dtk)',
    videoPause: 'Jeda video latar',
    videoResume: 'Putar video latar',
    ghTitle: 'Gratis dan sumber terbuka',
    ghText:
      'Kedua game bersumber terbuka dengan lisensi AGPL-3.0. Baca kodenya, usulkan perbaikan, atau jalankan server sendiri.',
    langLabel: 'Bahasa',
    privacyNote:
      'Tanpa cookie dan tanpa iklan. Halaman ini menghitung kunjungan dan klik, tidak pernah siapa Anda.',
    privacyLink: 'Kebijakan privasi',
    footerMore: 'Hal gratis lainnya di {link}',
    skip: 'Langsung ke konten',
  },
  it: {
    brand: 'Famiglia Divertente',
    metaTitle: 'Famiglia Divertente — giochi di storie buffe da fare insieme',
    metaDescription:
      'Due giochi di società gratuiti per amici e famiglia: scegliete risposte assurde, ottenete storie buffe e guardate ognuna diventare un disegno. Nel browser, in 23 lingue.',
    heroTitle: 'Storie buffe, inventate insieme',
    heroLead:
      'Due giochi di società gratuiti per amici e famiglia. Ognuno sceglie risposte assurde, il gioco le mescola in storie e ogni storia diventa un disegno.',
    gamesTitle: 'Scegliete un gioco',
    fmTag: '3–7 giocatori · ognuno sul proprio telefono',
    fmText:
      'Create una stanza e condividete il link o il codice QR. Ognuno risponde sul proprio telefono, poi le storie vengono svelate una alla volta, ognuna con il suo disegno.',
    foTag: '2–7 giocatori · un solo telefono che passa di mano',
    foText:
      'Niente stanza, niente registrazione, niente internet. Passatevi il telefono intorno al tavolo e aggiungete giocatori virtuali se siete in pochi.',
    play: 'Gioca',
    howTitle: 'Come funziona',
    how1: 'Ogni turno porta una domanda scherzosa: scegliete una risposta da un elenco di opzioni divertenti.',
    how2: 'Il gioco mescola le risposte di tutti in piccole storie assurde.',
    how3: 'Ogni storia diventa un disegno. Leggetele ad alta voce e ridete insieme.',
    videoPlay: 'Guarda il video',
    videoCaption: 'Guarda il trailer (6 s)',
    videoPause: 'Metti in pausa il video di sfondo',
    videoResume: 'Riproduci il video di sfondo',
    ghTitle: 'Gratis e open source',
    ghText:
      'Entrambi i giochi sono open source con licenza AGPL-3.0. Leggete il codice, proponete una correzione o gestite il vostro server.',
    langLabel: 'Lingua',
    privacyNote:
      'Niente cookie e niente pubblicità. Questa pagina conta visite e clic, mai chi sei.',
    privacyLink: 'Informativa sulla privacy',
    footerMore: 'Altre cose gratuite su {link}',
    skip: 'Vai al contenuto',
  },
  zh: {
    brand: '搞笑一家',
    metaTitle: '搞笑一家 — 一起玩的爆笑故事游戏',
    metaDescription:
      '两款面向朋友和家人的免费聚会游戏：选出荒诞的答案，拼成爆笑故事，每个故事都会变成一幅漫画。在浏览器中即可玩，支持 23 种语言。',
    heroTitle: '一起编出爆笑故事',
    heroLead:
      '两款面向朋友和家人的免费聚会游戏。每个人挑选荒诞的答案，游戏把它们拼成故事，每个故事都会变成一幅漫画。',
    gamesTitle: '选择游戏',
    fmTag: '3–7 名玩家 · 每人用自己的手机',
    fmText:
      '创建房间，分享链接或二维码。每个人在自己的手机上作答，然后故事逐个揭晓——每个故事都配有自己的漫画。',
    foTag: '2–7 名玩家 · 一部手机轮流传',
    foText: '无需房间，无需注册，无需联网。围着桌子传手机；人不够时，还可以加入虚拟玩家。',
    play: '开始玩',
    howTitle: '玩法',
    how1: '每一轮都有一个有趣的问题——从一串搞笑选项中挑一个答案。',
    how2: '游戏把大家的答案混在一起，编成荒诞的小故事。',
    how3: '每个故事都会变成一幅漫画。大声读出来，一起开怀大笑。',
    videoPlay: '播放视频',
    videoCaption: '观看预告片（6 秒）',
    videoPause: '暂停背景视频',
    videoResume: '播放背景视频',
    ghTitle: '免费且开源',
    ghText: '两款游戏均以 AGPL-3.0 许可证开源。你可以阅读代码、提出修改建议，或运行自己的服务器。',
    langLabel: '语言',
    privacyNote: '没有 Cookie，没有广告。本页面只统计访问和点击次数，从不识别你是谁。',
    privacyLink: '隐私政策',
    footerMore: '更多免费内容请访问 {link}',
    skip: '跳到正文',
  },
  yue: {
    brand: '搞笑一家親',
    metaTitle: '搞笑一家親 — 一家大細一齊玩嘅爆笑故事遊戲',
    metaDescription:
      '兩款畀朋友同屋企人玩嘅免費派對遊戲：揀啲無厘頭答案，砌出爆笑故事，每個故事仲會變成一幅漫畫。用瀏覽器就玩得，有 23 種語言。',
    heroTitle: '一齊砌出嚟嘅爆笑故事',
    heroLead:
      '兩款畀朋友同屋企人玩嘅免費派對遊戲。個個揀啲無厘頭答案，遊戲將佢哋撈埋一齊變成故事，每個故事仲會變成一幅漫畫。',
    gamesTitle: '揀個遊戲',
    fmTag: '3–7 個玩家 · 每人用自己部手機',
    fmText:
      '建立房間，分享連結或者 QR code。個個喺自己部手機度作答，跟住啲故事逐個揭曉——每個都有自己嘅漫畫。',
    foTag: '2–7 個玩家 · 一部手機輪流傳',
    foText: '唔使房間、唔使登記、唔使上網。圍住張枱傳手機玩；人唔夠嘅話，仲可以加虛擬玩家。',
    play: '即刻玩',
    howTitle: '點樣玩',
    how1: '每一輪都有一條搞笑問題——喺一堆搞笑選項入面揀一個答案。',
    how2: '遊戲將大家嘅答案撈埋一齊，變成一個個無厘頭小故事。',
    how3: '每個故事都會變成一幅漫畫。大聲讀出嚟，一齊笑到碌地。',
    videoPlay: '播放影片',
    videoCaption: '睇預告片（6 秒）',
    videoPause: '暫停背景影片',
    videoResume: '播放背景影片',
    ghTitle: '免費又開源',
    ghText:
      '兩款遊戲都係以 AGPL-3.0 授權嘅開源軟件。你可以睇吓啲程式碼、提出修正建議，或者自己搭個伺服器嚟行。',
    langLabel: '語言',
    privacyNote: '冇 Cookie，冇廣告。呢個網頁只會數訪問同點擊次數，永遠唔會知道你係邊個。',
    privacyLink: '私隱政策',
    footerMore: '更多免費好嘢喺 {link}',
    skip: '跳到內容',
  },
  ja: {
    brand: 'おもしろファミリー',
    metaTitle: 'おもしろファミリー — みんなで遊べるおもしろストーリーゲーム',
    metaDescription:
      '友だちや家族と遊べる無料のパーティーゲーム2本。とんでもない答えを選ぶとおかしな物語ができあがり、物語はそれぞれイラストになります。ブラウザで遊べて、23言語に対応。',
    heroTitle: 'みんなでつくる、おかしな物語',
    heroLead:
      '友だちや家族と遊べる無料のパーティーゲーム2本。みんながとんでもない答えを選び、ゲームがそれを物語にまとめ、物語はそれぞれイラストになります。',
    gamesTitle: 'ゲームを選ぶ',
    fmTag: '3〜7人 · それぞれ自分のスマホで',
    fmText:
      'ルームを作って、リンクかQRコードを共有。みんなが自分のスマホで答えたら、物語がひとつずつ公開されます。どの物語にもイラスト付き。',
    foTag: '2〜7人 · 1台のスマホを回して',
    foText:
      'ルームも登録もインターネットも不要。テーブルでスマホを回して遊びます。人数が足りなければバーチャルプレイヤーを追加できます。',
    play: '遊ぶ',
    howTitle: '遊び方',
    how1: 'ラウンドごとにおもしろい質問が出ます。おかしな選択肢のリストから答えを選びましょう。',
    how2: 'ゲームがみんなの答えを混ぜて、短いナンセンスな物語にします。',
    how3: '物語はそれぞれイラストになります。声に出して読んで、みんなで笑いましょう。',
    videoPlay: '動画を再生',
    videoCaption: '予告編を見る（6秒）',
    videoPause: '背景動画を一時停止',
    videoResume: '背景動画を再生',
    ghTitle: '無料でオープンソース',
    ghText:
      'どちらのゲームもAGPL-3.0ライセンスのオープンソースです。コードを読んだり、修正を提案したり、自分のサーバーで動かしたりできます。',
    langLabel: '言語',
    privacyNote:
      'Cookieも広告もありません。このページは訪問数とクリック数を数えるだけで、あなたが誰かは記録しません。',
    privacyLink: 'プライバシーポリシー',
    footerMore: 'ほかの無料コンテンツは {link} で',
    skip: '本文へ移動',
  },
  ko: {
    brand: '재미있는 가족',
    metaTitle: '재미있는 가족 — 함께 즐기는 엉뚱한 이야기 게임',
    metaDescription:
      '친구와 가족을 위한 무료 파티 게임 두 가지: 엉뚱한 답을 고르면 웃긴 이야기가 만들어지고, 이야기마다 만화가 됩니다. 브라우저에서 23개 언어로 즐기세요.',
    heroTitle: '함께 만드는 엉뚱한 이야기',
    heroLead:
      '친구와 가족을 위한 무료 파티 게임 두 가지. 모두가 엉뚱한 답을 고르면 게임이 그 답들을 섞어 이야기를 만들고, 이야기마다 만화가 됩니다.',
    gamesTitle: '게임 고르기',
    fmTag: '3–7명 · 각자 자기 휴대폰으로',
    fmText:
      '방을 만들고 링크나 QR 코드를 공유하세요. 모두 자기 휴대폰으로 답하고, 이야기가 하나씩 공개됩니다. 이야기마다 만화가 함께해요.',
    foTag: '2–7명 · 휴대폰 한 대를 돌려 가며',
    foText:
      '방도, 가입도, 인터넷도 필요 없어요. 테이블에서 휴대폰을 돌려 가며 하고, 사람이 모자라면 가상 플레이어를 추가하세요.',
    play: '플레이',
    howTitle: '게임 방법',
    how1: '라운드마다 재미있는 질문이 나옵니다. 웃긴 선택지 목록에서 답을 고르세요.',
    how2: '게임이 모두의 답을 섞어 엉뚱한 짧은 이야기를 만듭니다.',
    how3: '이야기마다 만화가 됩니다. 소리 내어 읽고 함께 웃어요.',
    videoPlay: '동영상 재생',
    videoCaption: '예고편 보기 (6초)',
    videoPause: '배경 동영상 일시정지',
    videoResume: '배경 동영상 재생',
    ghTitle: '무료 오픈 소스',
    ghText:
      '두 게임 모두 AGPL-3.0 라이선스의 오픈 소스입니다. 코드를 읽고, 수정을 제안하거나, 직접 서버를 운영해 보세요.',
    langLabel: '언어',
    privacyNote:
      '쿠키도 광고도 없습니다. 이 페이지는 방문과 클릭 수만 세며, 당신이 누구인지는 알지 못합니다.',
    privacyLink: '개인정보 처리방침',
    footerMore: '더 많은 무료 콘텐츠: {link}',
    skip: '본문으로 건너뛰기',
  },
  'pt-br': {
    brand: 'Família Divertida',
    metaTitle: 'Família Divertida — jogos de histórias malucas para jogar juntos',
    metaDescription:
      'Dois jogos grátis para amigos e família: escolham respostas absurdas, recebam histórias malucas e vejam cada uma virar um desenho. No navegador, em 23 idiomas.',
    heroTitle: 'Histórias malucas, criadas juntos',
    heroLead:
      'Dois jogos grátis para amigos e família. Cada um escolhe respostas absurdas, o jogo mistura tudo em histórias e cada história vira um desenho.',
    gamesTitle: 'Escolham um jogo',
    fmTag: '3–7 jogadores · cada um no seu celular',
    fmText:
      'Criem uma sala e compartilhem o link ou o QR code. Cada um responde no próprio celular, e depois as histórias são reveladas uma a uma — cada uma com seu desenho.',
    foTag: '2–7 jogadores · um celular passando de mão em mão',
    foText:
      'Sem sala, sem cadastro, sem internet. Passem o celular pela mesa e adicionem jogadores virtuais se faltar gente.',
    play: 'Jogar',
    howTitle: 'Como funciona',
    how1: 'Cada rodada traz uma pergunta divertida: escolham uma resposta numa lista de opções engraçadas.',
    how2: 'O jogo mistura as respostas de todos em pequenas histórias absurdas.',
    how3: 'Cada história vira um desenho. Leiam em voz alta e riam juntos.',
    videoPlay: 'Assistir ao vídeo',
    videoCaption: 'Veja o trailer (6 s)',
    videoPause: 'Pausar o vídeo de fundo',
    videoResume: 'Reproduzir o vídeo de fundo',
    ghTitle: 'Grátis e de código aberto',
    ghText:
      'Os dois jogos têm código aberto sob a licença AGPL-3.0. Leiam o código, sugiram uma correção ou rodem o próprio servidor.',
    langLabel: 'Idioma',
    privacyNote:
      'Sem cookies e sem anúncios. Esta página conta visitas e cliques, nunca quem você é.',
    privacyLink: 'Política de privacidade',
    footerMore: 'Mais coisas grátis em {link}',
    skip: 'Pular para o conteúdo',
  },
  'es-419': {
    brand: 'Familia Divertida',
    metaTitle: 'Familia Divertida: juegos de historias disparatadas para jugar juntos',
    metaDescription:
      'Dos juegos gratis para amigos y familia: elijan respuestas absurdas, obtengan historias disparatadas y vean cómo cada una se convierte en un dibujo. En el navegador y en 23 idiomas.',
    heroTitle: 'Historias disparatadas, creadas entre todos',
    heroLead:
      'Dos juegos gratis para amigos y familia. Cada uno elige respuestas absurdas, el juego las mezcla en historias y cada historia se convierte en un dibujo.',
    gamesTitle: 'Elijan un juego',
    fmTag: '3–7 jugadores · cada uno en su celular',
    fmText:
      'Creen una sala y compartan el enlace o el código QR. Cada uno responde en su propio celular y después las historias se revelan una por una, cada una con su dibujo.',
    foTag: '2–7 jugadores · un solo celular que va pasando',
    foText:
      'Sin sala, sin registro y sin necesidad de internet. Pásense el celular alrededor de la mesa y agreguen jugadores virtuales si falta gente.',
    play: 'Jugar',
    howTitle: 'Cómo funciona',
    how1: 'Cada ronda trae una pregunta divertida: elijan una respuesta de una lista de opciones graciosas.',
    how2: 'El juego mezcla las respuestas de todos en pequeñas historias absurdas.',
    how3: 'Cada historia se convierte en un dibujo. Léanlas en voz alta y ríanse juntos.',
    videoPlay: 'Reproducir el video',
    videoCaption: 'Ver el tráiler (6 s)',
    videoPause: 'Pausar el video de fondo',
    videoResume: 'Reproducir el video de fondo',
    ghTitle: 'Gratis y de código abierto',
    ghText:
      'Los dos juegos son de código abierto con licencia AGPL-3.0. Lean el código, propongan una mejora o monten su propio servidor.',
    langLabel: 'Idioma',
    privacyNote:
      'Sin cookies y sin anuncios. Esta página cuenta visitas y clics, pero nunca sabe quién sos.',
    privacyLink: 'Política de privacidad',
    footerMore: 'Más cosas gratis en {link}',
    skip: 'Ir al contenido',
  },
  'es-es': {
    brand: 'Familia Divertida',
    metaTitle: 'Familia Divertida: juegos de historias disparatadas para jugar juntos',
    metaDescription:
      'Dos juegos gratis para amigos y familia: elegid respuestas absurdas, obtened historias disparatadas y mirad cómo cada una se convierte en un dibujo. En el navegador y en 23 idiomas.',
    heroTitle: 'Historias disparatadas, creadas entre todos',
    heroLead:
      'Dos juegos gratis para amigos y familia. Cada uno elige respuestas absurdas, el juego las mezcla en historias y cada historia se convierte en un dibujo.',
    gamesTitle: 'Elegid un juego',
    fmTag: '3–7 jugadores · cada uno con su móvil',
    fmText:
      'Cread una sala y compartid el enlace o el código QR. Cada uno responde en su propio móvil y luego las historias se revelan una a una, cada una con su dibujo.',
    foTag: '2–7 jugadores · un solo móvil que va pasando',
    foText:
      'Sin sala, sin registro y sin necesidad de internet. Pasaos el móvil alrededor de la mesa y añadid jugadores virtuales si faltan personas.',
    play: 'Jugar',
    howTitle: 'Cómo funciona',
    how1: 'Cada ronda trae una pregunta divertida: elegid una respuesta de una lista de opciones graciosas.',
    how2: 'El juego mezcla las respuestas de todos en pequeñas historias absurdas.',
    how3: 'Cada historia se convierte en un dibujo. Leedlas en voz alta y reíos juntos.',
    videoPlay: 'Reproducir el vídeo',
    videoCaption: 'Ver el tráiler (6 s)',
    videoPause: 'Pausar el vídeo de fondo',
    videoResume: 'Reproducir el vídeo de fondo',
    ghTitle: 'Gratis y de código abierto',
    ghText:
      'Los dos juegos son de código abierto con licencia AGPL-3.0. Leed el código, proponed una mejora o montad vuestro propio servidor.',
    langLabel: 'Idioma',
    privacyNote:
      'Sin cookies y sin anuncios. Esta página cuenta visitas y clics, pero nunca sabe quién eres.',
    privacyLink: 'Política de privacidad',
    footerMore: 'Más cosas gratis en {link}',
    skip: 'Ir al contenido',
  },
  uk: {
    brand: 'Кумедна родина',
    metaTitle: 'Кумедна родина — смішні історії, які складають разом',
    metaDescription:
      'Дві безкоштовні ігри для друзів і родини: обирайте безглузді відповіді, отримуйте смішні історії — і кожна стає малюнком. Грайте в браузері, 23 мовами.',
    heroTitle: 'Смішні історії — разом',
    heroLead:
      'Дві безкоштовні ігри для компанії та родини. Кожен обирає безглузді відповіді, гра складає з них історії, і кожна історія стає малюнком.',
    gamesTitle: 'Оберіть гру',
    fmTag: '3–7 гравців · у кожного свій телефон',
    fmText:
      'Створіть кімнату й поділіться посиланням або QR-кодом. Кожен відповідає на своєму телефоні, а потім історії відкриваються одна за одною — і в кожної свій малюнок.',
    foTag: '2–7 гравців · один телефон по колу',
    foText:
      'Без кімнати, без реєстрації, без інтернету. Передавайте телефон по колу, а якщо людей бракує — додайте віртуальних гравців.',
    play: 'Грати',
    howTitle: 'Як грати',
    how1: 'У кожному раунді — жартівливе запитання: оберіть відповідь зі списку смішних варіантів.',
    how2: 'Гра змішує відповіді всіх гравців у короткі безглузді історії.',
    how3: 'Кожна історія стає малюнком. Читайте вголос і смійтеся разом.',
    videoPlay: 'Дивитися відео',
    videoCaption: 'Трейлер (6 с)',
    videoPause: 'Зупинити фонове відео',
    videoResume: 'Увімкнути фонове відео',
    ghTitle: 'Безкоштовно й з відкритим кодом',
    ghText:
      'Обидві гри мають відкритий вихідний код за ліцензією AGPL-3.0. Читайте код, пропонуйте виправлення або запустіть власний сервер.',
    langLabel: 'Мова',
    privacyNote:
      'Без cookies і без реклами. Сторінка рахує відвідування та кліки, але не знає, хто ви.',
    privacyLink: 'Політика конфіденційності',
    footerMore: 'Більше безкоштовного — на {link}',
    skip: 'Перейти до вмісту',
  },
  he: {
    brand: 'משפחה מצחיקה',
    metaTitle: 'משפחה מצחיקה — משחקי סיפורים מטורפים לשחק יחד',
    metaDescription:
      'שני משחקי מסיבה חינמיים לחברים ולמשפחה: בוחרים תשובות אבסורדיות, מקבלים סיפורים מטורפים, וכל סיפור הופך לציור. משחקים בדפדפן, ב-23 שפות.',
    heroTitle: 'סיפורים מטורפים, ביחד',
    heroLead:
      'שני משחקי מסיבה חינמיים לחברים ולמשפחה. כל אחד בוחר תשובות אבסורדיות, המשחק מערבב אותן לסיפורים, וכל סיפור הופך לציור.',
    gamesTitle: 'בחרו משחק',
    fmTag: '3–7 שחקנים · כל אחד בטלפון שלו',
    fmText:
      'יוצרים חדר ומשתפים את הקישור או את קוד ה-QR. כל אחד עונה בטלפון שלו, ואז הסיפורים נחשפים אחד אחרי השני — כל אחד עם הציור שלו.',
    foTag: '2–7 שחקנים · טלפון אחד שעובר מיד ליד',
    foText:
      'בלי חדר, בלי הרשמה, בלי אינטרנט. מעבירים את הטלפון סביב השולחן, ואם חסרים אנשים — מוסיפים שחקנים וירטואליים.',
    play: 'לשחק',
    howTitle: 'איך משחקים',
    how1: 'בכל סיבוב יש שאלה משעשעת — בוחרים תשובה מתוך רשימה של אפשרויות מצחיקות.',
    how2: 'המשחק מערבב את התשובות של כולם לסיפורים קצרים ואבסורדיים.',
    how3: 'כל סיפור הופך לציור. קוראים בקול וצוחקים יחד.',
    videoPlay: 'הפעלת הסרטון',
    videoCaption: 'צפו בטריילר (6 שניות)',
    videoPause: 'השהיית סרטון הרקע',
    videoResume: 'הפעלת סרטון הרקע',
    ghTitle: 'חינמי וקוד פתוח',
    ghText:
      'שני המשחקים הם קוד פתוח ברישיון AGPL-3.0. אפשר לקרוא את הקוד, להציע תיקון או להריץ שרת משלכם.',
    langLabel: 'שפה',
    privacyNote: 'בלי עוגיות ובלי פרסומות. הדף סופר ביקורים ולחיצות, אף פעם לא מי אתם.',
    privacyLink: 'מדיניות פרטיות',
    footerMore: 'עוד דברים חינמיים ב-{link}',
    skip: 'דילוג לתוכן',
  },
  fa: {
    brand: 'خانوادهٔ بامزه',
    metaTitle: 'خانوادهٔ بامزه — بازی‌های قصه‌سازی خنده‌دار برای دورهمی',
    metaDescription:
      'دو بازی رایگان برای دورهمی دوستان و خانواده: جواب‌های عجیب و غریب انتخاب کنید، قصه‌های خنده‌دار تحویل بگیرید و ببینید هر کدام کارتون می‌شود. در مرورگر، به 23 زبان.',
    heroTitle: 'قصه‌های بامزه‌ای که با هم می‌سازیم',
    heroLead:
      'دو بازی رایگان برای دوستان و خانواده. همه جواب‌های عجیب و غریب انتخاب می‌کنند، بازی آن‌ها را قاطی می‌کند و قصه می‌سازد، و هر قصه یک کارتون می‌شود.',
    gamesTitle: 'یک بازی انتخاب کنید',
    fmTag: '3 تا 7 بازیکن · هر کس با گوشی خودش',
    fmText:
      'یک اتاق بسازید و لینک یا کد QR را بفرستید. هر کس با گوشی خودش جواب می‌دهد، بعد قصه‌ها یکی‌یکی رو می‌شوند — هر کدام با کارتون خودش.',
    foTag: '2 تا 7 بازیکن · یک گوشی، دست‌به‌دست',
    foText:
      'نه اتاق، نه ثبت‌نام، نه اینترنت. گوشی را دور میز دست‌به‌دست کنید و اگر آدم کم دارید، بازیکن مجازی اضافه کنید.',
    play: 'همین حالا بازی کنید',
    howTitle: 'چطور بازی می‌شود',
    how1: 'هر دور یک سؤال بامزه می‌آید — از فهرست گزینه‌های خنده‌دار یک جواب انتخاب کنید.',
    how2: 'بازی جواب‌های همه را قاطی می‌کند و قصه‌های کوچولوی عجیب و غریب می‌سازد.',
    how3: 'هر قصه یک کارتون می‌شود. قصه‌ها را بلند بخوانید و با هم بخندید.',
    videoPlay: 'پخش ویدیو',
    videoCaption: 'تیزر را ببینید (6 ثانیه)',
    videoPause: 'توقف ویدیوی پس‌زمینه',
    videoResume: 'پخش ویدیوی پس‌زمینه',
    ghTitle: 'رایگان و متن‌باز',
    ghText:
      'هر دو بازی متن‌باز و با مجوز AGPL-3.0 منتشر شده‌اند. کد را بخوانید، اصلاحی پیشنهاد بدهید یا سرور خودتان را راه بیندازید.',
    langLabel: 'زبان',
    privacyNote:
      'بدون کوکی و بدون تبلیغ. این صفحه بازدیدها و کلیک‌ها را می‌شمارد، اما هرگز نمی‌فهمد شما چه کسی هستید.',
    privacyLink: 'سیاست حریم خصوصی',
    footerMore: 'چیزهای رایگان بیشتر در {link}',
    skip: 'رفتن به محتوا',
  },
  ta: {
    brand: 'வேடிக்கையான குடும்பம்',
    metaTitle: 'வேடிக்கையான குடும்பம் — சேர்ந்து விளையாடும் வேடிக்கைக் கதை விளையாட்டுகள்',
    metaDescription:
      'நண்பர்களுக்கும் குடும்பத்துக்கும் இரண்டு இலவச பார்ட்டி விளையாட்டுகள்: விநோதமான பதில்களைத் தேர்ந்தெடுங்கள், வேடிக்கையான கதைகளைப் பெறுங்கள் — ஒவ்வொரு கதையும் கார்ட்டூனாக மாறும். உலாவியில் 23 மொழிகளில் விளையாடுங்கள்.',
    heroTitle: 'சேர்ந்து உருவாக்கும் வேடிக்கைக் கதைகள்',
    heroLead:
      'நண்பர்களுக்கும் குடும்பத்துக்கும் இரண்டு இலவச பார்ட்டி விளையாட்டுகள். எல்லோரும் விநோதமான பதில்களைத் தேர்ந்தெடுக்கிறார்கள், விளையாட்டு அவற்றைக் கலந்து கதைகளாக்குகிறது, ஒவ்வொரு கதையும் கார்ட்டூனாக மாறுகிறது.',
    gamesTitle: 'ஒரு விளையாட்டைத் தேர்ந்தெடுங்கள்',
    fmTag: '3–7 பேர் · ஒவ்வொருவரும் தங்கள் சொந்த ஃபோனில்',
    fmText:
      'ஒரு அறையை உருவாக்கி, இணைப்பையோ QR குறியீட்டையோ பகிருங்கள். ஒவ்வொருவரும் தங்கள் ஃபோனில் பதிலளிக்கிறார்கள்; பிறகு கதைகள் ஒவ்வொன்றாக வெளிப்படும் — ஒவ்வொன்றுக்கும் அதன் சொந்த கார்ட்டூன்.',
    foTag: '2–7 பேர் · ஒரே ஃபோன், கை மாறி',
    foText:
      'அறை இல்லை, பதிவு இல்லை, இணையம் தேவையில்லை. மேசையைச் சுற்றி ஃபோனைக் கொடுத்து விளையாடுங்கள்; ஆட்கள் குறைவென்றால் மெய்நிகர் வீரர்களைச் சேருங்கள்.',
    play: 'விளையாடு',
    howTitle: 'எப்படி விளையாடுவது',
    how1: 'ஒவ்வொரு சுற்றிலும் ஒரு வேடிக்கையான கேள்வி — வேடிக்கையான விருப்பங்களின் பட்டியலிலிருந்து ஒரு பதிலைத் தேர்ந்தெடுங்கள்.',
    how2: 'விளையாட்டு எல்லோருடைய பதில்களையும் கலந்து சிறிய விநோதக் கதைகளாக்குகிறது.',
    how3: 'ஒவ்வொரு கதையும் கார்ட்டூனாக மாறும். சத்தமாகப் படித்து, சேர்ந்து சிரியுங்கள்.',
    videoPlay: 'வீடியோவை இயக்கு',
    videoCaption: 'முன்னோட்டத்தைப் பாருங்கள் (6 வி)',
    videoPause: 'பின்னணி வீடியோவை இடைநிறுத்து',
    videoResume: 'பின்னணி வீடியோவை இயக்கு',
    ghTitle: 'இலவசம், திறந்த மூலம்',
    ghText:
      'இரண்டு விளையாட்டுகளும் AGPL-3.0 உரிமத்தின் கீழ் திறந்த மூலமானவை. குறியீட்டைப் படியுங்கள், திருத்தத்தைப் பரிந்துரையுங்கள் அல்லது உங்கள் சொந்த சேவையகத்தை இயக்குங்கள்.',
    langLabel: 'மொழி',
    privacyNote:
      'குக்கீகள் இல்லை, விளம்பரங்கள் இல்லை. இந்தப் பக்கம் வருகைகளையும் கிளிக்குகளையும் மட்டுமே எண்ணுகிறது — நீங்கள் யார் என்பதை ஒருபோதும் அல்ல.',
    privacyLink: 'தனியுரிமைக் கொள்கை',
    footerMore: 'மேலும் இலவசங்கள்: {link}',
    skip: 'உள்ளடக்கத்துக்குச் செல்',
  },
  hi: {
    brand: 'मज़ेदार परिवार',
    metaTitle: 'मज़ेदार परिवार — साथ मिलकर खेलने वाले मज़ेदार कहानी-खेल',
    metaDescription:
      'दोस्तों और परिवार के लिए दो मुफ़्त पार्टी गेम: बेतुके जवाब चुनें, मज़ेदार कहानियाँ पाएँ और देखें कि हर कहानी कैसे कार्टून बनती है। ब्राउज़र में, 23 भाषाओं में खेलें।',
    heroTitle: 'मिलकर बनाई गई मज़ेदार कहानियाँ',
    heroLead:
      'दोस्तों और परिवार के लिए दो मुफ़्त पार्टी गेम। हर कोई बेतुके जवाब चुनता है, खेल उन्हें मिलाकर कहानियाँ बनाता है, और हर कहानी एक कार्टून बन जाती है।',
    gamesTitle: 'कोई खेल चुनें',
    fmTag: '3–7 खिलाड़ी · हर कोई अपने फ़ोन पर',
    fmText:
      'एक रूम बनाएँ और उसका लिंक या QR कोड शेयर करें। हर कोई अपने फ़ोन पर जवाब देता है, फिर कहानियाँ एक-एक करके खुलती हैं — हर एक अपने कार्टून के साथ।',
    foTag: '2–7 खिलाड़ी · एक फ़ोन, हाथों-हाथ',
    foText:
      'न रूम, न साइन-अप, न इंटरनेट की ज़रूरत। फ़ोन को टेबल पर बारी-बारी आगे बढ़ाएँ, और लोग कम हों तो वर्चुअल खिलाड़ी जोड़ लें।',
    play: 'अभी खेलें',
    howTitle: 'कैसे खेलें',
    how1: 'हर राउंड में एक मज़ेदार सवाल आता है — मज़ेदार विकल्पों की सूची से एक जवाब चुनें।',
    how2: 'खेल सबके जवाबों को मिलाकर छोटी-छोटी बेतुकी कहानियाँ बनाता है।',
    how3: 'हर कहानी एक कार्टून बन जाती है। उन्हें ज़ोर से पढ़ें और साथ मिलकर हँसें।',
    videoPlay: 'वीडियो चलाएँ',
    videoCaption: 'ट्रेलर देखें (6 सेकंड)',
    videoPause: 'बैकग्राउंड वीडियो रोकें',
    videoResume: 'बैकग्राउंड वीडियो चलाएँ',
    ghTitle: 'मुफ़्त और ओपन सोर्स',
    ghText:
      'दोनों खेल AGPL-3.0 लाइसेंस के तहत ओपन सोर्स हैं। कोड पढ़ें, कोई सुधार सुझाएँ या अपना ख़ुद का सर्वर चलाएँ।',
    langLabel: 'भाषा',
    privacyNote: 'न कुकीज़, न विज्ञापन। यह पेज विज़िट और क्लिक गिनता है — आप कौन हैं, यह कभी नहीं।',
    privacyLink: 'गोपनीयता नीति',
    footerMore: 'और भी मुफ़्त चीज़ें: {link}',
    skip: 'सीधे सामग्री पर जाएँ',
  },
  te: {
    brand: 'సరదా కుటుంబం',
    metaTitle: 'సరదా కుటుంబం — కలిసి ఆడుకునే సరదా కథల ఆటలు',
    metaDescription:
      'స్నేహితులకు, కుటుంబానికి రెండు ఉచిత పార్టీ ఆటలు: తలాతోకా లేని జవాబులు ఎంచుకోండి, తమాషా కథలు పొందండి — ప్రతి కథ ఒక కార్టూన్‌గా మారుతుంది. బ్రౌజర్‌లోనే 23 భాషల్లో ఆడండి.',
    heroTitle: 'కలిసి అల్లుకునే సరదా కథలు',
    heroLead:
      'స్నేహితులకు, కుటుంబానికి రెండు ఉచిత పార్టీ ఆటలు. అందరూ తలాతోకా లేని జవాబులు ఎంచుకుంటారు, ఆట వాటిని కలిపి కథలుగా అల్లుతుంది, ప్రతి కథ ఒక కార్టూన్‌గా మారుతుంది.',
    gamesTitle: 'ఒక ఆట ఎంచుకోండి',
    fmTag: '3–7 మంది · ఎవరి ఫోన్‌లో వాళ్ళు',
    fmText:
      'ఒక రూమ్ సృష్టించి, లింక్ లేదా QR కోడ్ షేర్ చేయండి. అందరూ తమ తమ ఫోన్‌లలో జవాబిస్తారు, తర్వాత కథలు ఒక్కొక్కటిగా బయటపడతాయి — ప్రతి దానికీ దాని సొంత కార్టూన్.',
    foTag: '2–7 మంది · ఒకే ఫోన్, చేతులు మారుతూ',
    foText:
      'రూమ్ అక్కర్లేదు, సైన్-అప్ అక్కర్లేదు, ఇంటర్నెట్ అక్కర్లేదు. ఫోన్‌ను టేబుల్ చుట్టూ తిప్పండి; మనుషులు తక్కువైతే వర్చువల్ ఆటగాళ్ళను చేర్చుకోండి.',
    play: 'ఇప్పుడే ఆడండి',
    howTitle: 'ఎలా ఆడాలి',
    how1: 'ప్రతి రౌండ్‌లో ఒక సరదా ప్రశ్న వస్తుంది — తమాషా జవాబుల జాబితాలోంచి ఒకటి ఎంచుకోండి.',
    how2: 'ఆట అందరి జవాబులనూ కలిపి తలాతోకా లేని చిట్టి కథలుగా అల్లుతుంది.',
    how3: 'ప్రతి కథ ఒక కార్టూన్‌గా మారుతుంది. వాటిని గట్టిగా చదివి, అందరూ కలిసి నవ్వుకోండి.',
    videoPlay: 'వీడియో ప్లే చేయి',
    videoCaption: 'ట్రైలర్ చూడండి (6 సెకన్లు)',
    videoPause: 'నేపథ్య వీడియోను పాజ్ చేయి',
    videoResume: 'నేపథ్య వీడియోను ప్లే చేయి',
    ghTitle: 'ఉచితం, ఓపెన్ సోర్స్',
    ghText:
      'రెండు ఆటలూ AGPL-3.0 లైసెన్స్ కింద ఓపెన్ సోర్స్. కోడ్ చదవండి, ఏదైనా సవరణ సూచించండి లేదా మీ సొంత సర్వర్ నడపండి.',
    langLabel: 'భాష',
    privacyNote:
      'కుకీలు లేవు, ప్రకటనలు లేవు. ఈ పేజీ సందర్శనలను, క్లిక్‌లను మాత్రమే లెక్కిస్తుంది; మీరు ఎవరో ఎప్పుడూ తెలుసుకోదు.',
    privacyLink: 'గోప్యతా విధానం',
    footerMore: 'మరిన్ని ఉచిత విషయాలు: {link}',
    skip: 'ప్రధాన కంటెంట్‌కు వెళ్ళు',
  },
  bn: {
    brand: 'মজার পরিবার',
    metaTitle: 'মজার পরিবার — সবাই মিলে খেলার মতো মজার গল্পের খেলা',
    metaDescription:
      'বন্ধু আর পরিবারের জন্য দুটো ফ্রি পার্টি গেম: উদ্ভট উত্তর বেছে নাও, মজার গল্প পাও, আর দেখো প্রতিটা গল্প কীভাবে কার্টুন হয়ে যায়। ব্রাউজারেই খেলো, 23টি ভাষায়।',
    heroTitle: 'সবাই মিলে বানানো মজার গল্প',
    heroLead:
      'বন্ধু আর পরিবারের জন্য দুটো ফ্রি পার্টি গেম। সবাই উদ্ভট উত্তর বেছে নেয়, গেম সেগুলো মিশিয়ে গল্প বানায়, আর প্রতিটা গল্প একটা কার্টুন হয়ে যায়।',
    gamesTitle: 'একটা খেলা বেছে নাও',
    fmTag: '3–7 জন · প্রত্যেকে নিজের ফোনে',
    fmText:
      'একটা রুম তৈরি করো, তারপর লিংক বা QR কোড শেয়ার করো। সবাই নিজের ফোনে উত্তর দেয়, তারপর গল্পগুলো একে একে সামনে আসে — প্রতিটার সাথে তার নিজের কার্টুন।',
    foTag: '2–7 জন · একটাই ফোন, হাতে হাতে',
    foText:
      'রুম লাগে না, সাইন-আপ লাগে না, ইন্টারনেটও লাগে না। টেবিল ঘিরে ফোনটা হাতে হাতে ঘোরাও, আর লোক কম পড়লে ভার্চুয়াল খেলোয়াড় যোগ করে নাও।',
    play: 'এখনই খেলো',
    howTitle: 'কীভাবে খেলবে',
    how1: 'প্রতি রাউন্ডে আসে একটা মজার প্রশ্ন — মজার সব উত্তরের তালিকা থেকে একটা বেছে নাও।',
    how2: 'গেম সবার উত্তর মিশিয়ে ছোট ছোট উদ্ভট গল্প বানায়।',
    how3: 'প্রতিটা গল্প একটা কার্টুন হয়ে যায়। জোরে জোরে পড়ো আর সবাই মিলে হাসো।',
    videoPlay: 'ভিডিও চালাও',
    videoCaption: 'ট্রেলার দেখো (6 সেকেন্ড)',
    videoPause: 'ব্যাকগ্রাউন্ড ভিডিও থামাও',
    videoResume: 'ব্যাকগ্রাউন্ড ভিডিও চালাও',
    ghTitle: 'ফ্রি আর ওপেন সোর্স',
    ghText:
      'দুটো খেলাই AGPL-3.0 লাইসেন্সে ওপেন সোর্স। কোড পড়ো, কোনো সংশোধনের পরামর্শ দাও, নয়তো নিজের সার্ভার চালাও।',
    langLabel: 'ভাষা',
    privacyNote:
      'কোনো কুকি নেই, কোনো বিজ্ঞাপন নেই। এই পেজ শুধু ভিজিট আর ক্লিক গোনে, তুমি কে তা কখনো নয়।',
    privacyLink: 'গোপনীয়তা নীতি',
    footerMore: 'আরও ফ্রি জিনিস: {link}',
    skip: 'মূল কনটেন্টে যাও',
  },
  ar: {
    brand: 'العائلة المرحة',
    metaTitle: 'العائلة المرحة — ألعاب حكايات مضحكة نلعبها معا',
    metaDescription:
      'لعبتان جماعيتان مجانيتان للأصدقاء والعائلة: اختاروا إجابات عجيبة، واحصلوا على حكايات مضحكة، وشاهدوا كل حكاية تتحول إلى رسم كرتوني. العبوا في المتصفح، بأي من 23 لغة.',
    heroTitle: 'حكايات عجيبة نصنعها معا',
    heroLead:
      'لعبتان جماعيتان مجانيتان للأصدقاء والعائلة. يختار الجميع إجابات عجيبة، فتمزجها اللعبة في حكايات، وتتحول كل حكاية إلى رسم كرتوني.',
    gamesTitle: 'اختاروا لعبة',
    fmTag: '3–7 لاعبين · كل لاعب على هاتفه',
    fmText:
      'أنشئوا غرفة وشاركوا الرابط أو رمز QR. يجيب كل لاعب على هاتفه، ثم تظهر الحكايات واحدة تلو الأخرى، ولكل منها رسمها الكرتوني الخاص.',
    foTag: '2–7 لاعبين · هاتف واحد يتنقل من يد إلى يد',
    foText:
      'لا غرفة، ولا تسجيل، ولا حاجة إلى الإنترنت. مرروا الهاتف حول الطاولة، وأضيفوا لاعبين افتراضيين إن نقص العدد.',
    play: 'العبوا الآن',
    howTitle: 'طريقة اللعب',
    how1: 'في كل جولة سؤال طريف: اختاروا إجابة من قائمة خيارات مضحكة.',
    how2: 'تمزج اللعبة إجابات الجميع في حكايات قصيرة عجيبة.',
    how3: 'تتحول كل حكاية إلى رسم كرتوني. اقرؤوها بصوت عال واضحكوا معا.',
    videoPlay: 'تشغيل الفيديو',
    videoCaption: 'شاهدوا الإعلان التشويقي (6 ثوان)',
    videoPause: 'إيقاف فيديو الخلفية مؤقتا',
    videoResume: 'تشغيل فيديو الخلفية',
    ghTitle: 'مجانية ومفتوحة المصدر',
    ghText:
      'اللعبتان مفتوحتا المصدر بترخيص AGPL-3.0. اقرؤوا الشيفرة، أو اقترحوا إصلاحا، أو أطلقوا خادمكم الخاص.',
    langLabel: 'اللغة',
    privacyNote:
      'لا ملفات تعريف ارتباط ولا إعلانات. تحصي هذه الصفحة الزيارات والنقرات، ولا تعرف أبدا من أنتم.',
    privacyLink: 'سياسة الخصوصية',
    footerMore: 'المزيد من الأشياء المجانية على {link}',
    skip: 'الانتقال إلى المحتوى',
  },
  sw: {
    brand: 'Familia ya Kicheko',
    metaTitle: 'Familia ya Kicheko — michezo ya hadithi za kuchekesha ya kucheza pamoja',
    metaDescription:
      'Michezo miwili ya bure ya kikundi kwa marafiki na familia: chagua majibu ya ajabu, pata hadithi za kuchekesha, na utazame kila moja ikigeuka kuwa katuni. Cheza kwenye kivinjari chako, kwa lugha 23.',
    heroTitle: 'Hadithi za kuchekesha, zilizotungwa pamoja',
    heroLead:
      'Michezo miwili ya bure ya kikundi kwa marafiki na familia. Kila mtu anachagua majibu ya ajabu, mchezo unayachanganya kuwa hadithi, na kila hadithi inageuka kuwa katuni.',
    gamesTitle: 'Chagua mchezo',
    fmTag: 'Wachezaji 3–7 · kila mmoja kwenye simu yake',
    fmText:
      'Unda chumba na utume kiungo au msimbo wa QR. Kila mtu anajibu kwenye simu yake, kisha hadithi zinafunuliwa moja baada ya nyingine — kila moja na katuni yake.',
    foTag: 'Wachezaji 2–7 · simu moja, mnapokezana',
    foText:
      'Hakuna chumba, hakuna kujisajili, hakuna haja ya intaneti. Pokezaneni simu kuzunguka meza, na ongezeni wachezaji roboti ikiwa watu hawatoshi.',
    play: 'Cheza sasa',
    howTitle: 'Jinsi inavyofanya kazi',
    how1: 'Kila raundi inaleta swali la kufurahisha — chagua jibu kutoka kwenye orodha ya machaguo ya kuchekesha.',
    how2: 'Mchezo unachanganya majibu ya kila mtu kuwa hadithi fupi za ajabu.',
    how3: 'Kila hadithi inageuka kuwa katuni. Zisomeni kwa sauti na mcheke pamoja.',
    videoPlay: 'Cheza video',
    videoCaption: 'Tazama kionjo (sekunde 6)',
    videoPause: 'Sitisha video ya nyuma ya ukurasa',
    videoResume: 'Cheza video ya nyuma ya ukurasa',
    ghTitle: 'Bure na chanzo huria',
    ghText:
      'Michezo yote miwili ni ya chanzo huria chini ya leseni ya AGPL-3.0. Soma msimbo, pendekeza marekebisho au endesha seva yako mwenyewe.',
    langLabel: 'Lugha',
    privacyNote:
      'Hakuna vidakuzi wala matangazo. Ukurasa huu huhesabu ziara na mibofyo tu, na kamwe haujui wewe ni nani.',
    privacyLink: 'Sera ya faragha',
    footerMore: 'Vitu zaidi vya bure kwenye {link}',
    skip: 'Ruka hadi maudhui',
  },
  yo: {
    brand: 'Ìdílé Aláwàdà',
    metaTitle: 'Ìdílé Aláwàdà — eré ìtàn apanilẹ́rìn-ín tí a jọ ń ṣe',
    metaDescription:
      'Eré àríyá ọ̀fẹ́ méjì fún ọ̀rẹ́ àti ẹbí: ẹ yan ìdáhùn tí kò lórí tí kò nídìí, ẹ gba ìtàn apanilẹ́rìn-ín, kí ẹ sì wo bí ìtàn kọ̀ọ̀kan ṣe ń di àwòrán efe. Ẹ ṣeré lórí búráúsà yín, ní èdè 23.',
    heroTitle: 'Ìtàn apanilẹ́rìn-ín tí a jọ hun',
    heroLead:
      'Eré àríyá ọ̀fẹ́ méjì fún ọ̀rẹ́ àti ẹbí. Gbogbo èèyàn ń yan ìdáhùn tí kò lórí tí kò nídìí, eré náà á dà wọ́n pọ̀ di ìtàn, ìtàn kọ̀ọ̀kan á sì di àwòrán efe.',
    gamesTitle: 'Yan eré kan',
    fmTag: 'Òṣèré 3–7 · kálukú lórí fóònù tirẹ̀',
    fmText:
      'Ṣẹ̀dá yàrá kan, kí o sì pín líǹkì tàbí kóòdù QR rẹ̀. Kálukú á dáhùn lórí fóònù tirẹ̀, lẹ́yìn náà a ó ṣí àwọn ìtàn payá lọ́kọ̀ọ̀kan — ìkọ̀ọ̀kan pẹ̀lú àwòrán efe tirẹ̀.',
    foTag: 'Òṣèré 2–7 · fóònù kan ṣoṣo, láti ọwọ́ dé ọwọ́',
    foText:
      'Kò sí yàrá, kò sí ìforúkọsílẹ̀, kò nílò ẹ̀rọ ayélujára. Ẹ máa gbé fóònù yíká tábìlì, kí ẹ sì ṣàfikún òṣèré ẹ̀rọ bí èèyàn kò bá pọ̀ tó.',
    play: 'Ṣeré báyìí',
    howTitle: 'Bí ó ṣe ń ṣiṣẹ́',
    how1: 'Ìyípo kọ̀ọ̀kan ń mú ìbéèrè alárinrin kan wá — yan ìdáhùn kan nínú àkójọ àwọn àṣàyàn apanilẹ́rìn-ín.',
    how2: 'Eré náà á da ìdáhùn gbogbo èèyàn pọ̀ di àwọn ìtàn kékeré tí kò lórí tí kò nídìí.',
    how3: 'Ìtàn kọ̀ọ̀kan á di àwòrán efe. Ẹ kà wọ́n sókè, kí ẹ sì jọ rẹ́rìn-ín.',
    videoPlay: 'Wo fídíò náà',
    videoCaption: 'Wo fídíò ṣókí (ìṣẹ́jú-àáyá 6)',
    videoPause: 'Dá fídíò ẹ̀yìn dúró',
    videoResume: 'Tẹ̀síwájú pẹ̀lú fídíò ẹ̀yìn',
    ghTitle: 'Ọ̀fẹ́ ni, kóòdù rẹ̀ sì wà ní gbangba',
    ghText:
      'Kóòdù eré méjèèjì wà ní gbangba lábẹ́ ìwé àṣẹ AGPL-3.0. Ka kóòdù náà, dábàá àtúnṣe, tàbí gbé sẹ́fà tìrẹ kalẹ̀.',
    langLabel: 'Èdè',
    privacyNote:
      'Kò sí kúkì, kò sí ìpolówó. Ojú-ìwé yìí ń ka iye àbẹ̀wò àti títẹ̀, ṣùgbọ́n kì í mọ ẹni tí o jẹ́.',
    privacyLink: 'Ìlànà ìpamọ́ àṣírí',
    footerMore: 'Àwọn nǹkan ọ̀fẹ́ mìíràn wà ní {link}',
    skip: 'Fò lọ sí àkóónú',
  },
};
