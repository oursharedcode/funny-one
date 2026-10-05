// SPDX-License-Identifier: AGPL-3.0-only

// D-10 — one gallery story's picture, from whichever source the player chose
// on Home (pictureSource.ts).
//
// `builtin` is `RigScene`, untouched. `online` asks the picture library for
// the story's cartoon and shows a quiet placeholder while it travels; if it
// does not arrive — the device is offline, the address cannot be built, the
// request fails, or it outlasts LIBRARY_TIMEOUT_MS — the rig is drawn
// instead, with the reveal it would have had. The gallery mounts this fresh
// per story (`key`), so the state below never carries over between stories.

import { useEffect, useState } from 'react';
import type { Story } from '@funny/shared';
import RigScene from './RigScene';
import { libraryPictureUrl, type PictureSource } from '../pictureSource';

/** How long a library picture may take before the rig is drawn instead. */
export const LIBRARY_TIMEOUT_MS = 12000;

interface Props {
  story: Story;
  source: PictureSource;
  reveal?: boolean;
  /** Told once the library picture is on screen, so an export can match it. */
  onLibraryPicture?: (url: string) => void;
}

type Status = 'loading' | 'shown' | 'failed';

function deviceOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export default function StoryPicture({ story, source, reveal = false, onLibraryPicture }: Props) {
  const online = source === 'online';
  const [status, setStatus] = useState<Status>(() =>
    online && !deviceOffline() ? 'loading' : 'failed',
  );
  const [url, setUrl] = useState<string | null>(null);
  // The gallery flips `reveal` off right after a story's first mount; a rig
  // that only appears later, as the fallback, still owes that first reveal.
  const [revealAtMount] = useState(reveal);

  useEffect(() => {
    if (status !== 'loading') return;
    let live = true;
    const timer = setTimeout(() => setStatus('failed'), LIBRARY_TIMEOUT_MS);
    void libraryPictureUrl(story).then((address) => {
      if (!live) return;
      if (address) setUrl(address);
      else setStatus('failed');
    });
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [status, story]);

  if (!online) return <RigScene story={story} reveal={reveal} />;
  if (status === 'failed') return <RigScene story={story} reveal={revealAtMount} />;

  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-amber-50">
      {status === 'loading' && (
        <div
          data-testid="picture-loading"
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-amber-100"
        />
      )}
      {url && (
        <img
          src={url}
          alt=""
          className={`h-full w-full object-contain transition-opacity duration-300 ${
            status === 'shown' ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => {
            setStatus('shown');
            onLibraryPicture?.(url);
          }}
          onError={() => setStatus('failed')}
        />
      )}
    </div>
  );
}
