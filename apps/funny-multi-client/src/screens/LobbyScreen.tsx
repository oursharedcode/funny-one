// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from SRC/client/src/screens/LobbyScreen.tsx. Two changes:
//
// 1. `game:start` takes no payload. SRC sent `{ wobbleEngine: 'lottie' }`;
//    ARC-3/DD-9 ship a single CSS recorder, so T-1.6 dropped the field — and,
//    since it was the payload's only member, the payload type with it.
// 2. `StatsPayload` comes from `@funny/shared`.
//
// Step 117 (owner decision 3A): a room in one of the Christmas edition's
// languages is a Christmas room unless its host switches it off here. Every
// player sees "🔔 This game has one Christmas story" while it is on; only the
// host sees the switch, and a guest sees nothing once it is off. The switch
// shows the server's state, so every lobby agrees on it.
//
// Step 122 (B-29): a paid room's box says every story is a Christmas one, and
// any player whose phone keeps a paid code can open the room with it
// (PackUnlock) — which also shows why the code Home sent did not.
//
// Step 126 (B-29 #2, the Christmas invitation): a Christmas room's box has an
// Invite button for every player, handing the share sheet the invitation in
// the player's own language (@funny/shared's PACK_INVITES, the table the
// server's join-link preview reads too) and the join link; where the browser
// has no share sheet, the two are copied instead. No price and no unlock code:
// the link is the room's ordinary one.
//
// Step 130 (B-29 #1, owner decision D1 A): the host can always start. With
// fewer than three players the button says how many bots will take the empty
// seats ("Start with 2 bots"), and a line under it says each friend who joins
// takes a bot's place; the bots themselves join only when the game starts.
//
// The cap banner is carried as-is. At T-3.2 it was inert — no server
// `stats:get` handler, so the ack never fired and `isCapReached(null)` was
// false. T-5.3 wired the handler; this file did not need to change.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { socket } from '../socket';
import { homeUrl } from '../basePath';
import { copyText } from '../copyText';
import PlayerList from '../components/PlayerList';
import QRCode from '../components/QRCode';
import PackUnlock from '../components/PackUnlock';
import { hoursUntilUtcMidnight, isCapReached } from '../capReset';
import type { LobbyState } from '../App';
import { inviteText, isLanguage, seatBotsNeeded, type StatsPayload } from '@funny/shared';

interface Props {
  lobby: LobbyState;
  onLeave: () => void;
}

export default function LobbyScreen({ lobby, onLeave }: Props) {
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
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
  // The lobby holds people only: seat bots join at the start (Step 130).
  const bots = seatBotsNeeded(lobby.players.length);
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

  async function invite(): Promise<void> {
    const text = inviteText(isLanguage(i18n.language) ? i18n.language : 'en');
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: t('home.title'), text, url: joinUrl });
        return;
      } catch (err) {
        // Dismissed: done. Refused (an insecure page, a busy sheet): copy.
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    await copyText(`${text} ${joinUrl}`);
    setInviteCopied(true);
    window.setTimeout(() => setInviteCopied(false), 1500);
  }

  function leave(): void {
    socket.emit('room:leave');
    onLeave();
  }

  function startGame(): void {
    socket.emit('game:start');
  }

  function setPack(on: boolean): void {
    socket.emit('room:setPack', { on });
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

      {lobby.pack && (lobby.pack.on || isHost) && (
        <div className="flex flex-col gap-2 rounded border border-amber-300 bg-white p-3">
          {lobby.pack.on && (
            <p className="text-center font-semibold text-pink-600" role="status">
              {lobby.pack.paid ? t('lobby.christmasPaid') : t('lobby.christmasOn')}
            </p>
          )}
          {isHost && (
            <label className="flex items-center gap-3 text-gray-800">
              <input
                type="checkbox"
                className="h-5 w-5 flex-shrink-0 accent-pink-500"
                checked={lobby.pack.on}
                onChange={(e) => setPack(e.target.checked)}
              />
              <span>{t('lobby.christmasSwitch')}</span>
            </label>
          )}
          {lobby.pack.on && (
            <button
              className="rounded bg-pink-500 py-2 font-semibold text-white"
              onClick={() => void invite()}
            >
              {inviteCopied ? t('lobby.copied') : t('lobby.invite')}
            </button>
          )}
        </div>
      )}

      <PackUnlock lobby={lobby} initialError={lobby.codeError ?? null} />

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
        <>
          <button
            className="rounded bg-pink-500 py-3 font-display text-xl font-semibold text-white"
            onClick={startGame}
          >
            {bots === 0
              ? t('lobby.startGame')
              : bots === 1
                ? t('lobby.startWithOneBot')
                : t('lobby.startWithTwoBots')}
          </button>
          {bots > 0 && (
            <p className="text-center text-sm text-gray-600" data-bots-note>
              {t('lobby.botsNote')}
            </p>
          )}
        </>
      ) : (
        <p className="text-center text-gray-600">{t('lobby.waitingForHost')}</p>
      )}

      <button className="self-center py-2 text-gray-600 underline" onClick={leave}>
        {t('lobby.leave')}
      </button>
    </div>
  );
}
