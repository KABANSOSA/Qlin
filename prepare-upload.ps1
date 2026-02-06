# PowerShell скрипт для подготовки проекта к загрузке на сервер
# Исключает ненужные папки и создает архив

Write-Host "📦 Подготовка проекта QLIN к загрузке на сервер..." -ForegroundColor Cyan

# Переходим в папку проекта
$projectPath = "C:\Users\бадан\OneDrive\Рабочий стол\QLINPRO"
Set-Location $projectPath

Write-Host "`n📁 Текущая директория: $projectPath" -ForegroundColor Yellow

# Список папок и файлов для исключения
$excludeItems = @(
    "node_modules",
    ".next",
    "__pycache__",
    ".git",
    ".env",
    "*.log",
    "qlin.zip",
    "qlin.tar.gz"
)

Write-Host "`n🚫 Исключаем из архива:" -ForegroundColor Yellow
foreach ($item in $excludeItems) {
    Write-Host "   - $item" -ForegroundColor Gray
}

# Проверяем наличие 7-Zip
$7zipPath = "C:\Program Files\7-Zip\7z.exe"
if (Test-Path $7zipPath) {
    Write-Host "`n✅ Найден 7-Zip, создаем архив..." -ForegroundColor Green
    
    # Создаем архив с исключениями
    & $7zipPath a -tzip "qlin.zip" * -xr!node_modules -xr!.next -xr!__pycache__ -xr!.git -xr!.env -xr!*.log -xr!qlin.zip -xr!qlin.tar.gz
    
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item "qlin.zip").Length / 1MB
        Write-Host "`n✅ Архив создан успешно!" -ForegroundColor Green
        Write-Host "   📦 Файл: qlin.zip" -ForegroundColor Cyan
        Write-Host "   📊 Размер: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
        Write-Host "`n📤 Теперь загрузите qlin.zip на сервер через SFTP/FileZilla" -ForegroundColor Yellow
    } else {
        Write-Host "`n❌ Ошибка при создании архива" -ForegroundColor Red
    }
} else {
    Write-Host "`n⚠️  7-Zip не найден. Используем встроенный Compress-Archive..." -ForegroundColor Yellow
    Write-Host "   (Этот метод может быть медленнее)" -ForegroundColor Gray
    
    # Создаем временную папку без исключенных элементов
    $tempFolder = "qlin_temp"
    if (Test-Path $tempFolder) {
        Remove-Item -Recurse -Force $tempFolder
    }
    New-Item -ItemType Directory -Path $tempFolder | Out-Null
    
    # Копируем файлы, исключая ненужные
    Get-ChildItem -Path . -Exclude $excludeItems | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination "$tempFolder\$($_.Name)" -Recurse -Force
    }
    
    # Создаем архив
    Compress-Archive -Path "$tempFolder\*" -DestinationPath "qlin.zip" -Force
    
    # Удаляем временную папку
    Remove-Item -Recurse -Force $tempFolder
    
    $fileSize = (Get-Item "qlin.zip").Length / 1MB
    Write-Host "`n✅ Архив создан успешно!" -ForegroundColor Green
    Write-Host "   📦 Файл: qlin.zip" -ForegroundColor Cyan
    Write-Host "   📊 Размер: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
    Write-Host "`n📤 Теперь загрузите qlin.zip на сервер через SFTP/FileZilla" -ForegroundColor Yellow
}

Write-Host "`n📝 Следующие шаги:" -ForegroundColor Cyan
Write-Host "   1. Загрузите qlin.zip на сервер через SFTP" -ForegroundColor White
Write-Host "   2. На сервере: cd /var/www" -ForegroundColor White
Write-Host "   3. На сервере: unzip qlin.zip -d qlin" -ForegroundColor White
Write-Host "   4. На сервере: cd qlin" -ForegroundColor White
Write-Host "   5. Создайте .env файл на сервере" -ForegroundColor White
Write-Host "   6. Запустите: ./deploy.sh" -ForegroundColor White

Write-Host "`n✨ Готово!" -ForegroundColor Green
