// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from SRC/client/src/screens/HomeScreen.tsx (design §3 lists this as a
// copy; four things made it an adaptation — see below).
//
// The two modes (spec §8) are carried unchanged. A `?room=` URL parameter —
// carried by every invite link and QR code — means the visitor is joining a
// specific room; its absence means they are creating one. There is no manual
// room-code entry.
//
// 1. `wobbleEngine` is gone from both `LobbyState` constructions. ARC-3/DD-9
//    ship a single CSS recorder and T-1.6 removed the field from the contract.
// 2. The **create-mode** picker chooses the room's *content* language, and the
//    server accepts only `AUTHORED_LANGUAGES` (rooms.ts `isValidLanguage`,
//    tightened at T-2.3 so a room cannot be created in a language whose pools
//    would throw at reveal, seven rounds later). SRC offered all 15 here, which
//    against this server would fail the create with an unexplained error. The
//    join-mode picker is untouched at all 15 — it only switches the *interface*
//    language, and i18next falls back to English for the 13 catalogues Phase 6
//    adds. T-6.1/T-6.3 widen `AUTHORED_LANGUAGES` and this list follows.
// 3. `LANGUAGES`/`isLanguage` come from `@funny/shared`; T-3.1 did not carry a
//    client-local language registry.
// 4. The stats block was copied but inert at T-3.2 (`stats:get` had no server
//    handler yet, so `stats` stayed null and the counter never rendered).
//    T-5.3 wired the handler; no client change was needed to light it up.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { socket } from '../socket';
import { homeUrl, withBase } from '../basePath';
import Wordmark from '../components/art/Wordmark';
import QRCode from '../components/QRCode';
import SourceFooter from '../components/SourceFooter';
import ScrollBox from '../components/ScrollBox';
import { AUTHORED_LANGUAGES, LANGUAGES, isLanguage } from '@funny/shared';
import type { LobbyState } from '../App';
import type { AuthoredLanguage, Language, StatsPayload } from '@funny/shared';

interface Props {
  onJoined: (state: LobbyState) => void;
}

// Room-content languages: the subset of the registry whose answer pools are
// authored. Derived from `LANGUAGES` rather than rebuilt from
// `AUTHORED_LANGUAGES` so flag artwork, display order and country labels stay
// in one place.
const CONTENT_LANGUAGES = LANGUAGES.filter((opt) =>
  (AUTHORED_LANGUAGES as readonly string[]).includes(opt.code),
);

function isAuthoredLanguage(value: string | null | undefined): value is AuthoredLanguage {
  return typeof value === 'string' && (AUTHORED_LANGUAGES as readonly string[]).includes(value);
}

export default function HomeScreen({ onJoined }: Props) {
  const { t, i18n } = useTranslation();

  const params = new URLSearchParams(window.location.search);
  const urlRoom = params.get('room')?.toUpperCase() ?? '';
  const urlLang = params.get('lang');

  const [mode, setMode] = useState<'create' | 'join'>(urlRoom ? 'join' : 'create');
  const [nickname, setNickname] = useState('');
  // Typed `AuthoredLanguage`, not `Language`: this value becomes the room's
  // content language, so the narrower type makes the server's constraint a
  // compile-time one on this screen.
  const [language, setLanguage] = useState<AuthoredLanguage>(
    isAuthoredLanguage(urlLang) ? urlLang : 'en',
  );
  const [error, setError] = useState<string | null>(null);
  const [roomGone, setRoomGone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<StatsPayload | null>(null);
  // A joiner who explicitly cycles the UI language must keep that choice — it
  // must not be clobbered by the room's content language on join (see join()).
  const [uiLangTouched, setUiLangTouched] = useState(false);

  // When the invite link carries the room language (`?room=CODE&lang=ru`),
  // render the join screen in that language immediately rather than waiting for
  // the join ack to arrive.
  useEffect(() => {
    if (isLanguage(urlLang)) void i18n.changeLanguage(urlLang);
  }, [urlLang, i18n]);

  // Create mode is the host's screen (spec §8) — fetch server stats once so
  // the host sees the open-room counter and the day's image usage (§13, §15),
  // then subscribe to stats:update so the counter ticks visibly when other
  // rooms generate pictures or open/close (§26).
  useEffect(() => {
    if (mode !== 'create') return;
    socket.emit('stats:get', (s) => setStats(s));
    const onStatsUpdate = (s: StatsPayload): void => setStats(s);
    socket.on('stats:update', onStatsUpdate);
    return () => {
      socket.off('stats:update', onStatsUpdate);
    };
  }, [mode]);

  // Release the button when the failure arrives as an `error` event rather than
  // an ack.
  //
  // `room:create`'s ack has no error branch, so T-2.2's rate limiter reports a
  // hit by emitting `error` — and this screen sets `busy` before the emit and
  // clears it only inside the ack. A host who taps Create past the 5-per-minute
  // budget (or shares an IP behind CGNAT with someone who has) therefore sees
  // App's error toast and a Create button that never comes back, with a reload
  // as the only way out. Verified against the real server: an invalid
  // `room:create` never acks.
  //
  // Only the busy flag is touched — App owns the toast, and duplicating the
  // message here would show it twice.
  useEffect(() => {
    const onError = (): void => setBusy(false);
    socket.on('error', onError);
    return () => {
      socket.off('error', onError);
    };
  }, []);

  function switchLanguage(lang: AuthoredLanguage): void {
    setLanguage(lang);
    void i18n.changeLanguage(lang);
  }

  // Joiner-only UI-language control (spec §8): picking a flag switches the
  // interface language, independent of the room's content language — the host
  // fixed that and the joiner can't change it. This only touches i18n display,
  // never the `language` content state used by the host's room:create payload.
  function selectUiLanguage(lang: Language): void {
    setUiLangTouched(true);
    void i18n.changeLanguage(lang);
  }

  function create(): void {
    setError(null);
    setBusy(true);
    socket.emit('room:create', { nickname: nickname.trim(), language }, (ack) => {
      setBusy(false);
      onJoined({
        roomCode: ack.roomCode,
        socketId: ack.socketId,
        hostId: ack.socketId,
        language,
        players: [{ id: ack.socketId, nickname: nickname.trim(), isBot: false }],
        donateUrl: null,
      });
    });
  }

  function join(): void {
    setError(null);
    setRoomGone(false);
    setBusy(true);
    socket.emit('room:join', { roomCode: urlRoom, nickname: nickname.trim() }, (ack) => {
      setBusy(false);
      if ('error' in ack) {
        // A stale or recycled link points at a room that no longer exists —
        // show a clear message and the escape hatch instead of a terse error.
        if (ack.error.code === 'ROOM_NOT_FOUND') {
          setRoomGone(true);
        } else {
          setError(t(`errors.${ack.error.code}`, { defaultValue: ack.error.message }));
        }
        return;
      }
      // The room language enters the client here, and this is the only place it
      // does. The server will not create a room in an unauthored language
      // (T-2.3), so this holds for every room that exists — but the ack is
      // typed `Language`, and `LobbyState` promises the narrower
      // `AuthoredLanguage` that RoundScreen needs to index `POOL_TEXTS`.
      // Narrowing at the boundary keeps that a compile-time fact everywhere
      // downstream. The failure is reachable only if a newer server meets an
      // older client mid-rollout; refusing the join is the honest outcome,
      // since joining would mean seven rounds of blank options.
      if (!isAuthoredLanguage(ack.language)) {
        setError(t('home.unsupportedLanguage'));
        return;
      }
      const roomLanguage = ack.language;
      // Default the joiner's UI to the room's content language — unless they
      // explicitly cycled to a different one on this screen, which we preserve.
      if (!uiLangTouched) void i18n.changeLanguage(roomLanguage);
      onJoined({
        roomCode: urlRoom,
        socketId: ack.socketId,
        hostId: ack.hostId,
        language: roomLanguage,
        players: ack.players,
        donateUrl: null,
      });
    });
  }

  // Stale-link escape hatch: leave Join mode for Create mode. Strips the
  // `?room=` / `?lang=` parameters so a refresh doesn't return to the dead link.
  function startOver(): void {
    window.history.replaceState(null, '', window.location.pathname);
    setError(null);
    setRoomGone(false);
    setMode('create');
  }

  const nicknameValid = nickname.trim().length >= 3 && nickname.trim().length <= 20;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
      <Wordmark />
      <p className="text-center text-gray-700">{t('home.subtitle')}</p>

      {mode === 'create' && (
        <>
          {/* Two-column row under the subtitle: a read-only "game rules" text
              box on the left, and the language picker on the right. Both are
              h-40 (160px) so the box matches the language list's height. */}
          <div className="flex w-full items-start gap-3">
            {/* Game rules — left. A centered "Game rules" title sits above a
                scrollable blurb shown in the currently selected language (it
                follows switchLanguage below). ScrollBox paints an always-visible
                scrollbar so it reads as scrollable even on mobile. */}
            <div className="flex h-40 flex-1 flex-col overflow-hidden rounded border border-amber-300 bg-white text-gray-800">
              <div className="border-b border-amber-200 py-2 text-center font-semibold">
                {t('home.gameRules')}
              </div>
              <ScrollBox className="flex-1" contentClassName="p-3 text-base">
                {t('home.rules')}
              </ScrollBox>
            </div>

            {/* Scrollable language list — right, narrower. Each row is a PNG
                flag (works on every device, unlike emoji flags) followed by a
                two-letter label. The static list ran the page off-screen on a
                phone; clamp to h-40 so it scrolls within the same slot. */}
            <ScrollBox
              className="h-40 w-28"
              contentClassName="flex flex-col gap-2 pe-2"
              role="group"
              aria-label="Language"
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
                  onClick={() => switchLanguage(opt.code as AuthoredLanguage)}
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

          <input
            className="w-full rounded border border-amber-300 p-3 text-lg"
            placeholder={t('home.nicknamePlaceholder')}
            value={nickname}
            maxLength={20}
            onChange={(e) => setNickname(e.target.value)}
          />

          <button
            className="w-full rounded bg-pink-500 py-3 font-display text-xl font-semibold text-white disabled:bg-gray-300 disabled:text-gray-500"
            disabled={!nicknameValid || busy}
            onClick={create}
          >
            {t('home.create')}
          </button>

          {stats && (
            <div className="text-center text-sm text-gray-600">
              <p>{t('home.openRooms', { count: stats.openRooms })}</p>
              <p>
                {t('home.imagesToday', {
                  total: stats.imagesLimit,
                })}
              </p>
            </div>
          )}
        </>
      )}

      {mode === 'join' && roomGone && (
        <div className="flex w-full flex-col items-center gap-4">
          <p className="text-center text-gray-700">{t('home.roomGone')}</p>
          <button
            className="w-full rounded bg-pink-500 py-3 font-display text-xl font-semibold text-white"
            onClick={startOver}
          >
            {t('home.createNew')}
          </button>
        </div>
      )}

      {mode === 'join' && !roomGone && (
        <>
          {/* Same two-column row as the host screen: the "game rules" box on
              the left (centered title above a scrollable blurb), language picker
              on the right. Here the flags switch the interface language only
              (spec §8) — the room's content language is fixed by the host, so
              this list stays at the full 15 registry entries. */}
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
              aria-label={t('home.uiLanguage')}
            >
              {LANGUAGES.map((opt) => (
                <button
                  key={opt.code}
                  aria-pressed={i18n.language === opt.code}
                  title={opt.name}
                  className={`flex flex-shrink-0 items-center gap-2 rounded px-3 py-3 font-semibold ${
                    i18n.language === opt.code
                      ? 'bg-pink-500 text-white'
                      : 'border border-amber-300 bg-white text-gray-800'
                  }`}
                  onClick={() => selectUiLanguage(opt.code)}
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

          <div className="w-full text-center">
            <p className="text-sm text-gray-600">{t('home.joining')}</p>
            <p className="font-display text-4xl font-bold tracking-widest text-pink-500">
              {urlRoom}
            </p>
          </div>

          {/* Mirror the lobby's QR pattern: show the same join link as a QR
              so a joiner can pass their phone to nearby friends instead of
              re-typing the room code or chasing a fresh link. The encoded
              URL preserves `?lang=` when present, matching LobbyScreen. */}
          <div className="flex flex-col items-center gap-2 rounded bg-white p-4">
            <QRCode
              value={`${homeUrl()}?room=${urlRoom}${urlLang ? `&lang=${urlLang}` : ''}`}
              size={160}
            />
            <p className="text-xs text-gray-600">{t('lobby.qrCaption')}</p>
          </div>

          <input
            className="w-full rounded border border-amber-300 p-3 text-lg"
            placeholder={t('home.nicknamePlaceholder')}
            value={nickname}
            maxLength={20}
            onChange={(e) => setNickname(e.target.value)}
          />

          <button
            className="w-full rounded bg-pink-500 py-3 font-display text-xl font-semibold text-white disabled:bg-gray-300 disabled:text-gray-500"
            disabled={!nicknameValid || busy}
            onClick={join}
          >
            {t('home.join')}
          </button>

          {error && (
            <div className="flex w-full flex-col items-center gap-3">
              <p className="text-center text-red-500">{error}</p>
              <button
                className="w-full rounded border-2 border-pink-500 bg-white py-3 font-display text-xl font-semibold text-pink-500"
                onClick={startOver}
              >
                {t('home.createNew')}
              </button>
            </div>
          )}
        </>
      )}

      <SourceFooter sourceQr={mode === 'create'} />
    </div>
  );
}
