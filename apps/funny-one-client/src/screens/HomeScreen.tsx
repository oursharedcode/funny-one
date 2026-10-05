// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-3.1 — the local setup screen: seat list (human/virtual mix) and the
// single content-language picker, gated to AUTHORED_LANGUAGES the same way
// Funny Multi's create-mode HomeScreen gates a room's content language (see
// apps/funny-multi-client/src/screens/HomeScreen.tsx). There is no join mode
// here — no room, no server (FO-ARC-3) — so this screen only ever plays the
// host's role.
//
// T-FO-5.1a — the same picker also drives the UI language: Funny One has no
// UI-vs-content split (i18n/index.ts), so a pick switches every screen via
// i18n.changeLanguage and is remembered for the next launch (uiLanguage.ts).
//
// D-10 (2026-10-05) — the picture choice: built-in pictures (the rig, no
// Internet) or the picture library's cartoons from the Internet
// (pictureSource.ts). Offered only when this build names a library; built-in
// is the default, so nothing is fetched until a player asks for it, and the
// pick is remembered like the language. The footer's notice follows the pick.

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { withBase } from '../basePath';
import Wordmark from '../components/art/Wordmark';
import ScrollBox from '../components/ScrollBox';
import SourceFooter from '../components/SourceFooter';
import { LANGUAGES, isLanguage } from '@funny/shared';
import type { AuthoredLanguage } from '@funny/shared';
import { MAX_SEATS, MIN_SEATS, type Seat } from '../game/roundRobin';
import { storeLanguage } from '../i18n/uiLanguage';
import {
  loadPictureSource,
  onlinePicturesAvailable,
  storePictureSource,
  type PictureSource,
} from '../pictureSource';

// Room-content languages: every registry entry is authored (D-2/T-6.3), so
// this is presently the same 15 as LANGUAGES — filtered from the registry
// rather than hardcoded so flag artwork, order and labels stay in one place,
// same pattern as Funny Multi's HomeScreen.
const CONTENT_LANGUAGES = LANGUAGES;

// Built-in first: it is the default and the one that always works.
const PICTURE_SOURCES = [
  { source: 'builtin', label: 'home.picturesBuiltIn', hint: 'home.picturesBuiltInHint' },
  { source: 'online', label: 'home.picturesOnline', hint: 'home.picturesOnlineHint' },
] as const;

interface Props {
  onStart: (seats: readonly Seat[], language: AuthoredLanguage, pictures: PictureSource) => void;
}

function defaultName(kind: Seat['kind'], ordinal: number): string {
  return kind === 'human' ? `Player ${ordinal}` : `Bot ${ordinal}`;
}

export default function HomeScreen({ onStart }: Props) {
  const { t, i18n } = useTranslation();
  const nextId = useRef(0);

  function makeSeat(kind: Seat['kind'], ordinal: number): Seat {
    const id = `seat-${nextId.current}`;
    nextId.current += 1;
    return { id, name: defaultName(kind, ordinal), kind };
  }

  // OQ-3's default: a solo quick-start, one human seat (the device holder)
  // plus one virtual seat, right at MIN_SEATS.
  const [seats, setSeats] = useState<Seat[]>(() => [makeSeat('human', 1), makeSeat('virtual', 1)]);
  // Starts on whatever the UI booted in (remembered pick or device locale),
  // so "Change players" and a relaunch both land on the last choice.
  const [language, setLanguage] = useState<AuthoredLanguage>(() =>
    isLanguage(i18n.language) ? i18n.language : 'en',
  );

  const [pictures, setPictures] = useState<PictureSource>(loadPictureSource);
  const picturesOffered = onlinePicturesAvailable();

  const humanCount = seats.filter((s) => s.kind === 'human').length;
  const virtualCount = seats.filter((s) => s.kind === 'virtual').length;

  function addSeat(kind: Seat['kind']): void {
    if (seats.length >= MAX_SEATS) return;
    const ordinal = (kind === 'human' ? humanCount : virtualCount) + 1;
    setSeats((prev) => [...prev, makeSeat(kind, ordinal)]);
  }

  function removeSeat(id: string): void {
    if (seats.length <= MIN_SEATS) return;
    setSeats((prev) => prev.filter((s) => s.id !== id));
  }

  function renameSeat(id: string, name: string): void {
    setSeats((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  }

  const namesValid = seats.every((s) => s.name.trim().length >= 1 && s.name.trim().length <= 20);
  const canStart = seats.length >= MIN_SEATS && seats.length <= MAX_SEATS && namesValid;

  function pickLanguage(code: AuthoredLanguage): void {
    setLanguage(code);
    storeLanguage(code);
    void i18n.changeLanguage(code);
  }

  function pickPictures(source: PictureSource): void {
    setPictures(source);
    storePictureSource(source);
  }

  function start(): void {
    const trimmed = seats.map((s) => ({ ...s, name: s.name.trim() }));
    onStart(trimmed, language, pictures);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
      <Wordmark />
      <p className="text-center text-gray-700">{t('home.subtitle')}</p>

      {/* Same two-column layout as Funny Multi's HomeScreen: rules blurb on
          the left, language picker on the right, both h-40. */}
      <div className="flex w-full items-start gap-3">
        <div className="flex h-40 flex-1 flex-col overflow-hidden rounded border border-amber-300 bg-white text-gray-800">
          <div className="border-b border-amber-200 py-2 text-center font-semibold">
            {t('home.gameRules')}
          </div>
          <ScrollBox className="flex-1" contentClassName="p-3 text-base">
            {t('home.rules')}
          </ScrollBox>
        </div>

        <ScrollBox
          className="h-40 w-28"
          contentClassName="flex flex-col gap-2 pe-2"
          role="group"
          aria-label={t('home.language')}
        >
          {CONTENT_LANGUAGES.map((opt) => (
            <button
              key={opt.code}
              aria-pressed={language === opt.code}
              title={opt.name}
              className={`flex flex-shrink-0 items-center gap-2 rounded px-3 py-3 font-semibold ${
                language === opt.code
                  ? 'bg-pink-500 text-white'
                  : 'border border-amber-300 bg-white text-gray-800'
              }`}
              onClick={() => pickLanguage(opt.code as AuthoredLanguage)}
            >
              <img
                src={withBase(`flags/${opt.code}.png`)}
                alt=""
                aria-hidden="true"
                className="h-6 w-6 flex-shrink-0 object-contain"
              />
              <span>{opt.country}</span>
            </button>
          ))}
        </ScrollBox>
      </div>

      <div className="w-full">
        <p className="mb-2 text-center text-sm text-gray-600">{t('home.seatCountHint')}</p>
        <ul className="flex flex-col gap-2">
          {seats.map((seat) => (
            <li key={seat.id} className="flex items-center gap-2">
              <input
                className="flex-1 rounded border border-amber-300 p-2 text-base"
                placeholder={t('home.playerNamePlaceholder')}
                value={seat.name}
                maxLength={20}
                aria-label={
                  seat.kind === 'human' ? t('home.humanSeatLabel') : t('home.virtualSeatLabel')
                }
                onChange={(e) => renameSeat(seat.id, e.target.value)}
              />
              <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                {seat.kind === 'human' ? t('home.humanBadge') : t('home.virtualBadge')}
              </span>
              <button
                type="button"
                className="rounded border border-pink-300 px-2 py-1 text-sm text-pink-500 disabled:border-gray-300 disabled:text-gray-300"
                disabled={seats.length <= MIN_SEATS}
                aria-label={t('home.removeSeat')}
                onClick={() => removeSeat(seat.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded border border-amber-300 bg-white py-2 font-semibold text-gray-800 disabled:text-gray-300"
            disabled={seats.length >= MAX_SEATS}
            onClick={() => addSeat('human')}
          >
            {t('home.addPlayer')}
          </button>
          <button
            type="button"
            className="flex-1 rounded border border-amber-300 bg-white py-2 font-semibold text-gray-800 disabled:text-gray-300"
            disabled={seats.length >= MAX_SEATS}
            onClick={() => addSeat('virtual')}
          >
            {t('home.addVirtual')}
          </button>
        </div>
      </div>

      {picturesOffered && (
        <div className="w-full">
          <p id="home-pictures-label" className="mb-2 text-center text-sm text-gray-600">
            {t('home.pictures')}
          </p>
          <div role="radiogroup" aria-labelledby="home-pictures-label" className="flex gap-2">
            {PICTURE_SOURCES.map(({ source, label }) => (
              <button
                key={source}
                type="button"
                role="radio"
                aria-checked={pictures === source}
                className={`flex-1 rounded px-2 py-2 font-semibold ${
                  pictures === source
                    ? 'bg-pink-500 text-white'
                    : 'border border-amber-300 bg-white text-gray-800'
                }`}
                onClick={() => pickPictures(source)}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-gray-500">
            {t(PICTURE_SOURCES.find((option) => option.source === pictures)!.hint)}
          </p>
        </div>
      )}

      <button
        className="w-full rounded bg-pink-500 py-3 font-display text-xl font-semibold text-white disabled:bg-gray-300 disabled:text-gray-500"
        disabled={!canStart}
        onClick={start}
      >
        {t('home.start')}
      </button>

      <SourceFooter pictures={pictures} />
    </div>
  );
}
