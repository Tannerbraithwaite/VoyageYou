#!/bin/bash

echo "🛑 Stopping Travel App..."
echo "=========================="

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    echo "🔴 Stopping processes on port $port..."
    
    # Find and kill processes using the port
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo "   Found processes: $pids"
        kill -9 $pids 2>/dev/null
        echo "   ✅ Killed processes on port $port"
    else
        echo "   ✅ No processes found on port $port"
    fi
}

# Kill processes by PID files if they exist
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "🔴 Stopping backend (PID: $BACKEND_PID)..."
        kill -9 $BACKEND_PID 2>/dev/null
        echo "   ✅ Backend stopped"
    else
        echo "   ✅ Backend process not found"
    fi
    rm -f backend.pid
else
    echo "   ✅ No backend PID file found"
fi

if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "🔴 Stopping frontend (PID: $FRONTEND_PID)..."
        kill -9 $FRONTEND_PID 2>/dev/null
        echo "   ✅ Frontend stopped"
    else
        echo "   ✅ Frontend process not found"
    fi
    rm -f frontend.pid
else
    echo "   ✅ No frontend PID file found"
fi

# Also kill any remaining processes on the ports
echo "🔄 Cleaning up any remaining processes..."
kill_port 8000
kill_port 8081

echo ""
echo "✅ Travel App has been stopped!"
echo "=========================="
echo "🌐 Frontend: http://localhost:8081 (stopped)"
echo "🔧 Backend:  http://localhost:8000 (stopped)"
echo ""
echo "🚀 To restart, run: ./start_app.sh"
