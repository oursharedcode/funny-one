// SPDX-License-Identifier: AGPL-3.0-only

// Scaffold — replaced by T-3.4 (waiting mascot, timer bar).
// See PlaceholderScreen.tsx for why these exist.

import type { RoundWaitingPayload } from '@funny/shared';
import PlaceholderScreen from './PlaceholderScreen';

interface Props {
  waiting: RoundWaitingPayload;
}

export default function WaitingScreen({ waiting }: Props) {
  return (
    <PlaceholderScreen
      phase="Waiting"
      task="T-3.4"
      detail={`${waiting.submitted} / ${waiting.total} submitted`}
    />
  );
}
