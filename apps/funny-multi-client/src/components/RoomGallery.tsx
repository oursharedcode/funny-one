// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from SRC/client/src/components/RoomGallery.tsx (spec §24). Three
// things SRC's version had are deliberately not here, each arriving with the
// task that owns it:
//
//   - Download/share/video buttons (`downloadStory.ts`, `share.ts`,
//     `recordWobble.ts`) — T-5.2's. This screen browses the gallery; it does
//     not yet export it.
//   - `<LogoStamp />` over the picture — T-7.2's, same as RevealScreen (T-4.4)
//     already noted. The picture renders correctly without the branding
//     overlay.
//   - The `wobbleEngine` prop — the type it read (`WobbleEngine`) doesn't
//     exist in this repo's wire contract at all (ARC-3/DD-9, T-1.6): there is
//     only the CSS engine now, so there is nothing to choose between.
//
// What's carried: the picture-wobble CSS classes (styles/index.css, already
// present since T-3.1 — its own comment names "reveal + gallery animated
// preview" as their intended use) and the prev/next browsing UI.

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProseText from './ProseText';
import type { GalleryEntry } from '@funny/shared';

interface Props {
  entries: GalleryEntry[];
}

// The shared room gallery (spec §24): every story + its picture, browsed one
// at a time. Bot slots and ungenerated stories show a no-picture placeholder.
export default function RoomGallery({ entries }: Props) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  if (entries.length === 0) return null;
  // entries is re-broadcast as late pictures arrive (self-heal, spec §24);
  // keep the index valid if a shorter list were ever re-shared.
  const safeIndex = Math.min(index, entries.length - 1);
  const entry = entries[safeIndex]!;

  function step(delta: number): void {
    setIndex((safeIndex + delta + entries.length) % entries.length);
  }

  return (
    <section className="flex w-full flex-col gap-3 rounded-xl border border-amber-200 bg-white p-4">
      <h3 className="font-display text-xl font-semibold text-pink-500">{t('gallery.title')}</h3>

      <p className="text-sm text-gray-600">{t('gallery.storyBy', { nickname: entry.nickname })}</p>

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
        </div>
      ) : (
        <div className="flex h-40 w-full items-center justify-center rounded-lg border-2 border-dashed border-amber-300 bg-amber-50">
          <p className="text-sm text-gray-500">{t('gallery.noPicture')}</p>
        </div>
      )}

      <ProseText prose={entry.prose} answers={entry.answers} className="text-lg" />

      <div className="flex items-center justify-between pt-1">
        <button
          className="rounded bg-white px-5 py-3 font-semibold text-pink-500"
          onClick={() => step(-1)}
          aria-label={t('gallery.prev')}
        >
          ◀
        </button>
        <span className="text-sm text-gray-600">
          {t('gallery.counter', { index: safeIndex + 1, total: entries.length })}
        </span>
        <button
          className="rounded bg-white px-5 py-3 font-semibold text-pink-500"
          onClick={() => step(1)}
          aria-label={t('gallery.next')}
        >
          ▶
        </button>
      </div>
    </section>
  );
}
