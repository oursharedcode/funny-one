// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-4.3a — adapted from
// `apps/funny-multi-client/src/components/RoomGallery.tsx`. What's not here:
// the video button and no-picture placeholder branch (every Funny One story
// is complete by the time it reaches the gallery — there's no async picture
// generation to be mid-flight for, and OQ-4 scoped T-FO-4.3b to the still
// image only, no video/wobble recording).
//
// T-FO-4.3b adds Download/Share, wired to `rigExport.ts` — the rig's
// canvas-compositor sibling to Multi's `downloadStory.ts` (no fetchable
// picture URL here; it rasterizes the same `RIG_LAYERS` art the on-screen
// `RigScene` draws) — and `share.ts`, copied verbatim.
//
// Each story plays RigScene's spring reveal (FO-IMG-3) exactly once, the
// first time it's stepped to — `seen` tracks which indices have already
// played it. `RigScene` is remounted per index (`key={index}`) so navigating
// to an unseen story always gets a fresh `initial` mount; revisiting a seen
// one mounts fresh too, but with `reveal={false}`, which renders already
// settled (see `RigScene`'s doc comment on that mode).

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import RigScene from './RigScene';
import ProseText from './ProseText';
import ShareButton from './ShareButton';
import { resolveStory } from '../game/resolveStory';
import { buildStoryImageFile, downloadStoryImage } from '../rigExport';
import { canShareFiles, downloadFile, shareFiles } from '../share';
import type { Seat } from '../game/roundRobin';
import type { AuthoredLanguage, Story } from '@funny/shared';

interface Props {
  seats: readonly Seat[];
  stories: readonly Story[];
  language: AuthoredLanguage;
}

export default function StoryGallery({ seats, stories, language }: Props) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set());
  const shareSupported = canShareFiles();

  // Marks the currently open story seen after its mount, once the reveal
  // (or settled) render has committed — doesn't retrigger RigScene's own
  // animation, since framer-motion only reads `initial` at mount time.
  useEffect(() => {
    if (seen.has(index)) return;
    setSeen((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
  }, [index, seen]);

  if (stories.length === 0) return null;
  const safeIndex = Math.min(index, stories.length - 1);
  const seat = seats[safeIndex]!;
  const story = stories[safeIndex]!;
  const { answers, prose } = resolveStory(language, story);
  const reveal = !seen.has(safeIndex);

  function step(delta: number): void {
    setIndex((safeIndex + delta + stories.length) % stories.length);
  }

  // Native-share the still image; fall back to a download if the platform
  // declines the file (so the button is never a dead end).
  async function shareImage(): Promise<void> {
    const file = await buildStoryImageFile({ name: seat.name, prose, story });
    const meta = { title: t('home.title'), text: t('gallery.storyBy', { name: seat.name }) };
    if ((await shareFiles([file], meta)) === 'unsupported') downloadFile(file);
  }

  return (
    <section className="flex w-full flex-col gap-3 rounded-xl border border-amber-200 bg-white p-4">
      <h3 className="font-display text-xl font-semibold text-pink-500">{t('gallery.title')}</h3>

      <p className="text-sm text-gray-600">{t('gallery.storyBy', { name: seat.name })}</p>

      <div role="img" aria-label={t('gallery.pictureAlt', { name: seat.name })}>
        <RigScene key={safeIndex} story={story} reveal={reveal} />
      </div>

      <ProseText prose={prose} answers={answers} className="text-lg" />

      {/* Mirrored under RTL: flex already swaps the buttons, the glyphs must follow. */}
      <div className="flex items-center justify-between pt-1">
        <button
          className="rounded bg-white px-5 py-3 font-semibold text-pink-500"
          onClick={() => step(-1)}
          aria-label={t('gallery.prev')}
        >
          <span className="inline-block rtl:-scale-x-100">◀</span>
        </button>
        <span className="text-sm text-gray-600">
          {t('gallery.counter', { index: safeIndex + 1, total: stories.length })}
        </span>
        <button
          className="rounded bg-white px-5 py-3 font-semibold text-pink-500"
          onClick={() => step(1)}
          aria-label={t('gallery.next')}
        >
          <span className="inline-block rtl:-scale-x-100">▶</span>
        </button>
      </div>

      {/* Download the still image, with a native Share button on its right
          (supported browsers only). */}
      <div className="flex gap-2">
        <button
          className="flex-1 rounded border border-amber-300 bg-white px-4 py-3 font-semibold text-pink-500"
          onClick={() => void downloadStoryImage({ name: seat.name, prose, story })}
        >
          {t('gallery.download')}
        </button>
        {shareSupported && (
          <ShareButton label={t('gallery.shareButton')} onClick={() => void shareImage()} />
        )}
      </div>
    </section>
  );
}
