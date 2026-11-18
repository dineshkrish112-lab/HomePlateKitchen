@echo off
title HomePlate Backend (port 8090)
cd /d "%~dp0backend"
where mvn >nul 2>nul
if %errorlevel%==0 (
  mvn spring-boot:run
) else (
  "%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.10.0\dae9a06d\bin\mvn.cmd" spring-boot:run
)
pause
