@echo off
title OMNIHUB Master Command Center
cd /d "%~dp0OmniHub"

echo ========================================================
echo         STARTING OMNIHUB UNIFIED WORKSPACE
echo ========================================================
echo Launching OmniHub Master Server on http://localhost:8080 ...

start "" "http://localhost:8080"
node server.js
pause
