# QLIN — мобильное приложение (Expo)

Одна кодовая база для **iOS** и **Android**: клиенты и клинеры после входа попадают в разные разделы (`/customer`, `/cleaner`) по полю `role` из API.

## Требования

- Node 20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) / `npx expo`
- Для нативных модулей (Yandex MapKit, пуши в production, Google/Apple Sign-In) — **development build** ([EAS Build](https://docs.expo.dev/build/introduction/)), не только Expo Go.

## Быстрый старт

```bash
cd mobile
cp .env.example .env
# Укажите EXPO_PUBLIC_API_URL=https://qlin.pro/api/v1 (или свой стенд)
npm install
npx expo start
```

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `EXPO_PUBLIC_API_URL` | Базовый URL API с суффиксом `/api/v1`, без слэша в конце. Пример: `https://qlin.pro/api/v1` |
| `EXPO_PUBLIC_YANDEX_MAPKIT_API_KEY` | (опционально) Ключ MapKit для инициализации SDK в JS — отдельные ключи также задаются в **iOS/Android** в нативных конфигах после `expo prebuild` |

Дублирование через `app.json` → `expo.extra` не обязательно: см. `src/lib/env.ts`.

## Структура

```
mobile/
├── app/                    # expo-router
│   ├── _layout.tsx         # QueryClient, Auth, PushGate
│   ├── index.tsx           # редирект по role
│   ├── login.tsx
│   ├── map-preview.tsx     # заглушка до подключения MapKit
│   ├── customer/           # экраны клиента
│   └── cleaner/            # экраны клинера
├── src/
│   ├── lib/api.ts          # axios + SecureStore JWT + refresh
│   ├── lib/auth-context.tsx
│   ├── lib/env.ts
│   ├── hooks/usePushRegistration.ts
│   ├── components/push-gate.tsx
│   └── types/
├── eas.json                # EAS Build / submit
└── app.json
```

## Пуш-уведомления

1. Зарегистрируйте проект в [Expo](https://expo.dev) и пропишите `extra.eas.projectId` в `app.json` (или через `eas init`).
2. После входа приложение получает Expo Push Token и отправляет его на бэкенд: **`POST /api/v1/users/push-token`** (тело: `{ "token": "...", "platform": "ios" | "android" }`, заголовок `Authorization: Bearer ...`).
3. Рассылку с сервера делайте через [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/) по сохранённым токенам.

## Yandex MapKit

1. Ключи в [кабинете Яндекса](https://developer.tech.yandex.ru/) — **отдельно для iOS и Android** (bundle id / package name).
2. Установите обёртку, например **`react-native-yamap-plus`** (нужен **prebuild**):

   ```bash
   npx expo install react-native-yamap-plus
   npx expo prebuild
   ```

3. Инициализацию MapKit вызывайте до рендера карты (см. документацию пакета).
4. Замените содержимое `app/map-preview.tsx` на реальный компонент карты.

**Expo Go** с кастомным нативным MapKit обычно **не** подходит — используйте **development build**.

## Сборка в сторы

```bash
npm install -g eas-cli
eas login
eas build --platform ios
eas build --platform android
```

Профили в `eas.json`: `development`, `preview`, `production`.

## Авторизация (дорожная карта)

| Сейчас | Дальше на бэкенде |
|--------|-------------------|
| Вход по телефону + паролю (`POST /auth/login`) | `POST /auth/otp/request`, `POST /auth/otp/verify` |
| — | `POST /auth/oauth/google`, `POST /auth/oauth/apple` с проверкой id_token на сервере |

В приложении появятся кнопки «СМС», «Google», «Apple» и вызов этих эндпоинтов; текущий экран `login.tsx` можно расширять без смены навигации.

## Связанные API

- `GET /auth/me` — профиль и `role`
- `GET /orders` — список заказов (фильтрация по роли на бэкенде)
- `POST /users/push-token` — регистрация пуш-токена
