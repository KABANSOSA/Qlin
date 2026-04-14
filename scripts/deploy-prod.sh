#!/usr/bin/env bash
# Деплой продакшена (Linux/macOS). Перед первым запуском: chmod +x scripts/deploy-prod.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== docker compose build ==="
docker compose -f docker-compose.prod.yml build --no-cache

echo "=== docker compose up ==="
docker compose -f docker-compose.prod.yml up -d

echo "=== alembic upgrade ==="
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

echo "=== seed zones and pricing (idempotent) ==="
docker compose -f docker-compose.prod.yml exec backend python -m app.db.seed

echo "=== Готово ==="
