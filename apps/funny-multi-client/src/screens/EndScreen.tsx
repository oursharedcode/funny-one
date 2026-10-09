// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from SRC/client/src/screens/EndScreen.tsx (spec §4, §5, §16 step
// 10, §24). Purely presentational — App.tsx already owns every socket
// subscription this screen needs (`gallery:ready`, `game:restartReady`,
// `game:over`) and hands the results down as props, so unlike RevealScreen
// this component has no useEffect of its own.
//
// Two things SRC's version had that are gone:
//
//   - The `monkeys-on-bus.png` header photo. Explicitly SRC's own branding
//     (design §3's file-treatment table drops it alongside the other raster
//     art), and no replacement raster asset exists in this repo. `EndMascots`
//     — already ported at T-3.1 for exactly this screen — stands in as the
//     sole hero visual instead of the small mascot-duo overlay SRC paired
//     with the photo. This is FM-CORE-11's "pre-bundled finale image":
//     bundled with the app, not generated, shown regardless of `gameOver`.
//   - The inline QR + source-link footer block. `SourceFooter` (carried
//     verbatim at T-3.2, already used on HomeScreen) is that exact markup as
//     a component; its own doc comment already names "the Home and End
//     screens" as its two call sites.

import { useTranslation } from 'react-i18next';
import { socket } from '../socket';
import EndMascots from '../components/art/EndMascots';
import RoomGallery from '../components/RoomGallery';
import SourceFooter from '../components/SourceFooter';
import { hasAnyRail } from '../support';
import type { GalleryReadyPayload, SupportConfig } from '@funny/shared';
import type { LobbyState } from '../App';

interface Props {
  lobby: LobbyState;
  // socket.ids of non-bot players who have toggled "ready" (spec §5).
  readyIds: string[];
  // True once the host has ended the game — controls are hidden, terminal view.
  gameOver: boolean;
  // The shared room gallery, or null until the host shares it (spec §24).
  gallery: GalleryReadyPayload | null;
  // T-9.4/T-9.4a (FM-TIER-4): replaces the old direct donate link with a
  // button that opens SupportScreen. Optional so screen-level tests that
  // don't care about it need not pass it.
  support?: SupportConfig | null;
  onOpenSupport?: () => void;
}

export default function EndScreen({
  lobby,
  readyIds,
  gameOver,
  gallery,
  support = null,
  onOpenSupport = () => {},
}: Props) {
  const { t } = useTranslation();

  const isHost = lobby.socketId === lobby.hostId;
  const nonBots = lobby.players.filter((p) => !p.isBot);
  const nonHostNonBots = nonBots.filter((p) => p.id !== lobby.hostId);
  const enoughPlayers = nonBots.length >= 3;
  const allReady = nonHostNonBots.every((p) => readyIds.includes(p.id));
  const canRestart = enoughPlayers && allReady;
  const iAmReady = readyIds.includes(lobby.socketId);

  function restart(): void {
    socket.emit('game:restart');
  }
  function finish(): void {
    socket.emit('game:end');
  }
  function toggleReady(): void {
    socket.emit('game:ready', { ready: !iAmReady });
  }
  function shareGallery(): void {
    socket.emit('gallery:share');
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-4 p-6">
      <EndMascots className="h-32 w-48" />

      {/* Item 8 of SRC's BUGS_AND_IMPROVEMENTS_02.md — "Game is over" felt
          premature while the gallery / restart flow was still ahead. The
          screen reads "Rounds are over" until the host's Finish Game action
          flips gameOver, at which point it becomes the terminal "Game is
          over". */}
      <h2 className="font-display text-3xl font-bold text-pink-500">
        {gameOver ? t('end.title') : t('end.roundsOver')}
      </h2>

      {gallery ? (
        <RoomGallery
          entries={gallery.entries}
          roomLanguage={lobby.language}
          defaultLanguage={lobby.myLanguage}
        />
      ) : isHost && !gameOver ? (
        <button
          className="w-full rounded bg-pink-500 py-3 font-display text-xl font-semibold text-white"
          onClick={shareGallery}
        >
          {t('gallery.share')}
        </button>
      ) : null}

      {gameOver ? null : isHost ? (
        <>
          <button
            className="w-full rounded bg-pink-500 py-3 font-display text-xl font-semibold text-white disabled:bg-gray-300 disabled:text-gray-500"
            disabled={!canRestart}
            onClick={restart}
          >
            {t('end.oneMoreGame')}
          </button>
          {!canRestart && (
            <p className="text-center text-sm text-gray-600">
              {!enoughPlayers ? t('end.needPlayers') : t('end.waitingForReady')}
            </p>
          )}
          <button
            className="w-full rounded border-2 border-pink-500 bg-white py-3 font-display text-xl font-semibold text-pink-500"
            onClick={finish}
          >
            {t('end.finishGame')}
          </button>
        </>
      ) : gallery === null ? (
        // The ready toggle is gated on the gallery being visible to the
        // joiner (SRC's item 11 of BUGS_AND_IMPROVEMENTS_02.md) — "ready for
        // a new game?" feels premature before players have seen this game's
        // pictures. Show the waiting-for-host message instead.
        <p className="text-center text-sm text-gray-600">{t('end.waitingForHost')}</p>
      ) : (
        <>
          <button
            className={`w-full rounded py-3 font-display text-xl font-semibold text-white ${
              iAmReady ? 'bg-green-500' : 'bg-pink-500'
            }`}
            onClick={toggleReady}
          >
            {iAmReady ? t('end.readyActive') : t('end.ready')}
          </button>
          {iAmReady && (
            <p className="text-center text-sm text-gray-600">{t('end.waitingForHost')}</p>
          )}
        </>
      )}

      {hasAnyRail(support) && (
        <button
          type="button"
          className="mt-2 text-sm text-gray-500 underline"
          onClick={onOpenSupport}
        >
          {t('endScreen.supportServer')}
        </button>
      )}

      <SourceFooter />
    </div>
  );
}
