#!/bin/bash

# Скрипт установки Docker и Docker Compose на Ubuntu/Debian

set -e

echo "🐳 Устанавливаем Docker и Docker Compose..."

# Обновляем пакеты
echo "📦 Обновляем список пакетов..."
sudo apt-get update

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Добавляем официальный GPG ключ Docker
echo "🔑 Добавляем GPG ключ Docker..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Настраиваем репозиторий
echo "📝 Настраиваем репозиторий Docker..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Устанавливаем Docker
echo "📦 Устанавливаем Docker..."
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Запускаем Docker
echo "▶️  Запускаем Docker..."
sudo systemctl start docker
sudo systemctl enable docker

# Добавляем текущего пользователя в группу docker
echo "👤 Добавляем пользователя в группу docker..."
sudo usermod -aG docker $USER

# Устанавливаем Docker Compose (standalone, если нужно)
echo "📦 Проверяем Docker Compose..."
if ! command -v docker compose &> /dev/null; then
    echo "📦 Устанавливаем Docker Compose standalone..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Проверяем установку
echo "✅ Проверяем установку..."
docker --version
docker compose version || docker-compose --version

echo ""
echo "🎉 Docker установлен успешно!"
echo "⚠️  ВАЖНО: Выйдите и войдите снова, чтобы изменения вступили в силу:"
echo "   exit"
echo "   # Затем подключитесь снова"
echo ""
echo "После этого запустите: ./deploy.sh"
