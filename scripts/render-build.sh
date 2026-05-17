#!/usr/bin/env bash
# Build client Vite — obligatoire avant « npm start » sur Render.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ npm install (racine)"
npm install

echo "▶ npm install + build (client)"
cd client
if [ -f package-lock.json ]; then
  npm ci || npm install
else
  npm install
fi
npm run build
cd ..

if [ ! -f client/dist/index.html ]; then
  echo "ERREUR: client/dist/index.html introuvable après le build."
  exit 1
fi

echo "✓ Client compilé dans client/dist/"
