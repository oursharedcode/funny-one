// SPDX-License-Identifier: AGPL-3.0-only

// Scaffold — replaced by T-3.2 (create/join modes, `?room=` link, QR, nickname).
// See PlaceholderScreen.tsx for why these exist.

import type { LobbyState } from '../App';
import PlaceholderScreen from './PlaceholderScreen';

interface Props {
  onJoined: (state: LobbyState) => void;
}

export default function HomeScreen(_props: Props) {
  return <PlaceholderScreen phase="Home" task="T-3.2" />;
}
