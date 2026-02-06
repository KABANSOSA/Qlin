# 📦 Шаг 2: Загрузка проекта на сервер Timtweb - Подробная инструкция

## 🎯 Цель шага
Загрузить все файлы проекта на сервер Timtweb, чтобы запустить сайт.

---

## 📋 Подготовка перед загрузкой

### 1. Проверьте, что у вас есть:
- ✅ Доступ к серверу Timtweb (SSH логин и пароль)
- ✅ IP-адрес или домен сервера
- ✅ Файл `.env.production` создан (из шага 1)
- ✅ Все файлы проекта готовы

### 2. Определите, какие файлы НЕ нужно загружать:

**Исключите из загрузки:**
- `node_modules/` - папка с зависимостями (будет установлена на сервере)
- `.next/` - папка сборки Next.js (будет создана при сборке)
- `__pycache__/` - кеш Python
- `.git/` - папка Git (если не используете Git на сервере)
- `.env` - локальный файл с переменными (используйте `.env.production`)
- `*.log` - файлы логов

---

## 🚀 Вариант 1: Загрузка через Git (РЕКОМЕНДУЕТСЯ)

### Преимущества:
- ✅ Легко обновлять проект
- ✅ Версионность
- ✅ Автоматическая синхронизация

### Шаги:

#### 1.1. Создайте Git репозиторий (если еще нет)

**На локальной машине:**

```bash
# Перейдите в папку проекта
cd "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO"

# Инициализируйте Git (если еще не сделано)
git init

# Создайте .gitignore файл (если его нет)
# Убедитесь, что в нем есть:
# node_modules/
# .next/
# __pycache__/
# .env
# *.log
```

#### 1.2. Создайте репозиторий на GitHub/GitLab

1. Зайдите на https://github.com (или GitLab)
2. Создайте новый репозиторий (например, `qlin`)
3. **НЕ добавляйте** README, .gitignore, лицензию (у вас уже есть)

#### 1.3. Загрузите код в репозиторий

**На локальной машине:**

```bash
# Добавьте все файлы
git add .

# Создайте первый коммит
git commit -m "Initial commit - QLIN project"

# Добавьте удаленный репозиторий (замените URL на ваш)
git remote add origin https://github.com/ваш-username/qlin.git

# Загрузите код
git push -u origin main
```

#### 1.4. Клонируйте на сервере Timtweb

**Подключитесь к серверу через SSH:**

```bash
# Пример подключения (замените на ваши данные)
ssh username@your-server-ip
# или
ssh username@your-domain.com
```

**На сервере выполните:**

```bash
# Перейдите в директорию для веб-проектов
# Обычно это /var/www или /home/username/www
cd /var/www

# Или создайте свою директорию
sudo mkdir -p /var/www
cd /var/www

# Клонируйте репозиторий
git clone https://github.com/ваш-username/qlin.git

# Перейдите в папку проекта
cd qlin

# Проверьте, что файлы загружены
ls -la
```

**Вы должны увидеть:**
- `backend/`
- `frontend/`
- `docker-compose.prod.yml`
- `DEPLOY_TIMTWEB.md`
- и другие файлы проекта

---

## 📁 Вариант 2: Загрузка через архив (если нет Git)

### Шаги:

#### 2.1. Создайте архив на локальной машине

**В PowerShell (на вашем компьютере):**

```powershell
# Перейдите в папку проекта
cd "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO"

# Создайте архив, исключая ненужные папки
# Используйте 7-Zip или WinRAR, или PowerShell:

# Если у вас есть 7-Zip:
7z a -tzip qlin.zip * -xr!node_modules -xr!.next -xr!__pycache__ -xr!.git -xr!.env

# Или через PowerShell (если установлен Compress-Archive):
Compress-Archive -Path * -DestinationPath qlin.zip -Force
```

**Или вручную:**
1. Выделите все файлы и папки в проекте
2. Исключите: `node_modules`, `.next`, `__pycache__`, `.git`, `.env`
3. Создайте ZIP архив

#### 2.2. Загрузите архив на сервер

**Способ A: Через SFTP клиент (FileZilla, WinSCP)**

1. **Скачайте FileZilla**: https://filezilla-project.org/
2. **Откройте FileZilla**
3. **Подключитесь к серверу:**
   - Хост: `sftp://your-server-ip` или `sftp://your-domain.com`
   - Порт: `22`
   - Протокол: `SFTP`
   - Пользователь: ваш SSH логин
   - Пароль: ваш SSH пароль
4. **Перейдите в папку** `/var/www` (или другую, где хранятся сайты)
5. **Перетащите архив** `qlin.zip` на сервер

**Способ B: Через SCP в PowerShell**

```powershell
# На вашем компьютере
scp qlin.zip username@your-server-ip:/var/www/
# Введите пароль при запросе
```

#### 2.3. Распакуйте архив на сервере

**Подключитесь к серверу через SSH:**

```bash
# Перейдите в папку для сайтов
cd /var/www

# Распакуйте архив
unzip qlin.zip -d qlin

# Или если unzip не установлен:
# sudo apt-get update && sudo apt-get install unzip
# unzip qlin.zip -d qlin

# Перейдите в папку проекта
cd qlin

# Проверьте файлы
ls -la
```

---

## 🔧 Вариант 3: Загрузка через FTP (если SFTP недоступен)

### Шаги:

1. **Получите FTP данные** от Timtweb:
   - FTP хост
   - FTP пользователь
   - FTP пароль
   - FTP порт (обычно 21)

2. **Используйте FTP клиент** (FileZilla, WinSCP):
   - Подключитесь по FTP
   - Загрузите архив или файлы

3. **Распакуйте на сервере** (как в варианте 2)

---

## ✅ Проверка после загрузки

### На сервере выполните:

```bash
# Перейдите в папку проекта
cd /var/www/qlin  # или ваша директория

# Проверьте структуру проекта
ls -la

# Должны быть видны:
# ✅ backend/
# ✅ frontend/
# ✅ docker-compose.prod.yml
# ✅ deploy.sh
# ✅ DEPLOY_TIMTWEB.md
```

### Проверьте важные файлы:

```bash
# Проверьте наличие docker-compose.prod.yml
ls -la docker-compose.prod.yml

# Проверьте наличие Dockerfile для frontend
ls -la frontend/Dockerfile.prod

# Проверьте наличие Dockerfile для backend
ls -la backend/Dockerfile
```

---

## 🔐 Создание .env файла на сервере

**После загрузки файлов создайте `.env` на сервере:**

```bash
# На сервере
cd /var/www/qlin

# Создайте файл .env
nano .env
# или
vi .env
```

**Скопируйте содержимое из `.env.production` и вставьте в файл:**

```env
POSTGRES_USER=qlin
POSTGRES_PASSWORD=ваш-надежный-пароль
POSTGRES_DB=qlin
SECRET_KEY=ваш-сгенерированный-ключ
TELEGRAM_BOT_TOKEN=ваш-токен
TELEGRAM_WEBHOOK_SECRET=ваш-секрет
NEXT_PUBLIC_API_URL=https://ваш-домен.com/api
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=ваш-ключ
CORS_ORIGINS=https://ваш-домен.com,https://www.ваш-домен.com
```

**Сохраните файл:**
- В `nano`: `Ctrl+O` (сохранить), `Enter`, `Ctrl+X` (выйти)
- В `vi`: `Esc`, `:wq`, `Enter`

---

## 🛠️ Установка необходимых инструментов на сервере

**Проверьте наличие Docker и Docker Compose:**

```bash
# Проверьте Docker
docker --version

# Проверьте Docker Compose
docker-compose --version
```

**Если не установлены, установите:**

```bash
# Для Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Запустите Docker
sudo systemctl start docker
sudo systemctl enable docker

# Добавьте пользователя в группу docker (чтобы не использовать sudo)
sudo usermod -aG docker $USER
# Выйдите и войдите снова, чтобы изменения вступили в силу
```

---

## 📝 Права доступа

**Установите правильные права:**

```bash
# На сервере
cd /var/www/qlin

# Сделайте скрипт деплоя исполняемым
chmod +x deploy.sh

# Установите права на файлы (если нужно)
chmod -R 755 .
```

---

## ⚠️ Важные замечания

1. **Не загружайте `.env` файл** в Git репозиторий
2. **Проверьте `.gitignore`** - он должен исключать:
   - `.env`
   - `node_modules/`
   - `.next/`
   - `__pycache__/`
3. **Используйте `.env.production`** как шаблон для создания `.env` на сервере
4. **Убедитесь, что все файлы загружены** перед переходом к следующему шагу

---

## 🎯 Что дальше?

После успешной загрузки файлов переходите к **Шагу 3: Настройка на сервере**

Выполните:
```bash
cd /var/www/qlin
./deploy.sh
```

Или следуйте инструкциям из `DEPLOY_TIMTWEB.md`

---

## ❓ Решение проблем

### Проблема: "Permission denied" при загрузке

```bash
# Проверьте права на папку
ls -la /var/www

# Если нужно, измените владельца
sudo chown -R $USER:$USER /var/www/qlin
```

### Проблема: "Docker not found"

```bash
# Установите Docker (см. выше)
# Или используйте sudo
sudo docker-compose -f docker-compose.prod.yml up -d
```

### Проблема: "Git not found"

```bash
# Установите Git
sudo apt-get update
sudo apt-get install -y git
```

---

**Готово! Файлы загружены на сервер. Переходите к следующему шагу! 🚀**
