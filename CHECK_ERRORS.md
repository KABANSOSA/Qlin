# Проверка ошибки регистрации

## Выполните эти команды для диагностики:

### 1. Проверьте логи backend

```powershell
docker-compose logs backend --tail 100
```

Ищите ошибки, связанные с регистрацией.

### 2. Проверьте, применена ли миграция

```powershell
docker-compose exec postgres psql -U qlinpro -d qlinpro -c "\d users"
```

Должно быть поле `password_hash`.

### 3. Если поля нет, добавьте вручную

```powershell
docker-compose exec postgres psql -U qlinpro -d qlinpro -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);"
```

### 4. Перезапустите backend

```powershell
docker-compose restart backend
```

### 5. Проверьте через Swagger

Откройте http://localhost:8000/docs и попробуйте зарегистрироваться через API напрямую - там будет видна точная ошибка.

### 6. Проверьте консоль браузера

Нажмите F12 в браузере, откройте вкладку "Console" и посмотрите ошибки JavaScript.
