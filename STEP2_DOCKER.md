# 🐳 ШАГ 2: Запуск Docker - Подробная инструкция

## Проверка перед запуском

### 1. Убедитесь, что Docker запущен

Откройте PowerShell и выполните:

```powershell
docker --version
```

**Ожидаемый результат:**
```
Docker version 24.x.x, build xxxxx
```

**Если ошибка "docker не найден":**
- Установите Docker Desktop: https://www.docker.com/products/docker-desktop
- После установки перезапустите компьютер
- Запустите Docker Desktop (иконка в трее должна быть зеленая)

### 2. Проверьте, что вы в правильной папке

```powershell
pwd
```

Должно показать:
```
C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO
```

Если нет, перейдите в папку:
```powershell
cd "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO"
```

### 3. Проверьте наличие docker-compose.yml

```powershell
Test-Path docker-compose.yml
```

Должно вернуть: `True`

## Запуск Docker Compose

### Вариант 1: Запуск в фоновом режиме (рекомендуется)

```powershell
docker-compose up -d
```

**Что происходит:**
- `-d` означает "detached" - контейнеры запускаются в фоне
- Docker скачает необходимые образы (если их нет)
- Создаст и запустит 5 контейнеров:
  - `qlinpro_postgres` - база данных
  - `qlinpro_redis` - кеш и очереди
  - `qlinpro_backend` - API сервер
  - `qlinpro_celery` - фоновые задачи
  - `qlinpro_frontend` - веб-интерфейс

**Время выполнения:** 2-5 минут при первом запуске (скачивание образов)

### Вариант 2: Запуск с выводом логов (для отладки)

```powershell
docker-compose up
```

Это покажет все логи в реальном времени. Нажмите `Ctrl+C` для остановки.

## Проверка статуса

### 1. Проверьте, что все контейнеры запущены

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

**Все должны быть в статусе "Up"!**

### 2. Проверьте логи (если что-то не работает)

```powershell
# Все логи
docker-compose logs

# Логи конкретного сервиса
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Логи в реальном времени
docker-compose logs -f backend
```

## Пошаговая проверка каждого сервиса

### 1. PostgreSQL (база данных)

```powershell
docker-compose exec postgres psql -U qlinpro -d qlinpro -c "SELECT version();"
```

**Ожидаемый результат:** версия PostgreSQL

**Если ошибка:** подождите 10-20 секунд и попробуйте снова (БД может еще запускаться)

### 2. Redis

```powershell
docker-compose exec redis redis-cli ping
```

**Ожидаемый результат:** `PONG`

### 3. Backend API

Откройте в браузере: http://localhost:8000

Или проверьте через PowerShell:
```powershell
curl http://localhost:8000
```

**Ожидаемый результат:**
```json
{"status":"ok","message":"QLINPRO API","version":"1.0.0"}
```

### 4. Frontend

Откройте в браузере: http://localhost:3000

Должна открыться главная страница с текстом "QLINPRO"

## Решение проблем

### Проблема 1: Порты уже заняты

**Ошибка:**
```
Error: bind: address already in use
```

**Решение:**

1. Проверьте, что использует порт:
```powershell
# Проверка порта 8000
netstat -ano | findstr :8000

# Проверка порта 3000
netstat -ano | findstr :3000
```

2. Остановите процесс или измените порты в `docker-compose.yml`:
```yaml
# В docker-compose.yml измените:
ports:
  - "8001:8000"  # вместо 8000:8000
  - "3001:3000"  # вместо 3000:3000
```

### Проблема 2: Docker не запускается

**Ошибка:**
```
Cannot connect to the Docker daemon
```

**Решение:**

1. Убедитесь, что Docker Desktop запущен
2. Проверьте в трее (правый нижний угол) - иконка Docker должна быть зеленая
3. Перезапустите Docker Desktop

### Проблема 3: Контейнеры падают (Exit 1)

**Проверьте логи:**
```powershell
docker-compose logs backend
```

**Частые причины:**
- Не создан файл `.env` или неправильные переменные
- Порт занят
- Недостаточно памяти

**Решение:**
```powershell
# Пересоздайте контейнеры
docker-compose down
docker-compose up -d

# Или пересоберите образы
docker-compose build --no-cache
docker-compose up -d
```

### Проблема 4: Медленная работа

**Причины:**
- Первый запуск (скачивание образов)
- Недостаточно ресурсов

**Решение:**
- Подождите 5-10 минут при первом запуске
- Увеличьте память для Docker Desktop (Settings → Resources → Memory)

### Проблема 5: Backend не отвечает

```powershell
# Проверьте логи
docker-compose logs backend

# Перезапустите backend
docker-compose restart backend

# Проверьте, что .env файл создан
Test-Path .env
```

### Проблема 6: Frontend не компилируется

```powershell
# Проверьте логи
docker-compose logs frontend

# Пересоздайте frontend контейнер
docker-compose stop frontend
docker-compose rm -f frontend
docker-compose up -d frontend
```

## Полезные команды

### Остановить все контейнеры
```powershell
docker-compose stop
```

### Остановить и удалить контейнеры
```powershell
docker-compose down
```

### Перезапустить конкретный сервис
```powershell
docker-compose restart backend
docker-compose restart frontend
```

### Просмотреть использование ресурсов
```powershell
docker stats
```

### Очистить все (удалит данные!)
```powershell
docker-compose down -v
```

## Проверочный чеклист

После выполнения шага 2 проверьте:

- [ ] `docker-compose ps` показывает все 5 сервисов в статусе "Up"
- [ ] http://localhost:8000 открывается и показывает JSON ответ
- [ ] http://localhost:3000 открывается и показывает веб-сайт
- [ ] http://localhost:8000/docs открывает Swagger документацию
- [ ] Логи не показывают критических ошибок

## Следующий шаг

После успешного запуска Docker переходите к **ШАГ 3**: Инициализация базы данных

```powershell
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m app.db.seed
```

---

**Если что-то не работает, покажите мне вывод команды:**
```powershell
docker-compose ps
docker-compose logs backend
```
