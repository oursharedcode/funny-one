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
// - the pay button. Step 124 wires PayID (pay.ts): the button turns into the
//   transfer to make — the PayID, its account name, the amount and the code as
//   the reference, each with Copy — and "I've paid", which makes the code work
//   at once (for 48 hours, until the owner matches the payment).
// - On Sponsors (Step 125), the GitHub name the buyer will pay with (owner
//   decision D1 A, 2026-11-25), above the pay button. The button gets a code
//   that waits for that name's sponsorship, and turns into a link to GitHub's
//   checkout of the pack's tier and "Waiting for GitHub…": the page asks the
//   server every few seconds, and whenever the buyer comes back to the tab,
//   whether the code works yet — once GitHub's webhook reports the
//   sponsorship, or the owner presses Received; never on the buyer's word
//   (D2 A), so there is no "I've paid" and nothing asks before closing.
//
// A buyer may pay in their bank's app and never come back to press "I've
// paid" (owner decision D3 A, 2026-11-25): the panel says to press it before
// closing, and Close or × with a code not yet claimed asks once more. The
// waiting code stays on the phone, so this page shows it again when reopened,
// and the owner's admin page lists codes nobody claimed.
//
// Step 134 (owner decisions 2026-11-28): "Give as a gift", offered on PayID
// (D3 A), also to a phone that has the pack. It buys a second code, kept apart
// from this phone's own: the same transfer and "I've paid", then the gift's
// link to Share or Copy, with the day it stops working (D2 A: that day is what
// keeps the pack outside the gift-card three-year rule). Gifts bought on this
// phone are listed here, so a link can be sent again.
//
// Instead of all that: a phone that keeps a code sees its own pack; once the
// pack's free part has ended it is no longer on sale; and when the server
// sells nothing (no code secret, pack rooms off, or no answer) it says to come
// back later. Until the server has answered, only the header shows.

import { useEffect, useRef, useState } from 'react';
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
import { copyText } from '../copyText';
import { trackGiftPayPress, trackPayPage, trackPayPress } from '../funnel';
import { readPackCode, rememberPackCode } from '../packCode';
import { lastPaidDay } from '../packDay';
import {
  SPONSORS_TIERS,
  checkPayStatus,
  claimPayId,
  forgetPendingPayId,
  forgetPendingSponsors,
  giftLink,
  keepGift,
  readGifts,
  readPendingPayId,
  readPendingSponsors,
  startPayment,
  type ClaimResult,
  type PayDoor,
  type PayIdTransfer,
  type SponsorsCheckout,
} from '../pay';

/** How often the page asks whether a Sponsors code works yet, and for how long. */
export const SPONSORS_POLL_MS = 5000;
export const SPONSORS_POLL_FOR_MS = 15 * 60_000;

interface Props {
  /** The pack the card or the link named. */
  pack: PackId;
  /** The server's `/config` answer: what is on sale and by which rail; undefined until it answers. */
  pay: PayConfig | null | undefined;
  door: PayDoor;
  onClose: () => void;
  /** A code was just paid for and kept on this phone: App opens the room with it. */
  onPaid?: (code: string) => void;
}

/** A PayID code is for this phone, or for a friend. */
type Buyer = 'own' | 'gift';

/** The refusal of a claim, in the reader's words: the code's own, or "try again". */
function claimErrorKey(result: ClaimResult): string {
  if (result.ok) return '';
  return result.error.startsWith('CODE_') || result.error === 'RATE_LIMITED'
    ? `errors.${result.error}`
    : 'pay.claimFailed';
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

export default function PayScreen({ pack, pay, door, onClose, onPaid }: Props) {
  const { t, i18n } = useTranslation();
  // The PayID codes this phone was given and has not claimed, its own and a
  // gift's: shown again, on PayID, however the page was reopened.
  const [ownTransfer, setOwnTransfer] = useState<PayIdTransfer | null>(() =>
    readPendingPayId(pack),
  );
  const [giftTransfer, setGiftTransfer] = useState<PayIdTransfer | null>(() =>
    readPendingPayId(pack, true),
  );
  // Buying for a friend. The page opens there when only a gift is waiting, and
  // from Home's gift link when this visitor is offered PayID.
  const [gifting, setGifting] = useState(
    () => (!ownTransfer && giftTransfer !== null) || (door === 'home' && pay?.rail === 'payid'),
  );
  // The gift just paid for: its link is on screen.
  const [ready, setReady] = useState<string | null>(null);
  const [gifts, setGifts] = useState(() => readGifts(pack));
  // A Sponsors code this phone waits on: its checkout shown again, likewise.
  const [checkout, setCheckout] = useState<SponsorsCheckout | null>(() =>
    readPendingSponsors(pack),
  );
  const [chosenRail, setChosenRail] = useState<PayRail | null>(() =>
    ownTransfer || giftTransfer ? 'payid' : checkout ? 'sponsors' : null,
  );
  const [login, setLogin] = useState(() => checkout?.login ?? '');
  const [loginInvalid, setLoginInvalid] = useState(false);
  // A waiting Sponsors code the server refused: blocked, ended, or not known.
  const [statusError, setStatusError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [paid, setPaid] = useState<PayRail | null>(null);
  // Close or × pressed with a code not yet claimed (D3).
  const [leaving, setLeaving] = useState(false);
  // What was copied last: a row of the transfer, or a gift's code for its link.
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    trackPayPage(door);
  }, [door]);

  const now = Date.now();
  const code = readPackCode();
  const owned = code?.pack === pack ? code : null;
  const selling = isPackFree(pack, now);
  const server = selling && pay?.pack === pack ? pay : null;
  const onSale = !owned ? server : null;
  // The server has not said yet whether the pack is on sale.
  const waiting = !owned && selling && pay === undefined;
  const rail = chosenRail ?? server?.rail ?? 'sponsors';
  const price = PACKS[pack].prices[rail];
  const giftView = gifting && (server !== null || ready !== null);
  const date = lastPaidDay(pack, i18n.language);
  const foreign = !(PACKS[pack].languages as readonly string[]).includes(i18n.language);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  // On Sponsors, with a code waiting: is it working yet?
  const watching = rail === 'sponsors' && checkout !== null && !paid && !owned;
  useEffect(() => {
    if (!watching || !checkout) return;
    let stopped = false;
    let asking = false;
    const until = Date.now() + SPONSORS_POLL_FOR_MS;
    async function ask(): Promise<void> {
      if (stopped || asking || !checkout) return;
      asking = true;
      const result = await checkPayStatus(checkout.code);
      asking = false;
      if (stopped) return;
      if (result.ok) {
        rememberPackCode(checkout.code);
        forgetPendingSponsors();
        setPaid('sponsors');
        onPaidRef.current?.(checkout.code);
      } else if (result.error.startsWith('CODE_') && result.error !== 'CODE_PENDING') {
        forgetPendingSponsors();
        setCheckout(null);
        setStatusError(`errors.${result.error}`);
      }
    }
    const timer = window.setInterval(() => {
      if (Date.now() < until) void ask();
      else window.clearInterval(timer);
    }, SPONSORS_POLL_MS);
    // Back from GitHub's tab: ask at once, also once the 15 minutes are over.
    function onBack(): void {
      if (document.visibilityState === 'visible') void ask();
    }
    document.addEventListener('visibilitychange', onBack);
    window.addEventListener('focus', onBack);
    void ask();
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onBack);
      window.removeEventListener('focus', onBack);
    };
  }, [watching, checkout]);

  function openGift(): void {
    setGifting(true);
    setChosenRail('payid');
    setFailed(false);
    setClaimError(null);
  }

  function closeGift(): void {
    setGifting(false);
    setReady(null);
    setFailed(false);
    setClaimError(null);
  }

  function switchRail(): void {
    setChosenRail(rail === 'payid' ? 'sponsors' : 'payid');
    setFailed(false);
  }

  async function press(): Promise<void> {
    if (giftView) trackGiftPayPress();
    else trackPayPress(rail);
    setBusy(true);
    setFailed(false);
    setLoginInvalid(false);
    setStatusError(null);
    const started = await startPayment({
      pack,
      rail: giftView ? 'payid' : rail,
      policy: REFUND_POLICY_VERSION,
      ...(giftView ? { gift: true } : rail === 'sponsors' ? { login } : {}),
    });
    setBusy(false);
    if (started.error === 'LOGIN_INVALID') setLoginInvalid(true);
    else setFailed(!started.ok);
    if (started.transfer) (giftView ? setGiftTransfer : setOwnTransfer)(started.transfer);
    if (started.checkout) setCheckout(started.checkout);
  }

  /** Another GitHub name: the waiting code is let go, and the next press asks for one. */
  function changeLogin(): void {
    forgetPendingSponsors();
    setCheckout(null);
  }

  async function claim(buyer: Buyer): Promise<void> {
    const transfer = buyer === 'gift' ? giftTransfer : ownTransfer;
    if (!transfer) return;
    const setTransfer = buyer === 'gift' ? setGiftTransfer : setOwnTransfer;
    setBusy(true);
    setClaimError(null);
    const result = await claimPayId(transfer.code);
    setBusy(false);
    if (!result.ok) {
      setClaimError(claimErrorKey(result));
      // A code the server does not know (a new code secret): a new press asks for another.
      if (result.error === 'CODE_INVALID') {
        forgetPendingPayId(buyer === 'gift');
        setTransfer(null);
      }
      return;
    }
    forgetPendingPayId(buyer === 'gift');
    setLeaving(false);
    if (buyer === 'gift') {
      // The friend's code, not this phone's: listed, never kept as its pack.
      keepGift(pack, transfer.code);
      setGifts(readGifts(pack));
      setGiftTransfer(null);
      setGifting(true);
      setReady(transfer.code);
      return;
    }
    rememberPackCode(transfer.code);
    setOwnTransfer(null);
    setPaid('payid');
    onPaid?.(transfer.code);
  }

  function copy(field: string, value: string): void {
    void copyText(value).then(() => {
      setCopied(field);
      window.setTimeout(() => setCopied((f) => (f === field ? null : f)), 1500);
    });
  }

  async function share(code: string): Promise<void> {
    const url = giftLink(code);
    const text = t('pay.giftShareText', { date });
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text, url });
        return;
      } catch (err) {
        // Dismissed: done. Refused (an insecure page, a busy sheet): copy.
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    copy(code, `${text} ${url}`);
  }

  // A code given and not claimed: closing asks first, about the one on screen.
  const ownWaits = ownTransfer !== null && !paid && !owned;
  const unclaimed: Buyer | null =
    giftTransfer && (giftView || !ownWaits) ? 'gift' : ownWaits ? 'own' : null;
  function requestClose(): void {
    if (unclaimed) setLeaving(true);
    else onClose();
  }

  function copyRow(field: string, label: string, value: string): JSX.Element {
    return (
      <div className="flex items-center gap-2" data-transfer={field}>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-600">{label}</p>
          <p className="break-all font-semibold text-gray-900" dir="ltr">
            {value}
          </p>
        </div>
        <button
          type="button"
          className="flex-shrink-0 rounded border border-amber-300 px-3 py-1 text-sm font-semibold"
          onClick={() => copy(field, value)}
        >
          {copied === field ? t('support.copied') : t('support.copy')}
        </button>
      </div>
    );
  }

  function paidButton(buyer: Buyer): JSX.Element {
    return (
      <button
        type="button"
        className="w-full rounded bg-pink-500 py-3 font-display text-xl font-semibold text-white disabled:opacity-50"
        disabled={busy}
        onClick={() => void claim(buyer)}
      >
        {t('pay.paidButton')}
      </button>
    );
  }

  function transferPanel(transfer: PayIdTransfer, buyer: Buyer): JSX.Element {
    return (
      <div
        className="flex flex-col gap-3 rounded border-2 border-pink-300 bg-white p-4"
        data-transfer-panel={transfer.code}
      >
        <p className="font-semibold text-gray-800">{t('pay.transferTitle')}</p>
        {copyRow('payId', t('support.payId'), transfer.payId)}
        {copyRow('name', t('pay.transferName'), transfer.payIdName)}
        {copyRow('amount', t('pay.transferAmount'), transfer.amount)}
        {copyRow('reference', t('pay.transferReference'), transfer.code)}
        <p className="text-sm text-gray-600">{t('pay.referenceHint')}</p>
        <p className="rounded bg-amber-50 p-3 text-sm text-gray-800" role="note" data-paid-warning>
          ⚠️ {t(buyer === 'gift' ? 'pay.giftPaidWarning' : 'pay.paidWarning')}
        </p>
        {paidButton(buyer)}
        {claimError && (
          <p className="text-center text-sm text-red-600" role="alert">
            {t(claimError)}
          </p>
        )}
      </div>
    );
  }

  /** A gift's link, to send or send again. */
  function giftRow(code: string): JSX.Element {
    return (
      <div key={code} className="flex flex-col gap-2" data-gift-link={code}>
        <p className="break-all text-sm text-gray-700" dir="ltr">
          {giftLink(code)}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 rounded bg-pink-500 py-2 font-semibold text-white"
            onClick={() => void share(code)}
          >
            {t('gallery.shareButton')}
          </button>
          <button
            type="button"
            className="flex-1 rounded border border-amber-300 py-2 font-semibold"
            onClick={() => copy(code, giftLink(code))}
          >
            {copied === code ? t('support.copied') : t('support.copy')}
          </button>
        </div>
      </div>
    );
  }

  const foreignNote = foreign && (
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
  );

  const refunds = (
    <p className="text-sm text-gray-600" data-policy={REFUND_POLICY_VERSION}>
      {t('pay.refunds')}
    </p>
  );

  function priceBox(by: PayRail): JSX.Element {
    return (
      <div className="rounded border border-amber-300 bg-white p-4 text-center">
        <p className="font-display text-4xl font-bold text-pink-600" dir="ltr" data-price={by}>
          {PACKS[pack].prices[by]}
        </p>
        <p className="mt-1 text-sm text-gray-600">
          {t(by === 'payid' ? 'pay.oncePayId' : 'pay.onceSponsors')}
        </p>
      </div>
    );
  }

  const payFailed = failed && (
    <p className="text-center text-sm text-red-600" role="alert">
      {t('pay.failed')}
    </p>
  );

  const giftBack = (
    <button
      type="button"
      className="self-center text-sm text-gray-600 underline"
      onClick={closeGift}
    >
      {t('pay.giftBack')}
    </button>
  );

  // Under the sale or the buyer's own pack: the way in to a gift, and the
  // gifts already bought.
  const giftExtras = (
    <>
      {server && rail === 'payid' && (
        <button
          type="button"
          className="w-full rounded border-2 border-pink-300 bg-white py-3 font-semibold text-pink-600"
          onClick={openGift}
          data-gift-open
        >
          🎁 {t('pay.giftButton')}
        </button>
      )}
      {/* A phone with the pack has no sale to switch under, and a country
          lookup can be wrong: the way to PayID, where gifts are sold. */}
      {owned && server && rail === 'sponsors' && (
        <button
          type="button"
          className="self-center text-sm text-gray-600 underline"
          onClick={switchRail}
        >
          {t('pay.switchToPayId')}
        </button>
      )}
      {gifts.length > 0 && (
        <div className="flex flex-col gap-3 rounded border border-amber-300 bg-white p-3">
          <p className="font-semibold text-gray-800">{t('pay.giftList')}</p>
          <p className="text-sm text-gray-600">{t('pay.giftSend', { date })}</p>
          {gifts.map(giftRow)}
        </div>
      )}
    </>
  );

  let body: JSX.Element | null;
  if (giftView) {
    body = ready ? (
      <>
        <p className="font-semibold text-gray-800" role="status">
          {t('pay.giftReady')}
        </p>
        <p className="text-gray-800">{t('pay.giftSend', { date })}</p>
        <div className="rounded border-2 border-pink-300 bg-white p-4">{giftRow(ready)}</div>
        <p className="text-sm text-gray-600">{t('pay.giftCheck')}</p>
        {giftBack}
      </>
    ) : (
      <>
        <p className="text-gray-800" data-gift-pitch>
          🎁 {t('pay.giftPitch', { date })}
        </p>
        {priceBox('payid')}
        {foreignNote}
        {refunds}
        {giftTransfer ? (
          transferPanel(giftTransfer, 'gift')
        ) : (
          <>
            <button
              type="button"
              className="w-full rounded bg-pink-500 py-3 font-display text-xl font-semibold text-white disabled:opacity-50"
              disabled={busy}
              onClick={() => void press()}
            >
              {t('pay.payPayId', { price: PACKS[pack].prices.payid })}
            </button>
            {payFailed}
          </>
        )}
        {giftBack}
      </>
    );
  } else if (owned) {
    body = (
      <>
        <p className="font-semibold text-gray-800" role={paid ? 'status' : undefined}>
          {t(paid ? 'pay.paidTitle' : 'pay.haveTitle')}
        </p>
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
        {paid === 'payid' && <p className="text-sm text-gray-600">{t('pay.paidCheck')}</p>}
        {giftExtras}
      </>
    );
  } else if (!selling) {
    body = (
      <>
        <p className="text-gray-800">{t('pay.ended')}</p>
        {giftExtras}
      </>
    );
  } else if (waiting) {
    body = null;
  } else if (!onSale) {
    body = (
      <>
        <p className="text-gray-800">{t('pay.closed')}</p>
        {giftExtras}
      </>
    );
  } else {
    body = (
      <>
        <p className="text-gray-800">{t('pay.pitch', { date })}</p>

        {priceBox(rail)}

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

        {foreignNote}

        {refunds}

        {rail === 'payid' && ownTransfer ? (
          transferPanel(ownTransfer, 'own')
        ) : rail === 'sponsors' && checkout ? (
          <div
            className="flex flex-col gap-3 rounded border-2 border-pink-300 bg-white p-4"
            data-checkout-panel={checkout.code}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 break-all font-semibold text-gray-800">
                {t('pay.payingAs', { login: isolated(`@${checkout.login}`) })}
              </p>
              <button
                type="button"
                className="flex-shrink-0 text-sm text-gray-600 underline"
                onClick={changeLogin}
              >
                {t('pay.changeLogin')}
              </button>
            </div>
            <a
              href={checkout.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded bg-pink-500 py-3 text-center font-display text-xl font-semibold text-white"
              data-checkout-link
            >
              {t('pay.openGitHub')}
            </a>
            <p className="text-center text-gray-700" role="status" data-waiting-github>
              ⏳ {t('pay.waitingGitHub')}
            </p>
            <p className="rounded bg-amber-50 p-3 text-sm text-gray-800" role="note">
              {t('pay.slowGitHub')}
            </p>
          </div>
        ) : (
          <>
            {rail === 'sponsors' && (
              <div className="flex flex-col gap-1">
                <label htmlFor="pay-github-login" className="font-semibold text-gray-800">
                  {t('pay.loginLabel')}
                </label>
                <input
                  id="pay-github-login"
                  aria-describedby="pay-github-login-hint"
                  className="rounded border border-amber-300 px-3 py-2 text-gray-900"
                  dir="ltr"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="username"
                  spellCheck={false}
                  maxLength={60}
                  value={login}
                  aria-invalid={loginInvalid || undefined}
                  onChange={(e) => {
                    setLogin(e.target.value);
                    setLoginInvalid(false);
                  }}
                  data-github-login
                />
                <p id="pay-github-login-hint" className="text-sm text-gray-600">
                  {t('pay.loginHint')}
                </p>
              </div>
            )}
            <button
              type="button"
              className="w-full rounded bg-pink-500 py-3 font-display text-xl font-semibold text-white disabled:opacity-50"
              disabled={busy || (rail === 'sponsors' && login.trim() === '')}
              onClick={() => void press()}
            >
              {t(rail === 'payid' ? 'pay.payPayId' : 'pay.paySponsors', { price })}
            </button>
            {loginInvalid && (
              <p className="text-center text-sm text-red-600" role="alert">
                {t('pay.loginInvalid')}
              </p>
            )}
            {payFailed}
            {statusError && (
              <p className="text-center text-sm text-red-600" role="alert">
                {t(statusError)}
              </p>
            )}
          </>
        )}

        <button
          type="button"
          className="self-center text-sm text-gray-600 underline"
          onClick={switchRail}
        >
          {t(rail === 'payid' ? 'pay.switchToSponsors' : 'pay.switchToPayId')}
        </button>

        {giftExtras}
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
            onClick={requestClose}
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
            onClick={requestClose}
          >
            {door === 'link' && !owned ? t('pay.playFree') : t('support.close')}
          </button>
        )}

        {leaving && unclaimed !== null && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pay-leave-title"
          >
            <div className="flex w-full max-w-md flex-col gap-3 rounded-lg bg-white p-5 shadow-lg">
              <p id="pay-leave-title" className="font-display text-xl font-bold text-gray-900">
                {t('pay.leaveTitle')}
              </p>
              <p className="text-gray-700">
                {t(unclaimed === 'gift' ? 'pay.giftLeaveText' : 'pay.leaveText')}
              </p>
              {paidButton(unclaimed)}
              {claimError && (
                <p className="text-center text-sm text-red-600" role="alert">
                  {t(claimError)}
                </p>
              )}
              <button
                type="button"
                className="w-full rounded border-2 border-gray-300 bg-white py-3 font-semibold text-gray-700"
                onClick={onClose}
              >
                {t('pay.leaveAnyway')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
