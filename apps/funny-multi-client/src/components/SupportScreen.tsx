// SPDX-License-Identifier: AGPL-3.0-only

// T-9.4 (FM-TIER-4, design §10.2). Opened from Home's ♥ and from the end
// screen (App.tsx owns both entry points and the fetched config). Row order
// — PayID, Sponsors, Lightning, Ko-fi, Buy Me a Coffee, donate URL — is the
// design's; each row renders only when its value is set. The caller only
// mounts this once `hasAnyRail` is true, so at least one row always shows.

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

// Step 75: the Ko-fi and Buy Me a Coffee buttons, in the brands' own colours
// and with the cup icons of the books page (oursharedcode.github.io), whose
// sheen they share (styles/index.css).
const GIFT_BUTTON =
  'gift-sheen relative flex min-h-[3.5rem] items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-2 text-center text-xl font-bold shadow-md';

/** A rail's name with a short note beside it: "In Australia", "Crypto Bitcoin". */
function RailTitle({ name, note }: { name: string; note: string }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-semibold text-gray-800">
      {name}
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
        {note}
      </span>
    </p>
  );
}

function KofiCup() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M4 5h12a1 1 0 0 1 1 1v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V6a1 1 0 0 1 1-1Z"
        fill="currentColor"
        opacity=".95"
      />
      <path
        d="M17 7h1.5a2.5 2.5 0 0 1 0 5H17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.6 8.6c.7-.8 1.9-.5 2.1.5.2-1 1.4-1.3 2.1-.5.6.7.3 1.7-.6 2.4l-1.5 1.2-1.5-1.2c-.9-.7-1.2-1.7-.6-2.4Z"
        fill="#ff5e5b"
      />
      <path d="M4 20h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CoffeeCup() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M5 8h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8Z" fill="currentColor" />
      <path
        d="M16 9.5h1.5a2.5 2.5 0 0 1 0 5H16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 5.2c0-.8 1-.9 1-1.7M11 5.2c0-.8 1-.9 1-1.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M4 20.5h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

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
            <RailTitle name={t('support.payId')} note={t('support.payIdWhere')} />
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
            <RailTitle name={t('support.lightning')} note={t('support.lightningWhat')} />
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

        {support.kofiUrl && (
          <a
            href={support.kofiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${GIFT_BUTTON} bg-[#ff5e5b] text-white`}
            onClick={() => trackGift('kofi')}
          >
            <KofiCup />
            {t('support.kofi')}
          </a>
        )}

        {support.bmcUrl && (
          <a
            href={support.bmcUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${GIFT_BUTTON} gift-sheen-bright bg-[#ffdd00] text-[#10121a]`}
            onClick={() => trackGift('bmc')}
          >
            <CoffeeCup />
            {t('support.bmc')}
          </a>
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
