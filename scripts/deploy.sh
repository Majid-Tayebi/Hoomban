#!/usr/bin/env bash
# Fast production deploy — rebuilds only the app image using Docker layer cache.
# Typical: ~1–3 minutes (NOT 10). Never pass --no-cache unless package.json changed.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Building app (cached npm layers)..."
DOCKER_BUILDKIT=1 docker compose build app

echo "==> Restarting app..."
docker compose up -d --no-deps app

echo "==> Reloading nginx..."
docker compose exec -T nginx nginx -t && docker compose exec -T nginx nginx -s reload

echo "==> Done. App is live."
docker compose ps app nginx --format 'table {{.Name}}\t{{.Status}}'
