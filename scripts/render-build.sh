#!/usr/bin/env bash
# Build client Vite sur Render (NODE_ENV=production omet sinon les devDependencies → vite introuvable).
set -euo pipefail
cd "$(dirname "$0")/.."

export NPM_CONFIG_PRODUCTION=false
export NODE_ENV=development

echo "▶ npm install (racine)"
npm install

echo "▶ npm install + build (client, avec devDependencies)"
cd client
if [ -f package-lock.json ]; then
  npm ci --include=dev
else
  npm install --include=dev
fi
npm run build
cd ..

if [ ! -f client/dist/index.html ]; then
  echo "ERREUR: client/dist/index.html introuvable après le build."
  exit 1
fi

echo "✓ Client compilé dans client/dist/"
