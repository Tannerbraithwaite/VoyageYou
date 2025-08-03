#!/bin/bash

# Travel App Backend Startup Script
echo "🚀 Starting Travel App Backend with Python 3.11.9..."

# Activate virtual environment
source venv/bin/activate

# Check if virtual environment is activated
if [[ "$VIRTUAL_ENV" != "" ]]; then
    echo "✅ Virtual environment activated: $VIRTUAL_ENV"
    echo "🐍 Python version: $(python --version)"
    echo "📦 Installed packages: $(pip list | wc -l) packages"
    echo ""
    echo "🌐 Starting FastAPI server on http://localhost:8000"
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Start the backend
    python main.py
else
    echo "❌ Failed to activate virtual environment"
    echo "Please run: source venv/bin/activate"
    exit 1
fi 