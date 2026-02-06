# Исправление ошибки регистрации

## Возможные причины

1. **Миграция не применена** - поле `password_hash` отсутствует в БД
2. **Ошибка в коде** - проблема с сохранением пользователя
3. **Проблема с валидацией** - неверные данные

## Решение

### 1. Примените миграцию (если еще не сделали)

```powershell
docker-compose exec backend alembic upgrade head
```

### 2. Проверьте логи backend

Откройте PowerShell и выполните:

```powershell
docker-compose logs backend --tail 50
```

Ищите ошибки, связанные с регистрацией.

### 3. Проверьте через API напрямую

Откройте http://localhost:8000/docs и попробуйте зарегистрироваться через Swagger UI.

### 4. Если миграция не применяется

Проверьте, что поле password_hash существует:

```powershell
docker-compose exec postgres psql -U qlinpro -d qlinpro -c "\d users"
```

Если поля нет, примените миграцию вручную:

```powershell
docker-compose exec postgres psql -U qlinpro -d qlinpro -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);"
```

### 5. Перезапустите backend

```powershell
docker-compose restart backend
```

## Проверка

После исправления попробуйте зарегистрироваться снова. Если ошибка сохраняется, проверьте логи и сообщите точный текст ошибки.
