@echo off
echo ========================================
echo    AgriAI Project Setup Script
echo ========================================
echo.

echo [1/6] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)
echo Python found!

echo.
echo [2/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 16+ from https://nodejs.org
    pause
    exit /b 1
)
echo Node.js found!

echo.
echo [3/6] Setting up Python virtual environment...
cd backend
if exist venv (
    echo Virtual environment already exists
) else (
    python -m venv venv
    echo Virtual environment created
)

echo.
echo [4/6] Activating virtual environment and installing Python packages...
call venv\Scripts\activate.bat
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python packages
    pause
    exit /b 1
)

echo.
echo [5/6] Installing Node.js packages...
cd ..
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Node.js packages
    pause
    exit /b 1
)

echo.
echo [6/6] Setup complete!
echo.
echo ========================================
echo    NEXT STEPS:
echo ========================================
echo 1. Set up your database:
echo    - Install MySQL 8.0+
echo    - Create database: agri_ai
echo    - Copy backend/.env.example to backend/.env
echo    - Edit .env with your database credentials
echo.
echo 2. Initialize database:
echo    cd backend
echo    python init_database.py
echo.
echo 3. Start the application:
echo    Terminal 1: cd backend && python app.py
echo    Terminal 2: npm start
echo.
echo 4. Access the application:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:5000
echo ========================================
echo.
pause