# 🚀 Инструкция по развертыванию в production

## Перед развертыванием

### 1. Примените миграцию для паролей

```powershell
docker-compose exec backend alembic upgrade head
```

### 2. Обновите .env файл для production

```env
# Production настройки
DEBUG=false
SECRET_KEY=сгенерируйте-случайный-ключ-минимум-32-символа

# Database (используйте production БД)
DATABASE_URL=postgresql://user:password@host:5432/qlinpro

# CORS (укажите ваш домен)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Telegram Bot
TELEGRAM_BOT_TOKEN=ваш-токен
TELEGRAM_WEBHOOK_SECRET=случайный-секрет

# Payment
YOOKASSA_SHOP_ID=ваш-shop-id
YOOKASSA_SECRET_KEY=ваш-секрет
```

### 3. Пересоберите образы

```powershell
docker-compose build --no-cache
docker-compose up -d
```

## Production Checklist

- [ ] Применены все миграции БД
- [ ] Настроены production переменные окружения
- [ ] Используется HTTPS
- [ ] Настроены правильные CORS origins
- [ ] Секретные ключи изменены
- [ ] Настроено резервное копирование БД
- [ ] Настроен мониторинг
- [ ] Настроено логирование
- [ ] SSL сертификаты установлены
- [ ] Домен настроен

## Рекомендации

1. **База данных**: Используйте managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
2. **Redis**: Используйте managed Redis (Redis Cloud, AWS ElastiCache)
3. **CDN**: Настройте CDN для статических файлов
4. **Мониторинг**: Настройте Sentry, DataDog или аналоги
5. **Логирование**: Настройте централизованное логирование
6. **Backup**: Автоматическое резервное копирование БД

## Docker Compose для Production

Создайте `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    restart: always
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    # Добавьте healthchecks, limits ресурсов и т.д.

  frontend:
    restart: always
    # Production build
    command: npm run build && npm start
```

## Nginx конфигурация (пример)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
