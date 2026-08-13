// SPDX-License-Identifier: AGPL-3.0-only

// Scaffold — replaced by T-3.2 (room code, QR, player list, start button).
// See PlaceholderScreen.tsx for why these exist.

import type { LobbyState } from '../App';
import PlaceholderScreen from './PlaceholderScreen';

interface Props {
  lobby: LobbyState;
  onLeave: () => void;
}

export default function LobbyScreen({ lobby, onLeave }: Props) {
  return (
    <PlaceholderScreen
      phase="Lobby"
      task="T-3.2"
      detail={`Room ${lobby.roomCode} — ${lobby.players.length} player(s)`}
    >
      <button className="rounded bg-pink-500 px-4 py-2 font-semibold text-white" onClick={onLeave}>
        Leave
      </button>
    </PlaceholderScreen>
  );
}
