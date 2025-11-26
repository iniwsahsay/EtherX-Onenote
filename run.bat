@echo off
echo Starting EtherX OneNote Application...
echo.
echo Backend server should be running on http://localhost:3001
echo Opening frontend in default browser...
echo.
start "" "etherx-backend.html"
echo.
echo Application started successfully!
echo If the backend is not running, execute: node server.js
pause