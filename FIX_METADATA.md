# Исправление проблемы с metadata

## Проблема
SQLAlchemy резервирует имя `metadata` для метаданных таблиц. Нельзя использовать его как имя поля модели.

## Решение
Переименованы поля `metadata` в моделях:
- `OrderEvent.metadata` → `OrderEvent.event_metadata` (колонка в БД остается `metadata`)
- `Payment.metadata` → `Payment.payment_metadata` (колонка в БД остается `metadata`)

## Что нужно сделать

1. Перезапустите backend:
```powershell
docker-compose restart backend
```

2. Примените миграции:
```powershell
docker-compose exec backend alembic upgrade head
```

3. Загрузите начальные данные:
```powershell
docker-compose exec backend python -m app.db.seed
```
