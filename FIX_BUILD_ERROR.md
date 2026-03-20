# 🔧 Исправление ошибки сборки

## Проблема
Сборка frontend завершилась с ошибкой (Exited 1).

## Решение

### Шаг 1: Проверьте логи ошибки на сервере

```bash
# На сервере
docker logs caa050979348
```

Это покажет, в чем именно ошибка.

### Шаг 2: Очистите старые контейнеры и образы

```bash
# На сервере
cd /var/www/Qlin

# Остановите все
docker-compose -f docker-compose.prod.yml down

# Удалите старые образы
docker rmi $(docker images -q) 2>/dev/null || true

# Очистите систему
docker system prune -f
```

### Шаг 3: Используйте упрощенный Dockerfile

**Вариант A: Обновите код с GitHub (если изменения загружены)**

```bash
# На сервере
cd /var/www/Qlin
git pull
```

**Вариант B: Создайте упрощенный Dockerfile вручную**

```bash
# На сервере
cd /var/www/Qlin/frontend
nano Dockerfile.prod
```

Замените содержимое на:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install --legacy-peer-deps --progress=false

# Copy application code
COPY . .

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]
```

Сохраните: `Ctrl+O` → `Enter` → `Ctrl+X`

### Шаг 4: Попробуйте собрать снова

```bash
# На сервере
cd /var/www/Qlin

# Соберите с увеличенной памятью
docker-compose -f docker-compose.prod.yml build --no-cache --progress=plain frontend
```

### Шаг 5: Если не хватает памяти

```bash
# Увеличьте swap (временная память на диске)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Соберите снова
docker-compose -f docker-compose.prod.yml build --no-cache frontend
```

### Шаг 6: Альтернатива - используйте dev режим для начала

Если сборка не работает, можно временно использовать dev режим:

```bash
# Измените docker-compose.prod.yml
# В секции frontend замените:
#   dockerfile: Dockerfile.prod
# на:
#   dockerfile: Dockerfile

# И измените command на:
#   command: npm run dev
```

---

## Быстрое решение

Выполните на сервере:

```bash
cd /var/www/Qlin

# 1. Проверьте логи
docker logs caa050979348 | tail -50

# 2. Очистите все
docker-compose -f docker-compose.prod.yml down
docker system prune -f

# 3. Соберите заново с выводом ошибок
docker-compose -f docker-compose.prod.yml build --no-cache --progress=plain frontend 2>&1 | tee build.log

# 4. Если ошибка - посмотрите конец build.log
tail -100 build.log
```

---

## Частые ошибки и решения

### Ошибка: "Out of memory"
```bash
# Увеличьте swap (см. выше)
# Или соберите на более мощном сервере
```

### Ошибка: "Module not found"
```bash
# Проверьте package.json
# Убедитесь, что все зависимости указаны
```

### Ошибка: "Build failed"
```bash
# Проверьте логи детально
docker-compose -f docker-compose.prod.yml build --no-cache --progress=plain frontend
```

---

**Выполните команды на сервере и сообщите, что показывает `docker logs caa050979348`**
