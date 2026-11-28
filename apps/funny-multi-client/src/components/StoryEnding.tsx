// SPDX-License-Identifier: AGPL-3.0-only

// Step 117 (B-29): a Christmas story's ending, under its scene on the reveal
// screen and in the gallery — a golden story's aftermath picture when it came
// (FM-PACK-3), the ending as a card otherwise: a slice story's, or a golden
// one's whose picture could not be had.
//
// Step 133 (B-29 #9; the owner's pick of 2026-11-28, D2: card 1, "Holly"): the
// card in a green frame, a holly sprig on its top-left and bottom-right corners
// and the gold bell over the ending (hollyArt.ts), as the clip draws it
// (videoFooter.ts `drawEndingCard`). The sprigs reach some 9 px outside the
// card, into the padding round it: the reveal screen's 24 px, the gallery
// entry's 16 px.

import { textDirection } from '../i18n';
import ArtSvg from './art/ArtSvg';
import { BELL, SPRIG } from './art/hollyArt';
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
      className="relative flex flex-col items-center gap-2 rounded-xl border-4 border-green-700 bg-white px-6 py-8 text-center shadow"
    >
      <ArtSvg art={SPRIG} className="absolute -left-[18px] -top-[18px] h-20 w-20" />
      <ArtSvg art={SPRIG} className="absolute -bottom-[18px] -right-[18px] h-20 w-20 rotate-180" />
      <ArtSvg art={BELL} className="h-14 w-14" />
      <p className="font-prose text-2xl leading-snug text-gray-800">{text}</p>
    </div>
  );
}
