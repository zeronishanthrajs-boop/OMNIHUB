# start_all_projects.ps1
# A script to launch all web project servers on their configured ports in parallel.

$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$logDir = Join-Path $PSScriptRoot "logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

$nodeBin = "C:\Users\sakth\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64"
$pythonBin = "C:\Users\sakth\AppData\Local\Programs\Python\Python312"
$pythonScripts = "C:\Users\sakth\AppData\Local\Programs\Python\Python312\Scripts"
$goBin = "$env:USERPROFILE\go\bin"

# Combined path to inject into child processes
$injectPath = "$nodeBin;$pythonBin;$pythonScripts;$goBin"

Write-Host "=== STARTING ALL WEB PROJECTS ===" -ForegroundColor Green
Write-Host "Logs will be written to the '$logDir' directory.`n" -ForegroundColor Yellow

# Function to spawn a background cmd process
function Start-ServerProcess($name, $dir, $port, $command, $customEnv = @{}) {
    $logFile = Join-Path $logDir "$($name.Replace(' ', '_').Replace('.', '')).log"
    Write-Host "$name - Launching on http://localhost:$port..." -ForegroundColor Cyan
    
    $p = New-Object System.Diagnostics.Process
    $p.StartInfo.FileName = "cmd.exe"
    # Use cmd redirection to file (immune to buffer locks)
    $p.StartInfo.Arguments = "/c $command > `"$logFile`" 2>&1"
    $p.StartInfo.WorkingDirectory = Join-Path $PSScriptRoot $dir
    $p.StartInfo.UseShellExecute = $false
    $p.StartInfo.CreateNoWindow = $true
    
    # Inject PATH
    $p.StartInfo.EnvironmentVariables["PATH"] = "$injectPath;" + $env:PATH
    
    # Inject custom environment variables
    foreach ($key in $customEnv.Keys) {
        $p.StartInfo.EnvironmentVariables[$key] = $customEnv[$key]
    }
    
    if ($p.Start()) {
        Write-Host "   [OK] Started (PID: $($p.Id))" -ForegroundColor Green
    } else {
        Write-Host "   [FAILED] Failed to start process" -ForegroundColor Red
    }
}

# 1. CYBER TREE (port 3000)
Start-ServerProcess -name "1. CYBER TREE" -dir "CYBER TREE" -port 3000 -command "npm run dev -- -p 3000"

# 2. DECLUZ (port 3001)
Start-ServerProcess -name "2. DECLUZ" -dir "DECLUZ" -port 3001 -command "npm run dev -- --port 3001"

# 3. GAME CHANGER (port 3002)
Start-ServerProcess -name "3. GAME CHANGER" -dir "GAME CHANGER" -port 3002 -command "npm run dev -- -p 3002"

# 4. JARVIS Frontend (port 3003)
Start-ServerProcess -name "4. JARVIS Frontend" -dir "JARVIS" -port 3003 -command "npm run dev -- --port 3003 --host 127.0.0.1" -customEnv @{ PORT = "3003" }

# 5. JARVIS Express Backend (port 3004)
Start-ServerProcess -name "5. JARVIS Express Backend" -dir "JARVIS" -port 3004 -command "npm run server:dev" -customEnv @{ PORT = "3004"; FRONTEND_URL = "http://localhost:3003" }

# 6. JARVIS FastAPI main.py (port 3005)
Start-ServerProcess -name "6. JARVIS FastAPI" -dir "JARVIS" -port 3005 -command "python -m uvicorn main:app --host 127.0.0.1 --port 3005"

# 7. VENOM Backend (port 3006)
Start-ServerProcess -name "7. VENOM Backend" -dir "VENOM\backend" -port 3006 -command "npm run dev" -customEnv @{ PORT = "3006" }

# 8. VENOM Dashboard (port 3007)
Start-ServerProcess -name "8. VENOM Dashboard" -dir "VENOM\dashboard" -port 3007 -command "npm run dev -- -p 3007"

# 9. Whisper Pages (port 3008)
Start-ServerProcess -name "9. Whisper Pages" -dir "Whisper Pages" -port 3008 -command "node server.js" -customEnv @{ PORT = "3008" }

# 10. jo form (port 3009)
Start-ServerProcess -name "10. jo form" -dir "jo form" -port 3009 -command "npm run dev -- -p 3009"

Write-Host "`nAll servers have been triggered to start." -ForegroundColor Green
Write-Host "You can access them at their respective localhost links above." -ForegroundColor Green
Write-Host "To check logs, open the respective file in the 'logs' folder." -ForegroundColor Green
