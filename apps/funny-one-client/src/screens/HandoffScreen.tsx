// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-3.2 — new (FO-CORE-3). Nothing in Funny Multi needs this screen:
// players never share a device there. Shown before every *human* seat's
// turn, never a virtual seat's — a bot has no one to hand the phone to, so
// App.tsx resolves those turns immediately without rendering this at all.
// The comedic "thinking" pause that stands in for a bot's turn instead lands
// at T-FO-3.3.

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { goofy } from '../styles/motion';
import type { Seat } from '../game/roundRobin';

interface Props {
  seat: Seat;
  onReady: () => void;
}

export default function HandoffScreen({ seat, onReady }: Props) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <motion.h1
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={goofy}
        className="font-display text-4xl font-semibold"
      >
        {t('handoff.title', { name: seat.name })}
      </motion.h1>
      <p className="text-gray-700">{t('handoff.subtitle')}</p>
      <button
        className="w-full rounded bg-pink-500 py-3 font-display text-xl font-semibold text-white"
        onClick={onReady}
      >
        {t('handoff.ready', { name: seat.name })}
      </button>
    </div>
  );
}
