@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

:: Environment overrides for memory efficiency and startup performance
set "OLLAMA_MAX_LOADED_MODELS=1"
set "JARVIS_PREWARM_MODEL=1"

set "LOG_DIR=logs"
set "RUN_LOG=%LOG_DIR%\run.log"
set "BACKEND_LOG=%LOG_DIR%\backend.log"
set "BACKEND_ERR=%LOG_DIR%\backend.err.log"
set "FRONTEND_LOG=%LOG_DIR%\frontend.log"
set "FRONTEND_ERR=%LOG_DIR%\frontend.err.log"
set "FASTAPI_LOG=%LOG_DIR%\fastapi.log"
set "FASTAPI_ERR=%LOG_DIR%\fastapi.err.log"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
break > "%RUN_LOG%"

echo ================================================================================
echo JARVIS ELITE v3.1 - STARTING ALL SERVICES
echo ================================================================================
>> "%RUN_LOG%" echo [%date% %time%] JARVIS ELITE v3.1 - RUN

if not exist package.json (
    echo [ERROR] package.json not found
    >> "%RUN_LOG%" echo [%date% %time%] [ERROR] package.json not found
    endlocal
    exit /b 1
)

if not exist node_modules (
    echo [INFO] node_modules missing; running setup.bat
    >> "%RUN_LOG%" echo [%date% %time%] [INFO] node_modules missing; running setup.bat
    call setup.bat
    if errorlevel 1 (
        echo [ERROR] setup.bat failed
        >> "%RUN_LOG%" echo [%date% %time%] [ERROR] setup.bat failed
        endlocal
        exit /b 1
    )
)

echo [1/7] Checking for port conflicts
>> "%RUN_LOG%" echo [%date% %time%] [1/7] Checking for port conflicts
for %%P in (3001 3000 8000) do (
    for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
        echo [INFO] Stopping PID %%p on port %%P
        >> "%RUN_LOG%" echo [%date% %time%] [INFO] Stopping PID %%p on port %%P
        taskkill /PID %%p /F >nul 2>&1
    )
)
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 1" >nul 2>&1
break > "%BACKEND_LOG%" 2>nul
break > "%BACKEND_ERR%" 2>nul
break > "%FRONTEND_LOG%" 2>nul
break > "%FRONTEND_ERR%" 2>nul
break > "%FASTAPI_LOG%" 2>nul
break > "%FASTAPI_ERR%" 2>nul
echo [OK] Port check complete
>> "%RUN_LOG%" echo [%date% %time%] [OK] Port check complete

echo [2/7] Checking Ollama
>> "%RUN_LOG%" echo [%date% %time%] [2/7] Checking Ollama
where ollama >nul 2>&1
if errorlevel 1 (
    echo [WARN] Ollama not installed; fallback mode active
    >> "%RUN_LOG%" echo [%date% %time%] [WARN] Ollama not installed
) else (
    curl -sf http://127.0.0.1:11434/api/tags >nul 2>&1
    if errorlevel 1 (
        echo [INFO] Starting Ollama
        >> "%RUN_LOG%" echo [%date% %time%] [INFO] Starting Ollama
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -WindowStyle Hidden -FilePath 'ollama' -ArgumentList 'serve'" >> "%RUN_LOG%" 2>&1
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3" >nul 2>&1
    )
    curl -sf http://127.0.0.1:11434/api/tags >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Ollama offline; fallback mode active
        >> "%RUN_LOG%" echo [%date% %time%] [WARN] Ollama offline
    ) else (
        echo [OK] Ollama responding
        >> "%RUN_LOG%" echo [%date% %time%] [OK] Ollama responding
    )
)

if "%JARVIS_CI%"=="1" (
    echo [OK] CI validation complete
    >> "%RUN_LOG%" echo [%date% %time%] [OK] CI validation complete
    endlocal
    exit /b 0
)

echo [3/7] Starting Express backend on port 3001
>> "%RUN_LOG%" echo [%date% %time%] [3/7] Starting Express backend
powershell -NoProfile -ExecutionPolicy Bypass -Command "$cwd=(Get-Location).Path; Start-Process -WindowStyle Hidden -WorkingDirectory $cwd -FilePath 'cmd.exe' -ArgumentList '/d','/s','/c','call npm run server:start > logs\backend.log 2> logs\backend.err.log'" >> "%RUN_LOG%" 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(30); do { try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3001/api/health' -TimeoutSec 2; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } } catch {}; Start-Sleep -Seconds 1 } while ((Get-Date) -lt $deadline); exit 1"
if errorlevel 1 goto backend_failed
echo [OK] Express backend responding
>> "%RUN_LOG%" echo [%date% %time%] [OK] Express backend responding

echo [4/7] Starting Vite frontend on port 3000
>> "%RUN_LOG%" echo [%date% %time%] [4/7] Starting Vite frontend
powershell -NoProfile -ExecutionPolicy Bypass -Command "$cwd=(Get-Location).Path; Start-Process -WindowStyle Hidden -WorkingDirectory $cwd -FilePath 'cmd.exe' -ArgumentList '/d','/s','/c','call npm run dev > logs\frontend.log 2> logs\frontend.err.log'" >> "%RUN_LOG%" 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(30); do { try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000' -TimeoutSec 2; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } } catch {}; Start-Sleep -Seconds 1 } while ((Get-Date) -lt $deadline); exit 1"
if errorlevel 1 goto frontend_failed
echo [OK] Vite frontend responding
>> "%RUN_LOG%" echo [%date% %time%] [OK] Vite frontend responding

echo [5/7] Starting FastAPI OpenAI gateway on port 8000
>> "%RUN_LOG%" echo [%date% %time%] [5/7] Starting FastAPI gateway
powershell -NoProfile -ExecutionPolicy Bypass -Command "$cwd=(Get-Location).Path; Start-Process -WindowStyle Hidden -WorkingDirectory $cwd -FilePath 'cmd.exe' -ArgumentList '/d','/s','/c','python main.py > logs\fastapi.log 2> logs\fastapi.err.log'" >> "%RUN_LOG%" 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(45); do { try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8000/health' -TimeoutSec 2; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } } catch {}; Start-Sleep -Seconds 1 } while ((Get-Date) -lt $deadline); exit 1"
if errorlevel 1 goto fastapi_failed
echo [OK] FastAPI gateway responding
>> "%RUN_LOG%" echo [%date% %time%] [OK] FastAPI gateway responding

echo [6/7] Verifying API loops
>> "%RUN_LOG%" echo [%date% %time%] [6/7] Verifying API loops
curl -sf -X POST http://127.0.0.1:3001/api/integrations/venom/watch >nul 2>&1
if errorlevel 1 goto loops_failed
curl -sf http://127.0.0.1:3001/api/integrations/venom/health >nul 2>&1
if errorlevel 1 goto loops_failed
curl -sf http://127.0.0.1:3001/api/message/pending >nul 2>&1
if errorlevel 1 goto loops_failed
curl -sf http://127.0.0.1:8000/v1/models >nul 2>&1
if errorlevel 1 goto loops_failed
echo [OK] API loop routes responding
>> "%RUN_LOG%" echo [%date% %time%] [OK] API loop routes responding

echo [7/7] Starting memory monitoring notice
>> "%RUN_LOG%" echo [%date% %time%] [7/7] Memory monitoring active in FastAPI
echo [INFO] RAM guard threshold: 600MB free
echo [INFO] Close other applications if model cold starts are slow.

powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process 'http://localhost:3000'" >> "%RUN_LOG%" 2>&1

echo ================================================================================
echo [OK] ALL SERVICES STARTED
echo Express Backend: http://localhost:3001
echo Vite Frontend:   http://localhost:3000
echo FastAPI Gateway: http://localhost:8000
echo Ollama:          http://127.0.0.1:11434
echo WSL/Hermes API:  http://127.0.0.1:8000/v1/chat/completions
echo ================================================================================
>> "%RUN_LOG%" echo [%date% %time%] [OK] ALL SERVICES STARTED
endlocal
exit /b 0

:backend_failed
echo [ERROR] Express backend failed to start
>> "%RUN_LOG%" echo [%date% %time%] [ERROR] Express backend failed
if exist "%BACKEND_ERR%" type "%BACKEND_ERR%"
if exist "%BACKEND_LOG%" type "%BACKEND_LOG%"
endlocal
exit /b 1

:frontend_failed
echo [ERROR] Vite frontend failed to start
>> "%RUN_LOG%" echo [%date% %time%] [ERROR] Vite frontend failed
if exist "%FRONTEND_ERR%" type "%FRONTEND_ERR%"
if exist "%FRONTEND_LOG%" type "%FRONTEND_LOG%"
endlocal
exit /b 1

:fastapi_failed
echo [ERROR] FastAPI gateway failed to start
>> "%RUN_LOG%" echo [%date% %time%] [ERROR] FastAPI failed
if exist "%FASTAPI_ERR%" type "%FASTAPI_ERR%"
if exist "%FASTAPI_LOG%" type "%FASTAPI_LOG%"
endlocal
exit /b 1

:loops_failed
echo [ERROR] API loop verification failed
>> "%RUN_LOG%" echo [%date% %time%] [ERROR] API loop verification failed
if exist "%BACKEND_ERR%" type "%BACKEND_ERR%"
if exist "%BACKEND_LOG%" type "%BACKEND_LOG%"
if exist "%FASTAPI_ERR%" type "%FASTAPI_ERR%"
if exist "%FASTAPI_LOG%" type "%FASTAPI_LOG%"
endlocal
exit /b 1
