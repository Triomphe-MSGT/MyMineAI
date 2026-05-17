/**
 * Vérifie que client/dist existe avant le démarrage du serveur.
 * Le build doit avoir lieu dans la phase « Build » Render (npm run build), pas au démarrage.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexHtml = path.join(root, 'client', 'dist', 'index.html');

if (fs.existsSync(indexHtml)) {
  process.exit(0);
}

const onRender = process.env.RENDER === 'true' || Boolean(process.env.RENDER_SERVICE_ID);

console.error(`
[MyMine] ERREUR : le client React n'est pas compilé (client/dist/index.html absent).

Sur Render → Settings → Build & Deploy :
  Build Command : npm run build
  Start Command : npm start

Puis « Manual Deploy » → « Clear build cache & deploy ».
`);

if (onRender) {
  process.exit(1);
}

console.warn('[MyMine] En local : npm run build && npm start');
process.exit(0);
