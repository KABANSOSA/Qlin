# 🔧 Исправление проблемы с Yandex Maps API

## Проблема
API ключ добавлен в `.env`, но не работает.

## Возможные причины и решения

### 1. Проверьте расположение .env файла
Файл `.env` должен быть в **корне проекта** (рядом с `docker-compose.yml`), а не в папке `frontend/`.

```
QLINPRO/
├── .env                    ← ЗДЕСЬ!
├── docker-compose.yml
├── frontend/
└── backend/
```

### 2. Проверьте формат .env файла
Файл должен содержать:
```env
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=ваш-ключ-здесь
```

**Важно:**
- Без пробелов вокруг `=`
- Без кавычек (если не нужны)
- Каждая переменная на новой строке

### 3. Пересоберите контейнер
После добавления/изменения `.env` нужно **пересобрать** контейнер, а не просто перезапустить:

```powershell
# Остановите контейнеры
docker-compose down

# Пересоберите frontend
docker-compose build frontend --no-cache

# Запустите снова
docker-compose up -d
```

Или одной командой:
```powershell
docker-compose up -d --build frontend
```

### 4. Проверьте, что переменная передается в контейнер
Выполните в PowerShell:
```powershell
docker-compose exec frontend printenv | Select-String "YANDEX"
```

Должно показать переменную окружения.

### 5. Проверьте в браузере
Откройте консоль браузера (F12) и проверьте:
- Должно быть: `Yandex Maps API Key present: true`
- Не должно быть: `YANDEX_MAPS_API_KEY is not set`

### 6. Перезапустите Next.js dev server
Если используете `npm run dev`, переменные окружения загружаются при старте.
Нужно полностью перезапустить контейнер.

## Быстрое решение

1. Убедитесь, что `.env` в корне проекта
2. Проверьте формат файла
3. Выполните:
```powershell
docker-compose down
docker-compose build frontend --no-cache
docker-compose up -d
```
4. Откройте http://localhost:3000
5. Проверьте консоль браузера

## Альтернатива: Переключиться на OpenStreetMap
Если не хотите возиться с API ключом, можно переключиться на OpenStreetMap (бесплатно, без ключа).
