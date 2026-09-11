@echo off
cd /d "%~dp0"
title Nur al-Wahy - local server

rem  The microphone is blocked when the page is opened as a file:// document,
rem  because browsers do not treat that as a secure context. Serving the folder
rem  on localhost fixes it with no internet and no SSL certificate.

set PORT=8731
set PY=

py -3 -c "pass" >nul 2>&1
if not errorlevel 1 set PY=py -3

if not defined PY (
  python -c "pass" >nul 2>&1
  if not errorlevel 1 set PY=python
)

if not defined PY (
  echo.
  echo   Python was not found on this computer.
  echo   Voice recording needs it; the rest of the game works by opening the file directly.
  echo   Install Python from python.org, then run this file again.
  echo.
  pause
  exit /b
)

echo.
echo   Nur al-Wahy is running at:  http://127.0.0.1:%PORT%/
echo   Keep this window open while playing, and close it when you are done.
echo.

start "" "http://127.0.0.1:%PORT%/"
%PY% -m http.server %PORT% --bind 127.0.0.1
