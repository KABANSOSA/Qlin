@echo off
REM Деплой продакшена (Windows). Запускайте из корня репозитория или отсюда.
cd /d "%~dp0.."

echo === docker compose build ===
docker compose -f docker-compose.prod.yml build --no-cache
if errorlevel 1 exit /b 1

echo === docker compose up ===
docker compose -f docker-compose.prod.yml up -d
if errorlevel 1 exit /b 1

echo === alembic upgrade ===
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
if errorlevel 1 exit /b 1

echo === seed zones and pricing (idempotent) ===
docker compose -f docker-compose.prod.yml exec backend python -m app.db.seed
if errorlevel 1 exit /b 1

echo === Готово ===
