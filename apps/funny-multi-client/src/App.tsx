// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from SRC/client/src/App.tsx. The phase machine, the socket
// subscription set, the forward slide-fade (spec §17) and the two overlays
// (transient error toast, host's player-lost notice) are carried as-is.
//
// One change: `wobbleEngine` is gone from `LobbyState` and from the
// `lobby:update` handler. ARC-3/DD-9 ship a single CSS recorder, so the field
// was removed from the socket contract in T-2.1 — carrying it here would mean
// storing a value the server no longer sends.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import RoundScreen from './screens/RoundScreen';
import WaitingScreen from './screens/WaitingScreen';
import RevealScreen from './screens/RevealScreen';
import EndScreen from './screens/EndScreen';
import BackgroundDoodle from './components/art/BackgroundDoodle';
import PayScreen from './components/PayScreen';
import SupportScreen from './components/SupportScreen';
import { hasAnyRail } from './support';
import { trackChristmasGame, trackSupportOpen } from './funnel';
import { clearPayLink, payLinkPack, type PayDoor } from './pay';
import { isStoreShell } from './storeShell';
import { canUnlockRoom } from './packCode';
import { screenSlide } from './styles/motion';
import { socket } from './socket';
import { setReloadSafe } from './swReload';
import { baseUrl, withBase, serverOrigin } from './basePath';
import { APP_VERSION } from './version';
import type {
  AuthoredLanguage,
  ClientConfig,
  ErrorPayload,
  GalleryReadyPayload,
  GameRestartReadyPayload,
  LobbyUpdatePayload,
  PackId,
  PayConfig,
  Player,
  PlayerLostPayload,
  RevealStartPayload,
  RoundStartPayload,
  RoomPack,
  RoundWaitingPayload,
  SupportConfig,
} from '@funny/shared';
import { seatBotNumber } from '@funny/shared';

export type GamePhase = 'home' | 'lobby' | 'writing' | 'waiting' | 'reveal' | 'end';

export interface LobbyState {
  roomCode: string;
  socketId: string;
  hostId: string;
  /**
   * The room's content language.
   *
   * Narrowed to `AuthoredLanguage`, not `Language`: the server refuses to
   * create a room in a language whose answer pools are not authored (T-2.3's
   * `isValidLanguage`), so every room that exists is one this client can fully
   * render — and RoundScreen needs exactly that guarantee to index
   * `POOL_TEXTS`, which is keyed by `AuthoredLanguage`. Stating it here makes
   * it a compile-time fact for every screen instead of a cast in each one.
   * HomeScreen does the narrowing where the value enters the client (T-3.3).
   */
  language: AuthoredLanguage;
  /** Whether the host ticked "multi-language room" (B-15); from the join ack for joiners. */
  multiLanguage: boolean;
  /**
   * The language this player reads the questions, the options and the stories
   * in by default: their own in a multi-language room (B-15), the room's in
   * any other. The story-language switch on the reveal screen and in the
   * gallery can still show a story in any language.
   */
  myLanguage: AuthoredLanguage;
  players: Player[];
  /**
   * The Christmas pack the room was offered and whether the host has it on
   * (Step 117, owner decision 3A); null for a room offered none. From
   * `lobby:update`, which every player gets right after creating or joining.
   */
  pack: RoomPack | null;
  /**
   * Why the code Home sent with `room:create` did not make the room paid
   * (Step 122): shown once in the lobby, next to the unlock button. Absent
   * for a joiner and for a room the code opened.
   */
  codeError?: ErrorPayload | null;
}

export default function App() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<GamePhase>('home');
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [round, setRound] = useState<RoundStartPayload | null>(null);
  const [waiting, setWaiting] = useState<RoundWaitingPayload | null>(null);
  const [reveal, setReveal] = useState<RevealStartPayload | null>(null);
  const [readyIds, setReadyIds] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gallery, setGallery] = useState<GalleryReadyPayload | null>(null);
  // Nickname of a player lost after the §7 grace window; drives the host's
  // notice banner (spec §12). Only the host's client ever receives the event.
  const [lostPlayer, setLostPlayer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // T-9.4/T-9.4a (FM-TIER-3/4): the support rails, fetched once at start-up so
  // Home's ♥ can show before any room exists. null until the fetch resolves
  // or fails — either way that means "no rails, no ♥" (see hasAnyRail).
  const [support, setSupport] = useState<SupportConfig | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  // Step 123 (B-29): what the server sells this visitor and by which rail,
  // from the same fetch — undefined until it answers, null when nothing is on
  // sale or the server cannot be reached. And the pay page: open from the
  // first render for a pay link (`?pay=x26`, where the landing site's /x26
  // forwards), later from the end screen's pay card. Never in the Android app.
  const [pay, setPay] = useState<PayConfig | null | undefined>(undefined);
  const [payPage, setPayPage] = useState<{ pack: PackId; door: PayDoor } | null>(() => {
    const linked = payLinkPack();
    return linked ? { pack: linked, door: 'link' } : null;
  });

  function closePayPage(): void {
    setPayPage(null);
    clearPayLink();
  }

  // Step 124: a code just paid for opens the room this phone is in, as the
  // lobby's "Use my Christmas pack here" would (PackUnlock) — from the next
  // game on the end screen. A refusal leaves that button to say why.
  function onPaid(code: string): void {
    if (lobby && canUnlockRoom(lobby.pack, lobby.language)) {
      socket.emit('room:unlock', { code }, () => {});
    }
  }

  // Both entry points (Home's ♥, the end screen) open the sheet through here,
  // so the funnel counts an opening once, wherever it came from (Step 72).
  function openSupport(): void {
    trackSupportOpen();
    setSupportOpen(true);
  }

  useEffect(() => {
    let cancelled = false;
    // Check the response's shape, not `res.ok`: a server without this route
    // (production, until its next deploy) answers the path with index.html at
    // status 200. `res.json()` throws on that HTML body, which the catch below
    // treats the same as "offline" — no rails, no ♥.
    fetch(serverOrigin() + withBase('config'))
      .then((res) => res.json())
      .then((data: Partial<ClientConfig> | null) => {
        if (cancelled) return;
        if (data?.support) setSupport(data.support);
        setPay(data?.pay ?? null);
      })
      .catch(() => {
        // No config route reachable — leave support at null; nothing is on sale.
        if (!cancelled) setPay(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onRoundStart = (data: RoundStartPayload): void => {
      setRound(data);
      setWaiting(null);
      setReveal(null);
      setReadyIds([]);
      setGallery(null);
      setLostPlayer(null);
      setPhase('writing');
    };
    const onRoundWaiting = (data: RoundWaitingPayload): void => {
      setWaiting(data);
      setPhase('waiting');
    };
    const onRevealStart = (data: RevealStartPayload): void => {
      setReveal(data);
      setRound(null);
      setWaiting(null);
      setPhase('reveal');
    };
    const onLobbyUpdate = (data: LobbyUpdatePayload): void => {
      setLobby((prev) =>
        prev
          ? {
              ...prev,
              players: data.players,
              hostId: data.hostId,
              pack: data.pack ?? null,
            }
          : prev,
      );
    };
    const onRestartReady = (data: GameRestartReadyPayload): void => {
      setReadyIds(data.readyIds);
    };
    const onGameOver = (): void => {
      setGameOver(true);
      setLostPlayer(null);
      setPhase('end');
    };
    const onGalleryReady = (data: GalleryReadyPayload): void => {
      setGallery(data);
    };
    const onPlayerLost = (data: PlayerLostPayload): void => {
      setLostPlayer(data.nickname);
    };
    const onError = (data: ErrorPayload): void => {
      // Localize via the error code; fall back to the server's message text.
      setError(t(`errors.${data.code}`, { defaultValue: data.message }));
      window.setTimeout(() => setError(null), 3000);
    };
    socket.on('round:start', onRoundStart);
    socket.on('round:waiting', onRoundWaiting);
    socket.on('reveal:start', onRevealStart);
    socket.on('lobby:update', onLobbyUpdate);
    socket.on('game:restartReady', onRestartReady);
    socket.on('game:over', onGameOver);
    socket.on('gallery:ready', onGalleryReady);
    socket.on('player:lost', onPlayerLost);
    socket.on('error', onError);
    return () => {
      socket.off('round:start', onRoundStart);
      socket.off('round:waiting', onRoundWaiting);
      socket.off('reveal:start', onRevealStart);
      socket.off('lobby:update', onLobbyUpdate);
      socket.off('game:restartReady', onRestartReady);
      socket.off('game:over', onGameOver);
      socket.off('gallery:ready', onGalleryReady);
      socket.off('player:lost', onPlayerLost);
      socket.off('error', onError);
    };
  }, []);

  // B-26: a new version reloads the page only on Home, with the support sheet
  // and the pay page shut — anywhere else the reload would drop this player
  // out of the room, or take the page from under someone about to pay.
  const payPageOpen = payPage !== null;
  useEffect(() => {
    setReloadSafe(phase === 'home' && !supportOpen && !payPageOpen);
  }, [phase, supportOpen, payPageOpen]);

  // Step 117 (D2 A): the Christmas funnel's first step — a game under way in a
  // room that was offered the Christmas stories, switched on or off. The
  // funnel counts it once per page load.
  // Step 130: and whether bots took empty seats — the roster with them reaches
  // every player before round 0 does.
  const pack = lobby?.pack ?? null;
  const roundNumber = round?.roundNumber ?? null;
  const withBots = lobby?.players.some((p) => seatBotNumber(p.id) !== null) ?? false;
  useEffect(() => {
    if (phase === 'writing' && roundNumber === 0 && pack) trackChristmasGame(pack.on, withBots);
  }, [phase, roundNumber, pack, withBots]);

  // "Create a new room" on the host notice (spec §12): end the current game
  // for everyone (game:end → game:over → room deleted), then reload to a fresh
  // Create-mode Home screen.
  function createNewRoom(): void {
    socket.emit('game:end');
    window.location.assign(baseUrl());
  }

  let body: JSX.Element;
  if (phase === 'end' && lobby) {
    body = (
      <EndScreen
        lobby={lobby}
        readyIds={readyIds}
        gameOver={gameOver}
        gallery={gallery}
        support={support}
        onOpenSupport={openSupport}
        pay={pay ?? null}
        onOpenPay={(pack) => setPayPage({ pack, door: 'card' })}
      />
    );
  } else if (phase === 'reveal' && reveal && lobby) {
    body = (
      <RevealScreen
        reveal={reveal}
        roomLanguage={lobby.language}
        defaultLanguage={lobby.myLanguage}
        onContinue={() => setPhase('end')}
      />
    );
  } else if (phase === 'writing' && round && lobby) {
    body = (
      <RoundScreen
        round={round}
        language={lobby.myLanguage}
        multiLanguage={lobby.multiLanguage}
        isHost={lobby.socketId === lobby.hostId}
      />
    );
  } else if (phase === 'waiting' && waiting) {
    body = <WaitingScreen waiting={waiting} />;
  } else if (phase === 'lobby' && lobby) {
    body = (
      <LobbyScreen
        lobby={lobby}
        onLeave={() => {
          setLobby(null);
          setPhase('home');
        }}
      />
    );
  } else {
    body = (
      <HomeScreen
        onJoined={(state) => {
          setLobby(state);
          setPhase('lobby');
        }}
        support={support}
        onOpenSupport={openSupport}
      />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <BackgroundDoodle />
      <div className="relative min-h-screen overflow-x-hidden">
        {/* Forward slide-fade per spec §17 — see `screenSlide`, which holds the
            values precisely so that they stay direction-independent. No
            `mode="wait"`: the outgoing screen leaves as the incoming arrives. */}
        <AnimatePresence initial={false}>
          <motion.div
            key={phase}
            data-phase={phase}
            className="absolute inset-0 overflow-y-auto"
            {...screenSlide}
          >
            {body}
          </motion.div>
        </AnimatePresence>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-1 right-1 z-40 rounded bg-white/70 px-1.5 py-0.5 text-[10px] leading-none text-gray-500"
      >
        v{APP_VERSION}
      </div>
      {error && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded bg-red-500 px-4 py-2 text-white shadow"
        >
          {error}
        </div>
      )}
      {lostPlayer && (
        <div
          role="alert"
          className="fixed left-1/2 top-4 z-50 flex w-[min(92vw,28rem)] -translate-x-1/2 flex-col gap-3 rounded-xl border-2 border-pink-500 bg-white p-4 shadow-lg"
        >
          <p className="text-center font-semibold text-gray-800">
            {t('playerLost.label', { nickname: lostPlayer })}
          </p>
          <div className="flex gap-2">
            <button
              className="flex-1 rounded bg-pink-500 py-3 font-semibold text-white"
              onClick={() => setLostPlayer(null)}
            >
              {t('playerLost.ignore')}
            </button>
            <button
              className="flex-1 rounded border-2 border-pink-500 bg-white py-3 font-semibold text-pink-500"
              onClick={createNewRoom}
            >
              {t('playerLost.newRoom')}
            </button>
          </div>
        </div>
      )}
      {supportOpen && support && hasAnyRail(support) && (
        <SupportScreen support={support} onClose={() => setSupportOpen(false)} />
      )}
      {payPage && !isStoreShell() && (
        <PayScreen
          pack={payPage.pack}
          pay={pay}
          door={payPage.door}
          onClose={closePayPage}
          onPaid={onPaid}
        />
      )}
    </MotionConfig>
  );
}
