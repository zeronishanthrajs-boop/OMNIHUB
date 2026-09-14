# start_ecosystem.ps1
# Multi-Port Orchestrator for 12 Interconnected Ecosystem Services

$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$rootDir = Split-Path -Parent -Path $PSScriptRoot
$newFolder2 = Join-Path $rootDir "New folder (2)"
$logsDir = Join-Path $PSScriptRoot "logs"

if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

$nodeBin = "C:\Users\sakth\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64"
$pythonBin = "C:\Users\sakth\AppData\Local\Programs\Python\Python312"
$pythonScripts = "C:\Users\sakth\AppData\Local\Programs\Python\Python312\Scripts"
$injectPath = "$nodeBin;$pythonBin;$pythonScripts;"

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "        OMNIHUB MULTI-PORT ECOSYSTEM ORCHESTRATOR        " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Each service runs on its own dedicated, unshared port.`n" -ForegroundColor Yellow

function Start-ServiceProcess($name, $workingDir, $port, $command, $customEnv = @{}) {
    $safeName = $name.Replace(' ', '_').Replace('.', '').Replace('(', '').Replace(')', '')
    $logFile = Join-Path $logsDir "$safeName.log"
    Write-Host "[*] Launching $name on Port :$port..." -ForegroundColor Cyan -NoNewline

    # Test if port is already running
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host " [ALREADY LISTENING - PORT PRESERVED]" -ForegroundColor Yellow
        return
    }
    
    $p = New-Object System.Diagnostics.Process
    $p.StartInfo.FileName = "cmd.exe"
    $p.StartInfo.Arguments = "/c $command > `"$logFile`" 2>&1"
    $p.StartInfo.WorkingDirectory = $workingDir
    $p.StartInfo.UseShellExecute = $false
    $p.StartInfo.CreateNoWindow = $true
    
    $p.StartInfo.EnvironmentVariables["PATH"] = "$injectPath;" + $env:PATH
    foreach ($key in $customEnv.Keys) {
        $p.StartInfo.EnvironmentVariables[$key] = $customEnv[$key]
    }
    
    if ($p.Start()) {
        Write-Host " [STARTED - PID $($p.Id)]" -ForegroundColor Green
    } else {
        Write-Host " [FAILED TO START]" -ForegroundColor Red
    }
}

# 0. OmniHub Master Interface (Port 8080)
Start-ServiceProcess -name "OmniHub Master Hub" -workingDir $PSScriptRoot -port 8080 -command "node server.js"

# 1. CYBER TREE (Port 3000)
Start-ServiceProcess -name "CYBER TREE" -workingDir (Join-Path $newFolder2 "CYBER TREE") -port 3000 -command "npm run dev -- -p 3000"

# 2. DECLUZ (Port 3001)
Start-ServiceProcess -name "DECLUZ" -workingDir (Join-Path $newFolder2 "DECLUZ") -port 3001 -command "npm run dev -- --port 3001 --host 0.0.0.0"

# 3. GAME CHANGER (Port 3002)
Start-ServiceProcess -name "GAME CHANGER" -workingDir (Join-Path $newFolder2 "GAME CHANGER") -port 3002 -command "npx next dev -p 3002 --webpack"

# 4. JARVIS Frontend (Port 3003)
Start-ServiceProcess -name "JARVIS Frontend" -workingDir (Join-Path $newFolder2 "JARVIS") -port 3003 -command "npm run dev -- --port 3003 --host 0.0.0.0" -customEnv @{ PORT = "3003" }

# 5. JARVIS Express Backend (Port 3004)
Start-ServiceProcess -name "JARVIS Express Backend" -workingDir (Join-Path $newFolder2 "JARVIS") -port 3004 -command "npm run server:dev" -customEnv @{ PORT = "3004"; FRONTEND_URL = "http://localhost:3003" }

# 6. JARVIS FastAPI (Port 3005)
Start-ServiceProcess -name "JARVIS FastAPI" -workingDir (Join-Path $newFolder2 "JARVIS") -port 3005 -command "python -m uvicorn main:app --host 0.0.0.0 --port 3005"

# 7. VENOM Backend (Port 3006)
Start-ServiceProcess -name "VENOM Backend" -workingDir (Join-Path (Join-Path $newFolder2 "VENOM") "backend") -port 3006 -command "npm run dev" -customEnv @{ PORT = "3006" }

# 8. VENOM Dashboard (Port 3007)
Start-ServiceProcess -name "VENOM Dashboard" -workingDir (Join-Path (Join-Path $newFolder2 "VENOM") "dashboard") -port 3007 -command "npm run dev -- -p 3007"

# 9. Whisper Pages (Port 3008)
Start-ServiceProcess -name "Whisper Pages" -workingDir (Join-Path $newFolder2 "Whisper Pages") -port 3008 -command "node server.js" -customEnv @{ PORT = "3008" }

# 10. jo form (Port 3009)
Start-ServiceProcess -name "jo form" -workingDir (Join-Path $newFolder2 "jo form") -port 3009 -command "npm run dev -- -p 3009"

# 11. Prediction Areena (Port 3011)
Start-ServiceProcess -name "Prediction Areena" -workingDir (Join-Path $rootDir "Prediction Areena") -port 3011 -command "npm run dev -- -p 3011"

# 12. Stock Pulse (Port 3012)
Start-ServiceProcess -name "Stock Pulse" -workingDir (Join-Path $rootDir "Stock Pulse") -port 3012 -command "node server.js" -customEnv @{ PORT = "3012" }

# 13. Cinematic Chess (Port 3013)
Start-ServiceProcess -name "Cinematic Chess" -workingDir (Join-Path $rootDir "CHESS") -port 3013 -command "npm run dev -w apps/client -- --port 3013 --host 0.0.0.0"

# 14. AI Web Builder (Port 3014)
Start-ServiceProcess -name "AI Web Builder" -workingDir (Join-Path (Join-Path $rootDir "Wd\ai-web-builder") "apps\web") -port 3014 -command "npx next dev -p 3014"

# 15. ULTRON Dashboard (Port 8000)
Start-ServiceProcess -name "ULTRON 3.0" -workingDir (Join-Path $rootDir "ULTRON") -port 8000 -command "python -m uvicorn dashboard:app --host 0.0.0.0 --port 8000"

Write-Host "`n=========================================================" -ForegroundColor Green
Write-Host "✅ ALL 16 ECOSYSTEM SERVICES HAVE BEEN DISPATCHED." -ForegroundColor Green
Write-Host "🌐 Master Command Center: http://localhost:8080" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Green
