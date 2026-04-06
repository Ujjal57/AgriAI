#!/bin/bash

echo "========================================"
echo "    AgriAI Project Setup Script"
echo "========================================"
echo

echo "[1/6] Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ from https://python.org"
    exit 1
fi
echo "Python found!"

echo
echo "[2/6] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi
echo "Node.js found!"

echo
echo "[3/6] Setting up Python virtual environment..."
cd backend
if [ -d "venv" ]; then
    echo "Virtual environment already exists"
else
    python3 -m venv venv
    echo "Virtual environment created"
fi

echo
echo "[4/6] Activating virtual environment and installing Python packages..."
source venv/bin/activate
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Python packages"
    exit 1
fi

echo
echo "[5/6] Installing Node.js packages..."
cd ..
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Node.js packages"
    exit 1
fi

echo
echo "[6/6] Setup complete!"
echo
echo "========================================"
echo "    NEXT STEPS:"
echo "========================================"
echo "1. Set up your database:"
echo "   - Install MySQL 8.0+"
echo "   - Create database: agri_ai"
echo "   - Copy backend/.env.example to backend/.env"
echo "   - Edit .env with your database credentials"
echo
echo "2. Initialize database:"
echo "   cd backend"
echo "   python init_database.py"
echo
echo "3. Start the application:"
echo "   Terminal 1: cd backend && python app.py"
echo "   Terminal 2: npm start"
echo
echo "4. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "========================================"
echo