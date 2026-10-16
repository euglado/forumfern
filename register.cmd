@echo off
cd /d "%~dp0"
call npm run register
exit /b %errorlevel%
