# Travel App Backend - Virtual Environment Setup

## 🐍 Python 3.11.9 Virtual Environment

This backend is now configured to run with Python 3.11.9 in a virtual environment for better dependency management and isolation.

## 📋 Setup Summary

- **Python Version**: 3.11.9 (managed by pyenv)
- **Virtual Environment**: `venv/` directory
- **Dependencies**: All installed in virtual environment
- **Startup Script**: `start.sh` for easy launching

## 🚀 Quick Start

### Option 1: Use the startup script (Recommended)
```bash
./start.sh
```

### Option 2: Manual activation
```bash
# Activate virtual environment
source venv/bin/activate

# Start the backend
python main.py
```

## 🔧 Virtual Environment Management

### Activate the environment
```bash
source venv/bin/activate
```

### Deactivate the environment
```bash
deactivate
```

### Check Python version
```bash
python --version
# Should show: Python 3.11.9
```

### Install new dependencies
```bash
pip install package_name
```

### Update requirements.txt
```bash
pip freeze > requirements.txt
```

## 📦 Installed Packages

The virtual environment includes:
- **FastAPI**: Web framework
- **Uvicorn**: ASGI server
- **SQLAlchemy**: Database ORM
- **Pydantic**: Data validation
- **OpenAI**: AI API integration
- **Python-dotenv**: Environment variable management
- **Alembic**: Database migrations
- **And more...**

## 🌐 Access Points

- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/

## 🔒 Environment Variables

Set your OpenAI API key:
```bash
export OPENAI_API_KEY="your_api_key_here"
```

Or create a `.env` file:
```
OPENAI_API_KEY=your_api_key_here
```

## 🛠️ Troubleshooting

### If virtual environment doesn't activate:
```bash
# Recreate the virtual environment
rm -rf venv
/Users/tannerbraithwaite/.pyenv/versions/3.11.9/bin/python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### If Python version is wrong:
```bash
# Check pyenv setup
pyenv versions
pyenv local 3.11.9
```

## 📝 Notes

- The virtual environment is isolated from your system Python
- All dependencies are installed locally in `venv/`
- The startup script automatically activates the environment
- Python 3.11.9 provides better performance and features 