// SPDX-License-Identifier: AGPL-3.0-only

// Copied from SRC/client/tailwind.config.js. Tailwind stays on v3 on purpose:
// v4 moves configuration into CSS and would mean rewriting the copied design
// system (`src/styles/index.css`) as part of a bootstrap task. v3.4 carries no
// advisories, so there is nothing forcing the move.

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fredoka', 'system-ui', 'sans-serif'],
        prose: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
