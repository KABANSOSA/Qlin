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
echo "=== 5. API снаружи (через nginx, только location /api/) ==="
echo "  curl -sS https://qlin.pro/api/v1/health            # JSON БД/Redis (как GET /health на бэкенде)"
echo "  curl -sSI https://qlin.pro/api/v1/auth/me | head -5   # 401 без токена — нормально"
echo "https://qlin.pro/health без отдельного location в nginx — HTML от Next.js; используйте /api/v1/health"

echo ""
echo "=== 5b. CORS для CRM (OPTIONS с Origin поддомена) ==="
echo "Ожидается 200/204 и заголовок access-control-allow-origin: https://crm.qlin.pro"
curl -sSI -m 10 -X OPTIONS "https://qlin.pro/api/v1/auth/me" \
  -H "Origin: https://crm.qlin.pro" \
  -H "Access-Control-Request-Method: GET" 2>/dev/null | head -25 || echo "curl failed (сеть / SSL / nginx)"

echo ""
echo "=== 6. Последние строки логов backend (ошибки старта / БД) ==="
eval "$DC logs backend --tail 40" 2>/dev/null || true

echo ""
echo "=== Подсказки ==="
echo "- Если backend в Restarting: смотрите логи (SECRET_KEY, DATABASE_URL, миграции)."
echo "- Сайт без API: в nginx для qlin.pro должен быть location /api/ → 127.0.0.1:8000 (см. nginx-qlin-main.example.conf)."
echo "- CRM «Нет связи с API»: см. блок 5b (CORS). Не оставляйте CORS_ORIGINS= пустым в .env. Nginx: crm.qlin.pro → 127.0.0.1:3002 (см. nginx-crm-subdomain.example.conf)."
echo "- SSL: certbot / срок сертификата; nginx -t"
