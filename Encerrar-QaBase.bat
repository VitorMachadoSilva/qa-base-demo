@echo off
setlocal EnableExtensions
title QaBase - Encerramento

echo.
echo ========================================
echo   QaBase - Encerramento local
echo ========================================
echo.

echo Encerrando API e interface...
taskkill /FI "WINDOWTITLE eq QaBase Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq QaBase Frontend*" /T /F >nul 2>&1

for /L %%R in (1,1,3) do (
  for %%P in (3001 5173) do (
    for /F %%I in ('powershell.exe -NoProfile -Command "$connections = Get-NetTCPConnection -State Listen -LocalPort %%P -ErrorAction SilentlyContinue; foreach ($connection in $connections) { $connection.OwningProcess }"') do (
      taskkill /PID %%I /T /F >nul 2>&1
    )
  )
  ping 127.0.0.1 -n 2 >nul
)

powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -State Listen -LocalPort 3001 -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if not errorlevel 1 goto :stop_error
powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if not errorlevel 1 goto :stop_error

echo QaBase encerrado com sucesso.
exit /b 0

:stop_error
echo.
echo [AVISO] Um dos servicos ainda esta ativo.
echo Feche as janelas "QaBase Backend" e "QaBase Frontend" manualmente.
pause
exit /b 1
