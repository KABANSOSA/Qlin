# 📋 Все команды для запуска проекта

## Шаг 1: Откройте PowerShell

Нажмите `Win + X` и выберите "Windows PowerShell" или "Терминал"

## Шаг 2: Перейдите в папку проекта

```powershell
cd "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO"
```

## Шаг 3: Проверьте наличие файла .env

```powershell
Test-Path .env
```

Если вернет `False`, создайте файл `.env` (см. ниже)

## Шаг 4: Создайте файл .env (если его нет)

Создайте файл `.env` в папке проекта со следующим содержимым:

```env
SECRET_KEY=ваш-случайный-ключ-минимум-32-символа-например-abc123xyz789def456
TELEGRAM_BOT_TOKEN=ваш-токен-от-botfather
TELEGRAM_WEBHOOK_SECRET=любой-секрет-для-webhook

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

**Важно:** Замените первые 3 строки на реальные значения!

## Шаг 5: Запустите Docker Compose

```powershell
docker-compose up -d
```

Подождите 2-5 минут, пока все контейнеры запустятся.

## Шаг 6: Проверьте статус контейнеров

```powershell
docker-compose ps
```

Должны быть запущены все 5 сервисов в статусе "Up".

## Шаг 7: Примените миграции БД

```powershell
docker-compose exec backend alembic upgrade head
```

## Шаг 8: Загрузите начальные данные

```powershell
docker-compose exec backend python -m app.db.seed
```

## Шаг 9: Откройте в браузере

- **Веб-сайт**: http://localhost:3000
- **API документация**: http://localhost:8000/docs

---

## Полезные команды

### Просмотр логов
```powershell
docker-compose logs backend
docker-compose logs frontend
```

### Перезапуск сервиса
```powershell
docker-compose restart backend
docker-compose restart frontend
```

### Остановка всех сервисов
```powershell
docker-compose stop
```

### Остановка и удаление контейнеров
```powershell
docker-compose down
```

### Пересоздание БД (удалит все данные!)
```powershell
docker-compose exec postgres psql -U qlinpro -d qlinpro -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m app.db.seed
```

---

## Если что-то не работает

### Проблема: Контейнеры не запускаются
```powershell
docker-compose logs
```

### Проблема: Backend не отвечает
```powershell
docker-compose restart backend
docker-compose logs backend
```

### Проблема: Frontend не компилируется
```powershell
docker-compose restart frontend
docker-compose logs frontend
```

### Проблема: База данных не подключается
```powershell
docker-compose restart postgres
Start-Sleep -Seconds 10
docker-compose exec backend alembic upgrade head
```
