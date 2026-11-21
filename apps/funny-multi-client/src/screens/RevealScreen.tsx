// SPDX-License-Identifier: AGPL-3.0-only
//
// Adapted from SRC/client/src/screens/RevealScreen.tsx (T-4.4). Picture
// generation still runs automatically on mount — there is no manual
// "Generate Picture" button (spec §8, §11) — and retry still re-emits the
// same request. What changed is what a picture *is*:
//
//   - `pictureUrl: string | null` (a base64 data URL) → `picture: PictureRef
//     | null` — `<img>` gets `src`, `width` and `height` from the payload
//     (design §8.2) instead of just `src`, so the browser reserves the exact
//     layout space before the image loads and the page never reflows once it
//     lands.
//   - `reveal:pictureReady`'s payload is `{ picture, imagePrompt }` (T-4.3/
//     T-4.4) rather than `{ pictureUrl, imagePrompt }`. `imagePrompt` is
//     still on the wire — SRC never rendered it on the real reveal screen
//     either, only on the dev-only Test* screens this repo doesn't carry
//     (design §3) — so it's received and otherwise unused here, same as SRC.
//
// B-15: the story opens in the player's own language (`defaultLanguage`) and
// a switch beside the title retells it in any other; the picture stays as it
// is, since it never carried text.
//
// Step 117 (B-29): a Christmas story shows its ending under the scene once the
// scene has come — a golden story's ending picture, which `reveal:pictureReady`
// brings with the scene, or the ending as a card (StoryEnding.tsx) — and a
// golden story says so above its text.
//
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { socket } from '../socket';
import ProseText from '../components/ProseText';
import LogoStamp from '../components/LogoStamp';
import StoryLanguageSwitch from '../components/StoryLanguageSwitch';
import PictureFlourish from '../components/art/PictureFlourish';
import WaitingMascot from '../components/art/WaitingMascot';
import ErrorMascot from '../components/art/ErrorMascot';
import { hoursUntilUtcMidnight } from '../capReset';
import { textDirection } from '../i18n';
import StoryEnding from '../components/StoryEnding';
import { trackGoldenCartoon } from '../funnel';
import { endingText, storyIn } from '../storyLanguage';
import { BASE_CONTENT, isGolden } from '@funny/shared';
import type {
  AuthoredLanguage,
  PictureRef,
  RevealPictureErrorCode,
  RevealPictureErrorPayload,
  RevealPictureReadyPayload,
  RevealStartPayload,
} from '@funny/shared';

interface Props {
  reveal: RevealStartPayload;
  /** The language the server wrote `reveal.prose` in. */
  roomLanguage: AuthoredLanguage;
  /** The language the story opens in: App.tsx `myLanguage`. */
  defaultLanguage: AuthoredLanguage;
  // Self-paced navigation to the end screen (spec §16 step 10).
  onContinue: () => void;
}

type PictureStatus = 'loading' | 'ready' | 'error';

// Picture generation runs automatically (spec §11). The "summoning" wait
// control only appears once generation has been running longer than this, so a
// fast result never flashes a spinner.
const WAIT_CONTROL_DELAY_MS = 3000;

export default function RevealScreen({ reveal, roomLanguage, defaultLanguage, onContinue }: Props) {
  const { t } = useTranslation();
  const [language, setLanguage] = useState<AuthoredLanguage>(defaultLanguage);
  const [status, setStatus] = useState<PictureStatus>('loading');
  const [picture, setPicture] = useState<PictureRef | null>(null);
  const [ending, setEnding] = useState<PictureRef | null>(null);
  // Older servers sent no content: a base story.
  const content = reveal.content ?? BASE_CONTENT;
  const golden = isGolden(content);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCode, setErrorCode] = useState<RevealPictureErrorCode | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showWait, setShowWait] = useState(false);

  // Register listeners and kick off generation automatically on mount — there
  // is no manual "Generate Picture" button anymore (spec §8, §11).
  useEffect(() => {
    const onReady = (data: RevealPictureReadyPayload): void => {
      setPicture(data.picture);
      setEnding(data.ending ?? null);
      setStatus('ready');
    };
    const onError = (data: RevealPictureErrorPayload): void => {
      setErrorMsg(data.message);
      setErrorCode(data.code ?? null);
      setStatus('error');
    };
    socket.on('reveal:pictureReady', onReady);
    socket.on('reveal:pictureError', onError);
    socket.emit('reveal:requestPicture');
    return () => {
      socket.off('reveal:pictureReady', onReady);
      socket.off('reveal:pictureError', onError);
    };
  }, []);

  // Reveal the funny wait control only once generation has run past the delay.
  useEffect(() => {
    setShowWait(false);
    if (status !== 'loading') return;
    const timer = window.setTimeout(() => setShowWait(true), WAIT_CONTROL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  function retry(): void {
    setErrorMsg('');
    setErrorCode(null);
    setStatus('loading');
    socket.emit('reveal:retryPicture');
  }

  // Cap-reached errors get the i18n'd "oven is full, new cartoons in ~N
  // hours" caption. Anything else falls back to the server's English message
  // or the existing i18n default. Retry stays useful: a CAP_REACHED retry
  // simply re-shows the same caption until UTC midnight rolls over.
  const displayError =
    errorCode === 'CAP_REACHED'
      ? t('reveal.capReached', { hours: hoursUntilUtcMidnight() })
      : errorMsg || t('reveal.error');

  const story = storyIn(reveal, roomLanguage, language);
  const showsCartoon = status === 'ready' && picture !== null;

  // The Christmas funnel's golden step (D2 A): a golden story's cartoon seen.
  useEffect(() => {
    if (golden && showsCartoon) trackGoldenCartoon();
  }, [golden, showsCartoon]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-pink-500">{t('reveal.title')}</h2>
        <StoryLanguageSwitch value={language} onChange={setLanguage} />
      </div>

      {golden && <p className="-mb-3 font-semibold text-pink-600">{t('reveal.goldenStory')}</p>}

      {/* The story's own lang and dir, which can differ from the interface's. */}
      <div lang={language} dir={textDirection(language)}>
        <ProseText prose={story.prose} answers={story.answers} className="text-xl" />
      </div>

      {showsCartoon && picture ? (
        <div className="relative">
          <img
            src={picture.url}
            width={picture.width}
            height={picture.height}
            alt={t('reveal.pictureAlt')}
            onLoad={() => setImgLoaded(true)}
            className={`w-full rounded-xl shadow-lg transition-all duration-500 ease-out ${
              imgLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          />
          {imgLoaded && (
            <>
              <PictureFlourish className="pointer-events-none absolute inset-0 h-full w-full" />
              <LogoStamp />
            </>
          )}
        </div>
      ) : status === 'error' ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <ErrorMascot className="h-28 w-28" />
          <p className="text-center text-gray-700">{displayError}</p>
          <button
            className="rounded bg-pink-500 px-6 py-3 font-display text-lg font-semibold text-white"
            onClick={retry}
          >
            {t('reveal.retry')}
          </button>
        </div>
      ) : showWait ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <WaitingMascot className="h-28 w-28" />
          <p className="text-gray-600">{t('reveal.spinner')}</p>
        </div>
      ) : null}

      {showsCartoon && content.kind !== 'base' && (
        <>
          <StoryEnding
            ending={ending}
            text={endingText(story, language)}
            language={language}
            alt={t('reveal.endingAlt')}
          />
          {/* The Continue button below floats 20vh up, over whatever ends the
              screen: fine over a picture, not over the ending card's words
              (seen in the browser, Step 117). This much room lets the card
              scroll clear of it. */}
          {!ending && (
            <div aria-hidden="true" data-testid="ending-room" className="h-[20vh] shrink-0" />
          )}
        </>
      )}

      {/* Continue link ("ДАЛЬШЕ" etc). Pinned near the bottom of the scroll
          viewport (sticky) so it stays visible without scrolling past a tall
          picture, raised 20% of the screen height off the bottom edge
          (bottom-[20vh]); the cream backdrop (brand-cream = amber-100) keeps it
          legible when it floats over the cartoon. Size bumped 90% from the 1rem
          base (→ 1.9rem). Applies to every language. */}
      <button
        className="sticky bottom-[20vh] z-10 mt-auto self-center rounded-full bg-amber-100 px-6 py-2 font-display text-[1.9rem] font-semibold text-pink-500 underline shadow-md"
        onClick={onContinue}
      >
        {t('reveal.continue')}
      </button>
    </div>
  );
}
