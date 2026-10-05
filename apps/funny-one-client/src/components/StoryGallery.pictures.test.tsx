// SPDX-License-Identifier: AGPL-3.0-only

// D-10 — the gallery with Internet pictures chosen: what reached the screen
// is what Download hands to the export. Kept apart from StoryGallery.test.tsx
// because it mocks the export and the picture source, which that suite runs
// for real.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { Story } from '@funny/shared';
import type { Seat } from '../game/roundRobin';
import '../i18n';

vi.mock('./RigScene', () => ({ default: () => <div data-testid="rig-scene" /> }));

const downloadStoryImage = vi.fn<(opts: { pictureUrl?: string | null }) => Promise<void>>();
vi.mock('../rigExport', () => ({ downloadStoryImage, buildStoryImageFile: vi.fn() }));

const libraryPictureUrl = vi.fn<(story: Story) => Promise<string | null>>();
vi.mock('../pictureSource', () => ({ libraryPictureUrl }));

const { default: StoryGallery } = await import('./StoryGallery');

const SEATS: Seat[] = [
  { id: 's0', name: 'Ann', kind: 'human' },
  { id: 's1', name: 'Bo', kind: 'virtual' },
];

function story(who: string): Story {
  return {
    picture: null,
    answers: [
      who,
      'with.angry-geese',
      'where.messy-kitchen',
      'when.hat-festival',
      'did.juggling-pancakes',
      'why.impress-a-pigeon',
      'end.duck-complaint',
    ],
  };
}

const STORIES = [story('who.grumpy-pirate'), story('who.sleepy-llama')];

async function settle(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

const exportedUrl = () => downloadStoryImage.mock.calls.at(-1)?.[0].pictureUrl;

beforeEach(() => {
  downloadStoryImage.mockReset();
  downloadStoryImage.mockResolvedValue();
  libraryPictureUrl.mockReset();
  libraryPictureUrl.mockImplementation((s) =>
    Promise.resolve(`https://pictures.example/i/${String(s.answers[0])}.png`),
  );
});

describe('StoryGallery with Internet pictures (D-10)', () => {
  it('exports the rig until the library picture is on screen, then that picture', async () => {
    const { container } = render(
      <StoryGallery seats={SEATS} stories={STORIES} language="en" pictures="online" />,
    );
    await settle();

    fireEvent.click(screen.getByText('Download'));
    expect(exportedUrl()).toBeNull();

    fireEvent.load(container.querySelector('img')!);
    fireEvent.click(screen.getByText('Download'));
    expect(exportedUrl()).toBe('https://pictures.example/i/who.grumpy-pirate.png');
  });

  it('tracks the picture per story', async () => {
    const { container } = render(
      <StoryGallery seats={SEATS} stories={STORIES} language="en" pictures="online" />,
    );
    await settle();
    fireEvent.load(container.querySelector('img')!);

    fireEvent.click(screen.getByRole('button', { name: 'Next story' }));
    await settle();
    // The second story's picture fails: it is drawn, and exported, as the rig.
    fireEvent.error(container.querySelector('img')!);
    expect(screen.getByTestId('rig-scene')).toBeTruthy();
    fireEvent.click(screen.getByText('Download'));
    expect(exportedUrl()).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Previous story' }));
    fireEvent.click(screen.getByText('Download'));
    expect(exportedUrl()).toBe('https://pictures.example/i/who.grumpy-pirate.png');
  });

  it('never asks the library with built-in pictures', () => {
    render(<StoryGallery seats={SEATS} stories={STORIES} language="en" />);
    expect(screen.getByTestId('rig-scene')).toBeTruthy();
    expect(libraryPictureUrl).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Download'));
    expect(exportedUrl()).toBeNull();
  });
});
