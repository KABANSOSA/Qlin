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

## Если на crm.qlin.pro видите «404 | This page could not be found»

1. Откройте **`https://crm.qlin.pro/login`** — у корня `/` без токена клиент редиректит на вход; при сбое кэша/JS сначала зайдите сюда вручную.
2. В Nginx для `crm.qlin.pro` убедитесь, что **`proxy_pass` идёт на порт CRM (например 3002)**, а не на порт основного Next-сайта (часто тоже 3000 на хосте).
3. После деплоя пересоздайте контейнер CRM:  
   `docker compose -f docker-compose.prod.yml up -d --force-recreate crm`
4. Проверка из SSH:  
   `docker exec qlin_crm wget -qO- http://127.0.0.1:3000/login | head -c 300` — в ответе должен быть HTML со словом login / QLIN.

## API

Используются те же эндпоинты, что и у админки сайта:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/admin/orders?status=&limit=&offset=`
