@echo off
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
python selenium_blog_post.py
exit /b %ERRORLEVEL%
