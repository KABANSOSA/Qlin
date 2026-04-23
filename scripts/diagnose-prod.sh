#!/usr/bin/env bash
# Запуск на сервере из каталога с docker-compose.prod.yml:
#   chmod +x scripts/diagnose-prod.sh && ./scripts/diagnose-prod.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DC="docker compose -f docker-compose.prod.yml"

echo "=== 1. Контейнеры ==="
eval "$DC ps -a" || true

echo ""
echo "=== 2. Backend: /health (с хоста, порт 8000) ==="
if curl -fsS -m 5 "http://127.0.0.1:8000/health" 2>/dev/null; then
  echo ""
else
  echo "ОШИБКА: нет ответа от http://127.0.0.1:8000/health — бэкенд не слушает или не запущен."
fi

echo ""
echo "=== 3. Frontend (порт 3000) ==="
code=$(curl -sS -o /dev/null -w "%{http_code}" -m 5 "http://127.0.0.1:3000/" || echo "000")
echo "HTTP $code (ожидается 200 или 3xx)"
if [[ "$code" != "200" && "$code" != "307" && "$code" != "308" && "$code" != "301" && "$code" != "302" ]]; then
  echo "Проверьте: контейнер qlin_frontend и логи: $DC logs frontend --tail 80"
fi

echo ""
echo "=== 4. CRM (порт 3002) ==="
code=$(curl -sS -o /dev/null -w "%{http_code}" -m 5 "http://127.0.0.1:3002/" || echo "000")
echo "HTTP $code"

echo ""
echo "=== 5. API снаружи (через nginx) ==="
echo "  curl -sSI https://qlin.pro/api/v1/auth/me | head -5   # ожидается 401 JSON от FastAPI"
echo "  curl -sSI https://qlin.pro/docs | head -3           # Swagger бэкенда (если location /docs в nginx)"
echo "Важно: https://qlin.pro/health даст HTML от Next.js, если нет отдельного location — см. nginx-qlin-main.example.conf"

echo ""
echo "=== 6. Последние строки логов backend (ошибки старта / БД) ==="
eval "$DC logs backend --tail 40" 2>/dev/null || true

echo ""
echo "=== Подсказки ==="
echo "- Если backend в Restarting: смотрите логи (SECRET_KEY, DATABASE_URL, миграции)."
echo "- Сайт без API: в nginx для qlin.pro должен быть location /api/ → 127.0.0.1:8000 (см. nginx-qlin-main.example.conf)."
echo "- CRM без API: CORS + запросы на https://qlin.pro/api/v1; в .env задайте CORS_ORIGINS с https://crm.qlin.pro; пересоберите backend."
echo "- SSL: certbot / срок сертификата; nginx -t"
