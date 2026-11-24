// SPDX-License-Identifier: AGPL-3.0-only

import { useTranslation } from 'react-i18next';

// Stands in for the code while the pack line is split around it.
const CODE_MARK = '\u0000';

/**
 * The pack line with its code on one line: a code broken at a hyphen
 * ("XMAS26-" / "K7QM-3FPA") reads as two. The translated line is split at its
 * placeholder, so each language keeps its own word order, and a copied code
 * keeps its plain hyphens. Home's pack box (Step 122) and the pay page of a
 * phone that already keeps a code (Step 123).
 */
export default function PackCodeLine({ code }: { code: string }) {
  const { t } = useTranslation();
  const [before = '', after = ''] = t('home.packCode', { code: CODE_MARK }).split(CODE_MARK);
  return (
    <p className="font-semibold text-pink-600">
      {before}
      <span className="whitespace-nowrap">{code}</span>
      {after}
    </p>
  );
}
