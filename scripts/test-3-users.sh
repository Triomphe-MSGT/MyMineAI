#!/usr/bin/env bash
# Lance MyMine et affiche les liens pour tester à 3 (Sourd · Aveugle · Standard).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pick_ip() {
  hostname -I 2>/dev/null | awk '{print $1}' | grep -E '^[0-9]+\.' | head -1
}

IP="$(pick_ip)"
[[ -z "$IP" ]] && IP="127.0.0.1"

PORT_SERVER="${PORT:-3001}"
PORT_CLIENT="${VITE_PORT:-5173}"
ROOM_ID="mm-test-$(date +%s | tail -c 6)-$(openssl rand -hex 2 2>/dev/null || echo abcd)"

BASE_LOCAL="http://localhost:${PORT_CLIENT}"
BASE_LAN="http://${IP}:${PORT_CLIENT}"
SERVER_URL="http://${IP}:${PORT_SERVER}"

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  MyMine — test 3 utilisateurs (même salle)"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "  Code salle à partager (copier-coller partout) :"
echo ""
echo "    ${ROOM_ID}"
echo ""
echo "──────────────────────────────────────────────────────────"
echo "  Sur CE PC (3 onglets navigateur)"
echo "──────────────────────────────────────────────────────────"
echo "  1. ${BASE_LOCAL}/select  →  Alice   →  Sourd · Muet"
echo "  2. ${BASE_LOCAL}/select  →  Bob     →  Aveugle"
echo "  3. ${BASE_LOCAL}/select  →  Carla   →  Standard"
echo ""
echo "──────────────────────────────────────────────────────────"
echo "  Sur téléphone / autre PC (même Wi‑Fi)"
echo "──────────────────────────────────────────────────────────"
echo "  ${BASE_LAN}/select"
echo ""
echo "  client/.env doit contenir :"
echo "    VITE_SERVER_URL=${SERVER_URL}"
echo ""
echo "──────────────────────────────────────────────────────────"
echo "  Scénario rapide"
echo "──────────────────────────────────────────────────────────"
echo "  • Alice : caméra → gestes (main ouverte, pouce) → Envoyer"
echo "  • Bob   : doit entendre la phrase reformulée"
echo "  • Carla : parle au micro → Alice voit sous-titres + LSF"
echo ""
echo "  Serveur : ${SERVER_URL}"
echo "══════════════════════════════════════════════════════════"
echo ""

if [[ "${1:-}" == "--links-only" ]]; then
  exit 0
fi

if [[ "${1:-}" == "--no-start" ]]; then
  echo "(Mode --no-start : lancez vous-même « npm run dev » dans un autre terminal.)"
  exit 0
fi

echo "Démarrage de npm run dev… (Ctrl+C pour arrêter)"
echo ""
exec npm run dev
