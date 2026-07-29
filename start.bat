@echo off
echo.
echo  ██████████████████████████████████████████
echo  █  AI Interview Prep System - Startup    █
echo  ██████████████████████████████████████████
echo.
echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "InterviewAI Backend" cmd /k "cd /d %~dp0backend && .\venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo [2/2] Starting Next.js Frontend on http://localhost:3000 ...
echo.
echo      IMPORTANT: Install Node.js first if not done!
echo      Download from: https://nodejs.org/en/download
echo.
echo      After installing Node.js, open a new terminal and run:
echo      cd frontend
echo      npm install
echo      npm run dev
echo.
echo  Backend docs at: http://localhost:8000/docs
echo  Frontend app at: http://localhost:3000
echo.
pause
