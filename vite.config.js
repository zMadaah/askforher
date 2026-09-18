import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { entryText } from './src/lib/entry.js';

const MAX_BODY = 4096; // uma resposta tem poucas centenas de bytes; o resto é lixo

/* Substitui o server.py do projeto original: durante `npm run dev` (ou
   `npm run preview`), um POST em /save acrescenta a resposta em responses.txt
   (e uma cópia em JSON, uma por linha, em responses.jsonl). */
function saveAnswers() {
  let root = process.cwd();

  const send = (res, status, body) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(body));
  };

  const handle = (req, res, next) => {
    const pathname = (req.url || '').split('?')[0].replace(/\/$/, '');
    if (pathname !== '/save') return next();
    if (req.method !== 'POST') return send(res, 405, { error: 'somente POST' });

    let body = '';
    let refused = false;
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      if (refused) return;
      body += chunk;
      if (body.length > MAX_BODY) {
        refused = true;
        send(res, 413, { error: 'corpo grande demais' });
      }
    });
    req.on('end', () => {
      if (refused) return;
      let payload;
      try {
        payload = JSON.parse(body || '{}');
      } catch {
        return send(res, 400, { error: 'json inválido' });
      }
      if (!payload || typeof payload !== 'object' || !payload.date || !payload.time) {
        return send(res, 400, { error: 'faltam data e horário' });
      }

      const receivedAt = new Date().toISOString();
      fs.appendFileSync(path.join(root, 'responses.txt'), entryText(payload, receivedAt), 'utf8');
      fs.appendFileSync(path.join(root, 'responses.jsonl'), `${JSON.stringify(payload)}\n`, 'utf8');

      console.log('  resposta salva -> responses.txt');
      send(res, 200, { ok: true, file: 'responses.txt' });
    });
  };

  return {
    name: 'save-answers',
    configResolved(config) { root = config.root; },
    configureServer(server) { server.middlewares.use(handle); },
    configurePreviewServer(server) { server.middlewares.use(handle); },
  };
}

export default defineConfig({
  // caminhos relativos: funciona em qualquer subpasta (GitHub Pages usa /nome-do-repo/)
  base: './',
  plugins: [react(), saveAnswers()],
});
