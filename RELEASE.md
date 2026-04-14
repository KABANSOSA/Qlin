# Релиз QLIN (сервер + веб + мобильное приложение)

## 1. Сервер (Docker)

На машине с репозиторием:

```bash
cd /path/to/QLINPRO
cp .env.example .env
# Заполните POSTGRES_PASSWORD, SECRET_KEY, TELEGRAM_*, YOOKASSA_*, и т.д.
nano .env
```

Деплой одной командой:

- **Linux / сервер:** `chmod +x scripts/deploy-prod.sh && ./scripts/deploy-prod.sh`
- **Windows (cmd):** `scripts\deploy-prod.cmd`

Или вручную:

```bash
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
docker compose -f docker-compose.prod.yml exec backend python -m app.db.seed
```

Сид **идемпотентен** (повторный запуск не дублирует зоны): без него заказы падают с текстом «В базе нет зон обслуживания».

Проверка: `https://ваш-домен/api/v1/docs` (или через nginx `/api/v1/docs`).

### CRM (crm.qlin.pro)

**Первый вход (пароль сид-админа `+79999999999`):** задать пароль одной командой.

Если образ уже с **новым** кодом репозитория:

```bash
cd /root/QLINPRO
docker compose -f docker-compose.prod.yml exec backend \
  python -m app.db.set_crm_admin_password 'ВашПарольОт8Символов'
```

Если пишет **`No module named app.db.set_crm_admin_password`** (старый образ без этого файла) — скрипт из репозитория **не требует** нового кода внутри образа, только уже установленные `app.*`:

```bash
cd /root/QLINPRO
chmod +x scripts/set-crm-admin-password.sh
./scripts/set-crm-admin-password.sh 'ВашПарольОт8Символов'
```

Потом на **crm.qlin.pro**: телефон **`+79999999999`**, этот пароль.

После `git pull` имеет смысл пересобрать backend: `docker compose -f docker-compose.prod.yml build backend && docker compose -f docker-compose.prod.yml up -d backend`.

Альтернатива: в `.env` задать **`SEED_ADMIN_PASSWORD`**, выполнить **`docker compose -f docker-compose.prod.yml up -d backend`** (чтобы переменная попала в контейнер), затем **`python -m app.db.seed`**.

Дальше в CRM раздел **«Админы»** — добавление коллег.

Аккаунт **клиента** с публичного сайта в CRM не пускается (нужна роль `admin`).

### ЮKassa

1. В личном кабинете ЮKassa укажите HTTP-уведомления на URL:  
   `https://qlin.pro/api/v1/webhooks/yookassa`  
   (замените домен на свой, путь должен совпадать).

2. В `.env` заданы `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY` (см. `.env.example`).

### Nginx

Убедитесь, что `/api` проксируется на бэкенд `:8000`, а фронт и CRM — на свои контейнеры (как у вас уже настроено).

---

## 2. Мобильное приложение (EAS)

Один раз: [Expo](https://expo.dev) → проект, локально:

```bash
cd mobile
npm install
npx eas-cli login
npx eas init
```

После `eas init` в `app.json` появится `extra.eas.projectId` — нужно для пушей и стабильных билдов.

Переменные для сборки (в `mobile/.env` или секреты EAS):

- `EXPO_PUBLIC_API_URL=https://qlin.pro/api/v1`

Сборки:

```bash
cd mobile
npm run build:android
npm run build:ios
```

Публикация в сторы:

```bash
npm run submit:android
npm run submit:ios
```

Идентификаторы в `app.json`: iOS `bundleIdentifier`, Android `package` — сейчас `pro.qlin.mobile`. При необходимости смените **до** первой публикации в стор.

---

## 3. Чеклист после выкладки

| Проверка | Действие |
|----------|----------|
| Зоны в БД | После первого деплоя или пустой БД: `docker compose -f docker-compose.prod.yml exec backend python -m app.db.seed` (уже входит в `scripts/deploy-prod.*`) |
| API | `GET /api/v1/auth/me` с токеном |
| Заказ с сайта | Создание → оплата ЮKassa |
| Заказ в приложении | Оплата открывает ЮKassa, после оплаты статус обновляется |
| Пуши | Токен в БД после логина, тестовое уведомление из кабинета Expo |

---

## 4. Откат

```bash
docker compose -f docker-compose.prod.yml down
# вернуть предыдущий образ / git checkout и снова build + up
```
