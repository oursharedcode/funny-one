// SPDX-License-Identifier: AGPL-3.0-only

// Scaffold — replaced by T-5.1 (ready toggle, one-more-game guard, gallery).
// See PlaceholderScreen.tsx for why these exist.

import type { GalleryReadyPayload } from '@funny/shared';
import type { LobbyState } from '../App';
import PlaceholderScreen from './PlaceholderScreen';

interface Props {
  lobby: LobbyState;
  readyIds: string[];
  gameOver: boolean;
  gallery: GalleryReadyPayload | null;
}

export default function EndScreen({ lobby, readyIds, gameOver, gallery }: Props) {
  return (
    <PlaceholderScreen
      phase={gameOver ? 'Game over' : 'End'}
      task="T-5.1"
      detail={`Room ${lobby.roomCode} — ${readyIds.length} ready, ${
        gallery ? gallery.entries.length : 0
      } gallery entries`}
    />
  );
}
