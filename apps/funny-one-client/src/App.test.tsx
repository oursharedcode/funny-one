// SPDX-License-Identifier: AGPL-3.0-only

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import './i18n';

describe('App', () => {
  it('renders the Funny One wordmark', () => {
    render(<App />);
    expect(screen.getByText('Funny One')).toBeTruthy();
  });
});
