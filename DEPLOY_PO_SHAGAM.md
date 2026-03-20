# Пошаговый деплой QLIN — от нуля до работающего сайта

Инструкция рассчитана на то, что вы делаете всё впервые. Каждый шаг — одна конкретная операция.

---

## ЧАСТЬ 1. Подготовка (на вашем компьютере)

### Шаг 1.1. Убедиться, что код в GitHub
- Откройте в браузере: https://github.com/KABANSOSA/Qlin  
- Убедитесь, что в репозитории есть папки `frontend`, `backend`, файлы `docker-compose.prod.yml`, `deploy.sh`, `DEPLOY.md`.  
- Если чего-то нет — сделайте `git push` из папки проекта (как вы уже делали).

### Шаг 1.2. Решить, где будет работать сайт
- **Вариант А:** арендовать VPS (виртуальный сервер). Примеры: Timeweb, Selectel, Reg.ru, Beget VPS.  
- **Вариант Б:** использовать уже купленный VPS.  
Нужна ОС **Ubuntu 20.04 или 22.04** и минимум **2 ГБ оперативной памяти**.

### Шаг 1.3. Узнать данные доступа к серверу
После заказа VPS в панели хостинга найдите:
- **IP-адрес сервера** (например `123.45.67.89`);
- **Логин** (часто `root` или имя пользователя);
- **Пароль** или **SSH-ключ** для входа.

Сохраните их — понадобятся в Части 2.

### Шаг 1.4. (По желанию) Купить домен
- Можно работать и по IP (например `http://123.45.67.89:3000`), но для «нормального» адреса нужен домен (например `qlin.ru`).  
- Домен покупается у регистратора (Reg.ru, Timeweb, nic.ru и т.п.).  
- В панели домена нужно будет указать **A-запись**: имя `@` (или `www`) → IP вашего VPS. Это делается после того, как сервер уже настроен (см. шаг 3.5).

---

## ЧАСТЬ 2. Первое подключение к серверу

### Шаг 2.1. Открыть терминал на вашем компьютере
- **Windows:** Win+R → ввести `cmd` или открыть «Терминал» / PowerShell.  
- **Mac/Linux:** открыть «Терминал».

### Шаг 2.2. Подключиться по SSH
Введите (подставьте свой IP и логин):

```bash
ssh root@123.45.67.89
```

Или, если логин не root:

```bash
ssh ваш_логин@123.45.67.89
```

- При первом подключении спросят «Trust this host?» — введите `yes` и Enter.  
- Когда попросят пароль — введите пароль от сервера (символы при вводе не отображаются — это нормально), затем Enter.

Если подключение прошло успешно, вы увидите приглашение вроде `root@server:~#` — вы уже на сервере.

### Шаг 2.3. Обновить систему на сервере (один раз)
Введите по очереди:

```bash
apt update
apt upgrade -y
```

Дождитесь окончания. Это может занять несколько минут.

---

## ЧАСТЬ 3. Установка Docker на сервере

### Шаг 3.1. Установить Docker
Скопируйте и вставьте в терминал (одной командой):

```bash
curl -fsSL https://get.docker.com | sh
```

Дождитесь сообщения об успешной установке.

### Шаг 3.2. Добавить своего пользователя в группу docker
(Подставьте своё имя пользователя, если заходили не под root; если под root — этот шаг можно пропустить.)

```bash
usermod -aG docker $USER
```

Если вы под root и будете всегда под root — ничего больше не делайте. Если под обычным пользователем — выйдите с сервера и зайдите снова (шаг 3.3).

### Шаг 3.3. Выйти и зайти снова по SSH (если не root)
Введите:

```bash
exit
```

Затем снова:

```bash
ssh ваш_логин@123.45.67.89
```

### Шаг 3.4. Проверить, что Docker работает
Введите:

```bash
docker run hello-world
```

Должно появиться сообщение «Hello from Docker!». Значит, Docker установлен.

#### Если пишет: «Cannot connect to the Docker daemon» или «no sockets found via socket activation»

На некоторых VPS (в т.ч. после перезагрузки) Docker ждёт сокет от systemd. Выполните по порядку:

```bash
sudo systemctl start docker.socket
sudo systemctl enable docker.socket
sudo systemctl start docker
sudo systemctl enable docker
```

Проверка: `docker run hello-world` — должно вывести «Hello from Docker!».

### Шаг 3.5. Установить Docker Compose
Введите:

```bash
apt install -y docker-compose-plugin
```

Проверка:

```bash
docker compose version
```

Должна вывестись версия (например 2.x.x).

---

## ЧАСТЬ 4. Загрузка проекта на сервер

### Шаг 4.1. Создать папку для сайта
Введите:

```bash
mkdir -p /var/www
cd /var/www
```

### Шаг 4.2. Склонировать репозиторий
Введите (одной строкой):

```bash
git clone https://github.com/KABANSOSA/Qlin.git qlin
```

Если спросят логин/пароль — это данные от **GitHub** (логин и Personal Access Token, если включена 2FA).  
После успешного клонирования появится папка `qlin`.

### Шаг 4.3. Перейти в папку проекта
Введите:

```bash
cd /var/www/qlin
```

Проверьте, что внутри есть файлы:

```bash
ls -la
```

Должны быть: `frontend`, `backend`, `docker-compose.prod.yml`, `deploy.sh`, `DEPLOY.md`.

---

## ЧАСТЬ 5. Настройка переменных окружения (.env)

### Шаг 5.1. Создать файл .env
Введите:

```bash
nano .env
```

Откроется редактор в терминале.

### Шаг 5.2. Вставить в файл такой текст (шаблон)
Скопируйте блок ниже и вставьте в терминал (правой кнопкой или Shift+Insert):

```env
POSTGRES_USER=qlin
POSTGRES_PASSWORD=ПридумайтеСложныйПароль123!
POSTGRES_DB=qlin

SECRET_KEY=придумайте-длинную-случайную-строку-для-jwt-токенов-минимум-32-символа

CORS_ORIGINS=http://ВАШ_IP:3000
NEXT_PUBLIC_API_URL=http://ВАШ_IP:8000

TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=любая-секретная-строка
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=
```

### Шаг 5.3. Подставить свои значения
- **ВАШ_IP** замените на реальный IP сервера (например `123.45.67.89`).  
  Пример:  
  `CORS_ORIGINS=http://123.45.67.89:3000`  
  `NEXT_PUBLIC_API_URL=http://123.45.67.89:8000`
- **POSTGRES_PASSWORD** — замените на свой надёжный пароль для БД.  
- **SECRET_KEY** — замените на любую длинную случайную строку (можно сгенерировать на сайте random.org).  
- **TELEGRAM_BOT_TOKEN** — если бота ещё нет, оставьте пустым; позже создадите бота в @BotFather и вставите сюда токен.  
- Сохраните файл в nano: **Ctrl+O**, Enter, затем **Ctrl+X** для выхода.

### Шаг 5.4. (Позже, когда будет домен) Перейти на HTTPS
Когда у вас будет домен и nginx с SSL (см. Часть 7), вы поменяете в `.env`:
- `CORS_ORIGINS=https://ваш-домен.ru`
- `NEXT_PUBLIC_API_URL=https://ваш-домен.ru`  
и пересоберёте фронтенд (шаг 7.9).

---

## ЧАСТЬ 6. Запуск проекта (Docker)

### Шаг 6.1. Перейти в папку проекта
Введите:

```bash
cd /var/www/qlin
```

### Шаг 6.2. Сделать скрипт деплоя исполняемым
Введите:

```bash
chmod +x deploy.sh
```

### Шаг 6.3. Запустить деплой
Введите:

```bash
./deploy.sh
```

Скрипт:
- остановит старые контейнеры (если были);
- соберёт образы (это может занять 5–15 минут);
- запустит контейнеры;
- подождёт БД и применит миграции.

Дождитесь сообщения вроде «Деплой завершен!» и списка контейнеров.

### Шаг 6.4. Проверить, что контейнеры работают
Введите:

```bash
docker compose -f docker-compose.prod.yml ps
```

Должны быть в состоянии «Up»: postgres, redis, backend, celery, frontend.

### Шаг 6.5. Проверить API и сайт на самом сервере
Введите:

```bash
curl http://localhost:8000/health
```

Должен вернуться JSON с `"status":"healthy"`.

Затем:

```bash
curl -I http://localhost:3000
```

Должна быть строка с кодом 200.

---

## ЧАСТЬ 7. Открыть сайт из интернета

### Вариант А: Только по IP (без домена и HTTPS)

**Шаг 7.1.** На вашем компьютере откройте браузер и перейдите по адресу:

```
http://ВАШ_IP:3000
```

Подставьте IP сервера. Должен открыться сайт QLIN.

**Шаг 7.2.** Если не открывается — проверить файрвол на сервере. Введите на сервере:

```bash
ufw allow 3000
ufw allow 8000
ufw allow 80
ufw allow 443
ufw enable
```

При вопросе «Proceed with operation?» введите `y`. Затем снова откройте в браузере `http://ВАШ_IP:3000`.

**Шаг 7.3.** В `.env` вы уже указали:
- `CORS_ORIGINS=http://ВАШ_IP:3000`
- `NEXT_PUBLIC_API_URL=http://ВАШ_IP:8000`  
Тогда регистрация и вход должны работать. Если меняли `.env` после первой сборки — пересоберите фронт (шаг 7.5 ниже).

---

### Вариант Б: С доменом и HTTPS (рекомендуется для боевого сайта)

**Шаг 7.4. Настроить домен**
- В панели управления доменом создайте **A-запись**: имя `@`, значение — IP вашего VPS.  
- При желании ещё одну: имя `www`, значение — тот же IP.  
- Подождите 5–30 минут, пока обновится DNS.

**Шаг 7.5. Установить nginx и certbot на сервере**
Введите:

```bash
apt install -y nginx certbot python3-certbot-nginx
```

**Шаг 7.6. Взять бесплатный SSL-сертификат**
(Подставьте свой домен вместо `qlin.ru`.)

```bash
certbot --nginx -d qlin.ru -d www.qlin.ru
```

Введите email, согласитесь с условиями. Certbot сам настроит nginx для HTTPS.

**Шаг 7.7. Настроить nginx вручную для QLIN**
Создайте конфиг (подставьте свой домен):

```bash
nano /etc/nginx/sites-available/qlin
```

Вставьте (замените `qlin.ru` на свой домен):

```nginx
server {
    listen 80;
    server_name qlin.ru www.qlin.ru;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name qlin.ru www.qlin.ru;

    ssl_certificate     /etc/letsencrypt/live/qlin.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/qlin.ru/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /docs { proxy_pass http://127.0.0.1:8000/docs; proxy_set_header Host $host; }
    location /openapi.json { proxy_pass http://127.0.0.1:8000/openapi.json; proxy_set_header Host $host; }
}
```

Сохраните: Ctrl+O, Enter, Ctrl+X.

Включите сайт и проверьте конфиг:

```bash
ln -s /etc/nginx/sites-available/qlin /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

**Шаг 7.8. Обновить .env для домена**
Введите:

```bash
nano /var/www/qlin/.env
```

Измените строки (подставьте свой домен):

```env
CORS_ORIGINS=https://qlin.ru,https://www.qlin.ru
NEXT_PUBLIC_API_URL=https://qlin.ru
```

Сохраните (Ctrl+O, Enter, Ctrl+X).

**Шаг 7.9. Пересобрать и перезапустить фронтенд**
Введите:

```bash
cd /var/www/qlin
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

**Шаг 7.10. Открыть сайт в браузере**
Перейдите по адресу:

```
https://qlin.ru
```

(подставьте свой домен). Сайт должен открываться по HTTPS.

---

## ЧАСТЬ 8. Обновление сайта после изменений в коде

### Шаг 8.1. Подключиться к серверу по SSH
```bash
ssh root@ВАШ_IP
```
(или ваш логин вместо root).

### Шаг 8.2. Перейти в папку проекта и подтянуть код
```bash
cd /var/www/qlin
git pull
```

### Шаг 8.3. Запустить деплой снова
```bash
./deploy.sh
```

После этого будет работать новая версия кода.

---

## Краткая шпаргалка команд на сервере

| Действие | Команда |
|----------|--------|
| Зайти в папку проекта | `cd /var/www/qlin` |
| Посмотреть логи всех сервисов | `docker compose -f docker-compose.prod.yml logs -f` |
| Логи только бэкенда | `docker compose -f docker-compose.prod.yml logs -f backend` |
| Логи только фронтенда | `docker compose -f docker-compose.prod.yml logs -f frontend` |
| Статус контейнеров | `docker compose -f docker-compose.prod.yml ps` |
| Остановить всё | `docker compose -f docker-compose.prod.yml down` |
| Запустить снова | `./deploy.sh` |

---

## ПРИЛОЖЕНИЕ. Супер-подробный сценарий (от входа на сервер до открытия сайта)

Ниже — максимально подробные шаги. Предполагается, что вы уже залогинены на сервер по SSH (приглашение вроде `root@5754453-hw15383:~#`) и Docker уже работает (`docker run hello-world` выводит «Hello from Docker!»).

---

### Блок A. Папка и клонирование репозитория

**A.1.** Введите команду (без кавычек) и нажмите Enter:

```bash
mkdir -p /var/www && cd /var/www
```

- Ожидание: приглашение просто сменится, ошибок быть не должно.  
- Если «Permission denied» — вы не root; тогда выполните: `sudo mkdir -p /var/www && cd /var/www`.

**A.2.** Проверьте, есть ли уже папка проекта:

```bash
ls -la
```

- Если в списке есть папка `qlin` — переходите к **блоку B** (настройка .env).  
- Если папки `qlin` нет — делайте шаг A.3.

**A.3.** Склонировать репозиторий (одна строка, Enter в конце):

```bash
git clone https://github.com/KABANSOSA/Qlin.git qlin
```

- Ожидание: строки вроде «Cloning into 'qlin'…», «Receiving objects…», в конце «done» или «Checking out files: 100%».  
- Если спросят логин/пароль — это данные GitHub (логин + Personal Access Token при 2FA).  
- Если «command not found: git» — выполните: `apt update && apt install -y git`, затем снова команду из A.3.

**A.4.** Перейти в папку проекта:

```bash
cd /var/www/qlin
```

**A.5.** Убедиться, что внутри есть нужные файлы:

```bash
ls -la
```

- Должны быть папки: `frontend`, `backend`, и файлы: `docker-compose.prod.yml`, `deploy.sh`. Если чего-то нет — проверьте, что клонировали правильный репозиторий.

---

### Блок B. Создание и правка файла .env

**B.1.** Открыть редактор для создания файла `.env`:

```bash
nano .env
```

- Откроется пустой экран (или список переменных, если файл уже был). Внизу подсказки: `^O` = сохранить, `^X` = выйти.

**B.2.** Вставьте в терминал этот шаблон целиком (правой кнопкой или Shift+Insert):

```env
POSTGRES_USER=qlin
POSTGRES_PASSWORD=СложныйПароль123!
POSTGRES_DB=qlin

SECRET_KEY=замените-на-длинную-случайную-строку-минимум-32-символа

CORS_ORIGINS=http://0.0.0.0:3000
NEXT_PUBLIC_API_URL=http://0.0.0.0:8000

TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=любая-секретная-строка
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=
```

**B.3.** Обязательно замените:

- **СложныйПароль123!** — на свой пароль для БД (латиница/цифры/символы).  
- **замените-на-длинную-случайную-строку-минимум-32-символа** — на любую длинную случайную строку (можно с random.org).  
- **0.0.0.0** в двух строках — на **реальный IP вашего сервера** (например `123.45.67.89`), чтобы получилось:
  - `CORS_ORIGINS=http://123.45.67.89:3000`
  - `NEXT_PUBLIC_API_URL=http://123.45.67.89:8000`

**B.4.** Сохранить и выйти из nano:

1. Нажмите **Ctrl+O** (буква O).  
2. Внизу появится «File Name to Write: .env» — нажмите **Enter**.  
3. Нажмите **Ctrl+X** — редактор закроется, вы снова в терминале.

**B.5.** Проверить, что файл создан:

```bash
cat .env
```

- Должны быть видны ваши переменные (пароли и ключи). Если всё верно — идём дальше.

---

### Блок C. Запуск деплоя

**C.1.** Убедиться, что вы в папке проекта:

```bash
cd /var/www/qlin && pwd
```

- Должно вывести: `/var/www/qlin`.

**C.2.** Сделать скрипт деплоя исполняемым (один раз):

```bash
chmod +x deploy.sh
```

- Ошибок быть не должно.

**C.3.** Запустить деплой:

```bash
./deploy.sh
```

- Скрипт остановит старые контейнеры (если были), начнёт сборку образов.  
- Сборка фронтенда может занять **5–15 минут** — будет много строк про npm, Next.js, «Compiling…». Не прерывайте.  
- В конце должно быть что-то вроде «Деплой завершен!» и список контейнеров.  
- Если ошибка на этапе сборки — скопируйте последние 20–30 строк вывода и сохраните для диагностики.  
- Если ошибка «permission denied» при работе с Docker — убедитесь, что Docker запущен (`sudo systemctl start docker.socket && sudo systemctl start docker`) и при необходимости запускайте: `sudo ./deploy.sh`.

**C.4.** Проверить, что все контейнеры запущены:

```bash
docker compose -f docker-compose.prod.yml ps
```

- В колонке STATE у postgres, redis, backend, celery, frontend должно быть **Up** (или «Up (healthy)»).  
- Если какой-то контейнер «Exited» — посмотрите логи:  
  `docker compose -f docker-compose.prod.yml logs имя_сервиса` (например `logs backend`).

**C.5.** Проверить API с самого сервера:

```bash
curl http://localhost:8000/health
```

- Ожидание: JSON вроде `{"status":"healthy",...}`.  
- Если «Connection refused» — подождите 30 секунд и повторите; бэкенд может ещё подниматься.

**C.6.** Проверить фронтенд с сервера:

```bash
curl -I http://localhost:3000
```

- Ожидание: первая строка содержит `200 OK` или `308`.  
- Если «Connection refused» — проверьте логи фронта: `docker compose -f docker-compose.prod.yml logs frontend`.

---

### Блок D. Открыть сайт с вашего компьютера

**D.1.** На своём компьютере откройте браузер (Chrome, Firefox и т.д.).

**D.2.** В адресной строке введите (подставьте свой IP вместо `ВАШ_IP`):

```
http://ВАШ_IP:3000
```

Пример: `http://123.45.67.89:3000` — нажмите Enter.

- Должна открыться главная страница QLIN.  
- Если страница не загружается — переходите к блоку E (файрвол).

**D.3.** Проверьте: нажмите «Регистрация», введите email и пароль, зарегистрируйтесь. Затем «Вход» — войдите. Если вход и регистрация проходят — сайт и API работают корректно.

---

### Блок E. Если сайт не открывается по IP (файрвол)

**E.1.** На сервере в терминале выполните по очереди:

```bash
ufw allow 3000
```

Нажмите Enter. Затем:

```bash
ufw allow 8000
ufw allow 80
ufw allow 443
ufw enable
```

- На вопрос «Proceed with operation?» введите `y` и Enter.

**E.2.** Снова откройте в браузере `http://ВАШ_IP:3000`. Сайт должен открыться.

---

### Краткая последовательность команд (копируйте по блокам)

Если всё уже настроено и нужно только «поднять» проект, можно выполнить по порядку:

```bash
cd /var/www/qlin
chmod +x deploy.sh
./deploy.sh
docker compose -f docker-compose.prod.yml ps
```

Потом в браузере: `http://ВАШ_IP:3000`.

---

Если на каком-то шаге появится ошибка — скопируйте точный текст ошибки из терминала и напишите, на каком шаге вы остановились; по ним можно будет подсказать, что исправить.
