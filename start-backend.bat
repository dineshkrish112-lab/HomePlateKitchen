@echo off
title HomePlate Backend (port 8090)
cd /d "%~dp0backend"
if not exist "src\main\resources\application-secrets.yml" (
  echo.
  echo  application-secrets.yml is missing.
  echo  Copy backend\src\main\resources\application-secrets.example.yml to application-secrets.yml
  echo  and put your MySQL password in it, then run this again.
  echo.
  pause
  exit /b 1
)
rem Maven Wrapper: downloads Maven automatically on first run, only a JDK 17+ is needed.
call mvnw.cmd spring-boot:run
pause
