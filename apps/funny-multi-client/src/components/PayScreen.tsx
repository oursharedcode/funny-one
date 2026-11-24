// SPDX-License-Identifier: AGPL-3.0-only

// Step 123 (B-29, owner decisions 2026-11-24): the pay page — a sheet over the
// game, like SupportScreen, opened from the end screen's pay card or from a
// link (pay.ts; the landing site's `/x26` forwards here). App.tsx mounts it on
// the website only: the Android app has no way in.
//
// What it shows, top to bottom, while the pack is on sale:
//
// - what is bought and until when; the price, written as the buyer is charged
//   it and never converted (D3 A) — Australian dollars by PayID, US dollars on
//   GitHub Sponsors, "your bank converts it";
// - the rail the server chose from the visitor's country (D2 A), with a small
//   link to the other one, since a country lookup can be wrong;
// - on Sponsors, the three-step guide in the reader's language (D5 A);
// - for a reader whose language has no stories of the pack (ar, he, fa), the
//   languages it does play in, before they pay (D4 A);
// - the refund policy, whose version goes with the payment to the receipt log;
// - the pay button. No rail is wired in this step (pay.ts `startPayment`), so
//   it answers "can't be started right now".
//
// Instead of all that: a phone that keeps a code sees its own pack; once the
// pack's free part has ended it is no longer on sale; and when the server
// sells nothing (no code secret, pack rooms off, or no answer) it says to come
// back later. Until the server has answered, only the header shows.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LANGUAGES,
  PACKS,
  REFUND_POLICY_VERSION,
  isPackFree,
  isPackPaid,
  type PackId,
  type PayConfig,
  type PayRail,
} from '@funny/shared';
import PackCodeLine from './PackCodeLine';
import { trackPayPage, trackPayPress } from '../funnel';
import { readPackCode } from '../packCode';
import { lastPaidDay } from '../packDay';
import { SPONSORS_TIERS, startPayment, type PayDoor } from '../pay';

interface Props {
  /** The pack the card or the link named. */
  pack: PackId;
  /** The server's `/config` answer: what is on sale and by which rail; undefined until it answers. */
  pay: PayConfig | null | undefined;
  door: PayDoor;
  onClose: () => void;
}

/**
 * The pack's languages as each names itself, without the region the picker
 * adds — "Deutsch", not "Deutsch (Deutschland)" — so the two Spanishes read as
 * one.
 */
function languageNames(pack: PackId): string[] {
  const codes: readonly string[] = PACKS[pack].languages;
  const names = LANGUAGES.filter((l) => codes.includes(l.code)).map((l) =>
    l.name.replace(/\s*\(.*\)$/u, ''),
  );
  return [...new Set(names)];
}

/**
 * A name in Latin letters kept whole inside a right-to-left line (Unicode's
 * first-strong isolate, U+2068 … U+2069). Without it the tier's name, the
 * closing quotation mark and the price after it join into one left-to-right
 * run in ar and he, and the mark and the colon land on the wrong side of the
 * name. Invisible, and harmless in a left-to-right line.
 */
function isolated(text: string): string {
  return `⁨${text}⁩`;
}

export default function PayScreen({ pack, pay, door, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const [chosenRail, setChosenRail] = useState<PayRail | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    trackPayPage(door);
  }, [door]);

  const now = Date.now();
  const code = readPackCode();
  const owned = code?.pack === pack ? code : null;
  const selling = isPackFree(pack, now);
  const onSale = !owned && selling && pay?.pack === pack ? pay : null;
  // The server has not said yet whether the pack is on sale.
  const waiting = !owned && selling && pay === undefined;
  const rail = chosenRail ?? onSale?.rail ?? 'sponsors';
  const price = PACKS[pack].prices[rail];
  const date = lastPaidDay(pack, i18n.language);
  const foreign = !(PACKS[pack].languages as readonly string[]).includes(i18n.language);

  function switchRail(): void {
    setChosenRail(rail === 'payid' ? 'sponsors' : 'payid');
    setFailed(false);
  }

  async function press(): Promise<void> {
    trackPayPress(rail);
    setBusy(true);
    setFailed(false);
    const started = await startPayment({ pack, rail, policy: REFUND_POLICY_VERSION });
    setBusy(false);
    setFailed(!started.ok);
  }

  let body: JSX.Element | null;
  if (owned) {
    body = (
      <>
        <p className="font-semibold text-gray-800">{t('pay.haveTitle')}</p>
        <div className="break-words rounded border border-amber-300 bg-white p-3">
          {isPackPaid(pack, now) ? (
            <>
              <PackCodeLine code={owned.code} />
              <p className="text-sm text-gray-600">{t('home.packCodeHint', { date })}</p>
            </>
          ) : (
            <p className="text-gray-700">{t('home.packEnded')}</p>
          )}
        </div>
      </>
    );
  } else if (!selling) {
    body = <p className="text-gray-800">{t('pay.ended')}</p>;
  } else if (waiting) {
    body = null;
  } else if (!onSale) {
    body = <p className="text-gray-800">{t('pay.closed')}</p>;
  } else {
    body = (
      <>
        <p className="text-gray-800">{t('pay.pitch', { date })}</p>

        <div className="rounded border border-amber-300 bg-white p-4 text-center">
          <p className="font-display text-4xl font-bold text-pink-600" dir="ltr" data-price={rail}>
            {price}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {t(rail === 'payid' ? 'pay.oncePayId' : 'pay.onceSponsors')}
          </p>
        </div>

        {rail === 'sponsors' && (
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-gray-800">{t('pay.guideTitle')}</p>
            <ol className="flex list-decimal flex-col gap-1 ps-6 text-gray-700">
              <li>{t('pay.guide1')}</li>
              <li>{t('pay.guide2', { tier: isolated(SPONSORS_TIERS[pack]), price })}</li>
              <li>{t('pay.guide3')}</li>
            </ol>
          </div>
        )}

        {foreign && (
          <div className="flex flex-col gap-2 rounded bg-amber-50 p-3" role="note">
            <p className="font-semibold text-gray-800">{t('pay.otherLanguages')}</p>
            <ul className="flex flex-wrap gap-1.5">
              {languageNames(pack).map((name) => (
                <li
                  key={name}
                  dir="auto"
                  className="rounded-full bg-white px-2 py-0.5 text-sm text-gray-700"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm text-gray-600" data-policy={REFUND_POLICY_VERSION}>
          {t('pay.refunds')}
        </p>

        <button
          type="button"
          className="w-full rounded bg-pink-500 py-3 font-display text-xl font-semibold text-white disabled:opacity-50"
          disabled={busy}
          onClick={() => void press()}
        >
          {t(rail === 'payid' ? 'pay.payPayId' : 'pay.paySponsors', { price })}
        </button>
        {failed && (
          <p className="text-center text-sm text-red-600" role="alert">
            {t('pay.failed')}
          </p>
        )}

        <button
          type="button"
          className="self-center text-sm text-gray-600 underline"
          onClick={switchRail}
        >
          {t(rail === 'payid' ? 'pay.switchToSponsors' : 'pay.switchToPayId')}
        </button>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white" data-pay-page={pack}>
      <div className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-pink-500">
            🔔 {t('footer.edition')}
          </h2>
          <button
            type="button"
            aria-label={t('support.close')}
            className="px-2 text-2xl leading-none text-gray-500"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {body}

        {/* A visitor who came by a link (the QR code on a story's picture) and
            buys nothing can still play; from the end screen's card the page
            just shuts, back to the room. */}
        {!waiting && (
          <button
            type="button"
            className="w-full rounded border-2 border-pink-500 bg-white py-3 font-display text-xl font-semibold text-pink-500"
            onClick={onClose}
          >
            {door === 'link' && !owned ? t('pay.playFree') : t('support.close')}
          </button>
        )}
      </div>
    </div>
  );
}
