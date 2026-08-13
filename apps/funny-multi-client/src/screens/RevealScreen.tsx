// SPDX-License-Identifier: AGPL-3.0-only

// Scaffold — replaced by T-4.4 (URL images with dimensions, retry, CAP_REACHED
// caption, error mascot). See PlaceholderScreen.tsx for why these exist.

import type { RevealStartPayload } from '@funny/shared';
import PlaceholderScreen from './PlaceholderScreen';

interface Props {
  reveal: RevealStartPayload;
  onContinue: () => void;
}

export default function RevealScreen({ reveal, onContinue }: Props) {
  return (
    <PlaceholderScreen phase="Reveal" task="T-4.4" detail={reveal.prose}>
      <button
        className="rounded bg-pink-500 px-4 py-2 font-semibold text-white"
        onClick={onContinue}
      >
        Continue
      </button>
    </PlaceholderScreen>
  );
}
