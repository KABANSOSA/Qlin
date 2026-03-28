# QLIN CRM

Отдельное веб-приложение для менеджеров: список всех заявок (заказов) с контактами клиентов. Работает с тем же FastAPI-бэкендом, что и сайт `qlin.pro`.

## Требования

- Учётная запись с ролью **`admin`** в БД (тот же логин/пароль, что на сайте, если пользователь — админ).
- В переменной **`CORS_ORIGINS`** бэкенда должен быть origin CRM, например `https://crm.qlin.pro` (и при локальной разработке `http://localhost:3001`).

Пример для `.env` на сервере с бэкендом:

```env
CORS_ORIGINS=https://qlin.pro,https://www.qlin.pro,https://crm.qlin.pro,http://localhost:3001
```

## Локальный запуск

Из корня репозитория:

```bash
cd crm
cp .env.example .env
# В .env: NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

Откройте http://localhost:3001 — вход только для `admin`.

## Продакшен (поддомен)

1. Соберите образ и поднимите контейнер (см. `docker-compose.prod.yml`, сервис `crm`).
2. В DNS: запись `A` для `crm.qlin.pro` на IP сервера.
3. В Nginx — отдельный `server` для `crm.qlin.pro`, прокси на порт CRM (например `127.0.0.1:3002`), SSL через certbot.
4. При сборке CRM передайте `NEXT_PUBLIC_API_URL=https://qlin.pro`, чтобы запросы шли на основной домен с `/api`.

## API

Используются те же эндпоинты, что и у админки сайта:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/admin/orders?status=&limit=&offset=`
