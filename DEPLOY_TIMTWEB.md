# 🚀 Деплой на Timtweb - Пошаговая инструкция

## 📋 Подготовка к деплою

### 1. Подготовка файлов на локальной машине

1. **Создайте файл `.env.production`** в корне проекта:

```env
# Database
POSTGRES_USER=qlin
POSTGRES_PASSWORD=ваш-надежный-пароль-для-БД
POSTGRES_DB=qlin

# Backend
SECRET_KEY=ваш-очень-длинный-случайный-секретный-ключ-минимум-32-символа
TELEGRAM_BOT_TOKEN=ваш-токен-телеграм-бота
TELEGRAM_WEBHOOK_SECRET=ваш-секрет-для-webhook

# Frontend
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=ваш-ключ-яндекс-карт

# CORS (замените на ваш домен)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

2. **Сгенерируйте SECRET_KEY**:
```bash
# В PowerShell или терминале
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Подключение к серверу Timtweb

1. Получите доступ к серверу через SSH
2. Убедитесь, что на сервере установлены:
   - Docker
   - Docker Compose
   - Git (опционально)

## 📦 Загрузка проекта на сервер

### Вариант 1: Через Git (рекомендуется)

```bash
# На сервере
cd /var/www  # или другая директория
git clone https://github.com/yourusername/qlin.git
cd qlin
```

### Вариант 2: Через SCP/SFTP

1. Заархивируйте проект на локальной машине (исключите `node_modules`, `.next`, `__pycache__`)
2. Загрузите архив на сервер
3. Распакуйте на сервере

```bash
# На локальной машине
tar -czf qlin.tar.gz --exclude='node_modules' --exclude='.next' --exclude='__pycache__' --exclude='.git' .

# На сервере
cd /var/www
tar -xzf qlin.tar.gz
cd qlin
```

## ⚙️ Настройка на сервере

### 1. Создайте файл `.env` на сервере

```bash
nano .env
```

Скопируйте содержимое из `.env.production` и замените:
- `yourdomain.com` на ваш реальный домен
- Все пароли на надежные

### 2. Настройте nginx (если нужно)

Если на Timtweb уже настроен nginx, используйте конфигурацию из `nginx.conf`:

```bash
sudo nano /etc/nginx/sites-available/qlin
# Скопируйте содержимое nginx.conf
sudo ln -s /etc/nginx/sites-available/qlin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Соберите и запустите контейнеры

```bash
# Соберите образы
docker-compose -f docker-compose.prod.yml build --no-cache

# Запустите контейнеры
docker-compose -f docker-compose.prod.yml up -d

# Проверьте статус
docker-compose -f docker-compose.prod.yml ps

# Посмотрите логи
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Выполните миграции базы данных

```bash
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### 5. Создайте суперпользователя (опционально)

```bash
docker-compose -f docker-compose.prod.yml exec backend python -c "
from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
db = SessionLocal()
admin = User(
    phone='+79991234567',
    email='admin@qlin.ru',
    first_name='Admin',
    role='admin',
    password_hash=get_password_hash('ваш-пароль-админа')
)
db.add(admin)
db.commit()
"
```

## 🔧 Настройка домена на Timtweb

1. В панели управления Timtweb:
   - Добавьте ваш домен
   - Настройте DNS записи (A-запись на IP сервера)
   - Настройте SSL сертификат (Let's Encrypt)

2. Обновите `.env` с правильным доменом:
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

3. Перезапустите контейнеры:
```bash
docker-compose -f docker-compose.prod.yml restart frontend backend
```

## 🔄 Обновление сайта

```bash
# На сервере
cd /var/www/qlin  # или ваша директория

# Обновите код (если через Git)
git pull origin main

# Пересоберите и перезапустите
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Примените миграции (если есть новые)
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## 📊 Мониторинг

### Просмотр логов

```bash
# Все сервисы
docker-compose -f docker-compose.prod.yml logs -f

# Конкретный сервис
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Проверка статуса

```bash
docker-compose -f docker-compose.prod.yml ps
```

### Перезапуск сервисов

```bash
# Все
docker-compose -f docker-compose.prod.yml restart

# Конкретный
docker-compose -f docker-compose.prod.yml restart frontend
```

## 🛠️ Решение проблем

### Проблема: Контейнеры не запускаются

```bash
# Проверьте логи
docker-compose -f docker-compose.prod.yml logs

# Проверьте конфигурацию
docker-compose -f docker-compose.prod.yml config
```

### Проблема: База данных не подключается

```bash
# Проверьте, что postgres запущен
docker-compose -f docker-compose.prod.yml ps postgres

# Проверьте логи
docker-compose -f docker-compose.prod.yml logs postgres
```

### Проблема: Frontend не собирается

```bash
# Очистите кеш и пересоберите
docker-compose -f docker-compose.prod.yml build --no-cache frontend
```

## 🔐 Безопасность

1. **Никогда не коммитьте `.env` в Git**
2. **Используйте сильные пароли** для базы данных
3. **Настройте SSL/HTTPS** для домена
4. **Регулярно обновляйте** зависимости
5. **Делайте бэкапы** базы данных

## 💾 Бэкапы

### Создание бэкапа базы данных

```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U qlin qlin > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Восстановление из бэкапа

```bash
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U qlin qlin < backup_20240101_120000.sql
```

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи: `docker-compose -f docker-compose.prod.yml logs`
2. Проверьте статус: `docker-compose -f docker-compose.prod.yml ps`
3. Проверьте переменные окружения в `.env`
4. Убедитесь, что все порты открыты в firewall

---

**Успешного деплоя! 🚀**
