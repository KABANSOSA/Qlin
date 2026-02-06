#!/bin/bash

# Скрипт для деплоя на сервер Timtweb

set -e

echo "🚀 Начинаем деплой QLIN..."

# Проверка наличия .env
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден! Создайте его на основе .env.production"
    exit 1
fi

# Остановка старых контейнеров
echo "📦 Останавливаем старые контейнеры..."
docker-compose -f docker-compose.prod.yml down

# Сборка образов
echo "🔨 Собираем Docker образы..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Запуск контейнеров
echo "▶️  Запускаем контейнеры..."
docker-compose -f docker-compose.prod.yml up -d

# Ожидание готовности БД
echo "⏳ Ожидаем готовности базы данных..."
sleep 10

# Применение миграций
echo "📊 Применяем миграции базы данных..."
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head || echo "⚠️  Миграции не применены (возможно, БД еще не готова)"

# Проверка статуса
echo "✅ Проверяем статус контейнеров..."
docker-compose -f docker-compose.prod.yml ps

echo "🎉 Деплой завершен!"
echo "📝 Проверьте логи: docker-compose -f docker-compose.prod.yml logs -f"
