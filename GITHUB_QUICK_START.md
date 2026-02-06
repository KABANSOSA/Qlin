# 🚀 GitHub деплой - Быстрая шпаргалка

## 📝 Команды для вашего компьютера

### 1. Первая загрузка в GitHub

```powershell
# Перейдите в папку проекта
cd "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO"

# Инициализируйте Git
git init

# Добавьте все файлы
git add .

# Создайте первый коммит
git commit -m "Initial commit - QLIN project"

# Подключите GitHub (замените URL!)
git remote add origin https://github.com/ваш-username/qlin.git

# Загрузите код
git push -u origin main
```

### 2. Обновление кода в GitHub

```powershell
# После изменений в коде
git add .
git commit -m "Описание изменений"
git push
```

---

## 📝 Команды для сервера Timtweb

### 1. Первое клонирование

```bash
# Перейдите в папку для сайтов
cd /var/www

# Клонируйте репозиторий (замените URL!)
git clone https://github.com/ваш-username/qlin.git

# Перейдите в папку проекта
cd qlin

# Создайте .env файл
nano .env
# Вставьте содержимое из .env.production

# Запустите деплой
chmod +x deploy.sh
./deploy.sh
```

### 2. Обновление на сервере

```bash
# Перейдите в папку проекта
cd /var/www/qlin

# Получите обновления
git pull

# Пересоберите и перезапустите
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Примените миграции (если есть)
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## 🔑 Создание Personal Access Token (для приватных репозиториев)

1. Зайдите: https://github.com/settings/tokens
2. Нажмите "Generate new token (classic)"
3. Название: `QLIN Deploy`
4. Срок: выберите нужный
5. Отметьте: `repo` (полный доступ)
6. Нажмите "Generate token"
7. **Скопируйте токен** (показывается только один раз!)

**Использование токена:**
- При `git push` - используйте токен как пароль
- При `git clone` - `git clone https://токен@github.com/username/qlin.git`

---

## ✅ Проверка на каждом этапе

### На компьютере:
```powershell
# Проверьте статус
git status

# Проверьте подключение к GitHub
git remote -v

# Проверьте коммиты
git log --oneline
```

### На сервере:
```bash
# Проверьте файлы
ls -la

# Проверьте статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Проверьте логи
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 📚 Подробная инструкция

Смотрите файл **`GITHUB_DEPLOY_GUIDE.md`** для детальных объяснений каждого шага.

---

**Успешного деплоя! 🚀**
