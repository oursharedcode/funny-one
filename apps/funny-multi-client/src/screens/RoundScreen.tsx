// SPDX-License-Identifier: AGPL-3.0-only

// Scaffold — replaced by T-3.3, the combobox (design §8.1). That is the task
// this whole product turns on: no free-text affordance may ever appear here.
// See PlaceholderScreen.tsx for why these exist.

import type { Language, RoundStartPayload } from '@funny/shared';
import PlaceholderScreen from './PlaceholderScreen';

interface Props {
  round: RoundStartPayload;
  language: Language;
  isHost: boolean;
}

export default function RoundScreen({ round, language }: Props) {
  return (
    <PlaceholderScreen
      phase="Round"
      task="T-3.3"
      detail={`Round ${round.roundNumber + 1} (${language}) — ${round.question}`}
    />
  );
}
