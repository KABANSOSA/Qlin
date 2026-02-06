# 🚀 Быстрый старт - Пошаговая инструкция

## Шаг 1: Подготовка окружения

### 1.1 Проверьте наличие Docker
```powershell
docker --version
docker-compose --version
```

Если Docker не установлен, скачайте с https://www.docker.com/products/docker-desktop

### 1.2 Откройте терминал в папке проекта
```powershell
cd "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO"
```

## Шаг 2: Настройка переменных окружения

### 2.1 Создайте файл .env
```powershell
# Скопируйте пример
Copy-Item .env.example .env
```

### 2.2 Откройте .env в редакторе и заполните обязательные поля:

```env
# Обязательно измените эти значения:

# Сгенерируйте случайный секретный ключ (можно использовать: python -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_KEY=ваш-случайный-секретный-ключ-минимум-32-символа

# Токен вашего Telegram бота (получите у @BotFather)
TELEGRAM_BOT_TOKEN=ваш-токен-бота

# Секрет для webhook (любая случайная строка)
TELEGRAM_WEBHOOK_SECRET=ваш-секрет-для-webhook
```

**Как получить TELEGRAM_BOT_TOKEN:**
1. Откройте Telegram
2. Найдите @BotFather
3. Отправьте `/newbot` или `/token`
4. Скопируйте токен в .env файл

## Шаг 3: Запуск сервисов

### 3.1 Запустите все сервисы через Docker Compose
```powershell
docker-compose up -d
```

Это запустит:
- PostgreSQL (база данных)
- Redis (кеш и очереди)
- Backend (FastAPI)
- Frontend (Next.js)
- Celery (фоновые задачи)

### 3.2 Проверьте, что все запустилось
```powershell
docker-compose ps
```

Должны быть запущены все 5 сервисов.

### 3.3 Если есть ошибки, посмотрите логи
```powershell
# Логи всех сервисов
docker-compose logs

# Логи конкретного сервиса
docker-compose logs backend
docker-compose logs frontend
```

## Шаг 4: Инициализация базы данных

### 4.1 Примените миграции
```powershell
docker-compose exec backend alembic upgrade head
```

### 4.2 Загрузите начальные данные (зоны, админ)
```powershell
docker-compose exec backend python -m app.db.seed
```

## Шаг 5: Проверка работы

### 5.1 Откройте в браузере:

- **Frontend (веб-сайт)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Документация (Swagger)**: http://localhost:8000/docs
- **Админ-панель**: http://localhost:3000/admin (после входа как админ)

### 5.2 Проверьте API
Откройте http://localhost:8000/docs и попробуйте:
- GET `/` - должен вернуть `{"status": "ok"}`
- GET `/health` - проверка здоровья сервисов

## Шаг 6: Создание первого пользователя

### 6.1 Через API (Swagger UI)
1. Откройте http://localhost:8000/docs
2. Найдите `POST /api/v1/auth/register`
3. Нажмите "Try it out"
4. Заполните данные:
```json
{
  "phone": "+79991234567",
  "email": "admin@example.com",
  "first_name": "Admin",
  "last_name": "User",
  "password": "SecurePass123!"
}
```
5. Нажмите "Execute"

### 6.2 Или через seed скрипт (уже создан админ)
Админ пользователь уже создан через seed:
- Телефон: `+79999999999`
- Роль: `admin`

## Шаг 7: Интеграция с Telegram ботом

### 7.1 Настройте webhook в вашем боте

Ваш бот должен отправлять события на:
```
POST http://ваш-домен/api/v1/webhooks/telegram
```

**Для локальной разработки используйте ngrok:**

1. Установите ngrok: https://ngrok.com/download
2. Запустите:
```powershell
ngrok http 8000
```
3. Скопируйте HTTPS URL (например: `https://abc123.ngrok.io`)
4. В коде бота используйте: `https://abc123.ngrok.io/api/v1/webhooks/telegram`

### 7.2 Пример кода для бота (Python)

```python
import requests

def send_order_accept_webhook(order_id, cleaner_id):
    url = "http://localhost:8000/api/v1/webhooks/telegram"
    headers = {
        "X-Telegram-Secret": "ваш-секрет-из-env",
        "Content-Type": "application/json"
    }
    data = {
        "event_type": "order_accept",
        "order_id": str(order_id),
        "cleaner_id": str(cleaner_id),
        "secret": "ваш-секрет-из-env"
    }
    response = requests.post(url, json=data, headers=headers)
    return response.json()
```

Подробнее см. [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

## Шаг 8: Тестирование полного потока

### 8.1 Создайте заказ через веб
1. Откройте http://localhost:3000
2. Нажмите "Заказать уборку"
3. Заполните форму и создайте заказ

### 8.2 Проверьте в API
1. Откройте http://localhost:8000/docs
2. `GET /api/v1/orders` - должен показать ваш заказ

### 8.3 Проверьте в базе данных
```powershell
docker-compose exec postgres psql -U qlinpro -d qlinpro -c "SELECT * FROM orders;"
```

## Полезные команды

### Остановить все сервисы
```powershell
docker-compose down
```

### Перезапустить сервис
```powershell
docker-compose restart backend
```

### Просмотреть логи
```powershell
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Пересоздать базу данных (удалит все данные!)
```powershell
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m app.db.seed
```

### Очистить и пересобрать
```powershell
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Решение проблем

### Проблема: Порт уже занят
```powershell
# Проверьте, что использует порт
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# Остановите процесс или измените порты в docker-compose.yml
```

### Проблема: База данных не подключается
```powershell
# Проверьте статус PostgreSQL
docker-compose ps postgres

# Перезапустите
docker-compose restart postgres

# Подождите 10 секунд и попробуйте снова
```

### Проблема: Frontend не компилируется
```powershell
# Удалите node_modules и пересоберите
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next
npm install
```

### Проблема: Ошибки миграций
```powershell
# Откатите и примените заново
docker-compose exec backend alembic downgrade -1
docker-compose exec backend alembic upgrade head
```

## Следующие шаги

1. ✅ Проект запущен
2. ✅ База данных инициализирована
3. ✅ API работает
4. ⏭️ Настройте интеграцию с ботом
5. ⏭️ Настройте платежи (YooKassa)
6. ⏭️ Настройте production окружение

## Дополнительная документация

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Документация API
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Интеграция с ботом
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Архитектура системы
- [SETUP.md](./SETUP.md) - Подробная установка
