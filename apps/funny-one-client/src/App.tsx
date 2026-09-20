// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-3.1 wires the setup screen in; the phase machine's "playing" branch is
// a deliberately minimal placeholder — HandoffScreen and the adapted
// RoundScreen (T-FO-3.2) haven't landed yet, so there is nothing richer to
// render here without reaching into the next task's scope.

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import HomeScreen from './screens/HomeScreen';
import {
  createGame,
  currentSeat,
  currentSlot,
  isDone,
  type GameState,
  type Seat,
} from './game/roundRobin';
import type { AuthoredLanguage } from '@funny/shared';

export default function App() {
  const { t } = useTranslation();
  const [game, setGame] = useState<GameState | null>(null);

  function handleStart(seats: readonly Seat[], language: AuthoredLanguage): void {
    setGame(createGame(seats, language));
  }

  if (!game) {
    return <HomeScreen onStart={handleStart} />;
  }

  const seat = currentSeat(game);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-10">
      {isDone(game) ? (
        <p className="text-center text-gray-700">{t('home.title')} — game complete</p>
      ) : (
        <p className="text-center text-gray-700">
          Question {currentSlot(game) + 1} — {seat?.name} ({seat?.kind})
        </p>
      )}
    </div>
  );
}
