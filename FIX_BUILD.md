# Исправление зависания сборки

## Проблема
Docker build завис на этапе `RUN npm install`

## Решения

### 1. Подождите еще (рекомендуется)
`npm install` может занять 5-10 минут при первой сборке, особенно с `--no-cache`. Это нормально.

### 2. Прервать и пересобрать без --no-cache
```powershell
# Нажмите Ctrl+C чтобы прервать
# Затем выполните:
docker-compose build frontend
```

### 3. Использовать npm ci (быстрее)
Обновим Dockerfile для использования `npm ci` вместо `npm install` - это быстрее и надежнее.

### 4. Проверить интернет
Убедитесь, что есть стабильное интернет-соединение для загрузки пакетов.

### 5. Очистить кэш Docker
```powershell
docker system prune -a
docker-compose build frontend
```

## Быстрое решение

Прервите текущую сборку (Ctrl+C) и выполните:

```powershell
docker-compose build frontend
```

Без `--no-cache` сборка будет быстрее, используя кэш Docker.
