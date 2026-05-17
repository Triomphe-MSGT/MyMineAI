/**
 * Sur Render : compile le client après « npm install » (Build Command par défaut).
 * Ne doit jamais rappeler « npm install » à la racine (boucle infinie).
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

if (process.env.MYMINE_CLIENT_BUILD === '1') {
  process.exit(0);
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexHtml = path.join(root, 'client', 'dist', 'index.html');

if (fs.existsSync(indexHtml)) {
  process.exit(0);
}

const onRender =
  process.env.RENDER === 'true' ||
  Boolean(process.env.RENDER_SERVICE_ID) ||
  process.env.CI === 'true';
const forceBuild = process.env.MYMINE_BUILD_CLIENT === 'true';

if (!onRender && !forceBuild) {
  process.exit(0);
}

console.log('[MyMine] postinstall → compilation du client (Render)…');
execSync('bash scripts/render-build.sh', {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    MYMINE_CLIENT_BUILD: '1',
    NPM_CONFIG_PRODUCTION: 'false',
  },
});
