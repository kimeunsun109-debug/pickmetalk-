@echo off
cd /d "%~dp0"
if not exist "..\logs" mkdir "..\logs"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "PROFILE=%LOCALAPPDATA%\naver-blog-chrome-debug"

powershell -NoProfile -Command "try{(Invoke-WebRequest -Uri 'http://127.0.0.1:9222/json/version' -UseBasicParsing -TimeoutSec 2).StatusCode}catch{'DOWN'}" | findstr 200 >nul
if errorlevel 1 (
  start "" "%CHROME%" --remote-debugging-port=9222 --user-data-dir="%PROFILE%" https://nid.naver.com/nidlogin.login
  timeout /t 12 /nobreak >nul
)

set PYTHONIOENCODING=utf-8
python blog_daily_run.py
exit /b %ERRORLEVEL%
