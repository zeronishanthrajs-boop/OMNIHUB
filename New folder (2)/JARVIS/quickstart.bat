@echo off
setlocal enabledelayedexpansion
title JARVIS Elite - Quick Start
cd /d "%~dp0"
color 0B

echo ===============================================================================
echo                      JARVIS ELITE - QUICK START
echo                    Active Model: Qwen2.5-Coder 7B
echo ===============================================================================
echo.

if not exist logs mkdir logs

:start_flow
:: 1. Free any occupied ports (3000, 3001, 8000)
echo [1/5] Checking and releasing ports 3000, 3001, 8000...
for %%P in (3000 3001 8000) do (
    for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr /R /C:":%%P .*LISTENING"') do (
        echo   - Releasing port %%P, PID %%p...
        taskkill /PID %%p /F >nul 2>&1
    )
)
ping -n 2 127.0.0.1 >nul

:: 2. Ensure Ollama is running
echo [2/5] Checking Ollama engine on port 11434...
curl -sf http://127.0.0.1:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo   - Starting Ollama daemon in background...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -WindowStyle Hidden -FilePath 'ollama' -ArgumentList 'serve'"
    ping -n 3 127.0.0.1 >nul
)
curl -sf http://127.0.0.1:11434/api/tags >nul 2>&1
if not errorlevel 1 (
    echo   [OK] Ollama is online with Qwen2.5-Coder 7B.
) else (
    echo   [WARN] Ollama starting in background; continuing...
)

:: 3. Start Express Backend
echo [3/5] Starting Express Backend on port 3001...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$cwd=(Get-Location).Path; Start-Process -WindowStyle Hidden -WorkingDirectory $cwd -FilePath 'cmd.exe' -ArgumentList '/d','/s','/c','call npm.cmd run server:start > logs\backend.log 2> logs\backend.err.log'"

:: 4. Start FastAPI Python Core
echo [4/5] Starting FastAPI Core on port 8000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$cwd=(Get-Location).Path; Start-Process -WindowStyle Hidden -WorkingDirectory $cwd -FilePath 'cmd.exe' -ArgumentList '/d','/s','/c','python main.py > logs\fastapi.log 2> logs\fastapi.err.log'"

:: 5. Start Vite Frontend HUD
echo [5/5] Starting Vite HUD on port 3000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$cwd=(Get-Location).Path; Start-Process -WindowStyle Hidden -WorkingDirectory $cwd -FilePath 'cmd.exe' -ArgumentList '/d','/s','/c','call npm.cmd run dev > logs\frontend.log 2> logs\frontend.err.log'"

:: Wait and verify health of backend
echo.
echo Verifying services...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$d=(Get-Date).AddSeconds(15); do { try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3001/api/health' -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Milliseconds 500 } while ((Get-Date) -lt $d); exit 1"
if errorlevel 1 (
    echo [WARN] Express backend still initializing. Logs:
    if exist logs\backend.err.log type logs\backend.err.log
) else (
    echo [OK] Express backend responding on port 3001.
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$d=(Get-Date).AddSeconds(10); do { try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000' -TimeoutSec 2; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } } catch {}; Start-Sleep -Milliseconds 500 } while ((Get-Date) -lt $d); exit 1"
if errorlevel 1 (
    echo [WARN] Vite HUD still initializing. Logs:
    if exist logs\frontend.err.log type logs\frontend.err.log
) else (
    echo [OK] Vite HUD responding on port 3000.
)

:: Launch browser
echo Opening HUD in default browser...
start http://localhost:3000

cls
echo ===============================================================================
echo                      JARVIS ELITE IS OPERATIONAL
echo ===============================================================================
echo.
echo   * Vite Frontend HUD:    http://localhost:3000
echo   * Express Backend API:  http://localhost:3001
echo   * FastAPI AI Core:      http://localhost:8000
echo   * Ollama Brain Engine:  http://127.0.0.1:11434 (Qwen2.5-Coder 7B)
echo   * WSL / Hermes Link:    http://127.0.0.1:8000/v1
echo.
echo ===============================================================================
echo   Press [O] to open HUD in browser again
echo   Press [R] to restart all services
echo   Press [S] or [Q] to shut down all JARVIS services and exit
echo ===============================================================================

:menu_loop
choice /c ORSQ /n /m "Select option (O/R/S/Q): "
if errorlevel 4 goto do_shutdown
if errorlevel 3 goto do_shutdown
if errorlevel 2 goto do_restart
if errorlevel 1 goto do_open

:do_open
start http://localhost:3000
goto menu_loop

:do_restart
echo.
echo Restarting JARVIS services...
call "%~dp0stop.bat"
cls
goto start_flow

:do_shutdown
echo.
echo Stopping all JARVIS services...
call "%~dp0stop.bat"
exit /b 0