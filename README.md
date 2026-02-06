# QLINPRO - Cleaning Service Platform

Современная веб-платформа для сервиса уборки с интеграцией существующего Telegram бота.

## 🏗️ Архитектура

```
┌─────────────────┐         ┌─────────────────┐
│   Next.js Web   │────────▶│   FastAPI       │
│   (Frontend)    │  REST   │   (Backend)     │
└─────────────────┘         └────────┬────────┘
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                    ┌─────▼─────┐        ┌─────▼─────┐
                    │ PostgreSQL│        │   Redis   │
                    └───────────┘        └───────────┘
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                    ┌─────▼─────┐        ┌─────▼─────┐
                    │  Telegram │        │  Workers  │
                    │    Bot    │        │ (Celery)  │
                    └───────────┘        └───────────┘
```

## 📁 Структура проекта

```
QLINPRO/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Config, security, dependencies
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   ├── workers/     # Background tasks
│   │   └── db/          # Database setup
│   ├── alembic/         # Migrations
│   └── tests/
├── frontend/             # Next.js frontend
│   ├── app/             # App Router
│   ├── components/      # React components
│   ├── lib/             # Utilities
│   └── public/
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 Быстрый старт

### Требования
- Docker & Docker Compose
- Node.js 18+ (для локальной разработки)
- Python 3.11+ (для локальной разработки)

### Запуск

```bash
# Клонировать репозиторий
git clone <repo-url>
cd QLINPRO

# Скопировать переменные окружения
cp .env.example .env
# Отредактировать .env файл

# Запустить все сервисы
docker-compose up -d

# Применить миграции
docker-compose exec backend alembic upgrade head

# Загрузить начальные данные
docker-compose exec backend python -m app.db.seed
```

## 🔌 API Совместимость с ботом

Backend предоставляет REST API, полностью совместимое с существующим Telegram ботом:

- `/api/v1/orders` - Управление заказами
- `/api/v1/users` - Управление пользователями
- `/api/v1/cleaners` - Управление уборщиками
- `/api/v1/webhooks/telegram` - Webhook для бота

Все endpoints поддерживают те же форматы данных и логику, что и бот.

## 🧪 Тестирование

```bash
# Backend тесты
docker-compose exec backend pytest

# Frontend тесты
cd frontend && npm test

# E2E тесты
npm run test:e2e
```

## 📚 Документация

- API документация: http://localhost:8000/docs
- OpenAPI spec: http://localhost:8000/openapi.json
- API Documentation: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- Integration Guide: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- Database Schema: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🔐 Роли

- **customer** - Клиенты (веб-платформа)
- **cleaner** - Уборщики (только через бот)
- **admin** - Администраторы (веб-панель)
