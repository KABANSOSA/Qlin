# API Документация

## Базовый URL
```
http://localhost:8000/api/v1
```

## Аутентификация

Большинство endpoints требуют JWT токен в заголовке:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Аутентификация

#### POST /auth/register
Регистрация нового пользователя.

**Request:**
```json
{
  "phone": "+79991234567",
  "email": "user@example.com",
  "first_name": "Иван",
  "last_name": "Иванов",
  "password": "securepassword123",
  "telegram_id": 123456789
}
```

**Response:**
```json
{
  "id": "uuid",
  "phone": "+79991234567",
  "email": "user@example.com",
  "first_name": "Иван",
  "last_name": "Иванов",
  "role": "customer",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### POST /auth/login
Вход в систему.

**Request:**
```json
{
  "phone": "+79991234567",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "access_token": "jwt_token",
  "refresh_token": "jwt_refresh_token",
  "token_type": "bearer"
}
```

#### POST /auth/refresh
Обновление access token.

**Request:**
```json
{
  "refresh_token": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "access_token": "new_jwt_token",
  "refresh_token": "new_jwt_refresh_token",
  "token_type": "bearer"
}
```

#### GET /auth/me
Получить информацию о текущем пользователе.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "phone": "+79991234567",
  "email": "user@example.com",
  "first_name": "Иван",
  "last_name": "Иванов",
  "role": "customer",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Заказы

#### POST /orders
Создать новый заказ.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "zone_id": "uuid",
  "address": "г. Москва, ул. Примерная, д. 1",
  "address_lat": 55.7558,
  "address_lon": 37.6173,
  "apartment": "12",
  "entrance": "1",
  "floor": 3,
  "intercom": "12#",
  "cleaning_type": "regular",
  "rooms_count": 2,
  "bathrooms_count": 1,
  "area_sqm": 50.5,
  "has_pets": false,
  "has_balcony": true,
  "special_instructions": "Осторожно с хрупкими предметами",
  "scheduled_at": "2024-01-15T14:00:00Z"
}
```

**Response:**
```json
{
  "id": "uuid",
  "order_number": "ORD-20240101-ABCD",
  "customer_id": "uuid",
  "cleaner_id": null,
  "zone_id": "uuid",
  "address": "г. Москва, ул. Примерная, д. 1",
  "status": "pending",
  "total_price": "2500.00",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### GET /orders
Получить список заказов текущего пользователя.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (optional): Фильтр по статусу
- `limit` (optional, default: 50): Количество записей
- `offset` (optional, default: 0): Смещение

**Response:**
```json
[
  {
    "id": "uuid",
    "order_number": "ORD-20240101-ABCD",
    "status": "pending",
    "address": "г. Москва, ул. Примерная, д. 1",
    "total_price": "2500.00",
    "scheduled_at": "2024-01-15T14:00:00Z"
  }
]
```

#### GET /orders/{order_id}
Получить заказ по ID.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "order_number": "ORD-20240101-ABCD",
  "customer_id": "uuid",
  "cleaner_id": "uuid",
  "status": "assigned",
  "address": "г. Москва, ул. Примерная, д. 1",
  "cleaning_type": "regular",
  "rooms_count": 2,
  "total_price": "2500.00",
  "scheduled_at": "2024-01-15T14:00:00Z",
  "started_at": null,
  "completed_at": null
}
```

#### PATCH /orders/{order_id}
Обновить заказ (только pending заказы).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "address": "Новый адрес",
  "scheduled_at": "2024-01-16T14:00:00Z"
}
```

#### POST /orders/{order_id}/cancel
Отменить заказ.

**Headers:**
```
Authorization: Bearer <access_token>
```

### Webhooks (для Telegram бота)

#### POST /webhooks/telegram
Webhook для событий от Telegram бота.

**Headers:**
```
X-Telegram-Secret: <webhook_secret>
```

**Request:**
```json
{
  "event_type": "order_accept",
  "order_id": "uuid",
  "cleaner_id": "uuid",
  "metadata": {
    "telegram_message_id": 123
  },
  "secret": "webhook_secret"
}
```

**Event Types:**
- `order_accept`: Уборщик принял заказ
- `order_start`: Уборщик начал работу
- `order_complete`: Уборщик завершил работу
- `order_cancel`: Заказ отменен

**Response:**
```json
{
  "status": "ok",
  "order_id": "uuid",
  "order_status": "assigned"
}
```

### Пользователи

#### GET /users/me
Получить профиль текущего пользователя.

#### PATCH /users/me
Обновить профиль текущего пользователя.

**Request:**
```json
{
  "email": "newemail@example.com",
  "first_name": "Новое имя"
}
```

### Админ панель

#### GET /admin/orders
Получить все заказы (только для админов).

**Query Parameters:**
- `status` (optional): Фильтр по статусу
- `limit` (optional): Количество записей
- `offset` (optional): Смещение

#### GET /admin/users
Получить всех пользователей (только для админов).

**Query Parameters:**
- `role` (optional): Фильтр по роли
- `limit` (optional): Количество записей
- `offset` (optional): Смещение

## Статусы заказов

- `pending`: Ожидает назначения уборщика
- `assigned`: Назначен уборщику
- `in_progress`: В работе
- `completed`: Завершен
- `cancelled`: Отменен
- `paid`: Оплачен

## Коды ошибок

- `400`: Неверный запрос
- `401`: Не авторизован
- `403`: Недостаточно прав
- `404`: Не найдено
- `500`: Внутренняя ошибка сервера
