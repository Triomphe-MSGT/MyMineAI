#!/usr/bin/env bash
# Compile uniquement le client Vite (sans « npm install » à la racine → évite boucle postinstall).
set -euo pipefail
cd "$(dirname "$0")/.."

export NPM_CONFIG_PRODUCTION=false

echo "▶ npm install + build (client)"
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
