# VoyageYou Scripts

This directory contains scripts to easily start and stop the VoyageYou.

## 🚀 Quick Start

### Start the App
```bash
./start_app.sh
```

This script will:
1. 🔴 Stop any existing processes on ports 8000 and 8081
2. 🐍 Start the backend (Python/FastAPI) on port 8000
3. ⚛️ Start the frontend (React Native/Expo) on port 8081
4. ✅ Wait for both services to be ready
5. 📊 Show process status and URLs

### Stop the App
```bash
./stop_app.sh
```

This script will:
1. 🔴 Stop the backend and frontend processes
2. 🧹 Clean up PID files
3. ✅ Ensure all ports are free

## 🌐 Access URLs

Once started, you can access:
- **Frontend**: http://localhost:8081
- **Backend**: http://localhost:8000

## 📝 Logs

The scripts create log files for debugging:
- **Backend logs**: `backend.log`
- **Frontend logs**: `frontend.log`

## 🔧 Manual Control

If you need to manually manage processes:

### Check what's running
```bash
lsof -i :8000  # Check backend port
lsof -i :8081  # Check frontend port
```

### Kill processes manually
```bash
kill -9 $(lsof -ti:8000)  # Kill backend
kill -9 $(lsof -ti:8081)  # Kill frontend
```

## 🚨 Troubleshooting

### Port already in use
If you get "port already in use" errors:
1. Run `./stop_app.sh` first
2. Wait a few seconds
3. Run `./start_app.sh` again

### Scripts not working
Make sure the scripts are executable:
```bash
chmod +x start_app.sh stop_app.sh
```

### Permission denied
If you get permission errors, you may need to run with sudo:
```bash
sudo ./start_app.sh
```

## 📋 Requirements

- **Backend**: Python 3.8+, uvicorn, FastAPI
- **Frontend**: Node.js, npm
- **System**: macOS/Linux with bash shell

## 🎯 What These Scripts Do

The start script:
1. **Cleans up** any existing processes
2. **Starts backend** with hot reload
3. **Starts frontend** with Expo dev server
4. **Waits for readiness** before showing success
5. **Saves PIDs** for easy cleanup

The stop script:
1. **Reads saved PIDs** from files
2. **Kills processes** gracefully
3. **Cleans up ports** as backup
4. **Removes PID files**

## 🚀 Usage Examples

```bash
# Start fresh
./start_app.sh

# Stop everything
./stop_app.sh

# Restart (stop then start)
./stop_app.sh && ./start_app.sh

# Check status
ps aux | grep -E "(uvicorn|expo|npm)"
```
