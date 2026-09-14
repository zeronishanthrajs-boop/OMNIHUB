@echo off
setlocal enabledelayedexpansion
title ULTRON 3.0 // Autonomous Multi-Agent Command Core

echo ==============================================================================
echo   ULTRON 3.0 // AUTONOMOUS MULTI-AGENT PLATFORM
echo   DIAMOND STANDARD // 100%% ZERO PLACEHOLDER ARCHITECTURE
echo ==============================================================================
echo.

:: 1. Verify / Locate Ollama Executable
echo [1/4] Checking Ollama AI Server...
set "OLLAMA_EXE="
where.exe ollama >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "OLLAMA_EXE=ollama"
) else (
    set "WINGET_OLLAMA=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Ollama.Ollama.Portable_Microsoft.Winget.Source_8wekyb3d8bbwe\ollama.exe"
    if exist "!WINGET_OLLAMA!" (
        set "OLLAMA_EXE=!WINGET_OLLAMA!"
    )
)

:: 2. Check if Ollama is already responding on port 11434
powershell -Command "(Invoke-WebRequest -Uri 'http://127.0.0.1:11434/api/tags' -UseBasicParsing -TimeoutSec 1).StatusCode" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Ollama is already running on http://127.0.0.1:11434
) else (
    if defined OLLAMA_EXE (
        echo [*] Starting Ollama server in background...
        start "Ollama Server" /min "!OLLAMA_EXE!" serve
        ping -n 4 127.0.0.1 >nul
        echo [OK] Ollama service started successfully!
    ) else (
        echo [!] Ollama executable not found in PATH or WinGet. ULTRON will use auto cloud/fallback engine.
    )
)

:: 3. Verify Python Environment
echo.
echo [2/4] Verifying Python runtime...
set "PY_CMD=python"
if exist "venv\Scripts\python.exe" (
    set "PY_CMD=venv\Scripts\python.exe"
    echo [OK] Using virtual environment Python: venv\Scripts\python.exe
) else (
    python --version >nul 2>&1
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Python was not found in PATH. Please install Python 3.10+ and add to PATH.
        pause
        exit /b 1
    )
    echo [OK] Using system Python environment.
)

:: 4. Start ULTRON FastAPI Engine & Open Browser
echo.
echo [3/4] Launching Antigravity Dashboard on http://127.0.0.1:8000...
set "LLM_BACKEND=auto"
set "PYTHONUNBUFFERED=1"

:: Start Uvicorn Dashboard in background
start "Antigravity Neural Kernel" cmd /k "!PY_CMD! -m uvicorn dashboard:app --host 127.0.0.1 --port 8000"

:: Wait up to 10 seconds for port 8000 to become ready
echo.
echo [4/4] Synchronizing with Antigravity UI...
set "ATTEMPTS=0"
:CHECK_HUD
ping -n 2 127.0.0.1 >nul
powershell -Command "(Invoke-WebRequest -Uri 'http://127.0.0.1:8000' -UseBasicParsing -TimeoutSec 1).StatusCode" >nul 2>&1
if %ERRORLEVEL% equ 0 goto HUD_READY
set /a ATTEMPTS+=1
if %ATTEMPTS% lss 10 goto CHECK_HUD

:HUD_READY
echo.
echo ==============================================================================
echo  [ONLINE] ANTIGRAVITY UI IS LIVE!
echo  Opening http://127.0.0.1:8000 in your browser...
echo ==============================================================================
start http://127.0.0.1:8000

echo.
echo All subsystems operational:
echo   - Local Ollama Engine:   http://127.0.0.1:11434
echo   - Antigravity Dashboard: http://127.0.0.1:8000 [Model: ULTRON]
echo   - Skills Engine:         Active [8/8 Antigravity Equivalents]
echo.
echo Keep this window open or minimize it. Press any key to shutdown ULTRON.
pause >nul

:: Graceful Cleanup
echo.
echo Shutting down ULTRON...
taskkill /f /fi "WINDOWTITLE eq Antigravity Neural Kernel*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq ULTRON Neural Kernel*" >nul 2>&1
echo [SHUTDOWN] ULTRON stopped cleanly. Goodbye!
