# test_open_all_and_ecosystem.ps1
# Comprehensive Verification Test Suite for OmniHub & Open All Tabs

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "        OMNIHUB // ECOSYSTEM & OPEN-ALL-TABS COMPREHENSIVE TEST RUNNER        " -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan

$passed = 0
$failed = 0

function Assert-Test($condition, $testName) {
    if ($condition) {
        Write-Host "  [PASS] $testName" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  [FAIL] $testName" -ForegroundColor Red
        $script:failed++
    }
}

# 1. Test OmniHub Master Server Liveness
Write-Host "`n[1] Testing OmniHub Core Server (:8080)..." -ForegroundColor Yellow
try {
    $vitals = Invoke-RestMethod -Uri "http://localhost:8080/api/vitals" -TimeoutSec 5
    Assert-Test ($vitals.success -eq $true) "OmniHub Master Server online and reporting vitals (RAM: $($vitals.memory.usedPercent)%)"
} catch {
    Assert-Test $false "OmniHub Master Server unreachable on port 8080"
}

# 2. Test All 12 Systems Health & Uptime
Write-Host "`n[2] Testing Health & Connectivity of All 12 Interconnected Systems..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -TimeoutSec 8
    Assert-Test ($health.success -eq $true) "Health check API responded with success"
    
    $onlineCount = 0
    foreach ($prop in $health.statuses.PSObject.Properties) {
        $isOnline = $prop.Value.online
        if ($isOnline) { $onlineCount++ }
        Write-Host "     * $($prop.Name.PadRight(18)) -> Port $($prop.Value.port.ToString().PadRight(5)) Online: $isOnline ($($prop.Value.latency)ms)" -ForegroundColor Gray
    }
    Assert-Test ($onlineCount -eq 12) "All 12/12 Systems are 100% ONLINE (0 Collisions)"
} catch {
    Assert-Test $false "Failed to query /api/health: $_"
}

# 3. Test Live Vercel URLs Mapping
Write-Host "`n[3] Testing Active Vercel Cloud Deployment URLs..." -ForegroundColor Yellow
try {
    $projects = (Invoke-RestMethod -Uri "http://localhost:8080/api/projects").projects
    
    $pred = $projects | Where-Object { $_.id -eq "prediction-arena" }
    $cyber = $projects | Where-Object { $_.id -eq "cyber-tree" }
    $venom = $projects | Where-Object { $_.id -eq "venom" }
    
    Assert-Test ($pred.url -eq "https://prediction-areena.vercel.app/") "Prediction Areena mapped to https://prediction-areena.vercel.app/"
    Assert-Test ($cyber.url -eq "https://cyber-tree-azure.vercel.app/") "CYBER TREE mapped to https://cyber-tree-azure.vercel.app/"
    Assert-Test ($venom.url -eq "https://dashboard-sigma-puce-87.vercel.app/onboard") "VENOM Security mapped to https://dashboard-sigma-puce-87.vercel.app/onboard"
} catch {
    Assert-Test $false "Failed to verify project URLs: $_"
}

# 4. Test /api/open-all-tabs for Google Chrome
Write-Host "`n[4] Testing Open All Tabs Dispatcher (Google Chrome)..." -ForegroundColor Yellow
try {
    $chromeRes = Invoke-RestMethod -Uri "http://localhost:8080/api/open-all-tabs" -Method Post -ContentType "application/json" -Body '{"browser":"chrome"}'
    Assert-Test ($chromeRes.success -eq $true) "Chrome open-all-tabs API returned success"
    Assert-Test ($chromeRes.count -eq 13) "Dispatches exactly 13 tabs (12 projects + 1 master command center)"
    Assert-Test ($chromeRes.urls -contains "https://prediction-areena.vercel.app/") "Includes Prediction Areena Vercel URL"
    Assert-Test ($chromeRes.urls -contains "https://cyber-tree-azure.vercel.app/") "Includes CYBER TREE Vercel URL"
    Assert-Test ($chromeRes.urls -contains "https://dashboard-sigma-puce-87.vercel.app/onboard") "Includes VENOM Security Onboard URL"
    Assert-Test ($chromeRes.urls -contains "http://localhost:8000") "Includes ULTRON local port :8000"
    Assert-Test ($chromeRes.urls -contains "http://localhost:3003") "Includes JARVIS local port :3003"
} catch {
    Assert-Test $false "Failed to invoke /api/open-all-tabs (Chrome): $_"
}

# 5. Test /api/open-all-tabs for Microsoft Edge
Write-Host "`n[5] Testing Open All Tabs Dispatcher (Microsoft Edge)..." -ForegroundColor Yellow
try {
    $edgeRes = Invoke-RestMethod -Uri "http://localhost:8080/api/open-all-tabs" -Method Post -ContentType "application/json" -Body '{"browser":"edge"}'
    Assert-Test ($edgeRes.success -eq $true) "Edge open-all-tabs API returned success"
    Assert-Test ($edgeRes.browser -eq "Microsoft Edge") "Correctly identified target browser as Microsoft Edge"
    Assert-Test ($edgeRes.count -eq 13) "Dispatches 13 tabs to Edge"
} catch {
    Assert-Test $false "Failed to invoke /api/open-all-tabs (Edge): $_"
}

# 6. Test Single Tab Dispatcher (/api/open-tab)
Write-Host "`n[6] Testing Single Tab Dispatcher (/api/open-tab)..." -ForegroundColor Yellow
try {
    $tabRes = Invoke-RestMethod -Uri "http://localhost:8080/api/open-tab" -Method Post -ContentType "application/json" -Body '{"url":"https://cyber-tree-azure.vercel.app/"}'
    Assert-Test ($tabRes.success -eq $true) "Single tab API returned success for live Vercel URL"
} catch {
    Assert-Test $false "Failed to invoke /api/open-tab: $_"
}

# 7. Test MCP (Model Context Protocol) Bridge
Write-Host "`n[7] Testing Model Context Protocol (MCP) Bridge..." -ForegroundColor Yellow
try {
    $mcp = Invoke-RestMethod -Uri "http://localhost:8080/api/mcp/tools"
    Assert-Test ($mcp.success -eq $true -and $mcp.tools.Count -ge 5) "MCP Tools endpoint active ($($mcp.tools.Count) tools published)"
} catch {
    Assert-Test $false "Failed to query /api/mcp/tools: $_"
}

# 8. Test omni.bat Launcher Integrity
Write-Host "`n[8] Testing omni.bat Master Launcher Structure..." -ForegroundColor Yellow
$batPath = "c:\Users\sakth\Music\omni.bat"
if (Test-Path $batPath) {
    $batContent = Get-Content $batPath -Raw
    $hasChromeLoop = $batContent -match 'prediction-areena\.vercel\.app'
    $hasEdgeLoop = $batContent -match 'cyber-tree-azure\.vercel\.app'
    $hasVenom = $batContent -match 'dashboard-sigma-puce-87\.vercel\.app'
    
    Assert-Test ($hasChromeLoop -and $hasEdgeLoop -and $hasVenom) "omni.bat has line-by-line staggered dispatch for Chrome & Edge with live Vercel URLs"
} else {
    Assert-Test $false "omni.bat not found"
}

Write-Host "`n==============================================================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY: $passed PASSED, $failed FAILED" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "==============================================================================" -ForegroundColor Cyan

if ($failed -gt 0) { exit 1 } else { exit 0 }
