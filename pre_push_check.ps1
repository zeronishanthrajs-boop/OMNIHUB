# pre_push_check.ps1
# Automated Pre-Push Git & Vercel Security / Integrity Audit

$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "         OMNIHUB PRE-PUSH GIT & VERCEL DEPLOYMENT AUDIT ENGINE                " -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan

$passed = $true

# 1. Audit .gitignore presence & rules
Write-Host "`n[1] Auditing Root .gitignore Integrity..." -ForegroundColor Yellow
$gitignorePath = Join-Path $PSScriptRoot ".gitignore"
if (Test-Path $gitignorePath) {
    $content = Get-Content $gitignorePath -Raw
    $hasEnv = $content -match '(?m)^\.env' -or $content -match '\.env'
    $hasModules = $content -match 'node_modules'
    $hasDb = $content -match '\*\.db' -or $content -match '\.db'
    
    if ($hasEnv -and $hasModules -and $hasDb) {
        Write-Host "   [PASS] .gitignore correctly protects .env, databases, and node_modules" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] .gitignore may be missing critical protection rules" -ForegroundColor Red
        $passed = $false
    }
} else {
    Write-Host "   [FAIL] No root .gitignore found!" -ForegroundColor Red
    $passed = $false
}

# 2. Audit Master .env and .env.example
Write-Host "`n[2] Auditing Environment Template (.env.example)..." -ForegroundColor Yellow
$examplePath = Join-Path $PSScriptRoot ".env.example"
if (Test-Path $examplePath) {
    $lines = (Get-Content $examplePath).Count
    Write-Host "   [PASS] Master .env.example documented ($lines lines)" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Missing master .env.example" -ForegroundColor Red
    $passed = $false
}

# 3. Check for exposed secrets in git staging (if git is initialized)
Write-Host "`n[3] Auditing Git Staged Files (Leak Detection)..." -ForegroundColor Yellow
if (Test-Path (Join-Path $PSScriptRoot ".git")) {
    $staged = git status --porcelain 2>$null
    $leaked = $staged | Where-Object { $_ -match "\.env" -and $_ -notmatch "\.env\.example" -and $_ -notmatch "\.env\.template" }
    if ($leaked) {
        Write-Host "   [ALERT] Potentially un-ignored .env files detected in git!" -ForegroundColor Red
        $leaked | ForEach-Object { Write-Host "     $_" -ForegroundColor Red }
        $passed = $false
    } else {
        Write-Host "   [PASS] Zero sensitive .env files staged in Git" -ForegroundColor Green
    }
} else {
    Write-Host "   [INFO] Root directory is not yet a Git repo. Git status clean." -ForegroundColor Cyan
}

# 4. Audit Vercel Configurations
Write-Host "`n[4] Auditing Vercel Deployment Configurations..." -ForegroundColor Yellow
$vercelConfigs = @(
    "OmniHub\vercel.json",
    "New folder (2)\CYBER TREE\vercel.json",
    "New folder (2)\VENOM\dashboard\vercel.json",
    "New folder (2)\Whisper Pages\vercel.json",
    "ULTRON\vercel.json"
)

foreach ($vc in $vercelConfigs) {
    $fullPath = Join-Path $PSScriptRoot $vc
    if (Test-Path $fullPath) {
        Write-Host "   [PASS] Found $vc" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] Missing $vc" -ForegroundColor DarkGray
    }
}

# 5. Summary & Instructions
Write-Host "`n==============================================================================" -ForegroundColor Cyan
if ($passed) {
    Write-Host "PRE-PUSH AUDIT PASSED: Repository is safe and ready for Git & Vercel!" -ForegroundColor Green
    Write-Host "`nTo initialize and push your repository to GitHub:" -ForegroundColor Yellow
    Write-Host "   git init" -ForegroundColor White
    Write-Host "   git add ." -ForegroundColor White
    Write-Host "   git commit -m 'Initial commit: OmniHub Multi-Project Ecosystem'" -ForegroundColor White
    Write-Host "   git branch -M main" -ForegroundColor White
    Write-Host "   git remote add origin https://github.com/<your-username>/<your-repo>.git" -ForegroundColor White
    Write-Host "   git push -u origin main" -ForegroundColor White
    Write-Host "`nTo deploy to Vercel:" -ForegroundColor Yellow
    Write-Host "   1. Import your GitHub repository into Vercel (https://vercel.com/new)" -ForegroundColor White
    Write-Host "   2. In Project Settings, set Root Directory to 'OmniHub' (or desired project)" -ForegroundColor White
    Write-Host "   3. Copy variables from .env.example into Vercel Environment Variables" -ForegroundColor White
    Write-Host "   4. Click Deploy!" -ForegroundColor White
} else {
    Write-Host "PRE-PUSH AUDIT FOUND WARNINGS. Resolve highlighted issues above before pushing." -ForegroundColor Red
}
Write-Host "==============================================================================" -ForegroundColor Cyan
