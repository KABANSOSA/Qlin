# Сброс базы данных

## Проблема
Таблицы уже существуют в базе данных (были созданы через `Base.metadata.create_all`), поэтому миграция не может их создать заново.

## Решение: Очистить базу данных

### Вариант 1: Удалить все таблицы (рекомендуется)

Выполните в PowerShell:

```powershell
docker-compose exec postgres psql -U qlinpro -d qlinpro -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Вариант 2: Удалить только таблицы проекта

```powershell
docker-compose exec postgres psql -U qlinpro -d qlinpro -c "
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS pricing_rules CASCADE;
DROP TABLE IF EXISTS order_events CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cleaners CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS users CASCADE;
"
```

### Вариант 3: Пересоздать весь контейнер БД (удалит все данные!)

```powershell
docker-compose down postgres
docker volume rm qlinpro_postgres_data
docker-compose up -d postgres
```

Подождите 10 секунд, пока PostgreSQL запустится.

## После очистки БД

1. Примените миграции:
```powershell
docker-compose exec backend alembic upgrade head
```

2. Загрузите начальные данные:
```powershell
docker-compose exec backend python -m app.db.seed
```
