@echo off
cd /d "%~dp0"
call npm ci --ignore-scripts
if errorlevel 1 exit /b 1
call npm run setup
exit /b %errorlevel%
