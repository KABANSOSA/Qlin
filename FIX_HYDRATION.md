# Исправление ошибки гидратации

## Проблема
React hydration error - несоответствие между серверным и клиентским рендерингом из-за использования `localStorage` в компонентах.

## Решение

### 1. Исправлен Header
- Использует `useState` и `useEffect` для проверки аутентификации только на клиенте
- Избегает проверки `localStorage` на сервере

### 2. Исправлена главная страница
- Аналогично использует `useState` и `useEffect`

### 3. Добавлен ProtectedRoute компонент
- Проверяет аутентификацию только на клиенте
- Показывает loading state во время проверки

### 4. Исправлены все защищенные страницы
- `/orders` - обернута в ProtectedRoute
- `/orders/new` - обернута в ProtectedRoute
- `/orders/[id]` - обернута в ProtectedRoute
- `/profile` - обернута в ProtectedRoute
- `/admin` - обернута в ProtectedRoute

### 5. Удален дубликат функции
- Удален дубликат `NewOrderPage` в `frontend/app/orders/new/page.tsx`

## Что нужно сделать

### 1. Перезапустите frontend

```powershell
docker-compose restart frontend
```

### 2. Обновите страницу в браузере

Нажмите `Ctrl + Shift + R` (жесткая перезагрузка) или `F5`.

### 3. Попробуйте снова

Ошибка гидратации должна исчезнуть.
