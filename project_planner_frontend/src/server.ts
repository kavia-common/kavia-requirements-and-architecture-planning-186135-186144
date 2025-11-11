import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';
import fs from 'node:fs';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();
const commonEngine = new CommonEngine();

// Optionally trust proxy based on env (runtime SSR env)
const TRUST_PROXY = parseBool(process.env['NG_APP_TRUST_PROXY'] ?? process.env['TRUST_PROXY'] ?? 'false');
if (TRUST_PROXY) {
  app.set('trust proxy', true);
}

// Resolve healthcheck path from env with default
const HEALTH_PATH = process.env['NG_APP_HEALTHCHECK_PATH'] || process.env['HEALTHCHECK_PATH'] || '/healthz';

// Serve runtime config.json as static (already copied by Angular assets to /browser)
app.get('/config.json', (req, res) => {
  const path = join(browserDistFolder, 'config.json');
  if (fs.existsSync(path)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.sendFile(path);
  } else {
    // fallback default minimal config to avoid 404 during early SSR
    res.status(200).json({
      apiBase: '/api',
      healthcheckPath: HEALTH_PATH,
    });
  }
});

// Healthcheck endpoint
app.get(HEALTH_PATH, (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * Serve static files from /browser
 */
app.get(
  '**',
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html'
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = Number(process.env['NG_APP_PORT'] || process.env['PORT'] || 4000);
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export default app;

function parseBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const t = v.toLowerCase().trim();
    if (['true', '1', 'yes', 'y'].includes(t)) return true;
    if (['false', '0', 'no', 'n'].includes(t)) return false;
  }
  if (typeof v === 'number') return v !== 0;
  return false;
}
