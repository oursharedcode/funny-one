// SPDX-License-Identifier: AGPL-3.0-only

import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { Story } from '@funny/shared';

// Same stub as StoryGallery.test.tsx: reports the `reveal` it was mounted with.
vi.mock('./RigScene', () => ({
  default: ({ reveal }: { reveal?: boolean }) => {
    const [revealedAtMount] = useState(reveal ?? false);
    return <div data-testid="rig-scene" data-reveal={String(revealedAtMount)} />;
  },
}));

const libraryPictureUrl = vi.fn<(story: Story) => Promise<string | null>>();
vi.mock('../pictureSource', () => ({ libraryPictureUrl }));

const { default: StoryPicture, LIBRARY_TIMEOUT_MS } = await import('./StoryPicture');

const URL = 'https://pictures.example/i/abc.png';

const STORY: Story = {
  picture: null,
  answers: [
    'who.grumpy-pirate',
    'with.angry-geese',
    'where.messy-kitchen',
    'when.hat-festival',
    'did.juggling-pancakes',
    'why.impress-a-pigeon',
    'end.duck-complaint',
  ],
};

/** Lets the mocked address promise resolve and React commit what follows. */
async function settle(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  libraryPictureUrl.mockReset();
  libraryPictureUrl.mockResolvedValue(URL);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('StoryPicture (D-10)', () => {
  it('draws the rig for built-in pictures and never asks for an address', () => {
    render(<StoryPicture story={STORY} source="builtin" reveal />);
    expect(screen.getByTestId('rig-scene').dataset.reveal).toBe('true');
    expect(libraryPictureUrl).not.toHaveBeenCalled();
  });

  it('shows the library picture once it loads, and reports its address', async () => {
    const onLibraryPicture = vi.fn();
    const { container } = render(
      <StoryPicture story={STORY} source="online" onLibraryPicture={onLibraryPicture} />,
    );
    expect(screen.getByTestId('picture-loading')).toBeTruthy();
    expect(screen.queryByTestId('rig-scene')).toBeNull();

    await settle();
    const img = container.querySelector('img')!;
    expect(img.getAttribute('src')).toBe(URL);
    expect(onLibraryPicture).not.toHaveBeenCalled();

    fireEvent.load(img);
    expect(screen.queryByTestId('picture-loading')).toBeNull();
    expect(screen.queryByTestId('rig-scene')).toBeNull();
    expect(onLibraryPicture).toHaveBeenCalledExactlyOnceWith(URL);
  });

  it('falls back to the rig, with its first reveal, when the picture fails to load', async () => {
    const { container, rerender } = render(<StoryPicture story={STORY} source="online" reveal />);
    // The gallery marks the story seen right after mount.
    rerender(<StoryPicture story={STORY} source="online" reveal={false} />);
    await settle();

    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByTestId('rig-scene').dataset.reveal).toBe('true');
  });

  it('falls back to the rig when there is no address to ask for', async () => {
    libraryPictureUrl.mockResolvedValue(null);
    render(<StoryPicture story={STORY} source="online" />);
    await settle();
    expect(screen.getByTestId('rig-scene')).toBeTruthy();
  });

  it('falls back to the rig when the picture outlasts the timeout', async () => {
    vi.useFakeTimers();
    const { container } = render(<StoryPicture story={STORY} source="online" />);
    await settle();
    expect(container.querySelector('img')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(LIBRARY_TIMEOUT_MS);
    });
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByTestId('rig-scene')).toBeTruthy();
  });

  it('keeps a loaded picture past the timeout', async () => {
    vi.useFakeTimers();
    const { container } = render(<StoryPicture story={STORY} source="online" />);
    await settle();
    fireEvent.load(container.querySelector('img')!);

    act(() => {
      vi.advanceTimersByTime(LIBRARY_TIMEOUT_MS * 2);
    });
    expect(container.querySelector('img')).toBeTruthy();
    expect(screen.queryByTestId('rig-scene')).toBeNull();
  });

  it('draws the rig at once on a device that is offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    render(<StoryPicture story={STORY} source="online" />);
    expect(screen.getByTestId('rig-scene')).toBeTruthy();
    expect(libraryPictureUrl).not.toHaveBeenCalled();
  });
});
