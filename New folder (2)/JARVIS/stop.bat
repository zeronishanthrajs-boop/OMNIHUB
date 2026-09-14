@echo off
setlocal enabledelayedexpansion
title JARVIS Elite - Shutdown
cd /d "%~dp0"
color 0C

echo ===============================================================================
echo                        STOPPING JARVIS ELITE
echo ===============================================================================
echo.

echo Releasing ports (3000, 3001, 8000)...
for %%P in (3000 3001 8000) do (
    for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr /R /C:":%%P .*LISTENING"') do (
        echo   - Stopping PID %%p on port %%P...
        taskkill /PID %%p /F >nul 2>&1
    )
)

echo Cleaning temporary cache...
if exist temp (
    del /q temp\*.lock >nul 2>&1
    del /q temp\*.tmp >nul 2>&1
)

echo.
echo ===============================================================================
echo [OK] All JARVIS services have been stopped.
echo ===============================================================================
ping -n 3 127.0.0.1 >nul
exit /b 0