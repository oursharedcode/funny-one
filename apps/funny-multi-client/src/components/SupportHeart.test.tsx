// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: Home's ♥ and its hopping label.

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import i18n from '../i18n';

const { default: SupportHeart, hopParts } = await import('./SupportHeart');

describe('hopParts', () => {
  it('hops a label word by word', () => {
    expect(hopParts('Support Author')).toEqual(['Support', 'Author']);
    expect(hopParts('படைப்பாளரை ஆதரிக்கவும்')).toEqual(['படைப்பாளரை', 'ஆதரிக்கவும்']);
  });

  it('hops a label without spaces character by character', () => {
    expect(hopParts('支持作者')).toEqual(['支', '持', '作', '者']);
  });

  it('never tears a mark from its letter', () => {
    // "e" + combining acute: one grapheme, two code points.
    expect(hopParts('café')).toEqual(['c', 'a', 'f', 'é']);
  });
});

describe('SupportHeart', () => {
  it('is one button named by its visible label, in the interface language', async () => {
    await i18n.changeLanguage('ru');
    const onOpen = vi.fn();
    render(<SupportHeart onOpen={onOpen} />);
    const button = screen.getByRole('button', { name: 'Поддержать автора' });
    expect(button.textContent).toBe('♥Поддержатьавтора');
    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
    await i18n.changeLanguage('en');
  });
});
