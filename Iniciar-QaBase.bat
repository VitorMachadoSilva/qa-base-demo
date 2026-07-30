@echo off
setlocal EnableExtensions
title QaBase - Inicializador

cd /d "%~dp0"
set "QABASE_ROOT=%~dp0"

echo.
echo ========================================
echo   QaBase - Inicializacao local
echo ========================================
echo.

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js e npm nao foram encontrados.
  echo Instale o Node.js LTS e tente novamente.
  echo.
  pause
  exit /b 1
)

if not exist "%QABASE_ROOT%backend\node_modules" (
  echo [1/4] Instalando dependencias do backend...
  pushd "%QABASE_ROOT%backend"
  call npm install
  if errorlevel 1 goto :install_error
  popd
)

if not exist "%QABASE_ROOT%frontend\node_modules" (
  echo [2/4] Instalando dependencias do frontend...
  pushd "%QABASE_ROOT%frontend"
  call npm install
  if errorlevel 1 goto :install_error
  popd
)

if not exist "%QABASE_ROOT%backend\.env" (
  echo [3/4] Criando configuracao local...
  copy "%QABASE_ROOT%backend\.env.example" "%QABASE_ROOT%backend\.env" >nul
)

echo [3/4] Preparando o PostgreSQL...
pushd "%QABASE_ROOT%backend"
call npm run db:deploy >nul
if errorlevel 1 (
  popd
  echo [ERRO] Nao foi possivel preparar o PostgreSQL.
  echo Confira DATABASE_URL e DIRECT_URL em backend\.env.
  pause
  exit /b 1
)
popd

powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -State Listen -LocalPort 3001 -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if errorlevel 1 (
  echo [4/4] Iniciando a API...
  pushd "%QABASE_ROOT%backend"
  start "QaBase Backend" /min cmd /k "title QaBase Backend && npm run dev"
  popd
) else (
  echo [4/4] A API ja esta ativa.
)

powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if errorlevel 1 (
  echo [4/4] Iniciando a interface...
  pushd "%QABASE_ROOT%frontend"
  start "QaBase Frontend" /min cmd /k "title QaBase Frontend && npm run dev -- --host 0.0.0.0 --port 5173 --strictPort"
  popd
) else (
  echo [4/4] A interface ja esta ativa.
)

echo.
echo Aguardando o QaBase ficar pronto...
set /a QABASE_ATTEMPTS=0

:wait_for_qabase
powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -State Listen -LocalPort 3001 -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if errorlevel 1 goto :wait_again
powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if errorlevel 1 goto :wait_again
goto :open_qabase

:wait_again
set /a QABASE_ATTEMPTS+=1
if %QABASE_ATTEMPTS% GEQ 30 goto :startup_timeout
ping 127.0.0.1 -n 2 >nul
goto :wait_for_qabase

:open_qabase
echo QaBase iniciado com sucesso.
start "" "http://localhost:5173"
exit /b 0

:startup_timeout
echo.
echo [ERRO] O QaBase nao respondeu em 30 segundos.
echo Verifique as janelas minimizadas "QaBase Backend" e "QaBase Frontend".
pause
exit /b 1

:install_error
popd
echo.
echo [ERRO] Nao foi possivel instalar as dependencias.
pause
exit /b 1
