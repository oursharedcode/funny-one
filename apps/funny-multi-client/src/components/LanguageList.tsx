// SPDX-License-Identifier: AGPL-3.0-only

// The start window's flag list as one component (B-15). HomeScreen shows it
// twice — the host's room-language picker and the joiner's interface-language
// picker — and the story-language switch on the reveal screen and in the room
// gallery opens the same list, so all of them read alike. Each row is a PNG
// flag (works on every device, unlike emoji flags) followed by a two-letter
// label. A static list ran the page off-screen on a phone, so it is clamped
// to h-40 and scrolls within that slot.

import ScrollBox from './ScrollBox';
import { withBase } from '../basePath';
import type { Language } from '@funny/shared';

interface Option {
  code: Language;
  name: string;
  country: string;
}

interface Props {
  languages: readonly Option[];
  /** The code shown pressed. A plain string, so `i18n.language` can be passed as it is. */
  selected: string;
  onSelect: (code: Language) => void;
  /** Accessible name of the group. */
  label: string;
}

export default function LanguageList({ languages, selected, onSelect, label }: Props) {
  return (
    <ScrollBox
      className="h-40 w-28"
      contentClassName="flex flex-col gap-2 pe-2"
      role="group"
      aria-label={label}
    >
      {languages.map((opt) => (
        <button
          key={opt.code}
          aria-pressed={selected === opt.code}
          title={opt.name}
          className={`flex flex-shrink-0 items-center gap-2 rounded px-3 py-3 font-semibold ${
            selected === opt.code
              ? 'bg-pink-500 text-white'
              : 'border border-amber-300 bg-white text-gray-800'
          }`}
          onClick={() => onSelect(opt.code)}
        >
          <img
            src={withBase(`flags/${opt.code}.png`)}
            alt=""
            aria-hidden="true"
            className="h-6 w-6 flex-shrink-0 object-contain"
          />
          <span>{opt.country}</span>
        </button>
      ))}
    </ScrollBox>
  );
}
