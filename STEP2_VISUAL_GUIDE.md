# 📦 Шаг 2: Загрузка проекта - Визуальная инструкция

## 🎯 Что мы делаем?
Загружаем все файлы проекта на сервер Timtweb, чтобы запустить сайт.

---

## 📋 Варианты загрузки

### 🟢 Вариант 1: Через Git (Самый простой)

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│  Ваш компьютер │  push   │   GitHub     │  clone  │   Сервер    │
│                │ ──────> │              │ ──────> │  Timtweb    │
│  QLINPRO/      │         │  qlin repo   │         │  /var/www/  │
└─────────────────┘         └──────────────┘         └─────────────┘
```

**Шаги:**

1. **Создайте репозиторий на GitHub:**
   - Зайдите на https://github.com
   - Нажмите "New repository"
   - Название: `qlin`
   - НЕ добавляйте README, .gitignore, лицензию

2. **На вашем компьютере:**
   ```powershell
   cd "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO"
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/ваш-username/qlin.git
   git push -u origin main
   ```

3. **На сервере Timtweb:**
   ```bash
   cd /var/www
   git clone https://github.com/ваш-username/qlin.git
   cd qlin
   ```

---

### 🟡 Вариант 2: Через архив (Если нет Git)

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│  Ваш компьютер │  zip   │   Архив      │  upload │   Сервер    │
│                │ ──────> │  qlin.zip    │ ──────> │  Timtweb    │
│  QLINPRO/      │         │              │         │  /var/www/  │
└─────────────────┘         └──────────────┘         └─────────────┘
                                                           │
                                                           │ unzip
                                                           ▼
                                                    ┌─────────────┐
                                                    │  qlin/      │
                                                    └─────────────┘
```

**Шаги:**

#### Шаг 2.1: Создайте архив

**Способ A: Через PowerShell скрипт (РЕКОМЕНДУЕТСЯ)**

1. Откройте PowerShell в папке проекта
2. Выполните:
   ```powershell
   .\prepare-upload.ps1
   ```
3. Будет создан файл `qlin.zip`

**Способ B: Вручную**

1. Откройте папку проекта в проводнике
2. Выделите все файлы и папки
3. **ИСКЛЮЧИТЕ:**
   - ❌ `node_modules` (папка)
   - ❌ `.next` (папка)
   - ❌ `__pycache__` (папка)
   - ❌ `.git` (папка)
   - ❌ `.env` (файл)
4. Правой кнопкой → "Отправить" → "Сжатая ZIP-папка"
5. Назовите `qlin.zip`

#### Шаг 2.2: Загрузите архив на сервер

**Через FileZilla (РЕКОМЕНДУЕТСЯ):**

1. **Скачайте FileZilla:**
   - https://filezilla-project.org/download.php?type=client
   - Установите

2. **Откройте FileZilla**

3. **Подключитесь к серверу:**
   ```
   Хост: sftp://ваш-ip-адрес
   Имя пользователя: ваш-ssh-логин
   Пароль: ваш-ssh-пароль
   Порт: 22
   ```

   Нажмите "Быстрое подключение"

4. **В левой части** (ваш компьютер):
   - Найдите файл `qlin.zip`
   
5. **В правой части** (сервер):
   - Перейдите в `/var/www` (или другую папку для сайтов)
   
6. **Перетащите** `qlin.zip` из левой части в правую

**Через WinSCP (альтернатива):**

1. Скачайте WinSCP: https://winscp.net/
2. Подключитесь по SFTP
3. Загрузите архив

#### Шаг 2.3: Распакуйте на сервере

**Подключитесь к серверу через SSH:**

1. **Используйте PuTTY или встроенный SSH в Windows:**
   ```powershell
   ssh username@your-server-ip
   ```

2. **На сервере выполните:**
   ```bash
   # Перейдите в папку
   cd /var/www
   
   # Распакуйте архив
   unzip qlin.zip -d qlin
   
   # Если unzip не установлен:
   # sudo apt-get update && sudo apt-get install unzip
   
   # Перейдите в папку проекта
   cd qlin
   
   # Проверьте файлы
   ls -la
   ```

---

## ✅ Проверка после загрузки

### На сервере должны быть видны:

```
/var/www/qlin/
├── backend/
│   ├── app/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/
│   ├── components/
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   └── package.json
├── docker-compose.prod.yml
├── deploy.sh
├── DEPLOY_TIMTWEB.md
└── другие файлы...
```

### Проверьте командами:

```bash
# На сервере
cd /var/www/qlin

# Проверьте структуру
ls -la

# Проверьте наличие важных файлов
ls -la docker-compose.prod.yml
ls -la frontend/Dockerfile.prod
ls -la backend/Dockerfile
ls -la deploy.sh
```

---

## 🔐 Создание .env на сервере

**После загрузки файлов:**

```bash
# На сервере
cd /var/www/qlin

# Создайте файл .env
nano .env
```

**Вставьте содержимое (из вашего .env.production):**

```env
POSTGRES_USER=qlin
POSTGRES_PASSWORD=ваш-надежный-пароль-16+символов
POSTGRES_DB=qlin
SECRET_KEY=ваш-сгенерированный-ключ-43-символа
TELEGRAM_BOT_TOKEN=ваш-токен-бота
TELEGRAM_WEBHOOK_SECRET=любой-секрет
NEXT_PUBLIC_API_URL=https://ваш-домен.com/api
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=ваш-ключ-яндекс
CORS_ORIGINS=https://ваш-домен.com,https://www.ваш-домен.com
```

**Сохраните:**
- В `nano`: `Ctrl+O` → `Enter` → `Ctrl+X`
- В `vi`: `Esc` → `:wq` → `Enter`

---

## 🛠️ Установка Docker (если нужно)

**Проверьте наличие Docker:**

```bash
docker --version
docker-compose --version
```

**Если не установлен:**

```bash
# Для Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Запустите Docker
sudo systemctl start docker
sudo systemctl enable docker

# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER
# Выйдите и войдите снова
```

---

## 📝 Права доступа

```bash
# На сервере
cd /var/www/qlin

# Сделайте скрипт исполняемым
chmod +x deploy.sh

# Установите права (если нужно)
chmod -R 755 .
```

---

## 🎯 Что дальше?

После успешной загрузки переходите к **Шагу 3: Настройка и запуск**

Выполните на сервере:
```bash
cd /var/www/qlin
./deploy.sh
```

---

## ❓ Частые вопросы

**Q: Как узнать IP адрес сервера?**  
A: В панели управления Timtweb или спросите у поддержки

**Q: Какой порт использовать для SSH?**  
A: Обычно 22, но уточните у Timtweb

**Q: Где найти SSH логин и пароль?**  
A: В панели управления Timtweb в разделе "SSH доступ"

**Q: Что делать, если не могу подключиться?**  
A: Проверьте:
- Правильность IP адреса
- Правильность логина/пароля
- Доступность порта 22
- Обратитесь в поддержку Timtweb

---

**Готово! Файлы загружены. Переходите к следующему шагу! 🚀**
