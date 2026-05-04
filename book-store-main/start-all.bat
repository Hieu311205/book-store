@echo off
setlocal

set "PHP_CMD=php"
where php >nul 2>nul
if errorlevel 1 set "PHP_CMD="

if not defined PHP_CMD if exist "C:\xampp\php\php.exe" set "PHP_CMD=C:\xampp\php\php.exe"
if not defined PHP_CMD if exist "C:\laragon\bin\php\php-8.3.0-Win32-vs16-x64\php.exe" set "PHP_CMD=C:\laragon\bin\php\php-8.3.0-Win32-vs16-x64\php.exe"
if not defined PHP_CMD if exist "C:\laragon\bin\php\php-8.2.0-Win32-vs16-x64\php.exe" set "PHP_CMD=C:\laragon\bin\php\php-8.2.0-Win32-vs16-x64\php.exe"
if not defined PHP_CMD if exist "C:\wamp64\bin\php\php8.3.0\php.exe" set "PHP_CMD=C:\wamp64\bin\php\php8.3.0\php.exe"
if not defined PHP_CMD if exist "C:\wamp64\bin\php\php8.2.0\php.exe" set "PHP_CMD=C:\wamp64\bin\php\php8.2.0\php.exe"

if not defined PHP_CMD (
  echo [LOI] Khong tim thay PHP.
  echo Cach nhanh nhat:
  echo   1. Cai XAMPP hoac Laragon.
  echo   2. Them thu muc chua php.exe vao PATH.
  echo      Vi du XAMPP: C:\xampp\php
  echo   3. Bat MySQL trong Laragon va extension pdo_mysql.
  echo.
  echo Kiem tra lai bang lenh:
  echo   php -v
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js/npm.
  pause
  exit /b 1
)

if not exist "frontend\node_modules" (
  echo [THIEU] frontend\node_modules chua ton tai. Dang cai frontend...
  call npm --prefix frontend install
  if errorlevel 1 exit /b 1
)

if not exist "admin-panel\node_modules" (
  echo [THIEU] admin-panel\node_modules chua ton tai. Dang cai admin-panel...
  call npm --prefix admin-panel install
  if errorlevel 1 exit /b 1
)

echo Dang chay backend, frontend va admin panel...
echo Backend:  http://127.0.0.1:5000
echo Frontend: http://127.0.0.1:3000
echo Admin:    http://127.0.0.1:3001

start "Backend PHP" cmd /k ""%PHP_CMD%" -S 127.0.0.1:5000 -t "%~dp0backend" "%~dp0backend\index.php""
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 127.0.0.1"
start "Admin Panel" cmd /k "cd /d "%~dp0admin-panel" && npm run dev -- --host 127.0.0.1"

endlocal
