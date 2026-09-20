// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-3.2 replaces the T-FO-3.1 placeholder with the real local phase
// machine: setup -> (handoff -> round)* -> done. Funny Multi's phases are
// driven by socket events; this one is driven entirely by the `roundRobin`
// reducer plus one piece of local UI state (`awaitingHandoff`).
//
// Every human seat's turn is preceded by a HandoffScreen (FO-CORE-3, "Pass to
// {name}" + an explicit "I'm {name} — go" tap). A virtual seat's turn has no
// one to hand the phone to, so it resolves immediately here with no screen of
// its own — the 0.8–1.5 s "thinking" pause that will stand in for it lands at
// T-FO-3.3 (owner call, 2026-09-20).

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import HomeScreen from './screens/HomeScreen';
import HandoffScreen from './screens/HandoffScreen';
import RoundScreen from './screens/RoundScreen';
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

  // Virtual seats never render anything of their own: as soon as one becomes
  // the current turn, resolve it and move straight to the next. This re-runs
  // every time `game` changes, so a run of consecutive virtual seats resolves
  // one turn per render with no extra wiring.
  useEffect(() => {
    if (!game || isDone(game)) return;
    const seat = currentSeat(game)!;
    if (seat.kind === 'virtual') {
      setGame(submitAnswer(game, pickVirtualAnswer(game)));
    } else {
      setAwaitingHandoff(true);
    }
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

  // Nothing to show while a virtual seat's turn auto-resolves above — in
  // particular, never the combobox, or a human could answer on the bot's
  // behalf.
  if (seat.kind === 'virtual') {
    return null;
  }

  if (awaitingHandoff) {
    return <HandoffScreen seat={seat} onReady={() => setAwaitingHandoff(false)} />;
  }

  return <RoundScreen language={game.language} slot={currentSlot(game)} onSubmit={handleSubmit} />;
}
