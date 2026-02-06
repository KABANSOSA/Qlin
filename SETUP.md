# Инструкция по установке и запуску

## Предварительные требования

- Docker & Docker Compose
- Git

## Быстрый старт

### 1. Клонирование и настройка

```bash
# Клонировать репозиторий (если есть)
git clone <repository-url>
cd QLINPRO

# Скопировать файл с переменными окружения
cp .env.example .env

# Отредактировать .env файл
# Обязательно установите:
# - SECRET_KEY (сгенерируйте случайную строку)
# - TELEGRAM_BOT_TOKEN (токен вашего бота)
# - TELEGRAM_WEBHOOK_SECRET (секрет для webhook)
```

### 2. Запуск сервисов

```bash
# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker-compose ps
```

### 3. Инициализация базы данных

```bash
# Применить миграции
docker-compose exec backend alembic upgrade head

# Загрузить начальные данные (зоны, админ пользователь)
docker-compose exec backend python -m app.db.seed
```

### 4. Проверка работы

- Backend API: http://localhost:8000
- API документация: http://localhost:8000/docs
- Frontend: http://localhost:3000

## Разработка

### Backend (локально)

```bash
cd backend

# Создать виртуальное окружение
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows

# Установить зависимости
pip install -r requirements.txt

# Настроить переменные окружения в .env

# Запустить сервер
uvicorn app.main:app --reload
```

### Frontend (локально)

```bash
cd frontend

# Установить зависимости
npm install

# Запустить dev сервер
npm run dev
```

## Интеграция с Telegram ботом

### 1. Настройка Webhook в боте

Бот должен отправлять события в backend через endpoint:
```
POST http://your-backend-url/api/v1/webhooks/telegram
```

См. подробности в [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

### 2. Тестирование интеграции

1. Создайте заказ через веб-интерфейс
2. Проверьте, что заказ появился в БД
3. Убедитесь, что бот получил уведомление (через polling или webhook)
4. Примите заказ через бота
5. Проверьте, что статус обновился в веб-интерфейсе

## Структура проекта

```
QLINPRO/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Config, security
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── db/             # Database setup
│   ├── alembic/            # Migrations
│   └── requirements.txt
├── frontend/               # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   └── lib/               # Utilities
├── docker-compose.yml
├── .env.example
└── README.md
```

## Переменные окружения

См. `.env.example` для полного списка переменных.

**Обязательные:**
- `SECRET_KEY` - секретный ключ для JWT
- `TELEGRAM_BOT_TOKEN` - токен Telegram бота
- `TELEGRAM_WEBHOOK_SECRET` - секрет для webhook

**База данных:**
- `DATABASE_URL` - URL подключения к PostgreSQL
- `REDIS_URL` - URL подключения к Redis

## Troubleshooting

### Проблемы с подключением к БД

```bash
# Проверить статус PostgreSQL
docker-compose ps postgres

# Просмотреть логи
docker-compose logs postgres

# Пересоздать БД
docker-compose down -v
docker-compose up -d postgres
```

### Проблемы с миграциями

```bash
# Просмотреть текущую версию
docker-compose exec backend alembic current

# Откатить последнюю миграцию
docker-compose exec backend alembic downgrade -1

# Применить все миграции
docker-compose exec backend alembic upgrade head
```

### Проблемы с frontend

```bash
# Очистить кеш Next.js
cd frontend
rm -rf .next
npm run dev
```

## Production Deployment

1. Настройте production переменные окружения
2. Используйте HTTPS для всех сервисов
3. Настройте правильные CORS origins
4. Используйте сильные секреты
5. Настройте мониторинг и логирование
6. Настройте резервное копирование БД

## Поддержка

Для вопросов и проблем создайте issue в репозитории.
