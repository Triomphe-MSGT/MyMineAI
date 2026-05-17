/**
 * Sur Render : si le build dashboard a été oublié, compile le client au démarrage.
 * (évite la page JSON « Run npm run build »)
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexHtml = path.join(root, 'client', 'dist', 'index.html');

if (fs.existsSync(indexHtml)) {
  process.exit(0);
}

const onRender = process.env.RENDER === 'true' || Boolean(process.env.RENDER_SERVICE_ID);

if (!onRender) {
  console.warn('[MyMine] client/dist absent — en local : npm run build');
  process.exit(0);
}

console.log('[MyMine] client/dist absent sur Render → build automatique…');
execSync('bash scripts/render-build.sh', { cwd: root, stdio: 'inherit' });

if (!fs.existsSync(indexHtml)) {
  console.error('[MyMine] Échec du build client.');
  process.exit(1);
}
