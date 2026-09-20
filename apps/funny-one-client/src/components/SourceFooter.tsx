// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from apps/funny-multi-client/src/components/SourceFooter.tsx — the
// `sourceQr` prop and QRCode import are dropped: Funny One has no join link
// to encode (FO-ARC-3, no rooms), so there's nothing for a QR code to point
// at. The content notice also drops the "AI pictures" clause, since Funny
// One's rig art ships with the app rather than being generated per-story
// (D-8).

import { useTranslation } from 'react-i18next';
import { SOURCE_URL } from '../sourceUrl';
import { APP_VERSION, BUILD_DATE } from '../version';

export default function SourceFooter() {
  const { t } = useTranslation();
  return (
    <footer className="mt-6 flex w-full flex-col items-center gap-1 text-center text-xs text-gray-500">
      <a
        href={SOURCE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 underline"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 fill-current">
          <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
        </svg>
        <span>{t('footer.source')}</span>
      </a>
      <p className="px-2">{t('footer.contentNotice')}</p>
      <p className="text-gray-400">
        v{APP_VERSION} · {BUILD_DATE}
      </p>
    </footer>
  );
}
