// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: the Funny Family landing page (www.funny-family.oursharedcode.com).
// No framework and no HTML input: the build has two script entries, and the
// plugin below writes every page around the files Vite produced — one landing
// page per language the games ship, /stats/, 404.html and sitemap.xml. The
// pages themselves are rendered by src/prerender/site.ts, which is
// typechecked and tested; this file only wires it in. The dev server renders
// the same pages on request, with the source modules in place of the built
// files. (Not src/build/: the repository ignores every build/ folder.)
//
// Port 5187 is this workspace's in the machine's port register. /api goes to
// a local Funny Multi server (port 3000), which keeps the visit counts.

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import { DEV_ASSETS, entryAssets, pageForPath, renderSite } from './src/prerender/site.ts';
import type { BundleItem } from './src/prerender/site.ts';

function sitePages(): Plugin {
  return {
    name: 'funny-family-pages',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        const url = new URL(req.url ?? '/', 'http://localhost');
        const page = pageForPath(url.pathname, DEV_ASSETS);
        if (!page) return next();
        if ('redirect' in page) {
          res.statusCode = 301;
          res.setHeader('Location', `${page.redirect}${url.search}`);
          res.end();
          return;
        }
        server
          .transformIndexHtml(url.pathname, page.html)
          .then((html) => {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(html);
          })
          .catch(next);
      });
    },
    generateBundle(_options, bundle) {
      const items = bundle as unknown as Record<string, BundleItem>;
      const files = renderSite({
        main: entryAssets(items, 'main'),
        stats: entryAssets(items, 'stats'),
      });
      for (const [fileName, source] of files) {
        this.emitFile({ type: 'asset', fileName, source });
      }
    },
  };
}

const api = { '/api': 'http://localhost:3000' };

export default defineConfig({
  appType: 'mpa',
  plugins: [sitePages()],
  build: {
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./src/main.ts', import.meta.url)),
        stats: fileURLToPath(new URL('./src/stats/main.ts', import.meta.url)),
      },
    },
  },
  server: { port: 5187, strictPort: true, proxy: api },
  preview: { port: 5187, strictPort: true, proxy: api },
});
