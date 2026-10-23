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

echo.
echo   ============================================================
echo     Starting FinSuraksha - KEEP THIS WINDOW OPEN.
echo     Closing this window stops the website. Ctrl+C also stops it.
echo   ============================================================

rem Opens the browser once the server is ready (or right away if it is already running).
node server.js --open
if errorlevel 1 pause
