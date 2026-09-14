@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "LOG_DIR=logs"
set "SETUP_LOG=%LOG_DIR%\setup.log"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "memory" mkdir "memory"
if not exist "temp" mkdir "temp"
break > "%SETUP_LOG%"

echo ================================================================================
echo JARVIS ELITE v3.1 - SETUP AND DEPENDENCY INSTALLATION
echo ================================================================================
>> "%SETUP_LOG%" echo [%date% %time%] JARVIS ELITE v3.1 - SETUP

echo [1/9] Checking Node.js
>> "%SETUP_LOG%" echo [%date% %time%] [1/9] Checking Node.js
where node >nul 2>&1
if errorlevel 1 goto node_missing
for /f "delims=" %%v in ('node --version') do set "NODE_VERSION=%%v"
echo [OK] Node.js !NODE_VERSION!
>> "%SETUP_LOG%" echo [%date% %time%] [OK] Node.js !NODE_VERSION!

echo [2/9] Checking npm
>> "%SETUP_LOG%" echo [%date% %time%] [2/9] Checking npm
where npm >nul 2>&1
if errorlevel 1 goto npm_missing
for /f "delims=" %%v in ('npm --version') do set "NPM_VERSION=%%v"
echo [OK] npm !NPM_VERSION!
>> "%SETUP_LOG%" echo [%date% %time%] [OK] npm !NPM_VERSION!

echo [3/9] Installing Node dependencies
>> "%SETUP_LOG%" echo [%date% %time%] [3/9] Installing Node dependencies
call npm install >> "%SETUP_LOG%" 2>&1
if errorlevel 1 goto npm_install_failed
echo [OK] npm dependencies installed
>> "%SETUP_LOG%" echo [%date% %time%] [OK] npm dependencies installed

echo [4/9] Checking Python fallback runtime
>> "%SETUP_LOG%" echo [%date% %time%] [4/9] Checking Python fallback runtime
set "PY_VERSION="
set "PY_FULL_VERSION="
where python >nul 2>&1
if errorlevel 1 (
    echo [WARN] Python not found; FastAPI gateway unavailable
    >> "%SETUP_LOG%" echo [%date% %time%] [WARN] Python not found
) else (
    for /f "delims=" %%v in ('python -c "import sys; print(str(sys.version_info.major)+'.'+str(sys.version_info.minor))" 2^>nul') do set "PY_VERSION=%%v"
    for /f "delims=" %%v in ('python --version 2^>nul') do set "PY_FULL_VERSION=%%v"
    echo [OK] !PY_FULL_VERSION!
    >> "%SETUP_LOG%" echo [%date% %time%] [OK] !PY_FULL_VERSION!
)

echo [5/9] Installing Python dependencies
>> "%SETUP_LOG%" echo [%date% %time%] [5/9] Installing Python dependencies
set "PY_SUPPORTED=0"
if "!PY_VERSION!"=="3.10" set "PY_SUPPORTED=1"
if "!PY_VERSION!"=="3.11" set "PY_SUPPORTED=1"
if "!PY_VERSION!"=="3.12" set "PY_SUPPORTED=1"
if "!PY_VERSION!"=="" (
    echo [OK] Python dependency install skipped
    >> "%SETUP_LOG%" echo [%date% %time%] [OK] Python dependency install skipped
) else if "!PY_SUPPORTED!"=="1" (
    python -m pip install -r requirements.txt >> "%SETUP_LOG%" 2>&1
    if errorlevel 1 (
        echo [WARN] Python optional dependencies had issues; Node services continue
        >> "%SETUP_LOG%" echo [%date% %time%] [WARN] Python optional dependencies had issues
    ) else (
        echo [OK] Python dependencies installed
        >> "%SETUP_LOG%" echo [%date% %time%] [OK] Python dependencies installed
    )
) else (
    echo [WARN] Python !PY_VERSION! detected; optional deps skipped to avoid unsupported wheels
    >> "%SETUP_LOG%" echo [%date% %time%] [WARN] Python !PY_VERSION! unsupported for pinned optional deps
)

echo [6/9] Checking Ollama
>> "%SETUP_LOG%" echo [%date% %time%] [6/9] Checking Ollama
set "OLLAMA_READY=0"
where ollama >nul 2>&1
if errorlevel 1 (
    echo [WARN] Ollama not installed. Install from https://ollama.com/
    >> "%SETUP_LOG%" echo [%date% %time%] [WARN] Ollama not installed
) else (
    curl -sf http://127.0.0.1:11434/api/tags >nul 2>&1
    if errorlevel 1 (
        echo [INFO] Starting Ollama
        >> "%SETUP_LOG%" echo [%date% %time%] [INFO] Starting Ollama
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -WindowStyle Hidden -FilePath 'ollama' -ArgumentList 'serve'" >> "%SETUP_LOG%" 2>&1
        powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3" >nul 2>&1
    )
    curl -sf http://127.0.0.1:11434/api/tags >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Ollama is installed but not responding
        >> "%SETUP_LOG%" echo [%date% %time%] [WARN] Ollama not responding
    ) else (
        set "OLLAMA_READY=1"
        echo [OK] Ollama responding
        >> "%SETUP_LOG%" echo [%date% %time%] [OK] Ollama responding
    )
)

echo [7/9] Selecting optimal model from system RAM
>> "%SETUP_LOG%" echo [%date% %time%] [7/9] Selecting optimal model
set "TOTAL_GB=8"
set "FREE_GB=0"
for /f "usebackq tokens=1,2 delims=," %%a in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$os=Get-CimInstance Win32_OperatingSystem; '{0},{1}' -f [math]::Floor($os.TotalVisibleMemorySize/1048576), [math]::Floor($os.FreePhysicalMemory/1048576)"`) do (
    set "TOTAL_GB=%%a"
    set "FREE_GB=%%b"
)
set "RECOMMENDED_MODEL=llama3.2:1b"
if !TOTAL_GB! GEQ 12 set "RECOMMENDED_MODEL=qwen2.5:3b"
if !TOTAL_GB! LSS 12 set "RECOMMENDED_MODEL=llama3.2:1b"
echo [INFO] Available RAM: !FREE_GB!GB / !TOTAL_GB!GB total
echo [DECISION] Primary model: !RECOMMENDED_MODEL!
>> "%SETUP_LOG%" echo [%date% %time%] [INFO] RAM !FREE_GB!GB / !TOTAL_GB!GB
>> "%SETUP_LOG%" echo [%date% %time%] [DECISION] Primary model !RECOMMENDED_MODEL!

echo [8/9] Pulling selected model
>> "%SETUP_LOG%" echo [%date% %time%] [8/9] Pulling selected model
if "!OLLAMA_READY!"=="1" (
    if "%JARVIS_SKIP_MODEL_PULL%"=="1" (
        echo [OK] Model pull skipped by JARVIS_SKIP_MODEL_PULL=1
        >> "%SETUP_LOG%" echo [%date% %time%] [OK] Model pull skipped
    ) else (
        ollama pull !RECOMMENDED_MODEL! >> "%SETUP_LOG%" 2>&1
        if errorlevel 1 (
            echo [WARN] Model pull failed. Manual pull: ollama pull !RECOMMENDED_MODEL!
            >> "%SETUP_LOG%" echo [%date% %time%] [WARN] Model pull failed
        ) else (
            echo [OK] Model !RECOMMENDED_MODEL! ready
            >> "%SETUP_LOG%" echo [%date% %time%] [OK] Model !RECOMMENDED_MODEL! ready
        )
    )
) else (
    echo [WARN] Model pull skipped because Ollama is unavailable
    >> "%SETUP_LOG%" echo [%date% %time%] [WARN] Model pull skipped
)

echo [9/9] Running quality loop
>> "%SETUP_LOG%" echo [%date% %time%] [9/9] Running quality loop
call npm run quality >> "%SETUP_LOG%" 2>&1
if errorlevel 1 goto quality_failed
echo [OK] Quality loop passed
>> "%SETUP_LOG%" echo [%date% %time%] [OK] Quality loop passed

echo ================================================================================
echo [OK] SETUP COMPLETE
echo Model selected: !RECOMMENDED_MODEL!
echo RAM available: !FREE_GB!GB
echo Run: run.bat
echo Open: http://localhost:3000
echo ================================================================================
>> "%SETUP_LOG%" echo [%date% %time%] [OK] SETUP COMPLETE
if not "%JARVIS_CI%"=="1" pause
endlocal
exit /b 0

:node_missing
echo [ERROR] Node.js not found. Install from https://nodejs.org/
>> "%SETUP_LOG%" echo [%date% %time%] [ERROR] Node.js not found
if not "%JARVIS_CI%"=="1" pause
endlocal
exit /b 1

:npm_missing
echo [ERROR] npm not found. Reinstall Node.js.
>> "%SETUP_LOG%" echo [%date% %time%] [ERROR] npm not found
if not "%JARVIS_CI%"=="1" pause
endlocal
exit /b 1

:npm_install_failed
type "%SETUP_LOG%"
echo [ERROR] npm install failed
if not "%JARVIS_CI%"=="1" pause
endlocal
exit /b 1

:quality_failed
type "%SETUP_LOG%"
echo [ERROR] Quality loop failed
if not "%JARVIS_CI%"=="1" pause
endlocal
exit /b 1
