// SPDX-License-Identifier: AGPL-3.0-only

// B-15: the small control that retells one story in another language, on the
// reveal screen and on each story of the room gallery. It shows the language
// the story is in now — flag and two-letter label — and a tap opens the start
// window's flag list (`LanguageList`) under it; picking a flag closes it. Only
// the story's texts change: the interface stays in the language the player set
// on the start window.

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageList from './LanguageList';
import { withBase } from '../basePath';
import { CONTENT_LANGUAGES } from '../storyLanguage';
import type { AuthoredLanguage } from '@funny/shared';

interface Props {
  value: AuthoredLanguage;
  onChange: (language: AuthoredLanguage) => void;
}

export default function StoryLanguageSwitch({ value, onChange }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const current = CONTENT_LANGUAGES.find((opt) => opt.code === value);

  // While the list is open, a tap anywhere outside it closes it, and so does
  // Escape, which also hands focus back to the toggle. Focus starts on the
  // pressed flag, which also scrolls that flag into the list's view.
  useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
    const onPointerDown = (event: Event): void => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function select(language: AuthoredLanguage): void {
    setOpen(false);
    toggleRef.current?.focus();
    onChange(language);
  }

  const label = t('round.storyLanguage');
  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={current ? `${label}: ${current.name}` : label}
        className="flex items-center gap-1 rounded border border-amber-300 bg-white px-2 py-1 text-sm font-semibold text-gray-800"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <img
          src={withBase(`flags/${value}.png`)}
          alt=""
          aria-hidden="true"
          className="h-5 w-5 flex-shrink-0 object-contain"
        />
        <span>{current?.country ?? value}</span>
        <span aria-hidden="true" className="text-xs text-gray-500">
          ▾
        </span>
      </button>
      {open && (
        <div
          id={listId}
          className="absolute end-0 top-full z-30 mt-1 rounded-lg border border-amber-300 bg-white p-2 shadow-lg"
        >
          <LanguageList
            languages={CONTENT_LANGUAGES}
            selected={value}
            onSelect={select}
            label={label}
          />
        </div>
      )}
    </div>
  );
}
