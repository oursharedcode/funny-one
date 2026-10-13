// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from SRC/client/src/main.tsx. SRC branched here on a `?test=` query
// parameter to mount one of five developer-only harness screens; design §3
// drops those for v1 ("dev-only harnesses; re-add on demand"), and with them
// the branch, leaving the entry point to do only what an entry point should.

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installSwReloadListener } from './swReload';
import { initFunnel } from './funnel';
import './i18n';
import './styles/index.css';

installSwReloadListener();
// Before the first render: it takes the landing page's parameters off the
// address bar, and HomeScreen reads the address bar as it renders.
initFunnel();

const root = document.getElementById('root');
if (!root) throw new Error('No #root element');
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
