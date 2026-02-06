# 🚀 Быстрый деплой на Timtweb

## 📝 Краткая инструкция

### 1. Подготовка на локальной машине

1. Создайте файл `.env.production` в корне проекта со следующим содержимым:

```env
POSTGRES_USER=qlin
POSTGRES_PASSWORD=надежный-пароль-16+символов
POSTGRES_DB=qlin
SECRET_KEY=сгенерируйте-через-python-import-secrets-print-secrets-token-urlsafe-32
TELEGRAM_BOT_TOKEN=ваш-токен
TELEGRAM_WEBHOOK_SECRET=любой-секрет
NEXT_PUBLIC_API_URL=https://ваш-домен.com/api
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=ваш-ключ
CORS_ORIGINS=https://ваш-домен.com,https://www.ваш-домен.com
```

### 2. Загрузка на сервер

**Вариант A: Через Git**
```bash
# На сервере
cd /var/www
git clone ваш-репозиторий qlin
cd qlin
```

**Вариант B: Через архив**
```bash
# На локальной машине - создайте архив (исключите node_modules, .next)
tar -czf qlin.tar.gz --exclude='node_modules' --exclude='.next' --exclude='__pycache__' --exclude='.git' .

# Загрузите на сервер через SFTP/SCP
# На сервере распакуйте
tar -xzf qlin.tar.gz
```

### 3. Настройка на сервере

```bash
# 1. Создайте .env файл
nano .env
# Скопируйте содержимое из .env.production и замените домены

# 2. Сделайте скрипт исполняемым
chmod +x deploy.sh

# 3. Запустите деплой
./deploy.sh

# ИЛИ вручную:
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### 4. Настройка домена

1. В панели Timtweb добавьте домен
2. Настройте DNS (A-запись на IP сервера)
3. Настройте SSL (Let's Encrypt)
4. Обновите `.env` с правильным доменом
5. Перезапустите: `docker-compose -f docker-compose.prod.yml restart`

### 5. Проверка

```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи
docker-compose -f docker-compose.prod.yml logs -f

# Проверка сайта
curl http://localhost:3000
```

## 🔄 Обновление

```bash
cd /var/www/qlin
git pull  # или загрузите новые файлы
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## ⚠️ Важно

- Замените `yourdomain.com` на ваш реальный домен
- Используйте надежные пароли
- Настройте SSL/HTTPS
- Регулярно делайте бэкапы БД

Подробная инструкция в файле `DEPLOY_TIMTWEB.md`
