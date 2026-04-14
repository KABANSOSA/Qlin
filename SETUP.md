# QLINPRO — настройка с нуля

## Что установить на компьютер

1. **Git** (если клонируете репозиторий)
2. **Docker Desktop** (Windows/macOS) или Docker + Docker Compose на Linux
3. **Node.js 20+** (для фронта и мобильного приложения без Docker)
4. **npm** (идёт с Node)

---

## 1. Получить код

Откройте папку проекта, например:

`C:\Users\<ваш_пользователь>\OneDrive\Рабочий стол\QLINPRO`

Или клонируйте репозиторий и перейдите в каталог.

---

## 2. Файл `.env` в корне проекта (для Docker)

Бэкенд требует **обязательные** переменные. Создайте файл **`.env`** в **корне** `QLINPRO` (рядом с `docker-compose.yml`).

**Минимум для локальной разработки** (можно скопировать и подправить):

```env
SECRET_KEY=локальная-случайная-строка-минимум-32-символа
TELEGRAM_BOT_TOKEN=000000:placeholder
TELEGRAM_WEBHOOK_SECRET=local-dev-secret
```

Полный список полей см. в **`.env.example`** (прод и дополнительные сервисы).

---

## 3. Запуск бэкенда и БД (Docker)

В **cmd** или **PowerShell** из корня `QLINPRO`:

```bat
cd /d "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO"
docker compose up -d postgres redis backend
```

Дождитесь готовности контейнеров. Затем миграции:

```bat
docker compose exec backend alembic upgrade head
```

Проверка: в браузере откройте **http://localhost:8000/docs** — Swagger API.

Если порт 8000 занят — измените проброс в `docker-compose.yml` или остановите другой сервис.

---

## 4. Запуск сайта (frontend) локально

В отдельном терминале:

```bat
cd /d "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO\frontend"
npm install
npm run dev
```

Обычно сайт: **http://localhost:3000** (см. вывод в консоли).

Переменные окружения фронта при необходимости — в `frontend` по документации проекта.

---

## 5. Мобильное приложение (Expo)

```bat
cd /d "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO\mobile"
copy .env.example .env
notepad .env
```

В `.env` укажите API:

| Сценарий | Значение `EXPO_PUBLIC_API_URL` |
|----------|-------------------------------|
| Эмулятор Android на этом ПК | `http://10.0.2.2:8000/api/v1` |
| Телефон в той же Wi‑Fi сети | `http://<IP_вашего_ПК>:8000/api/v1` (узнайте `ipconfig`) |
| Боевой сервер | `https://qlin.pro/api/v1` |

Дальше:

```bat
npm install
npx expo start
```

Откройте в **Expo Go** по QR или нажмите `a` / `i` для эмулятора.

---

## 6. Частые проблемы

| Симптом | Что проверить |
|--------|----------------|
| Backend не стартует | Есть ли `.env` в корне с `SECRET_KEY`, `TELEGRAM_*` |
| Docker не запускается | Запущен ли Docker Desktop |
| Приложение не видит API | Один Wi‑Fi с ПК, фаервол Windows, верный `EXPO_PUBLIC_API_URL` |
| `npm install` ошибки в mobile | `npm install --legacy-peer-deps` |

---

## 7. Продакшен (сервер)

См. **`RELEASE.md`** и **`scripts/deploy-prod.cmd`** / **`scripts/deploy-prod.sh`**.

---

## 8. Полезные команды

Остановить контейнеры:

```bat
docker compose down
```

Логи бэкенда:

```bat
docker compose logs -f backend
```
