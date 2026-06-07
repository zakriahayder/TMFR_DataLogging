@echo off
title TMFR Data Viewer
echo ================================================
echo   TMFR Data Viewer - Starting up...
echo ================================================
echo.

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

REM Check that the virtual environment exists
if not exist "%ROOT%\.venv\Scripts\activate.bat" (
    echo ERROR: Python virtual environment not found.
    echo Please run: python -m venv .venv
    echo Then:       .venv\Scripts\activate ^&^& pip install -e .
    pause
    exit /b 1
)

REM Check that pnpm is available
where pnpm >nul 2>&1
if errorlevel 1 (
    echo ERROR: pnpm is not installed or not on PATH.
    echo Install it from: https://pnpm.io/installation
    pause
    exit /b 1
)

echo [1/3] Starting backend server...
start "TMFR Backend" cmd /k "cd /d "%ROOT%" && .venv\Scripts\activate && uvicorn backend.main:app --reload"

echo [2/3] Starting frontend...
start "TMFR Frontend" cmd /k "cd /d "%ROOT%\frontend" && pnpm dev"

echo [3/3] Opening browser (waiting 10 seconds for servers to start)...
timeout /t 10 /nobreak >nul
start http://localhost:3000

echo.
echo Both servers are running in separate windows.
echo Close the "TMFR Backend" and "TMFR Frontend" windows to stop them.
echo.
pause
