# 🗺️ Пошаговая настройка Yandex Maps API

## Шаг 1: Получите API ключ

1. Откройте: https://developer.tech.yandex.ru/services/
2. Войдите в аккаунт Яндекс (или создайте)
3. Нажмите "Создать ключ"
4. Выберите "JavaScript API и HTTP Геокодер"
5. Скопируйте полученный ключ (выглядит примерно так: `12345678-1234-1234-1234-123456789012`)

## Шаг 2: Создайте файл .env

1. Откройте корневую папку проекта `QLINPRO` (где находится `docker-compose.yml`)
2. Создайте файл `.env` (если его нет)
3. Добавьте в файл одну строку:
```env
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=ваш-ключ-здесь
```
**Важно:** Замените `ваш-ключ-здесь` на реальный ключ, который вы получили на шаге 1.

**Пример:**
```env
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=12345678-1234-1234-1234-123456789012
```

## Шаг 3: Пересоберите Docker контейнер

Откройте PowerShell в папке проекта и выполните:

```powershell
# Остановите контейнеры
docker-compose down

# Пересоберите frontend (это важно!)
docker-compose build frontend --no-cache

# Запустите снова
docker-compose up -d
```

Или одной командой:
```powershell
docker-compose down && docker-compose build frontend --no-cache && docker-compose up -d
```

## Шаг 4: Проверьте работу

1. Откройте браузер: http://localhost:3000
2. Откройте консоль разработчика (F12)
3. Перейдите на вкладку "Console"
4. Обновите страницу (F5)
5. Перейдите на страницу создания заказа: http://localhost:3000/orders/new

### Что должно быть в консоли:

✅ **Хорошо:**
```
Yandex Maps API Key present: true
API Key length: 36
API Key first 10 chars: 12345678-1
Yandex Maps loaded successfully
```

❌ **Плохо (если видите это):**
```
YANDEX_MAPS_API_KEY is not set - using fallback mode
API Key length: 0
```

## Шаг 5: Проверьте подсказки адресов

1. На странице создания заказа выберите город
2. Начните вводить адрес (например, "Москва, Тверская")
3. Должны появиться подсказки с адресами

## Если не работает

### Проверка 1: Файл .env существует?
```powershell
Get-Content .env
```
Должна быть строка с `NEXT_PUBLIC_YANDEX_MAPS_API_KEY`

### Проверка 2: Переменная в контейнере?
```powershell
docker-compose exec frontend printenv | Select-String "YANDEX"
```
Должна показать переменную

### Проверка 3: Перезапуск frontend
```powershell
docker-compose restart frontend
```

## Альтернатива: OpenStreetMap (без ключа)

Если не хотите возиться с API ключом, можно переключиться на OpenStreetMap - бесплатно и без регистрации.
