// SPDX-License-Identifier: AGPL-3.0-only

// Step 117 (B-29): a Christmas story's ending, under its scene on the reveal
// screen and in the gallery — a golden story's aftermath picture when it came
// (FM-PACK-3), the ending as a card otherwise: a slice story's, or a golden
// one's whose picture could not be had.

import { textDirection } from '../i18n';
import type { AuthoredLanguage, PictureRef } from '@funny/shared';

interface Props {
  ending: PictureRef | null;
  /** The ending in the story's language (storyLanguage.ts `endingText`). */
  text: string;
  /** The language the story is on screen in. */
  language: AuthoredLanguage;
  /** The ending picture's alternative text. */
  alt: string;
}

export default function StoryEnding({ ending, text, language, alt }: Props) {
  if (ending) {
    return (
      <img
        src={ending.url}
        width={ending.width}
        height={ending.height}
        alt={alt}
        className="w-full rounded-xl shadow-lg"
      />
    );
  }
  return (
    <div
      lang={language}
      dir={textDirection(language)}
      data-testid="ending-card"
      className="flex flex-col items-center gap-2 rounded-xl border-4 border-pink-400 bg-white px-6 py-8 text-center shadow"
    >
      <span aria-hidden="true" className="text-4xl">
        🔔
      </span>
      <p className="font-prose text-2xl leading-snug text-gray-800">{text}</p>
    </div>
  );
}
