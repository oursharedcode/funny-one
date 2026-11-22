// SPDX-License-Identifier: AGPL-3.0-only

// Step 122 (B-29 #4, "unlock the room you're in"): a player whose phone keeps
// a paid code opens the room's pack with it — in the lobby, from the first
// game; on the end screen, from the next. Any player can, not only the host:
// whoever paid may have joined someone else's room. The server checks the
// code and says why it will not; a refusal a retry cannot change (a code that
// is not one, blocked or ended, or a room the pack has no stories for) takes
// the button away, so it is not tapped again and again. The code itself is
// never shown here or sent anywhere but the server.

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { socket } from '../socket';
import { canUnlockRoom, readPackCode } from '../packCode';
import type { LobbyState } from '../App';
import type { ErrorCode, ErrorPayload } from '@funny/shared';

// Refusals worth another tap later: a PayID code whose payment is on its way,
// and the wrong-code limiter.
const RETRYABLE: ReadonlySet<ErrorCode> = new Set<ErrorCode>(['CODE_PENDING', 'RATE_LIMITED']);

interface Props {
  lobby: LobbyState;
  /** The create ack's `codeError`, in the lobby of the room it was refused for. */
  initialError?: ErrorPayload | null;
}

export default function PackUnlock({ lobby, initialError = null }: Props) {
  const { t } = useTranslation();
  const [error, setError] = useState<ErrorPayload | null>(initialError);
  const [busy, setBusy] = useState(false);

  // Once the room is paid, by this phone or another, an old refusal is moot.
  const shownError = lobby.pack?.paid ? null : error;
  const offer = canUnlockRoom(lobby.pack, lobby.language) && !(error && !RETRYABLE.has(error.code));

  function unlock(): void {
    const code = readPackCode();
    if (!code) return;
    setBusy(true);
    socket.emit('room:unlock', { code: code.code }, (res) => {
      setBusy(false);
      setError('error' in res ? res.error : null);
    });
  }

  if (!offer && !shownError) return null;
  return (
    <div className="flex flex-col gap-2">
      {offer && (
        <button
          className="rounded border border-pink-400 bg-white py-2 font-semibold text-pink-600 disabled:opacity-50"
          disabled={busy}
          onClick={unlock}
        >
          {t('lobby.usePack')}
        </button>
      )}
      {shownError && (
        <p className="text-center text-sm text-red-600" role="alert">
          {t(`errors.${shownError.code}`, { defaultValue: shownError.message })}
        </p>
      )}
    </div>
  );
}
