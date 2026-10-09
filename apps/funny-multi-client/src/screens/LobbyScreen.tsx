// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from SRC/client/src/screens/LobbyScreen.tsx. Two changes:
//
// 1. `game:start` takes no payload. SRC sent `{ wobbleEngine: 'lottie' }`;
//    ARC-3/DD-9 ship a single CSS recorder, so T-1.6 dropped the field — and,
//    since it was the payload's only member, the payload type with it.
// 2. `StatsPayload` comes from `@funny/shared`.
//
// The cap banner is carried as-is. At T-3.2 it was inert — no server
// `stats:get` handler, so the ack never fired and `isCapReached(null)` was
// false. T-5.3 wired the handler; this file did not need to change.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { socket } from '../socket';
import { homeUrl } from '../basePath';
import PlayerList from '../components/PlayerList';
import QRCode from '../components/QRCode';
import { hoursUntilUtcMidnight, isCapReached } from '../capReset';
import type { LobbyState } from '../App';
import type { StatsPayload } from '@funny/shared';

interface Props {
  lobby: LobbyState;
  onLeave: () => void;
}

export default function LobbyScreen({ lobby, onLeave }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<StatsPayload | null>(null);

  // Subscribe to the live stats broadcast (spec §26) so the lobby reflects
  // the daily cap state in real time. Everyone in the lobby (host and guests
  // alike) sees the cap-reached banner when the day's image allowance has been
  // spent, so nobody is surprised mid-game when the cartoons stop appearing at
  // reveal.
  useEffect(() => {
    socket.emit('stats:get', (s) => setStats(s));
    const onStatsUpdate = (s: StatsPayload): void => setStats(s);
    socket.on('stats:update', onStatsUpdate);
    return () => {
      socket.off('stats:update', onStatsUpdate);
    };
  }, []);

  // Carry the room language so the invitee's join screen renders in it from the
  // first paint (HomeScreen reads `?lang=`), and `&multi=1` for a
  // multi-language room (B-15) so that screen can tell the invitee to pick
  // their own language first. The QR code encodes the same URL.
  const joinUrl = `${homeUrl()}?room=${lobby.roomCode}&lang=${lobby.language}${
    lobby.multiLanguage ? '&multi=1' : ''
  }`;
  const isHost = lobby.socketId === lobby.hostId;
  const canStart = lobby.players.length >= 3;
  const capReached = isCapReached(stats);

  function copyLink(): void {
    const flash = (): void => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    };
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(joinUrl).then(flash, fallbackCopy);
    } else {
      fallbackCopy();
    }
    function fallbackCopy(): void {
      const ta = document.createElement('textarea');
      ta.value = joinUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      flash();
    }
  }

  function leave(): void {
    socket.emit('room:leave');
    onLeave();
  }

  function startGame(): void {
    socket.emit('game:start');
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <div className="text-center">
        <p className="text-sm text-gray-600">{t('lobby.roomCodeLabel')}</p>
        <p className="font-display text-5xl font-bold tracking-widest text-pink-500">
          {lobby.roomCode}
        </p>
        {lobby.multiLanguage && (
          <p className="text-sm font-semibold text-pink-600">{t('home.multiLanguage')}</p>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 rounded bg-white p-4">
        <QRCode value={joinUrl} size={160} />
        <p className="text-xs text-gray-600">{t('lobby.qrCaption')}</p>
      </div>

      <button
        className="rounded border border-amber-300 bg-white py-2 font-semibold"
        onClick={copyLink}
      >
        {copied ? t('lobby.copied') : t('lobby.copyLink')}
      </button>

      <PlayerList players={lobby.players} hostId={lobby.hostId} />

      {capReached && (
        <div
          className="rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900"
          role="status"
        >
          <p>{t('lobby.capReached', { hours: hoursUntilUtcMidnight() })}</p>
          {isHost && <p className="mt-1 text-amber-800">{t('lobby.capReachedHost')}</p>}
        </div>
      )}

      {isHost ? (
        <button
          className="rounded bg-pink-500 py-3 font-display text-xl font-semibold text-white disabled:bg-gray-300 disabled:text-gray-500"
          disabled={!canStart}
          title={!canStart ? t('lobby.startDisabled') : ''}
          onClick={startGame}
        >
          {t('lobby.startGame')}
        </button>
      ) : (
        <p className="text-center text-gray-600">{t('lobby.waitingForHost')}</p>
      )}

      <button className="self-center py-2 text-gray-600 underline" onClick={leave}>
        {t('lobby.leave')}
      </button>
    </div>
  );
}
