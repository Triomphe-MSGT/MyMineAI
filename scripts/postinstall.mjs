/**
 * Sur Render, le Build Command est souvent seulement « npm install ».
 * Ce script compile alors le client React pendant l'installation.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexHtml = path.join(root, 'client', 'dist', 'index.html');

if (fs.existsSync(indexHtml)) {
  process.exit(0);
}

// Render : RENDER=true au runtime, CI=true pendant le build
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
    NPM_CONFIG_PRODUCTION: 'false',
    NODE_ENV: 'development',
  },
});
