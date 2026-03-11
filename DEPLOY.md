# Развёртывание QLIN в общий доступ

Пошаговая инструкция для выкладки на VPS (Timeweb, любой сервер с Docker).

---

## 1. Что понадобится

- **Сервер (VPS)** с Ubuntu 20.04/22.04 и минимум 2 GB RAM.
- **Домен** (например `qlin.ru`) или IP-адрес сервера.
- **Docker** и **Docker Compose** на сервере.

---

## 2. Подготовка сервера

Подключитесь по SSH и установите Docker (если ещё не установлен):

```bash
# Установка Docker (Ubuntu)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Выйдите и зайдите по SSH снова, чтобы применилась группа
```

Установка Docker Compose (v2):

```bash
sudo apt-get update && sudo apt-get install -y docker-compose-plugin
```

---

## 3. Загрузка проекта на сервер

**Вариант А — через Git (рекомендуется):**

```bash
cd /var/www  # или любая папка
sudo mkdir -p qlin && sudo chown $USER:$USER qlin
cd qlin
git clone https://github.com/KABANSOSA/QLin.git .
# или: git clone <ваш-репозиторий> .
```

**Вариант Б — через архив:**

Соберите архив проекта на своём компьютере (без `node_modules`, без `.next`), загрузите на сервер (scp, SFTP) и распакуйте в `/var/www/qlin` (или другую папку).

---

## 4. Файл переменных окружения

В корне проекта (рядом с `docker-compose.prod.yml`) создайте файл **`.env`**:

```bash
cd /var/www/qlin
nano .env
```

Вставьте и **обязательно подставьте свои значения**:

```env
# База данных
POSTGRES_USER=qlin
POSTGRES_PASSWORD=СЛОЖНЫЙ_ПАРОЛЬ_БД
POSTGRES_DB=qlin

# Бэкенд
SECRET_KEY=длинная-случайная-строка-для-jwt
CORS_ORIGINS=https://ваш-домен.ru,https://www.ваш-домен.ru

# Telegram (если бот уже есть)
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_WEBHOOK_SECRET=любая-секретная-строка

# Фронтенд — URL, по которому браузер будет ходить к API
NEXT_PUBLIC_API_URL=https://api.ваш-домен.ru
# Или если API на том же домене за nginx: https://ваш-домен.ru/api
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=ваш-ключ-яндекс-карт

# Для sitemap/robots (опционально)
# NEXT_PUBLIC_SITE_URL=https://ваш-домен.ru
```

Важно:

- **CORS_ORIGINS** — через запятую, без пробелов, точный адрес сайта (с https).
- **NEXT_PUBLIC_API_URL** — тот URL, по которому с фронтенда будут вызываться запросы к API (должен быть доступен с браузера).

Сохраните файл (в nano: Ctrl+O, Enter, Ctrl+X).

---

## 5. Запуск через Docker

В той же папке выполните:

```bash
cd /var/www/qlin
chmod +x deploy.sh
./deploy.sh
```

Или вручную:

```bash
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
sleep 15
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
```

Проверка:

```bash
docker compose -f docker-compose.prod.yml ps
curl http://localhost:8000/health
curl http://localhost:3000
```

- Порт **3000** — фронтенд.
- Порт **8000** — бэкенд (API).

---

## 6. Доступ из интернета (nginx + HTTPS)

Чтобы открыть сайт по домену и по HTTPS, на сервере ставят nginx и проксируют запросы на контейнеры.

**Установка nginx и certbot:**

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

**Пример конфига nginx** для домена `qlin.ru` (фронт и API на одном домене):

Создайте файл:

```bash
sudo nano /etc/nginx/sites-available/qlin
```

Содержимое (замените `qlin.ru` на свой домен):

```nginx
# Редирект с www на без www
server {
    listen 80;
    server_name www.qlin.ru;
    return 301 https://qlin.ru$request_uri;
}

server {
    listen 80;
    server_name qlin.ru;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name qlin.ru;

    ssl_certificate     /etc/letsencrypt/live/qlin.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/qlin.ru/privkey.pem;

    # Фронтенд
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API бэкенда
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
        proxy_set_header Host $host;
    }
    location /openapi.json {
        proxy_pass http://127.0.0.1:8000/openapi.json;
        proxy_set_header Host $host;
    }
}
```

Включите сайт и получите сертификат:

```bash
sudo ln -s /etc/nginx/sites-available/qlin /etc/nginx/sites-enabled/
sudo nginx -t
sudo certbot --nginx -d qlin.ru -d www.qlin.ru
sudo systemctl reload nginx
```

В `.env` на сервере укажите:

- **CORS_ORIGINS** = `https://qlin.ru,https://www.qlin.ru`
- **NEXT_PUBLIC_API_URL** = `https://qlin.ru`  
  (так как API доступен по `https://qlin.ru/api/`)

После смены **NEXT_PUBLIC_API_URL** пересоберите только фронтенд и перезапустите:

```bash
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

---

## 7. Обновление проекта (релиз)

После изменений в коде:

```bash
cd /var/www/qlin
git pull
./deploy.sh
```

При смене только фронта можно не пересобирать backend:

```bash
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

---

## 8. Полезные команды

| Действие | Команда |
|----------|---------|
| Логи всех сервисов | `docker compose -f docker-compose.prod.yml logs -f` |
| Логи бэкенда | `docker compose -f docker-compose.prod.yml logs -f backend` |
| Логи фронтенда | `docker compose -f docker-compose.prod.yml logs -f frontend` |
| Остановить | `docker compose -f docker-compose.prod.yml down` |
| Статус | `docker compose -f docker-compose.prod.yml ps` |

---

## 9. Краткий чеклист

- [ ] Сервер с Docker и Docker Compose
- [ ] Репозиторий склонирован (или архив распакован)
- [ ] Создан `.env` с паролями, доменом, CORS и NEXT_PUBLIC_API_URL
- [ ] Выполнен `./deploy.sh` (или аналог из шага 5)
- [ ] Миграции применены (`alembic upgrade head`)
- [ ] Настроен nginx и HTTPS (если нужен домен)
- [ ] В браузере открывается https://ваш-домен.ru и работает вход/регистрация

После этого сайт будет доступен в общем доступе по вашему домену (или по IP и портам 3000/8000, если nginx не настраиваете).
