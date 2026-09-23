// SPDX-License-Identifier: AGPL-3.0-only

import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Story } from '@funny/shared';
import StoryGallery from './StoryGallery';
import type { Seat } from '../game/roundRobin';
import '../i18n';

// Stubs the compositor so the reveal-once contract can be asserted on its
// `reveal` prop directly, rather than reaching into framer-motion's inline
// styles (RigScene's own suite already covers the animation itself). Reads
// `reveal` only via a `useState` initializer — same "only matters at mount"
// semantics framer-motion's `initial` prop actually has on the real
// component — so a later prop change (StoryGallery's own seen-tracking
// re-render, right after mount) doesn't retroactively flip what this stub
// reports.
vi.mock('./RigScene', () => ({
  default: ({ reveal }: { reveal?: boolean }) => {
    const [revealedAtMount] = useState(reveal ?? false);
    return <div data-testid="rig-scene" data-reveal={String(revealedAtMount)} />;
  },
}));

function storyWith(answers: (string | null)[]): Story {
  const full = new Array<string | null>(7).fill(null);
  answers.forEach((a, i) => {
    full[i] = a;
  });
  return { answers: full, picture: null };
}

const SEATS: Seat[] = [
  { id: 's0', name: 'Ann', kind: 'human' },
  { id: 's1', name: 'Bo', kind: 'virtual' },
];

const STORIES: Story[] = [
  storyWith([
    'who.grumpy-pirate',
    'with.angry-geese',
    'where.messy-kitchen',
    'when.hat-festival',
    'did.juggling-pancakes',
    'why.impress-a-pigeon',
    'end.duck-complaint',
  ]),
  storyWith([
    'who.sleepy-llama',
    'with.confused-walrus',
    'where.cloud-castle',
    'when.hat-festival',
    'did.juggling-pancakes',
    'why.impress-a-pigeon',
    'end.duck-complaint',
  ]),
];

describe('StoryGallery', () => {
  it('renders nothing for an empty story list', () => {
    const { container } = render(<StoryGallery seats={[]} stories={[]} language="en" />);
    expect(container.innerHTML).toBe('');
  });

  it('shows the current seat, resolved prose, and a 1-based counter', () => {
    render(<StoryGallery seats={SEATS} stories={STORIES} language="en" />);
    expect(screen.getByText("Ann's story")).toBeTruthy();
    expect(screen.getByText('1 of 2')).toBeTruthy();
  });

  it('steps forward and wraps back to the first story', () => {
    render(<StoryGallery seats={SEATS} stories={STORIES} language="en" />);

    fireEvent.click(screen.getByRole('button', { name: 'Next story' }));
    expect(screen.getByText("Bo's story")).toBeTruthy();
    expect(screen.getByText('2 of 2')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Next story' }));
    expect(screen.getByText("Ann's story")).toBeTruthy();
    expect(screen.getByText('1 of 2')).toBeTruthy();
  });

  it('plays the reveal only the first time a story is opened', () => {
    render(<StoryGallery seats={SEATS} stories={STORIES} language="en" />);
    expect(screen.getByTestId('rig-scene').dataset.reveal).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Next story' }));
    expect(screen.getByTestId('rig-scene').dataset.reveal).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Previous story' }));
    // Story 0 was already opened once above — revisiting renders settled.
    expect(screen.getByTestId('rig-scene').dataset.reveal).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: 'Next story' }));
    // Story 1 was already opened too.
    expect(screen.getByTestId('rig-scene').dataset.reveal).toBe('false');
  });
});
