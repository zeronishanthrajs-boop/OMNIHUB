@echo off
setlocal enabledelayedexpansion
title OMNIHUB // MULTI-PORT ECOSYSTEM LAUNCHER
color 0B

set "CHROME_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "EDGE_EXE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

set "BROWSER_CMD=start """
if exist "!CHROME_EXE!" (
    set "BROWSER_CMD="!CHROME_EXE!""
) else if exist "!EDGE_EXE!" (
    set "BROWSER_CMD="!EDGE_EXE!""
)

echo ==============================================================================
echo           OMNIHUB - UNIFIED MULTI-PORT COMMAND CENTER & WORKSPACE            
echo ==============================================================================
echo.
echo [*] Dispatching all 12 interconnected systems across separate ports...
echo.

:: 1. Launch background ecosystem services on their dedicated ports
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0OmniHub\start_ecosystem.ps1"

:: 2. Launch OmniHub Master Server in independent background process
start "OmniHub Server" /min cmd /c "cd /d "%~dp0OmniHub" && node server.js"

:: Wait briefly for master server to bind port 8080
timeout /t 3 /nobreak >nul

:: Launch Master Dashboard in real browser
echo.
echo [*] Launching Master Interface: http://localhost:8080 ...
if exist "!CHROME_EXE!" (
    start "" "!CHROME_EXE!" "http://localhost:8080"
) else if exist "!EDGE_EXE!" (
    start "" "!EDGE_EXE!" "http://localhost:8080"
) else (
    start "" "http://localhost:8080"
)

:MENU
echo.
echo ==============================================================================
echo                     OMNIHUB MULTI-PORT INTERACTIVE MENU                      
echo ==============================================================================
echo  [A]  Open ALL 12 Systems in separate browser tabs (Google Chrome)
echo  [E]  Open ALL 12 Systems in separate browser tabs (Microsoft Edge)
echo  [O]  Open OmniHub Command Center (http://localhost:8080)
echo.
echo  --- Individual Dedicated Ports & Live Cloud Deployments ---
echo  [1]  CYBER TREE (Vercel Cloud)     [7]  jo form (:3009)
echo  [2]  DECLUZ (:3001)                [8]  Prediction Areena (Vercel Cloud)
echo  [3]  GAME CHANGER (:3002)          [9]  Stock Pulse (:3012)
echo  [4]  JARVIS Elite (:3003)          [10] Cinematic Chess (:3013)
echo  [5]  VENOM Security (Vercel Cloud) [11] AI Web Builder (:3014)
echo  [6]  Whisper Pages (:3008)         [12] ULTRON 3.0 Dashboard (:8000)
echo.
echo  [Q]  Exit launcher menu (all servers remain active on their ports)
echo ==============================================================================
set /p choice="Enter option: "

if /i "%choice%"=="A" (
    echo Opening all 12 project tabs in Google Chrome...
    if exist "!CHROME_EXE!" (
        start "" "!CHROME_EXE!" "http://localhost:8080"
        start "" "!CHROME_EXE!" "https://cyber-tree-azure.vercel.app/"
        start "" "!CHROME_EXE!" "http://localhost:3001"
        start "" "!CHROME_EXE!" "http://localhost:3002"
        start "" "!CHROME_EXE!" "http://localhost:3003"
        start "" "!CHROME_EXE!" "https://dashboard-sigma-puce-87.vercel.app/onboard"
        start "" "!CHROME_EXE!" "http://localhost:3008"
        start "" "!CHROME_EXE!" "http://localhost:3009"
        start "" "!CHROME_EXE!" "https://prediction-areena.vercel.app/"
        start "" "!CHROME_EXE!" "http://localhost:3012"
        start "" "!CHROME_EXE!" "http://localhost:3013"
        start "" "!CHROME_EXE!" "http://localhost:3014"
        start "" "!CHROME_EXE!" "http://localhost:8000"
    ) else (
        start "" "http://localhost:8080"
        start "" "https://cyber-tree-azure.vercel.app/"
        start "" "http://localhost:3001"
        start "" "http://localhost:3002"
        start "" "http://localhost:3003"
        start "" "https://dashboard-sigma-puce-87.vercel.app/onboard"
        start "" "http://localhost:3008"
        start "" "http://localhost:3009"
        start "" "https://prediction-areena.vercel.app/"
        start "" "http://localhost:3012"
        start "" "http://localhost:3013"
        start "" "http://localhost:3014"
        start "" "http://localhost:8000"
    )
    goto MENU
)

if /i "%choice%"=="E" (
    echo Opening all 12 project tabs in Microsoft Edge...
    if exist "!EDGE_EXE!" (
        start "" "!EDGE_EXE!" "http://localhost:8080"
        start "" "!EDGE_EXE!" "https://cyber-tree-azure.vercel.app/"
        start "" "!EDGE_EXE!" "http://localhost:3001"
        start "" "!EDGE_EXE!" "http://localhost:3002"
        start "" "!EDGE_EXE!" "http://localhost:3003"
        start "" "!EDGE_EXE!" "https://dashboard-sigma-puce-87.vercel.app/onboard"
        start "" "!EDGE_EXE!" "http://localhost:3008"
        start "" "!EDGE_EXE!" "http://localhost:3009"
        start "" "!EDGE_EXE!" "https://prediction-areena.vercel.app/"
        start "" "!EDGE_EXE!" "http://localhost:3012"
        start "" "!EDGE_EXE!" "http://localhost:3013"
        start "" "!EDGE_EXE!" "http://localhost:3014"
        start "" "!EDGE_EXE!" "http://localhost:8000"
    )
    goto MENU
)

if /i "%choice%"=="O" (
    if exist "!CHROME_EXE!" ( start "" "!CHROME_EXE!" "http://localhost:8080" ) else ( start "" "http://localhost:8080" )
    goto MENU
)
if "%choice%"=="1" (
    if exist "!CHROME_EXE!" ( start "" "!CHROME_EXE!" "https://cyber-tree-azure.vercel.app/" ) else ( start "" "https://cyber-tree-azure.vercel.app/" )
    goto MENU
)
if "%choice%"=="2" (
    if exist "!CHROME_EXE!" ( start "" "!CHROME_EXE!" "http://localhost:3001" ) else ( start "" "http://localhost:3001" )
    goto MENU
)
if "%choice%"=="3" (
    if exist "!CHROME_EXE!" ( start "" "!CHROME_EXE!" "http://localhost:3002" ) else ( start "" "http://localhost:3002" )
    goto MENU
)
if "%choice%"=="4" (
    if exist "!CHROME_EXE!" ( start "" "!CHROME_EXE!" "http://localhost:3003" ) else ( start "" "http://localhost:3003" )
    goto MENU
)
if "%choice%"=="5" (
    if exist "!CHROME_EXE!" ( start "" "!CHROME_EXE!" "https://dashboard-sigma-puce-87.vercel.app/onboard" ) else ( start "" "https://dashboard-sigma-puce-87.vercel.app/onboard" )
    goto MENU
)
if "%choice%"=="6" (
    if exist "!CHROME_EXE!" ( start "" "!CHROME_EXE!" "http://localhost:3008" ) else ( start "" "http://localhost:3008" )
    goto MENU
)
if "%choice%"=="7" (
    if exist "!CHROME_EXE!" ( start "" "!CHROME_EXE!" "http://localhost:3009" ) else ( start "" "http://localhost:3009" )
    goto MENU
)
if "%choice%"=="8" (
    if exist "!CHROME_EXE!" ( start "" "!CHROME_EXE!" "https://prediction-areena.vercel.app/" ) else ( start "" "https://prediction-areena.vercel.app/" )
    goto MENU
)
if "%choice%"=="9" (
    if exist "!CHROME_EXE!" ( start "" "!CHROME_EXE!" "http://localhost:3012" ) else ( start "" "http://localhost:3012" )
    goto MENU
)
if "%choice%"=="10" (
    if exist "!CHROME_EXE!" ( start "" "!CHROME_EXE!" "http://localhost:3013" ) else ( start "" "http://localhost:3013" )
    goto MENU
)
if "%choice%"=="11" (
    if exist "!CHROME_EXE!" ( start "" "!CHROME_EXE!" "http://localhost:3014" ) else ( start "" "http://localhost:3014" )
    goto MENU
)
if "%choice%"=="12" (
    if exist "!CHROME_EXE!" ( start "" "!CHROME_EXE!" "http://localhost:8000" ) else ( start "" "http://localhost:8000" )
    goto MENU
)

if /i "%choice%"=="Q" (
    echo Exiting launcher menu. All background servers remain running on their ports.
    exit /b 0
)

goto MENU
