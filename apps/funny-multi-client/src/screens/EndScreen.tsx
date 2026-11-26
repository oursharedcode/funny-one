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
//
// Step 122 (B-29): until the game is over, a paid room says its next game is
// all Christmas stories, and a player whose phone keeps a paid code can open
// the room for the next game (PackUnlock). The gallery reports each paid
// story saved or shared (`story:exported`) for the game's receipt record.
//
// Step 123 (B-29): the pay card. After a free Christmas game — the room's pack
// switched on and not paid — every player whose phone keeps no code is shown
// what the pack costs and until when it plays, with one button to the pay
// page. On the website only, and only while the server says the pack is on
// sale (`pay`, from /config): never in the Android app, in a paid room, with
// the host's switch off, or in a room whose language has no pack (ar, he, fa
// — such a room was offered none). The price is the one the server's rail for
// this visitor charges.

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PACKS } from '@funny/shared';
import { socket } from '../socket';
import EndMascots from '../components/art/EndMascots';
import PackUnlock from '../components/PackUnlock';
import RoomGallery from '../components/RoomGallery';
import SourceFooter from '../components/SourceFooter';
import { trackPayCard } from '../funnel';
import { readPackCode } from '../packCode';
import { lastPaidDay } from '../packDay';
import { isStoreShell } from '../storeShell';
import { hasAnyRail } from '../support';
import type { GalleryReadyPayload, PackId, PayConfig, SupportConfig } from '@funny/shared';
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
  // Step 123: what the server sells this visitor and by which rail (/config),
  // or null; and the pay card's button, which opens the pay page.
  pay?: PayConfig | null;
  onOpenPay?: (pack: PackId) => void;
}

export default function EndScreen({
  lobby,
  readyIds,
  gameOver,
  gallery,
  support = null,
  onOpenSupport = () => {},
  pay = null,
  onOpenPay = () => {},
}: Props) {
  const { t, i18n } = useTranslation();

  const isHost = lobby.socketId === lobby.hostId;
  const nonBots = lobby.players.filter((p) => !p.isBot);
  const nonHostNonBots = nonBots.filter((p) => p.id !== lobby.hostId);
  // Any number of people can play again since Step 130: bots take the seats
  // up to three, as at the first start.
  const allReady = nonHostNonBots.every((p) => readyIds.includes(p.id));
  const canRestart = allReady;
  const iAmReady = readyIds.includes(lobby.socketId);

  // The pay card's offer, or null where the card does not belong (see the top).
  const roomPack = lobby.pack;
  const offer =
    pay &&
    roomPack?.on &&
    !roomPack.paid &&
    pay.pack === roomPack.id &&
    !isStoreShell() &&
    readPackCode() === null
      ? pay
      : null;
  const offered = offer !== null;
  useEffect(() => {
    if (offered) trackPayCard();
  }, [offered]);

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
          onExported={(kind) => socket.emit('story:exported', { kind })}
        />
      ) : isHost && !gameOver ? (
        <button
          className="w-full rounded bg-pink-500 py-3 font-display text-xl font-semibold text-white"
          onClick={shareGallery}
        >
          {t('gallery.share')}
        </button>
      ) : null}

      {!gameOver && lobby.pack?.paid && lobby.pack.on && (
        <p className="text-center font-semibold text-pink-600" role="status">
          {t('end.nextPaid')}
        </p>
      )}
      {!gameOver && <PackUnlock lobby={lobby} />}
      {offer && (
        <div
          className="flex w-full flex-col gap-2 rounded border border-amber-300 bg-white p-3 text-center"
          data-pay-card={offer.pack}
        >
          <p className="text-gray-800">
            {t('pay.card', {
              price: PACKS[offer.pack].prices[offer.rail],
              date: lastPaidDay(offer.pack, i18n.language),
            })}
          </p>
          <button
            type="button"
            className="rounded bg-amber-400 py-2 font-semibold text-gray-900"
            onClick={() => onOpenPay(offer.pack)}
          >
            {t('pay.cardButton')}
          </button>
        </div>
      )}

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
            <p className="text-center text-sm text-gray-600">{t('end.waitingForReady')}</p>
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
