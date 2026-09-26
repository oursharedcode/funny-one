// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from apps/funny-multi-client/src/components/SourceFooter.tsx — the
// `sourceQr` prop and QRCode import are dropped: Funny One has no join link
// to encode (FO-ARC-3, no rooms), so there's nothing for a QR code to point
// at. The content notice also drops the "AI pictures" clause, since Funny
// One's rig art ships with the app rather than being generated per-story
// (D-8). Since T-FO-6.2 the link points at the game itself (gameUrl.ts), not
// the GitHub repo, which stays private until launch — so a plain link icon
// replaces the GitHub mark.

import { useTranslation } from 'react-i18next';
import { gameUrl } from '../gameUrl';
import { APP_VERSION, BUILD_DATE } from '../version';

export default function SourceFooter() {
  const { t } = useTranslation();
  return (
    <footer className="mt-6 flex w-full flex-col items-center gap-1 text-center text-xs text-gray-500">
      <a
        href={gameUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 underline"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="h-4 w-4 fill-none stroke-current"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M6.5 9.5l3-3M7 4.5l1-1a2.83 2.83 0 0 1 4 4l-1 1M9 11.5l-1 1a2.83 2.83 0 0 1-4-4l1-1" />
        </svg>
        <span>{t('footer.gameLink')}</span>
      </a>
      <p className="px-2">{t('footer.contentNotice')}</p>
      <p className="text-gray-400">
        v{APP_VERSION} · {BUILD_DATE}
      </p>
    </footer>
  );
}
