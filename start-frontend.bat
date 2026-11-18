@echo off
title HomePlate Frontend (port 5173)
cd /d "%~dp0frontend"
if not exist node_modules call npm install
start "" http://localhost:5173
npm run dev
pause
