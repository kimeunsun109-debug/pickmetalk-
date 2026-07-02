@echo off
chcp 65001 >nul
set PROFILE=%LOCALAPPDATA%\naver-blog-chrome-debug
set CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe
if not exist "%CHROME%" set CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe

echo Chrome 디버그 모드 (포트 9222)
echo 프로필: %PROFILE%
echo.
echo [안내] 최초 1회: 네이버 로그인 시 "아이디 저장" 체크 후 로그인하세요.
echo        이후에는 저장된 아이디/비밀번호 자동완성으로 로그인됩니다.
echo.

start "" "%CHROME%" --remote-debugging-port=9222 --user-data-dir="%PROFILE%" https://nid.naver.com/nidlogin.login
