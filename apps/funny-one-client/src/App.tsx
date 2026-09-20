// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-1.1 scaffold placeholder. This is deliberately not the game — the
// local round-robin state machine (T-FO-2.2) and the real screens (Phase
// FO-3) land in later steps. This exists so the workspace builds, typechecks,
// and has one smoke test, per steering/funny-one-tasks.md Phase FO-1.

import { useTranslation } from 'react-i18next';
import Wordmark from './components/art/Wordmark';
import SourceFooter from './components/SourceFooter';

export default function App() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-10">
      <Wordmark />
      <p className="max-w-sm text-center text-gray-600">{t('home.subtitle')}</p>
      <SourceFooter />
    </div>
  );
}
