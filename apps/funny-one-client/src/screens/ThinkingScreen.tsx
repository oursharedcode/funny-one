// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-3.3 (FO-BOT-1, archive ONE-4) — shown for the whole of a virtual
// seat's "thinking" delay, while App.tsx's timer runs out before it auto-picks
// an answer. Purely decorative: there is nothing here for anyone to act on,
// by design (App.tsx never wires this screen to submitAnswer).
//
// Reuses Funny Multi's WaitingMascot (copied unmodified, T-FO-3.3) — both
// screens are the same beat: nothing to do but wait on someone/something else.

import { useTranslation } from 'react-i18next';
import WaitingMascot from '../components/art/WaitingMascot';
import type { Seat } from '../game/roundRobin';

interface Props {
  seat: Seat;
}

export default function ThinkingScreen({ seat }: Props) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <WaitingMascot className="h-32 w-32" />
      <h2 className="font-display text-3xl font-semibold text-pink-500">
        {t('thinking.title', { name: seat.name })}
      </h2>
    </div>
  );
}
