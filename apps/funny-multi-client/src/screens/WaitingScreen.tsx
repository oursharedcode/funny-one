// SPDX-License-Identifier: AGPL-3.0-only

// Copied from SRC/client/src/screens/WaitingScreen.tsx. The only change is the
// payload type: SRC declared a local `WaitingData` interface, and the same
// shape already exists on the socket contract as `RoundWaitingPayload`, which
// App routes in directly.
//
// No timer here, deliberately. The 60 s deadline belongs to RoundScreen, which
// is where a player can still act on it; once you have submitted, a countdown
// only tells you how long you may be stuck watching a mascot.

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import WaitingMascot from '../components/art/WaitingMascot';
import { snappy } from '../styles/motion';
import type { RoundWaitingPayload } from '@funny/shared';

interface Props {
  waiting: RoundWaitingPayload;
}

export default function WaitingScreen({ waiting }: Props) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
      <WaitingMascot className="h-32 w-32" />
      <h2 className="font-display text-3xl font-semibold text-pink-500">{t('waiting.title')}</h2>
      {/* Keyed on the count so each new submission re-runs the pop — the one
          moving part on a screen whose whole job is to show progress. */}
      <motion.p
        key={waiting.submitted}
        className="text-xl text-gray-700"
        initial={{ scale: 1.18 }}
        animate={{ scale: 1 }}
        transition={snappy}
      >
        {t('waiting.progress', { submitted: waiting.submitted, total: waiting.total })}
      </motion.p>
      <p className="text-sm text-gray-500">{t('waiting.ellipsis')}</p>
    </div>
  );
}
