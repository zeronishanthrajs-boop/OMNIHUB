# deploy_to_vercel.ps1
# Interactive 1-Click Vercel Deployment & Pipeline Manager for OmniHub Ecosystem

$rootDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

function Show-Menu {
    Clear-Host
    Write-Host "==============================================================================" -ForegroundColor Cyan
    Write-Host "             OMNIHUB // VERCEL CLOUD DEPLOYMENT CONTROL CENTER                " -ForegroundColor Green
    Write-Host "==============================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  --- STEP 1: AUTHENTICATION & REPOSITORY STATUS ---" -ForegroundColor Yellow
    Write-Host "  [L]  Login to Vercel CLI (Opens browser for quick authentication)"
    Write-Host "  [W]  Check Vercel CLI Status (WhoAmI)"
    Write-Host "  [G]  Push Latest Changes to GitHub (git push -u origin main)"
    Write-Host ""
    Write-Host "  --- STEP 2: 1-CLICK PRODUCTION DEPLOYMENTS (Vercel CLI) ---" -ForegroundColor Yellow
    Write-Host "  [1]  Deploy OmniHub Master Command Center (Serverless Portal)"
    Write-Host "  [2]  Deploy Prediction Areena (Next.js 16)"
    Write-Host "  [3]  Deploy CYBER TREE (Next.js 16 + Threat Globe)"
    Write-Host "  [4]  Deploy VENOM Security Dashboard (Next.js Audit Suite)"
    Write-Host "  [5]  Deploy DECLUZ Showcase (Vite / React 19)"
    Write-Host "  [6]  Deploy MorphCart / GAME CHANGER (Next.js 16)"
    Write-Host "  [7]  Deploy jo form Builder (Next.js 16)"
    Write-Host "  [8]  Deploy Cinematic Chess (Vite + Stockfish)"
    Write-Host ""
    Write-Host "  --- STEP 3: PRE-DEPLOYMENT AUDIT & TESTING ---" -ForegroundColor Yellow
    Write-Host "  [A]  Run Pre-Push Security & Credential Leak Audit"
    Write-Host "  [T]  Run Full 12-System Health & Dispatcher Test Suite"
    Write-Host ""
    Write-Host "  [Q]  Exit" -ForegroundColor Gray
    Write-Host "==============================================================================" -ForegroundColor Cyan
}

function Run-Deploy($folderPath, $projectName) {
    Write-Host "`n>>> Starting Production Deployment for $projectName..." -ForegroundColor Cyan
    Write-Host "Target Directory: $folderPath" -ForegroundColor Gray
    if (-not (Test-Path $folderPath)) {
        Write-Host "[ERROR] Directory not found: $folderPath" -ForegroundColor Red
        Pause
        return
    }
    
    Push-Location $folderPath
    try {
        cmd /c "npx vercel --prod"
    } finally {
        Pop-Location
    }
    Write-Host "`n>>> Deployment routine completed for $projectName." -ForegroundColor Green
    Pause
}

do {
    Show-Menu
    $choice = Read-Host "Select option"
    switch ($choice.ToUpper()) {
        "L" {
            Write-Host "`nOpening browser for Vercel CLI Authentication..." -ForegroundColor Cyan
            cmd /c "npx vercel login"
            Pause
        }
        "W" {
            Write-Host "`nChecking Vercel Authentication..." -ForegroundColor Cyan
            cmd /c "npx vercel whoami"
            Pause
        }
        "G" {
            Write-Host "`nPushing latest code to GitHub origin main..." -ForegroundColor Cyan
            git push origin main
            Pause
        }
        "1" { Run-Deploy (Join-Path $rootDir "OmniHub") "OmniHub Master Portal" }
        "2" { Run-Deploy (Join-Path $rootDir "Prediction Areena") "Prediction Areena" }
        "3" { Run-Deploy (Join-Path $rootDir "New folder (2)\CYBER TREE") "CYBER TREE" }
        "4" { Run-Deploy (Join-Path $rootDir "New folder (2)\VENOM\dashboard") "VENOM Security Dashboard" }
        "5" { Run-Deploy (Join-Path $rootDir "New folder (2)\DECLUZ") "DECLUZ" }
        "6" { Run-Deploy (Join-Path $rootDir "New folder (2)\GAME CHANGER") "GAME CHANGER (MorphCart)" }
        "7" { Run-Deploy (Join-Path $rootDir "New folder (2)\jo form") "jo form Builder" }
        "8" { Run-Deploy (Join-Path $rootDir "CHESS") "Cinematic Chess" }
        "A" {
            powershell -ExecutionPolicy Bypass -File (Join-Path $rootDir "pre_push_check.ps1")
            Pause
        }
        "T" {
            powershell -ExecutionPolicy Bypass -File (Join-Path $rootDir "OmniHub\test_open_all_and_ecosystem.ps1")
            Pause
        }
    }
} while ($choice.ToUpper() -ne "Q")
