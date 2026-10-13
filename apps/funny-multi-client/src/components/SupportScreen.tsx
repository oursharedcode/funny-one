// SPDX-License-Identifier: AGPL-3.0-only

// T-9.4 (FM-TIER-4, design §10.2). Opened from Home's ♥ and from the end
// screen (App.tsx owns both entry points and the fetched config). Row order
// — PayID, Sponsors, Lightning, donate URL — is the design's; each row
// renders only when its value is set. The caller only mounts this once
// `hasAnyRail` is true, so at least one row always shows.

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from './QRCode';
import { trackGift, type GiftRail } from '../funnel';
import type { SupportConfig } from '@funny/shared';

interface Props {
  support: SupportConfig;
  onClose: () => void;
}

type CopyField = 'payId' | 'lightning';

// The funnel's name for each copied field (funnel.ts, Step 72).
const GIFT_RAIL: Record<CopyField, GiftRail> = { payId: 'payid', lightning: 'lightning' };

export default function SupportScreen({ support, onClose }: Props) {
  const { t } = useTranslation();
  // Which row currently shows "Copied!" — at most one at a time, same pattern
  // as LobbyScreen's copy-link button.
  const [copiedField, setCopiedField] = useState<CopyField | null>(null);

  function copy(field: CopyField, value: string): void {
    trackGift(GIFT_RAIL[field]);
    const flash = (): void => {
      setCopiedField(field);
      window.setTimeout(() => setCopiedField((f) => (f === field ? null : f)), 1500);
    };
    function fallbackCopy(): void {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      flash();
    }
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(value).then(flash, fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-pink-500">{t('support.title')}</h2>
          <button
            type="button"
            aria-label={t('support.close')}
            className="px-2 text-2xl leading-none text-gray-500"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600">{t('support.intro')}</p>

        {support.payId && (
          <div className="rounded border border-amber-300 bg-white p-3">
            <p className="font-semibold text-gray-800">{t('support.payId')}</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 break-all">{support.payId}</code>
              <button
                type="button"
                className="flex-shrink-0 rounded border border-amber-300 px-3 py-1 text-sm font-semibold"
                onClick={() => copy('payId', support.payId as string)}
              >
                {copiedField === 'payId' ? t('support.copied') : t('support.copy')}
              </button>
            </div>
            {support.payIdName && (
              <p className="mt-1 text-xs text-gray-600">
                {t('support.payIdBankNote', { name: support.payIdName })}
              </p>
            )}
          </div>
        )}

        {support.sponsorsUrl && (
          <div className="rounded border border-amber-300 bg-white p-3">
            <p className="font-semibold text-gray-800">{t('support.sponsors')}</p>
            <a
              href={support.sponsorsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block break-all text-pink-500 underline"
              onClick={() => trackGift('sponsors')}
            >
              {support.sponsorsUrl}
            </a>
            <p className="mt-1 text-xs text-gray-600">{t('support.sponsorsHint')}</p>
          </div>
        )}

        {support.lightningAddress && (
          <div className="rounded border border-amber-300 bg-white p-3">
            <p className="font-semibold text-gray-800">{t('support.lightning')}</p>
            <div className="mt-1 flex items-center gap-2">
              <a
                href={`lightning:${support.lightningAddress}`}
                className="flex-1 break-all text-pink-500 underline"
                onClick={() => trackGift('lightning')}
              >
                {support.lightningAddress}
              </a>
              <button
                type="button"
                className="flex-shrink-0 rounded border border-amber-300 px-3 py-1 text-sm font-semibold"
                onClick={() => copy('lightning', support.lightningAddress as string)}
              >
                {copiedField === 'lightning' ? t('support.copied') : t('support.copy')}
              </button>
            </div>
            <div className="mt-2 flex justify-center">
              <QRCode value={`lightning:${support.lightningAddress}`} size={140} />
            </div>
          </div>
        )}

        {support.donateUrl && (
          <a
            href={support.donateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-amber-300 bg-white p-3 text-center font-semibold text-pink-500 underline"
            onClick={() => trackGift('donate')}
          >
            {t('support.donate')}
          </a>
        )}
      </div>
    </div>
  );
}
