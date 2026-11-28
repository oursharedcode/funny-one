// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from SRC/client/src/components/RoomGallery.tsx (spec §24). One
// thing SRC's version had is deliberately not here:
//
//   - The `wobbleEngine` prop — the type it read (`WobbleEngine`) doesn't
//     exist in this repo's wire contract at all (ARC-3/DD-9, T-1.6): there is
//     only the CSS engine now, so there is nothing to choose between.
//     `makeClip` below always uses `recordWobble.ts`.
//
// Landed by this task (T-5.2, design §8.3): download/share/video buttons,
// wired to `downloadStory.ts`, `share.ts` and `recordWobble.ts`. What's
// carried unchanged from the earlier pass: the picture-wobble CSS classes
// (styles/index.css, present since T-3.1) and the prev/next browsing UI.
// `<LogoStamp />` (T-7.2) sits on the outer relative wrapper, outside the
// wobble stack, so the branding overlay stays fixed while the picture wobbles.
//
// B-15: every story opens in the player's own language (`defaultLanguage`),
// and a switch beside "Story by …" retells that story in any other. The
// gallery remembers the choice per story while it is open, and the download,
// share and video buttons export the story in the language on screen.
//
// Step 117 (B-29): a Christmas story shows its ending under the scene
// (StoryEnding.tsx), a golden one says so; the server lists the golden story
// last. A golden story's still carries its ending picture and the edition's
// footer, and every Christmas story's video ends on its ending.
//
// Step 122 (B-29): a paid story's still carries its ending and the buyer's
// thank-you footer, and each one saved or shared is reported (`onExported`)
// for its game's receipt record — a count, nothing else. A share the person
// dismisses is not one.
//
// Step 130 (B-29 #1): a seat bot's story is "Bot 2's story" in the player's
// own language, and its still and video name it in the story's language.
//
// Step 135 (B-29 #7): a video is no longer saved by itself once recorded — it
// waits behind "Save video" and "Share video" (owner decision D3 B: a share
// sheet needs a tap of its own). And "Video of the whole game" records every
// story's clip, one after another, in the gallery's order and in the language
// each is shown in.

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProseText from './ProseText';
import ShareButton from './ShareButton';
import LogoStamp from './LogoStamp';
import StoryLanguageSwitch from './StoryLanguageSwitch';
import StoryEnding from './StoryEnding';
import { buildStoryImageFile, downloadStoryImage } from '../downloadStory';
import { textDirection } from '../i18n';
import {
  buildGameVideoFile,
  buildWobbleVideoFile,
  isVideoRecordingSupported,
  RecordingStopped,
  type WobbleVideoOptions,
} from '../recordWobble';
import { trackGameVideo, trackGoldenCartoon } from '../funnel';
import { canShareFiles, downloadFile, shareFiles } from '../share';
import { endingText, storyIn } from '../storyLanguage';
import { BASE_CONTENT, isGolden } from '@funny/shared';
import type { AuthoredLanguage, GalleryEntry } from '@funny/shared';

interface Props {
  entries: GalleryEntry[];
  /** The language the server wrote each entry's prose in. */
  roomLanguage: AuthoredLanguage;
  /** The language every story opens in: App.tsx `myLanguage`. */
  defaultLanguage: AuthoredLanguage;
  /** Step 122: a paid story saved or shared. Never called for any other. */
  onExported?: (kind: 'download' | 'share') => void;
}

// The whole-game video's button appears once this many stories have a picture.
const GAME_VIDEO_MIN = 2;

/** A recorded video, and what it was made of: changed, it is made anew. */
interface Made {
  key: string;
  file: File;
}

/** What is being recorded now; `part` 0 while the whole game's is prepared. */
type Recording = { kind: 'story' } | { kind: 'game'; part: number; total: number };

const BUTTON =
  'w-full rounded border border-amber-300 bg-white px-4 py-3 font-semibold text-pink-500 disabled:cursor-wait disabled:opacity-60';

// The shared room gallery (spec §24): every story + its picture, browsed one
// at a time. Bot slots and ungenerated stories show a no-picture placeholder.
export default function RoomGallery({ entries, roomLanguage, defaultLanguage, onExported }: Props) {
  const { t, i18n } = useTranslation();
  const [index, setIndex] = useState(0);
  // Story index → the language the player switched that story to.
  const [languages, setLanguages] = useState<Record<number, AuthoredLanguage>>({});
  const [recording, setRecording] = useState<Recording | null>(null);
  const [clips, setClips] = useState<Record<number, Made>>({});
  const [gameVideo, setGameVideo] = useState<Made | null>(null);
  const [gameStopped, setGameStopped] = useState(false);
  // Leaving the screen gives up a whole-game recording.
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const videoSupported = isVideoRecordingSupported();
  // Whether to offer the native-share buttons. Web Share with files is present
  // on mobile + Chromium desktop and absent on desktop Firefox; there the
  // download buttons alone remain. It's a static browser capability.
  const shareSupported = canShareFiles();
  // entries is re-broadcast as late pictures arrive (self-heal, spec §24);
  // keep the index valid if a shorter list were ever re-shared.
  const safeIndex = Math.min(index, entries.length - 1);
  const entry = entries[safeIndex];
  // Older servers sent no content: a base story.
  const content = entry?.content ?? BASE_CONTENT;
  const golden = isGolden(content);
  const paid = content.kind === 'paid';
  const goldenCartoon = golden && Boolean(entry?.picture);

  // The Christmas funnel's golden step (D2 A): a golden story's cartoon seen.
  useEffect(() => {
    if (goldenCartoon) trackGoldenCartoon();
  }, [goldenCartoon]);

  if (!entry) return null;
  const language = languages[safeIndex] ?? defaultLanguage;
  const story = storyIn(entry, roomLanguage, language);
  const christmas = content.kind !== 'base';
  const ending = entry.ending ?? null;
  // A seat bot's name in the interface's language, and in the story's on its
  // exports (Step 130); a person's (or a person's bot's) nickname as it is.
  const seat = entry.seat;
  const nickname = seat === undefined ? entry.nickname : t('gallery.botName', { number: seat });
  const exportName =
    seat === undefined
      ? entry.nickname
      : i18n.getFixedT(language)('gallery.botName', { number: seat });
  // What every export of this story shares: its still and its video.
  const still = {
    nickname: exportName,
    prose: story.prose,
    pictureUrl: entry.picture?.url ?? null,
    language,
    golden,
    paid,
    endingUrl: ending?.url ?? null,
  };

  /** A story as its video takes it, in the language the gallery shows it in. */
  function videoOf(item: GalleryEntry, at: number, picture: string): WobbleVideoOptions {
    const shown = languages[at] ?? defaultLanguage;
    const told = storyIn(item, roomLanguage, shown);
    const kind = item.content ?? BASE_CONTENT;
    return {
      nickname:
        item.seat === undefined
          ? item.nickname
          : i18n.getFixedT(shown)('gallery.botName', { number: item.seat }),
      prose: told.prose,
      pictureUrl: picture,
      language: shown,
      golden: isGolden(kind),
      paid: kind.kind === 'paid',
      ending:
        kind.kind === 'base'
          ? null
          : { pictureUrl: item.ending?.url ?? null, text: endingText(told, shown) },
    };
  }

  const clip = entry.picture
    ? videoOf(entry, safeIndex, entry.picture.url)
    : (null as WobbleVideoOptions | null);
  const clipKey = JSON.stringify(clip);
  const clipMade = clips[safeIndex]?.key === clipKey ? clips[safeIndex].file : null;

  // The whole game's video: the stories that have a picture, in this order,
  // under one footer — the buyer's thank-you in a paid game, the edition's
  // line in a free Christmas one.
  const gameStories = entries.flatMap((item, at) =>
    item.picture ? [videoOf(item, at, item.picture.url)] : [],
  );
  const gameKey = JSON.stringify(gameStories);
  const gameMade = gameVideo?.key === gameKey ? gameVideo.file : null;
  const gamePaid = entries.some((item) => item.content?.kind === 'paid');
  const gameChristmas = entries.some((item) => (item.content ?? BASE_CONTENT).kind !== 'base');

  function step(delta: number): void {
    setIndex((safeIndex + delta + entries.length) % entries.length);
  }

  // Short title/text that ride along with the shared file where the platform
  // surfaces them (e.g. the suggested message). The file is the real payload.
  function shareMeta(): { title: string; text: string } {
    return {
      title: t('home.title'),
      text: t('gallery.storyBy', { nickname }),
    };
  }

  function exported(kind: 'download' | 'share'): void {
    if (paid) onExported?.(kind);
  }

  async function downloadImage(): Promise<void> {
    await downloadStoryImage(still);
    exported('download');
  }

  // Native-share the still image; fall back to a download if the platform
  // declines the file (so the button is never a dead end).
  async function shareImage(): Promise<void> {
    const file = await buildStoryImageFile(still);
    const result = await shareFiles([file], shareMeta());
    if (result === 'unsupported') {
      downloadFile(file);
      exported('download');
    } else if (result === 'shared') {
      exported('share');
    }
  }

  async function makeClip(options: WobbleVideoOptions): Promise<void> {
    if (recording) return;
    const at = safeIndex;
    const key = clipKey;
    setRecording({ kind: 'story' });
    try {
      const file = await buildWobbleVideoFile(options);
      setClips((made) => ({ ...made, [at]: { key, file } }));
    } finally {
      setRecording(null);
    }
  }

  async function makeGameVideo(): Promise<void> {
    if (recording) return;
    const key = gameKey;
    const controller = new AbortController();
    abort.current = controller;
    setGameStopped(false);
    setRecording({ kind: 'game', part: 0, total: gameStories.length });
    try {
      // Called before any await, so the video's sound opens inside the tap.
      const file = await buildGameVideoFile({
        stories: gameStories,
        footer: { golden: !gamePaid && gameChristmas, paid: gamePaid },
        signal: controller.signal,
        onPart: (part, total) => setRecording({ kind: 'game', part, total }),
      });
      setGameVideo({ key, file });
      trackGameVideo(gameChristmas);
    } catch (err) {
      if (!(err instanceof RecordingStopped)) throw err;
      setGameStopped(true);
    } finally {
      setRecording(null);
    }
  }

  // A made video's two buttons. A paid game's counts once saved or shared
  // (the receipt record), the whole game's video as one.
  function madeButtons(file: File, paidVideo: boolean, text: string) {
    function done(kind: 'download' | 'share'): void {
      if (paidVideo) onExported?.(kind);
    }
    function save(): void {
      downloadFile(file);
      done('download');
    }
    async function share(): Promise<void> {
      const result = await shareFiles([file], { title: t('home.title'), text });
      if (result === 'unsupported') save();
      else if (result === 'shared') done('share');
    }
    return (
      // A long language's two words take a row each on a narrow phone.
      <div className="flex flex-wrap gap-2 [&>button]:grow">
        <button className={BUTTON} onClick={save}>
          {t('gallery.videoSave')}
        </button>
        {shareSupported && (
          <ShareButton label={t('gallery.videoShare')} onClick={() => void share()} />
        )}
      </div>
    );
  }

  return (
    <section className="flex w-full flex-col gap-3 rounded-xl border border-amber-200 bg-white p-4">
      <h3 className="font-display text-xl font-semibold text-pink-500">{t('gallery.title')}</h3>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <p className="text-sm text-gray-600">{t('gallery.storyBy', { nickname })}</p>
          {golden && (
            <p className="text-sm font-semibold text-pink-600">{t('reveal.goldenStory')}</p>
          )}
        </div>
        <StoryLanguageSwitch
          value={language}
          onChange={(next) => setLanguages((chosen) => ({ ...chosen, [safeIndex]: next }))}
        />
      </div>

      {entry.picture ? (
        // Three stacked wrappers each carry one of the four CSS-keyframe
        // wobble axes; the innermost img carries the pulse-free transform.
        <div className="relative">
          <div className="picture-wobble-drift">
            <div className="picture-wobble-jiggle">
              <div className="picture-wobble-zoom">
                <img
                  src={entry.picture.url}
                  width={entry.picture.width}
                  height={entry.picture.height}
                  alt={t('gallery.pictureAlt', { nickname })}
                  className="w-full rounded-lg shadow"
                />
              </div>
            </div>
          </div>
          <LogoStamp />
        </div>
      ) : (
        <div className="flex h-40 w-full items-center justify-center rounded-lg border-2 border-dashed border-amber-300 bg-amber-50">
          <p className="text-sm text-gray-500">{t('gallery.noPicture')}</p>
        </div>
      )}

      {christmas && (
        <StoryEnding
          ending={ending}
          text={endingText(story, language)}
          language={language}
          alt={t('gallery.endingAlt', { nickname })}
        />
      )}

      {/* The story's own lang and dir, which can differ from the interface's. */}
      <div lang={language} dir={textDirection(language)}>
        <ProseText prose={story.prose} answers={story.answers} className="text-lg" />
      </div>

      {/* Download the still image, with a native Share button on its right
          (supported browsers only). */}
      <div className="flex gap-2">
        <button
          className="flex-1 rounded border border-amber-300 bg-white px-4 py-3 font-semibold text-pink-500"
          onClick={() => void downloadImage()}
        >
          {entry.picture ? t('gallery.download') : t('gallery.downloadStoryOnly')}
        </button>
        {shareSupported && (
          <ShareButton label={t('gallery.shareButton')} onClick={() => void shareImage()} />
        )}
      </div>

      {clip &&
        videoSupported &&
        (clipMade ? (
          madeButtons(clipMade, paid, t('gallery.storyBy', { nickname }))
        ) : (
          // Records the 5-second video.
          <button
            className={BUTTON}
            disabled={recording !== null}
            onClick={() => void makeClip(clip)}
          >
            {recording?.kind === 'story' ? t('gallery.recording') : t('gallery.downloadVideo')}
          </button>
        ))}

      <div className="flex items-center justify-between pt-1">
        <button
          className="rounded bg-white px-5 py-3 font-semibold text-pink-500"
          onClick={() => step(-1)}
          aria-label={t('gallery.prev')}
        >
          <span className="inline-block rtl:-scale-x-100">◀</span>
        </button>
        <span className="text-sm text-gray-600">
          {t('gallery.counter', { index: safeIndex + 1, total: entries.length })}
        </span>
        <button
          className="rounded bg-white px-5 py-3 font-semibold text-pink-500"
          onClick={() => step(1)}
          aria-label={t('gallery.next')}
        >
          <span className="inline-block rtl:-scale-x-100">▶</span>
        </button>
      </div>

      {videoSupported && gameStories.length >= GAME_VIDEO_MIN && (
        <div className="flex flex-col gap-2 border-t border-amber-200 pt-3">
          {gameMade ? (
            <>
              <p className="text-sm font-semibold text-gray-600">{t('gallery.gameVideo')}</p>
              {madeButtons(gameMade, gamePaid, t('gallery.gameVideo'))}
            </>
          ) : (
            <button
              className={BUTTON}
              disabled={recording !== null}
              onClick={() => void makeGameVideo()}
            >
              {recording?.kind !== 'game'
                ? t('gallery.gameVideo')
                : recording.part === 0
                  ? t('gallery.gameVideoPreparing')
                  : t('gallery.gameVideoRecording', {
                      number: recording.part,
                      total: recording.total,
                    })}
            </button>
          )}
          {gameStopped && (
            <p role="alert" className="text-sm text-pink-600">
              {t('gallery.gameVideoStopped')}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
