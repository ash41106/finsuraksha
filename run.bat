@echo off
title FinSuraksha
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Download it from https://nodejs.org ^(version 18 or newer^).
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies - first run only...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

if not exist .env if exist .env.example copy .env.example .env >nul

rem Open the browser a few seconds after the server starts.
start "" /b cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

echo Starting FinSuraksha... close this window to stop the server.
call npm start
pause
