/// <reference types="vitest" />
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * `vite preview` falls back to the home page for deep links. Production hosts serve the prerendered
 * folder (dist/products/peach/index.html) for /products/peach; this makes preview do the same.
 */
const servePrerenderedRoutes = (): Plugin => ({
  name: 'serve-prerendered-routes',
  configurePreviewServer(server) {
    server.middlewares.use((req, _res, next) => {
      const path = (req.url ?? '').split('?')[0].replace(/\/+$/, '');
      if (path && !/\.[a-z0-9]+$/i.test(path) && existsSync(resolve('dist', `.${path}`, 'index.html'))) {
        req.url = `${path}/index.html`;
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), servePrerenderedRoutes()],
  test: {
    include: ['src/**/*.test.ts'],
  },
  server: {
    port: 3000,
    host: true,
    watch: {
      usePolling: true,
    },
  },
});
