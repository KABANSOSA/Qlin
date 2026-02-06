# Руководство по интеграции с Telegram ботом

## Обзор

Веб-платформа QLINPRO интегрируется с существующим Telegram ботом (@CleaningRu_bot) через REST API и webhooks. Бот **НЕ МОДИФИЦИРУЕТСЯ** - он работает как внешний клиент.

## Архитектура интеграции

```
Telegram Bot → Webhook → Backend API → Database
     ↑                                      ↓
     └─────────── API Calls ───────────────┘
```

## Шаги интеграции

### 1. Настройка Webhook в боте

Бот должен отправлять события в backend через webhook:

```python
# Пример для Python Telegram Bot
import requests

def send_webhook(event_type, order_id, cleaner_id=None, metadata=None):
    url = "http://your-backend-url/api/v1/webhooks/telegram"
    headers = {
        "X-Telegram-Secret": "your-webhook-secret",
        "Content-Type": "application/json"
    }
    data = {
        "event_type": event_type,
        "order_id": str(order_id),
        "cleaner_id": str(cleaner_id) if cleaner_id else None,
        "metadata": metadata or {},
        "secret": "your-webhook-secret"
    }
    response = requests.post(url, json=data, headers=headers)
    return response.json()
```

### 2. События от бота

Бот отправляет следующие события:

#### order_accept
Когда уборщик принимает заказ через бота:
```json
{
  "event_type": "order_accept",
  "order_id": "uuid",
  "cleaner_id": "uuid",
  "metadata": {
    "telegram_message_id": 123,
    "accepted_at": "2024-01-01T12:00:00Z"
  }
}
```

#### order_start
Когда уборщик начинает работу:
```json
{
  "event_type": "order_start",
  "order_id": "uuid",
  "cleaner_id": "uuid",
  "metadata": {
    "started_at": "2024-01-01T14:00:00Z"
  }
}
```

#### order_complete
Когда уборщик завершает работу:
```json
{
  "event_type": "order_complete",
  "order_id": "uuid",
  "cleaner_id": "uuid",
  "metadata": {
    "completed_at": "2024-01-01T16:00:00Z",
    "photos": ["url1", "url2"]
  }
}
```

#### order_cancel
Когда заказ отменяется:
```json
{
  "event_type": "order_cancel",
  "order_id": "uuid",
  "cleaner_id": "uuid",
  "metadata": {
    "reason": "Customer cancelled",
    "cancelled_at": "2024-01-01T13:00:00Z"
  }
}
```

### 3. Получение данных из Backend

Бот может получать данные через API:

#### Получить заказ
```python
import requests

def get_order(order_id, token):
    url = f"http://your-backend-url/api/v1/orders/{order_id}"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    return response.json()
```

#### Получить список доступных заказов
```python
def get_available_orders(token):
    url = "http://your-backend-url/api/v1/orders"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"status": "pending"}
    response = requests.get(url, headers=headers, params=params)
    return response.json()
```

### 4. Уведомления уборщикам

Backend автоматически создает уведомления в БД при создании заказа. Бот может:

1. **Polling**: Периодически запрашивать новые заказы через API
2. **Webhook от Backend**: Backend может отправлять webhook боту (если бот поддерживает)

### 5. Создание заказа из бота

Если клиент создает заказ через бота, бот должен отправить данные в backend:

```python
def create_order_from_bot(order_data, customer_telegram_id):
    # 1. Получить или создать пользователя
    user = get_or_create_user_by_telegram_id(customer_telegram_id)
    
    # 2. Создать заказ через API
    url = "http://your-backend-url/api/v1/orders"
    headers = {
        "Authorization": f"Bearer {user_token}",
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=order_data, headers=headers)
    return response.json()
```

### 6. Безопасность

#### Webhook Secret
Всегда проверяйте webhook secret:
```python
WEBHOOK_SECRET = "your-secure-secret"

def verify_webhook(secret):
    return secret == WEBHOOK_SECRET
```

#### JWT Tokens
Для API вызовов используйте JWT токены:
```python
# Получить токен для бота (service account)
def get_bot_token():
    # Создать специального пользователя с ролью "bot"
    # Или использовать отдельный механизм аутентификации
    pass
```

### 7. Обработка ошибок

Всегда обрабатывайте ошибки от backend:

```python
try:
    response = requests.post(webhook_url, json=data, headers=headers)
    response.raise_for_status()
except requests.exceptions.RequestException as e:
    logger.error(f"Webhook failed: {e}")
    # Retry logic or fallback
```

### 8. Тестирование

1. **Локальное тестирование**:
   - Запустите backend: `docker-compose up backend`
   - Используйте ngrok для публичного URL: `ngrok http 8000`
   - Настройте webhook URL в боте на ngrok URL

2. **Production**:
   - Используйте HTTPS для webhook URL
   - Настройте правильный CORS
   - Используйте сильные секреты

## Пример полного потока

1. **Клиент создает заказ через веб**:
   - Backend создает заказ в БД (status: `pending`)
   - Backend создает уведомления для уборщиков

2. **Бот получает уведомление** (через polling или webhook):
   - Бот показывает заказ уборщикам в Telegram

3. **Уборщик принимает заказ через бота**:
   - Бот отправляет webhook: `order_accept`
   - Backend обновляет статус: `pending` → `assigned`
   - Backend уведомляет клиента

4. **Уборщик начинает работу**:
   - Бот отправляет webhook: `order_start`
   - Backend обновляет статус: `assigned` → `in_progress`

5. **Уборщик завершает работу**:
   - Бот отправляет webhook: `order_complete`
   - Backend обновляет статус: `in_progress` → `completed`

6. **Клиент оплачивает**:
   - Через веб или бота
   - Backend обновляет статус: `completed` → `paid`

## Важные замечания

- ✅ Бот НЕ модифицируется - только добавляются вызовы API
- ✅ Все данные хранятся в общей БД
- ✅ State machine гарантирует правильные переходы статусов
- ✅ Redis locks предотвращают race conditions
- ✅ Webhook secret защищает от несанкционированных запросов
