// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from apps/funny-multi-client/src/components/SourceFooter.tsx — the
// `sourceQr` prop and QRCode import are dropped: Funny One has no join link
// to encode (FO-ARC-3, no rooms), so there's nothing for a QR code to point
// at. The content notice also drops the "AI pictures" clause, since Funny
// One's rig art ships with the app rather than being generated per-story
// (D-8). Since T-FO-6.2 the link points at the game itself (gameUrl.ts), not
// the GitHub repo, which stays private until launch — so a plain link icon
// replaces the GitHub mark.
//
// D-10 (2026-10-05): with Internet pictures chosen the notice is the
// `contentNoticeOnline` one — "runs entirely on your device" would no longer
// be the whole truth once a story's cartoon is fetched from the library.
//
// Step 85 (B-23): Home's footer also links to the privacy policy, at the
// section in the interface language. Google Play wants that link inside the
// app itself, and the Android app is this page in a Trusted Web Activity, so
// this link is the app's. Caddy serves the policy at the root of the game's
// host (deploy/caddy/Caddyfile); the service worker leaves that address to
// the network (vite.config.ts), so it needs a connection.

import { isLanguage } from '@funny/shared';
import { useTranslation } from 'react-i18next';
import { gameUrl } from '../gameUrl';
import type { PictureSource } from '../pictureSource';
import { APP_VERSION, BUILD_DATE } from '../version';

interface Props {
  pictures?: PictureSource;
  /** Link to the privacy policy. On the Home screen only. */
  privacyLink?: boolean;
}

export default function SourceFooter({ pictures = 'builtin', privacyLink = false }: Props) {
  const { t, i18n } = useTranslation();
  const language = isLanguage(i18n.language) ? i18n.language : 'en';
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
      {privacyLink && (
        <a
          href={`/privacy#privacy-${language}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {t('footer.privacy')}
        </a>
      )}
      <p className="px-2">
        {t(pictures === 'online' ? 'footer.contentNoticeOnline' : 'footer.contentNotice')}
      </p>
      <p className="text-gray-400">
        v{APP_VERSION} · {BUILD_DATE}
      </p>
    </footer>
  );
}
