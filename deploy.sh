#!/bin/bash

# Скрипт для деплоя на сервер Timtweb

set -e

# Определяем команду docker-compose (новый или старый синтаксис)
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Docker Compose не найден! Установите Docker."
    exit 1
fi

echo "🚀 Начинаем деплой QLIN..."

# Проверка наличия .env
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден! Создайте его на основе .env.production"
    exit 1
fi

# Остановка старых контейнеров
echo "📦 Останавливаем старые контейнеры..."
$DOCKER_COMPOSE -f docker-compose.prod.yml down

# Сборка образов (без --no-cache и без --parallel: на маленьком диске VPS иначе «No space left on device»)
# Полная пересборка с нуля: CACHE_BUST=1 ./deploy.sh
echo "🔨 Собираем Docker образы..."
if [ "${CACHE_BUST:-0}" = "1" ]; then
  $DOCKER_COMPOSE -f docker-compose.prod.yml build --no-cache
else
  $DOCKER_COMPOSE -f docker-compose.prod.yml build
fi

# Запуск контейнеров
echo "▶️  Запускаем контейнеры..."
$DOCKER_COMPOSE -f docker-compose.prod.yml up -d

# Ожидание готовности БД
echo "⏳ Ожидаем готовности базы данных..."
sleep 10

# Применение миграций
echo "📊 Применяем миграции базы данных..."
$DOCKER_COMPOSE -f docker-compose.prod.yml exec -T backend alembic upgrade head || echo "⚠️  Миграции не применены (возможно, БД еще не готова)"

# Проверка статуса
echo "✅ Проверяем статус контейнеров..."
$DOCKER_COMPOSE -f docker-compose.prod.yml ps

echo "🎉 Деплой завершен!"
echo "📝 Проверьте логи: $DOCKER_COMPOSE -f docker-compose.prod.yml logs -f"
