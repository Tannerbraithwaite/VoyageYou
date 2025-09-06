#!/bin/bash

echo "🚀 Starting Travel App..."
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

# Function to wait for a port to be available
wait_for_port() {
    local port=$1
    local service_name=$2
    echo "⏳ Waiting for $service_name to start on port $port..."
    
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if lsof -i:$port >/dev/null 2>&1; then
            echo "   ✅ $service_name is running on port $port"
            return 0
        fi
        sleep 1
        attempts=$((attempts + 1))
        echo "   Attempt $attempts/$max_attempts..."
    done
    
    echo "   ❌ $service_name failed to start on port $port"
    return 1
}

# Kill existing processes
echo "🔄 Cleaning up existing processes..."
kill_port 8000
kill_port 8081

# Wait a moment for processes to fully terminate
sleep 2

# Start backend
echo "🐍 Starting backend on port 8000..."
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend started with PID: $BACKEND_PID"

# Wait for backend to start
if wait_for_port 8000 "Backend"; then
    echo "✅ Backend is ready!"
else
    echo "❌ Backend failed to start. Check backend.log for details."
    exit 1
fi

# Start frontend
echo "⚛️  Starting frontend on port 8081..."
cd ../frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend started with PID: $FRONTEND_PID"

# Wait for frontend to start
if wait_for_port 8081 "Frontend"; then
    echo "✅ Frontend is ready!"
else
    echo "❌ Frontend failed to start. Check frontend.log for details."
    exit 1
fi

# Save PIDs to file for easy cleanup
echo $BACKEND_PID > ../backend.pid
echo $FRONTEND_PID > ../frontend.pid

echo ""
echo "🎉 Travel App is now running!"
echo "=========================="
echo "🌐 Frontend: http://localhost:8081"
echo "🔧 Backend:  http://localhost:8000"
echo ""
echo "📝 Logs:"
echo "   Backend:  backend.log"
echo "   Frontend: frontend.log"
echo ""
echo "🛑 To stop the app, run: ./stop_app.sh"
echo "   Or manually kill PIDs: $BACKEND_PID (backend), $FRONTEND_PID (frontend)"
echo ""
echo "📊 Process status:"
ps -p $BACKEND_PID,$FRONTEND_PID -o pid,ppid,command
