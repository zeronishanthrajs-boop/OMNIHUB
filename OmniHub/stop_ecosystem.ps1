# stop_ecosystem.ps1
# Cleanly terminates processes on all assigned ecosystem ports

$ports = @(8080, 3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3011, 3012, 3013, 3014, 8000)

Write-Host "Shutting down OmniHub ecosystem ports..." -ForegroundColor Yellow

foreach ($port in $ports) {
    $connections = netstat -ano | Select-String ":$port\s"
    foreach ($conn in $connections) {
        $parts = ($conn -replace '\s+', ' ').Trim().Split(' ')
        $pid = $parts[-1]
        if ($pid -match '^\d+$' -and $pid -ne '0') {
            try {
                Stop-Process -Id [int]$pid -Force -ErrorAction SilentlyContinue
                Write-Host "   Stopped port $port (PID: $pid)" -ForegroundColor Green
            } catch {
                # Ignored
            }
        }
    }
}

Write-Host "All specified project ports are now free." -ForegroundColor Green
