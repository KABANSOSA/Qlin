# 🐳 Установка Docker Desktop для Windows

## Шаг 1: Скачайте Docker Desktop

1. Откройте браузер и перейдите на:
   **https://www.docker.com/products/docker-desktop**

2. Нажмите кнопку **"Download for Windows"**

3. Будет скачан файл `Docker Desktop Installer.exe` (около 500 МБ)

## Шаг 2: Установите Docker Desktop

1. **Запустите** скачанный файл `Docker Desktop Installer.exe`

2. Следуйте инструкциям установщика:
   - Примите лицензионное соглашение
   - Выберите "Use WSL 2 instead of Hyper-V" (если доступно)
   - Нажмите "Install"

3. **Дождитесь завершения установки** (5-10 минут)

4. После установки нажмите **"Close and restart"** или перезапустите компьютер вручную

## Шаг 3: Запустите Docker Desktop

1. После перезагрузки найдите **Docker Desktop** в меню Пуск

2. Запустите приложение

3. При первом запуске:
   - Примите условия использования
   - Войдите в Docker Hub (или пропустите - необязательно)
   - Дождитесь полной загрузки (иконка в трее станет зеленой)

4. **Проверьте статус:**
   - В правом нижнем углу (трей) должна быть иконка Docker
   - Иконка должна быть **зеленой** (не красной или желтой)
   - При наведении должно показывать "Docker Desktop is running"

## Шаг 4: Проверьте установку

Откройте PowerShell и выполните:

```powershell
docker --version
```

**Ожидаемый результат:**
```
Docker version 24.0.0, build xxxxx
```

Если видите версию - Docker установлен правильно! ✅

## Шаг 5: Проверьте Docker Compose

```powershell
docker-compose --version
```

**Ожидаемый результат:**
```
Docker Compose version v2.x.x
```

## Требования системы

- **Windows 10 64-bit:** Pro, Enterprise, или Education (Build 15063 или новее)
- **Windows 11 64-bit:** Home или Pro версия 21H2 или новее
- **WSL 2** (рекомендуется) или Hyper-V
- **Минимум 4 ГБ RAM** (рекомендуется 8 ГБ)
- **Включена виртуализация** в BIOS

## Проверка виртуализации

Если Docker не запускается, проверьте виртуализацию:

1. Откройте **Диспетчер задач** (Ctrl+Shift+Esc)
2. Перейдите на вкладку **"Производительность"**
3. Выберите **"ЦП"**
4. Внизу должно быть написано **"Виртуализация: Включено"**

Если виртуализация отключена:
- Перезагрузите компьютер
- Зайдите в BIOS/UEFI
- Включите виртуализацию (Intel VT-x или AMD-V)
- Сохраните и перезагрузите

## Альтернатива: WSL 2 (рекомендуется)

Если у вас Windows 10/11, лучше использовать WSL 2:

1. Откройте PowerShell **от имени администратора**

2. Выполните:
```powershell
wsl --install
```

3. Перезагрузите компьютер

4. После перезагрузки WSL 2 установится автоматически

5. Docker Desktop автоматически использует WSL 2

## Решение проблем

### Проблема: "Docker Desktop не запускается"

**Решение:**
1. Запустите PowerShell от имени администратора
2. Выполните:
```powershell
# Остановите все процессы Docker
Get-Process "*Docker*" | Stop-Process -Force

# Перезапустите Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

### Проблема: "WSL 2 installation is incomplete"

**Решение:**
1. Откройте PowerShell от имени администратора
2. Выполните:
```powershell
wsl --update
wsl --set-default-version 2
```

### Проблема: "Hardware assisted virtualization and data execution protection must be enabled"

**Решение:**
1. Включите виртуализацию в BIOS
2. Включите DEP (Data Execution Prevention) в Windows

### Проблема: Команда docker не найдена после установки

**Решение:**
1. Перезапустите PowerShell (закройте и откройте заново)
2. Перезагрузите компьютер
3. Проверьте PATH: Docker должен быть в системном PATH автоматически

## После успешной установки

Когда Docker Desktop запущен и работает:

1. ✅ Иконка в трее зеленая
2. ✅ `docker --version` показывает версию
3. ✅ `docker-compose --version` показывает версию

**Теперь можно переходить к ШАГ 2: Запуск проекта!**

```powershell
cd "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO"
docker-compose up -d
```

---

## Быстрая ссылка для скачивания

**Docker Desktop для Windows:**
https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

Или перейдите на официальный сайт:
https://www.docker.com/products/docker-desktop
