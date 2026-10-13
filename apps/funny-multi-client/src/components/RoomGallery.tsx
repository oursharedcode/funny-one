// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from SRC/client/src/components/RoomGallery.tsx (spec §24). One
// thing SRC's version had is deliberately not here:
//
//   - The `wobbleEngine` prop — the type it read (`WobbleEngine`) doesn't
//     exist in this repo's wire contract at all (ARC-3/DD-9, T-1.6): there is
//     only the CSS engine now, so there is nothing to choose between.
//     `downloadVideo` below always uses `recordWobble.ts`.
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

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProseText from './ProseText';
import ShareButton from './ShareButton';
import LogoStamp from './LogoStamp';
import StoryLanguageSwitch from './StoryLanguageSwitch';
import { buildStoryImageFile, downloadStoryImage } from '../downloadStory';
import { textDirection } from '../i18n';
import { buildWobbleVideoFile, isVideoRecordingSupported } from '../recordWobble';
import { canShareFiles, downloadFile, shareFiles } from '../share';
import { storyIn } from '../storyLanguage';
import type { AuthoredLanguage, GalleryEntry } from '@funny/shared';

interface Props {
  entries: GalleryEntry[];
  /** The language the server wrote each entry's prose in. */
  roomLanguage: AuthoredLanguage;
  /** The language every story opens in: App.tsx `myLanguage`. */
  defaultLanguage: AuthoredLanguage;
}

// The shared room gallery (spec §24): every story + its picture, browsed one
// at a time. Bot slots and ungenerated stories show a no-picture placeholder.
export default function RoomGallery({ entries, roomLanguage, defaultLanguage }: Props) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  // Story index → the language the player switched that story to.
  const [languages, setLanguages] = useState<Record<number, AuthoredLanguage>>({});
  const [recording, setRecording] = useState(false);
  const videoSupported = isVideoRecordingSupported();
  // Whether to offer the native-share buttons. Web Share with files is present
  // on mobile + Chromium desktop and absent on desktop Firefox; there the
  // download buttons alone remain. It's a static browser capability.
  const shareSupported = canShareFiles();

  if (entries.length === 0) return null;
  // entries is re-broadcast as late pictures arrive (self-heal, spec §24);
  // keep the index valid if a shorter list were ever re-shared.
  const safeIndex = Math.min(index, entries.length - 1);
  const entry = entries[safeIndex]!;
  const language = languages[safeIndex] ?? defaultLanguage;
  const story = storyIn(entry, roomLanguage, language);

  function step(delta: number): void {
    setIndex((safeIndex + delta + entries.length) % entries.length);
  }

  // Short title/text that ride along with the shared file where the platform
  // surfaces them (e.g. the suggested message). The file is the real payload.
  function shareMeta(): { title: string; text: string } {
    return {
      title: t('home.title'),
      text: t('gallery.storyBy', { nickname: entry.nickname }),
    };
  }

  // Native-share the still image; fall back to a download if the platform
  // declines the file (so the button is never a dead end).
  async function shareImage(): Promise<void> {
    const file = await buildStoryImageFile({
      nickname: entry.nickname,
      prose: story.prose,
      pictureUrl: entry.picture?.url ?? null,
      language,
    });
    if ((await shareFiles([file], shareMeta())) === 'unsupported') downloadFile(file);
  }

  async function downloadVideo(): Promise<void> {
    if (!entry.picture || recording) return;
    setRecording(true);
    try {
      const file = await buildWobbleVideoFile({
        nickname: entry.nickname,
        prose: story.prose,
        pictureUrl: entry.picture.url,
        language,
      });
      downloadFile(file);
    } finally {
      setRecording(false);
    }
  }

  return (
    <section className="flex w-full flex-col gap-3 rounded-xl border border-amber-200 bg-white p-4">
      <h3 className="font-display text-xl font-semibold text-pink-500">{t('gallery.title')}</h3>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {t('gallery.storyBy', { nickname: entry.nickname })}
        </p>
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
                  alt={t('gallery.pictureAlt', { nickname: entry.nickname })}
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

      {/* The story's own lang and dir, which can differ from the interface's. */}
      <div lang={language} dir={textDirection(language)}>
        <ProseText prose={story.prose} answers={story.answers} className="text-lg" />
      </div>

      {/* Download the still image, with a native Share button on its right
          (supported browsers only). */}
      <div className="flex gap-2">
        <button
          className="flex-1 rounded border border-amber-300 bg-white px-4 py-3 font-semibold text-pink-500"
          onClick={() =>
            void downloadStoryImage({
              nickname: entry.nickname,
              prose: story.prose,
              pictureUrl: entry.picture?.url ?? null,
              language,
            })
          }
        >
          {entry.picture ? t('gallery.download') : t('gallery.downloadStoryOnly')}
        </button>
        {shareSupported && (
          <ShareButton label={t('gallery.shareButton')} onClick={() => void shareImage()} />
        )}
      </div>

      {entry.picture && videoSupported && (
        // Download the 5-second video.
        <button
          className="w-full rounded border border-amber-300 bg-white px-4 py-3 font-semibold text-pink-500 disabled:cursor-wait disabled:opacity-60"
          disabled={recording}
          onClick={() => void downloadVideo()}
        >
          {recording ? t('gallery.recording') : t('gallery.downloadVideo')}
        </button>
      )}

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
    </section>
  );
}
