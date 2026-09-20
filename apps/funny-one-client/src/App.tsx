// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-3.2 built the local phase machine: setup -> (handoff -> round)* ->
// done, driven by the `roundRobin` reducer plus one piece of local UI state
// (`awaitingHandoff`). T-FO-3.3 fills in a virtual seat's turn, which was a
// no-op `null` render until now: it now shows a ThinkingScreen for FO-BOT-1's
// 0.8–1.5 s comedic delay (archive ONE-4) before auto-picking an answer.
//
// Every human seat's turn is preceded by a HandoffScreen (FO-CORE-3, "Pass to
// {name}" + an explicit "I'm {name} — go" tap). A virtual seat's turn has no
// one to hand the phone to, so it never shows a HandoffScreen (owner call,
// 2026-09-20) — only the ThinkingScreen, then an automatic submit.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import HomeScreen from './screens/HomeScreen';
import HandoffScreen from './screens/HandoffScreen';
import RoundScreen from './screens/RoundScreen';
import ThinkingScreen from './screens/ThinkingScreen';
import { pickThinkingDelayMs } from './game/thinkingDelay';
import {
  createGame,
  currentSeat,
  currentSlot,
  isDone,
  pickVirtualAnswer,
  submitAnswer,
  type GameState,
  type Seat,
} from './game/roundRobin';
import type { AuthoredLanguage, OptionId } from '@funny/shared';

export default function App() {
  const { t } = useTranslation();
  const [game, setGame] = useState<GameState | null>(null);
  // Gates the HandoffScreen for the seat currently up. Reset to true
  // whenever a new human turn begins (see the effect below); a "go" tap sets
  // it false so RoundScreen takes over for that same turn.
  const [awaitingHandoff, setAwaitingHandoff] = useState(true);

  // Drives a virtual seat's turn: as soon as one becomes current, run out
  // FO-BOT-1's thinking delay, then auto-submit and move to the next turn.
  // The functional `setGame` update reads the *latest* state when the timer
  // fires rather than closing over the `game` this effect was scheduled
  // with, and the cleanup clears a stale timer — both matter under
  // StrictMode's dev-only double-invoke, which would otherwise risk two
  // picks racing for the same turn.
  useEffect(() => {
    if (!game || isDone(game)) return;
    const seat = currentSeat(game)!;
    if (seat.kind !== 'virtual') {
      setAwaitingHandoff(true);
      return;
    }
    const timer = setTimeout(() => {
      setGame((prev) => (prev ? submitAnswer(prev, pickVirtualAnswer(prev)) : prev));
    }, pickThinkingDelayMs());
    return () => clearTimeout(timer);
  }, [game]);

  function handleStart(seats: readonly Seat[], language: AuthoredLanguage): void {
    setGame(createGame(seats, language));
  }

  function handleSubmit(optionId: OptionId): void {
    setGame((prev) => (prev ? submitAnswer(prev, optionId) : prev));
  }

  if (!game) {
    return <HomeScreen onStart={handleStart} />;
  }

  if (isDone(game)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="text-center text-gray-700">{t('home.title')} — game complete</p>
      </div>
    );
  }

  const seat = currentSeat(game)!;

  // Never the combobox for a virtual seat's turn — a human could otherwise
  // answer on the bot's behalf. The ThinkingScreen has nothing for anyone to
  // act on; the effect above is what actually resolves this turn.
  if (seat.kind === 'virtual') {
    return <ThinkingScreen seat={seat} />;
  }

  if (awaitingHandoff) {
    return <HandoffScreen seat={seat} onReady={() => setAwaitingHandoff(false)} />;
  }

  return <RoundScreen language={game.language} slot={currentSlot(game)} onSubmit={handleSubmit} />;
}
