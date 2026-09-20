// SPDX-License-Identifier: AGPL-3.0-only

// Copied verbatim from apps/funny-multi-client/src/components/art/Wordmark.tsx
// (steering/funny-one-design.md §2: design-system components carry over
// unmodified). The rendered text comes from the home.title i18n key, which
// differs per product catalog.

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { goofy } from '../../styles/motion';

interface Props {
  className?: string;
}

export default function Wordmark({ className = '' }: Props) {
  const { t } = useTranslation();
  return (
    <motion.h1
      className={`font-display font-bold text-5xl md:text-6xl text-pink-500 ${className}`}
      initial={{ scale: 0.3, rotate: -14, opacity: 0 }}
      animate={{ scale: 1, rotate: -4, opacity: 1 }}
      transition={goofy}
    >
      {t('home.title')}
    </motion.h1>
  );
}
