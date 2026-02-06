# 🚀 Запуск проекта QLINPRO

## Текущий статус
✅ Docker Desktop запущен и работает
✅ Engine running
✅ Готов к запуску проекта

## Шаг 1: Откройте PowerShell в папке проекта

1. Нажмите `Win + R`
2. Введите: `powershell`
3. Нажмите Enter

4. Перейдите в папку проекта:
```powershell
cd "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO"
```

## Шаг 2: Проверьте наличие файлов

Убедитесь, что есть необходимые файлы:

```powershell
# Проверка docker-compose.yml
Test-Path docker-compose.yml

# Проверка .env файла
Test-Path .env
```

Если `.env` файла нет, создайте его (см. ШАГ 1 из START_HERE.md)

## Шаг 3: Запустите проект

Выполните команду:

```powershell
docker-compose up -d
```

**Что происходит:**
- Docker скачает необходимые образы (при первом запуске)
- Создаст и запустит 5 контейнеров:
  - PostgreSQL (база данных)
  - Redis (кеш)
  - Backend (API сервер)
  - Celery (фоновые задачи)
  - Frontend (веб-интерфейс)

**Время выполнения:** 2-5 минут при первом запуске

## Шаг 4: Проверьте статус контейнеров

```powershell
docker-compose ps
```

**Ожидаемый результат:**
```
NAME                  STATUS              PORTS
qlinpro_backend      Up X minutes         0.0.0.0:8000->8000/tcp
qlinpro_celery       Up X minutes         
qlinpro_frontend     Up X minutes         0.0.0.0:3000->3000/tcp
qlinpro_postgres     Up X minutes         0.0.0.0:5432->5432/tcp
qlinpro_redis        Up X minutes         0.0.0.0:6379->6379/tcp
```

Все должны быть в статусе **"Up"**!

## Шаг 5: Проверьте работу сервисов

### Backend API
Откройте в браузере: **http://localhost:8000**

Должен показать:
```json
{"status":"ok","message":"QLINPRO API","version":"1.0.0"}
```

### API Документация
Откройте: **http://localhost:8000/docs**

Должна открыться Swagger документация

### Frontend
Откройте: **http://localhost:3000**

Должна открыться главная страница с текстом "QLINPRO"

## Шаг 6: Инициализация базы данных

После успешного запуска контейнеров:

```powershell
# Применить миграции
docker-compose exec backend alembic upgrade head

# Загрузить начальные данные
docker-compose exec backend python -m app.db.seed
```

## Просмотр логов

Если что-то не работает, проверьте логи:

```powershell
# Все логи
docker-compose logs

# Логи конкретного сервиса
docker-compose logs backend
docker-compose logs frontend

# Логи в реальном времени
docker-compose logs -f backend
```

## Остановка проекта

Чтобы остановить все контейнеры:

```powershell
docker-compose stop
```

Чтобы остановить и удалить контейнеры:

```powershell
docker-compose down
```

## Перезапуск проекта

```powershell
docker-compose restart
```

Или перезапустить конкретный сервис:

```powershell
docker-compose restart backend
docker-compose restart frontend
```

## Решение проблем

### Проблема: Контейнеры не запускаются

**Проверьте логи:**
```powershell
docker-compose logs backend
```

**Частые причины:**
- Не создан файл `.env`
- Неправильные переменные в `.env`
- Порты заняты

### Проблема: Backend не отвечает

```powershell
# Перезапустите backend
docker-compose restart backend

# Проверьте логи
docker-compose logs -f backend
```

### Проблема: Frontend не компилируется

```powershell
# Пересоздайте frontend контейнер
docker-compose stop frontend
docker-compose rm -f frontend
docker-compose up -d frontend
```

### Проблема: База данных не подключается

```powershell
# Подождите 10 секунд и попробуйте снова
Start-Sleep -Seconds 10
docker-compose exec backend alembic upgrade head
```

## Чеклист успешного запуска

- [ ] `docker-compose ps` показывает все 5 сервисов в статусе "Up"
- [ ] http://localhost:8000 открывается и показывает JSON
- [ ] http://localhost:3000 открывается и показывает веб-сайт
- [ ] http://localhost:8000/docs открывает Swagger документацию
- [ ] Миграции применены успешно
- [ ] Начальные данные загружены

## Следующие шаги

После успешного запуска:

1. ✅ Проект запущен
2. ⏭️ Создайте первого пользователя через API
3. ⏭️ Настройте интеграцию с Telegram ботом
4. ⏭️ Начните использовать веб-интерфейс

---

**Готовы? Выполните команду:**

```powershell
cd "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO"
docker-compose up -d
```
