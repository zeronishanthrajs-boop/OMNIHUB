@echo off
title OMNIHUB // VERCEL DEPLOYMENT PIPELINE
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy_to_vercel.ps1"
