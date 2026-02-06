# 🎯 НАЧНИТЕ ОТСЮДА - Конкретные шаги

## ✅ ШАГ 1: Создайте файл .env

Создайте файл `.env` в корне проекта со следующим содержимым:

```env
# Обязательно измените эти 3 строки:

SECRET_KEY=ваш-случайный-ключ-минимум-32-символа-например-abc123xyz789
TELEGRAM_BOT_TOKEN=ваш-токен-от-botfather
TELEGRAM_WEBHOOK_SECRET=любой-секрет-для-webhook

# Остальное можно оставить как есть:
DEBUG=false
POSTGRES_USER=qlinpro
POSTGRES_PASSWORD=qlinpro
POSTGRES_DB=qlinpro
DATABASE_URL=postgresql://qlinpro:qlinpro@postgres:5432/qlinpro
REDIS_URL=redis://redis:6379/0
REDIS_CACHE_TTL=3600
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
PAYMENT_PROVIDER=yookassa
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
LOG_LEVEL=INFO
```

**Как получить TELEGRAM_BOT_TOKEN:**
1. Откройте Telegram
2. Найдите бота @BotFather
3. Отправьте команду `/newbot` или `/token`
4. Скопируйте токен в файл .env

## ✅ ШАГ 2: Запустите Docker Compose

Откройте PowerShell в папке проекта и выполните:

```powershell
docker-compose up -d
```

Подождите 1-2 минуты, пока все контейнеры запустятся.

## ✅ ШАГ 3: Проверьте статус

```powershell
docker-compose ps
```

Должны быть запущены: postgres, redis, backend, celery, frontend

## ✅ ШАГ 4: Инициализируйте базу данных

```powershell
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m app.db.seed
```

## ✅ ШАГ 5: Откройте в браузере

- **Веб-сайт**: http://localhost:3000
- **API документация**: http://localhost:8000/docs

## 🎉 Готово!

Теперь вы можете:
1. Создавать заказы через веб-интерфейс
2. Использовать API для интеграции с ботом
3. Управлять заказами через админ-панель

---

## 📋 Если что-то не работает:

### Проблема: Docker не запускается
```powershell
# Проверьте логи
docker-compose logs

# Перезапустите
docker-compose restart
```

### Проблема: База данных не подключается
```powershell
# Подождите 10 секунд и попробуйте снова
Start-Sleep -Seconds 10
docker-compose exec backend alembic upgrade head
```

### Проблема: Порты заняты
Измените порты в `docker-compose.yml`:
- 8000 → другой порт для backend
- 3000 → другой порт для frontend

---

**Подробная инструкция**: [QUICK_START.md](./QUICK_START.md)
