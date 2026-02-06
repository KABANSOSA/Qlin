# 🚀 Деплой через GitHub - Подробная инструкция

## 📋 Что мы делаем?
1. Создаем репозиторий на GitHub
2. Загружаем код с вашего компьютера в GitHub
3. Клонируем репозиторий на сервер Timtweb
4. Запускаем проект

---

## 🎯 Шаг 1: Подготовка проекта на вашем компьютере

### 1.1. Проверьте наличие Git

**Откройте PowerShell и выполните:**

```powershell
git --version
```

**Если Git не установлен:**
1. Скачайте: https://git-scm.com/download/win
2. Установите (оставьте все настройки по умолчанию)
3. Перезапустите PowerShell

### 1.2. Настройте Git (если еще не настроен)

```powershell
# Укажите ваше имя
git config --global user.name "Ваше Имя"

# Укажите ваш email
git config --global user.email "ваш-email@example.com"
```

### 1.3. Проверьте .gitignore

**Убедитесь, что файл `.gitignore` существует в корне проекта:**

```powershell
# В папке проекта
cd "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO"
cat .gitignore
```

**Если файла нет, создайте его:**

```powershell
# Создайте файл .gitignore
@"
# Dependencies
node_modules/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python

# Build outputs
.next/
dist/
build/
*.egg-info/

# Environment variables
.env
.env.local
.env.production

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Docker
docker-compose.override.yml

# Temporary files
*.tmp
*.temp
"@ | Out-File -FilePath .gitignore -Encoding UTF8
```

**Проверьте содержимое:**

```powershell
Get-Content .gitignore
```

---

## 🎯 Шаг 2: Создание репозитория на GitHub

### 2.1. Зарегистрируйтесь на GitHub (если еще не зарегистрированы)

1. Зайдите на https://github.com
2. Нажмите "Sign up"
3. Заполните форму регистрации
4. Подтвердите email

### 2.2. Создайте новый репозиторий

1. **Войдите в GitHub**
2. **Нажмите на "+" в правом верхнем углу** → "New repository"
3. **Заполните форму:**
   - **Repository name:** `qlin` (или другое название)
   - **Description:** `QLIN - Cleaning Service Platform` (опционально)
   - **Visibility:** 
     - ✅ **Private** (рекомендуется) - только вы видите код
     - ⚪ Public - все видят код
   - **НЕ СТАВЬТЕ ГАЛОЧКИ:**
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
4. **Нажмите "Create repository"**

### 2.3. Скопируйте URL репозитория

После создания вы увидите страницу с инструкциями. **Скопируйте URL:**

```
https://github.com/ваш-username/qlin.git
```

Или если вы выбрали SSH:
```
git@github.com:ваш-username/qlin.git
```

**Сохраните этот URL - он понадобится!**

---

## 🎯 Шаг 3: Загрузка кода в GitHub

### 3.1. Инициализируйте Git в проекте

**Откройте PowerShell в папке проекта:**

```powershell
# Перейдите в папку проекта
cd "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO"

# Проверьте, что вы в правильной папке
ls
# Должны увидеть: backend/, frontend/, docker-compose.yml и т.д.
```

**Инициализируйте Git:**

```powershell
# Инициализируйте репозиторий
git init

# Проверьте статус
git status
```

### 3.2. Добавьте все файлы

```powershell
# Добавьте все файлы (кроме тех, что в .gitignore)
git add .

# Проверьте, что добавлено
git status
```

**Вы должны увидеть список файлов, которые будут загружены.**
**НЕ должны быть видны:**
- ❌ `node_modules/`
- ❌ `.next/`
- ❌ `.env`
- ❌ `__pycache__/`

### 3.3. Создайте первый коммит

```powershell
# Создайте коммит
git commit -m "Initial commit - QLIN project"

# Проверьте коммит
git log
```

### 3.4. Подключите удаленный репозиторий

```powershell
# Добавьте удаленный репозиторий (замените URL на ваш!)
git remote add origin https://github.com/ваш-username/qlin.git

# Проверьте подключение
git remote -v
```

**Должно показать:**
```
origin  https://github.com/ваш-username/qlin.git (fetch)
origin  https://github.com/ваш-username/qlin.git (push)
```

### 3.5. Загрузите код в GitHub

```powershell
# Загрузите код (первый раз)
git push -u origin main
```

**Если появится ошибка про "main" vs "master":**

```powershell
# Проверьте текущую ветку
git branch

# Если видите "master", переименуйте:
git branch -M main

# Или используйте master:
git push -u origin master
```

**Если попросит авторизацию:**

1. **Через браузер (рекомендуется):**
   - GitHub откроет браузер для авторизации
   - Войдите в GitHub
   - Разрешите доступ

2. **Через Personal Access Token:**
   - Зайдите: https://github.com/settings/tokens
   - Нажмите "Generate new token (classic)"
   - Выберите срок действия
   - Отметьте `repo` (полный доступ к репозиториям)
   - Скопируйте токен
   - Используйте токен как пароль при `git push`

### 3.6. Проверьте загрузку

1. **Обновите страницу репозитория на GitHub**
2. **Вы должны увидеть все файлы проекта:**
   - `backend/`
   - `frontend/`
   - `docker-compose.prod.yml`
   - `DEPLOY_TIMTWEB.md`
   - и другие файлы

---

## 🎯 Шаг 4: Клонирование на сервер Timtweb

### 4.1. Подключитесь к серверу

**Способ A: Через встроенный SSH в Windows 10/11**

```powershell
# В PowerShell
ssh username@your-server-ip
# или
ssh username@your-domain.com
```

**Способ B: Через PuTTY**

1. Скачайте PuTTY: https://www.putty.org/
2. Откройте PuTTY
3. Введите:
   - Host Name: `your-server-ip` или `your-domain.com`
   - Port: `22`
   - Connection type: `SSH`
4. Нажмите "Open"
5. Введите логин и пароль

**Где взять данные для подключения:**
- В панели управления Timtweb
- В разделе "SSH доступ" или "Управление сервером"
- Обычно это: IP адрес, логин, пароль

### 4.2. На сервере: Перейдите в папку для сайтов

```bash
# Обычно это /var/www или /home/username/www
cd /var/www

# Или создайте свою папку
sudo mkdir -p /var/www
cd /var/www

# Проверьте текущую директорию
pwd
# Должно показать: /var/www
```

### 4.3. Клонируйте репозиторий

```bash
# Клонируйте репозиторий (замените URL на ваш!)
git clone https://github.com/ваш-username/qlin.git

# Если репозиторий приватный, GitHub попросит авторизацию
# Используйте Personal Access Token как пароль
```

**Если репозиторий приватный:**

1. **Создайте Personal Access Token на GitHub:**
   - https://github.com/settings/tokens
   - "Generate new token (classic)"
   - Отметьте `repo`
   - Скопируйте токен

2. **При клонировании используйте токен:**
   ```bash
   git clone https://ваш-токен@github.com/ваш-username/qlin.git
   ```

### 4.4. Проверьте загрузку

```bash
# Перейдите в папку проекта
cd qlin

# Проверьте файлы
ls -la

# Должны быть видны:
# ✅ backend/
# ✅ frontend/
# ✅ docker-compose.prod.yml
# ✅ deploy.sh
# ✅ DEPLOY_TIMTWEB.md
```

### 4.5. Проверьте важные файлы

```bash
# Проверьте наличие docker-compose.prod.yml
ls -la docker-compose.prod.yml

# Проверьте Dockerfile для frontend
ls -la frontend/Dockerfile.prod

# Проверьте Dockerfile для backend
ls -la backend/Dockerfile

# Проверьте скрипт деплоя
ls -la deploy.sh
```

---

## 🎯 Шаг 5: Создание .env файла на сервере

### 5.1. Создайте файл .env

```bash
# На сервере, в папке проекта
cd /var/www/qlin

# Создайте файл .env
nano .env
# или
vi .env
```

### 5.2. Вставьте содержимое

**Скопируйте из вашего `.env.production` и вставьте:**

```env
POSTGRES_USER=qlin
POSTGRES_PASSWORD=ваш-надежный-пароль-минимум-16-символов
POSTGRES_DB=qlin
SECRET_KEY=ваш-сгенерированный-ключ-43-символа
TELEGRAM_BOT_TOKEN=ваш-токен-телеграм-бота
TELEGRAM_WEBHOOK_SECRET=любой-секрет-для-webhook
NEXT_PUBLIC_API_URL=https://ваш-домен.com/api
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=ваш-ключ-яндекс-карт
CORS_ORIGINS=https://ваш-домен.com,https://www.ваш-домен.com
```

**Важно:**
- Замените `ваш-домен.com` на ваш реальный домен
- Используйте надежные пароли
- SECRET_KEY должен быть сгенерирован (см. `generate_secret.py`)

### 5.3. Сохраните файл

**В nano:**
- `Ctrl+O` - сохранить
- `Enter` - подтвердить имя файла
- `Ctrl+X` - выйти

**В vi:**
- `Esc` - выйти из режима редактирования
- `:wq` - сохранить и выйти
- `Enter` - выполнить команду

### 5.4. Проверьте файл

```bash
# Проверьте, что файл создан
ls -la .env

# Посмотрите содержимое (первые строки)
head -5 .env
```

---

## 🎯 Шаг 6: Установка Docker (если нужно)

### 6.1. Проверьте наличие Docker

```bash
# Проверьте Docker
docker --version

# Проверьте Docker Compose
docker-compose --version
```

### 6.2. Если Docker не установлен

```bash
# Обновите пакеты
sudo apt-get update

# Установите Docker
sudo apt-get install -y docker.io docker-compose

# Запустите Docker
sudo systemctl start docker
sudo systemctl enable docker

# Добавьте пользователя в группу docker (чтобы не использовать sudo)
sudo usermod -aG docker $USER

# Выйдите и войдите снова, чтобы изменения вступили в силу
exit
# Затем подключитесь снова
```

---

## 🎯 Шаг 7: Запуск проекта

### 7.1. Сделайте скрипт исполняемым

```bash
# На сервере
cd /var/www/qlin

# Сделайте скрипт деплоя исполняемым
chmod +x deploy.sh

# Проверьте права
ls -la deploy.sh
# Должно быть: -rwxr-xr-x
```

### 7.2. Запустите деплой

**Вариант A: Через скрипт (рекомендуется)**

```bash
./deploy.sh
```

**Вариант B: Вручную**

```bash
# Соберите образы
docker-compose -f docker-compose.prod.yml build --no-cache

# Запустите контейнеры
docker-compose -f docker-compose.prod.yml up -d

# Примените миграции базы данных
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### 7.3. Проверьте статус

```bash
# Проверьте статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Должны быть запущены:
# ✅ qlin_postgres
# ✅ qlin_redis
# ✅ qlin_backend
# ✅ qlin_celery
# ✅ qlin_frontend
```

### 7.4. Проверьте логи

```bash
# Все логи
docker-compose -f docker-compose.prod.yml logs -f

# Конкретный сервис
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f backend
```

---

## 🔄 Обновление проекта в будущем

### Когда нужно обновить код:

1. **На вашем компьютере:**
   ```powershell
   cd "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO"
   
   # Внесите изменения в код
   # ...
   
   # Добавьте изменения
   git add .
   
   # Создайте коммит
   git commit -m "Описание изменений"
   
   # Загрузите в GitHub
   git push
   ```

2. **На сервере:**
   ```bash
   cd /var/www/qlin
   
   # Получите обновления
   git pull
   
   # Пересоберите и перезапустите
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   
   # Примените миграции (если есть новые)
   docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
   ```

---

## ❓ Решение проблем

### Проблема: "Permission denied" при git push

**Решение:**
- Используйте Personal Access Token вместо пароля
- Или настройте SSH ключи

### Проблема: "Repository not found" при клонировании

**Решение:**
- Проверьте правильность URL
- Убедитесь, что репозиторий существует
- Если приватный - используйте токен

### Проблема: "Docker not found" на сервере

**Решение:**
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
```

### Проблема: Контейнеры не запускаются

**Решение:**
```bash
# Проверьте логи
docker-compose -f docker-compose.prod.yml logs

# Проверьте .env файл
cat .env

# Проверьте конфигурацию
docker-compose -f docker-compose.prod.yml config
```

---

## ✅ Чек-лист готовности

- [ ] Git установлен на компьютере
- [ ] Репозиторий создан на GitHub
- [ ] Код загружен в GitHub
- [ ] Подключение к серверу работает
- [ ] Репозиторий клонирован на сервер
- [ ] Файл .env создан на сервере
- [ ] Docker установлен на сервере
- [ ] Контейнеры запущены
- [ ] Сайт доступен

---

**Готово! Проект загружен и запущен! 🎉**

Если возникнут вопросы - обращайтесь!
