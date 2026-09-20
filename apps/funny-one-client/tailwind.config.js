// SPDX-License-Identifier: AGPL-3.0-only

// Same design-system tokens as apps/funny-multi-client (steering/funny-one-design.md §2:
// motion presets and design-system components are copied unmodified between the two products).

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
