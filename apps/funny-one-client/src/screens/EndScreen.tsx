// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-4.3a — adapted from `apps/funny-multi-client/src/screens/EndScreen.tsx`.
// Funny One has no lobby/socket to drive this: no host, no per-player
// "ready" toggle, no "rounds are over" vs. "game is over" distinction (there
// is only ever one game, finished the moment `isDone` is true). What's left
// after stripping all of that: the mascot hero, the gallery, and two ways
// forward — owner decision 2026-09-23, resolved alongside the reveal-once
// gallery behaviour above.
//
//   - Play again: same seats, same language, a fresh game in one tap
//     (App.tsx re-runs `createGame` with the current seats).
//   - Change players: back to HomeScreen's setup (App.tsx clears `game`).

import { useTranslation } from 'react-i18next';
import EndMascots from '../components/art/EndMascots';
import StoryGallery from '../components/StoryGallery';
import SourceFooter from '../components/SourceFooter';
import type { GameState } from '../game/roundRobin';
import type { PictureSource } from '../pictureSource';

interface Props {
  game: GameState;
  /** Where the gallery's pictures come from (D-10); the rig when omitted. */
  pictures?: PictureSource;
  onPlayAgain: () => void;
  onChangePlayers: () => void;
}

export default function EndScreen({
  game,
  pictures = 'builtin',
  onPlayAgain,
  onChangePlayers,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-4 p-6">
      <EndMascots className="h-32 w-48" />

      <h2 className="font-display text-3xl font-bold text-pink-500">{t('end.title')}</h2>

      <StoryGallery
        seats={game.seats}
        stories={game.stories}
        language={game.language}
        pictures={pictures}
      />

      <button
        className="w-full rounded bg-pink-500 py-3 font-display text-xl font-semibold text-white"
        onClick={onPlayAgain}
      >
        {t('end.playAgain')}
      </button>
      <button
        className="w-full rounded border-2 border-pink-500 bg-white py-3 font-display text-xl font-semibold text-pink-500"
        onClick={onChangePlayers}
      >
        {t('end.changePlayers')}
      </button>

      <SourceFooter pictures={pictures} />
    </div>
  );
}
