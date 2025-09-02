#!/usr/bin/env python3
"""
Test script to debug Railway startup issues
"""
import os
import sys
from dotenv import load_dotenv

print("=== Railway Startup Debug ===")
print(f"Python version: {sys.version}")
print(f"Working directory: {os.getcwd()}")

# Load environment variables
load_dotenv()
if not os.getenv('OPENAI_API_KEY'):
    load_dotenv('backend/.env')

print("\n=== Environment Variables ===")
required_vars = [
    'OPENAI_API_KEY',
    'SECRET_KEY', 
    'JWT_SECRET_KEY',
    'DATABASE_URL',
    'SMTP_HOST',
    'SMTP_USERNAME',
    'SMTP_PASSWORD'
]

for var in required_vars:
    value = os.getenv(var)
    if value:
        print(f"✅ {var}: {'*' * min(len(value), 10)}...")
    else:
        print(f"❌ {var}: NOT SET")

print("\n=== Testing Imports ===")
try:
    print("Testing database import...")
    from database import create_tables
    print("✅ Database import successful")
except Exception as e:
    print(f"❌ Database import failed: {e}")

try:
    print("Testing main app import...")
    from main import app
    print("✅ Main app import successful")
except Exception as e:
    print(f"❌ Main app import failed: {e}")

print("\n=== Testing Database Creation ===")
try:
    create_tables()
    print("✅ Database tables created successfully")
except Exception as e:
    print(f"❌ Database creation failed: {e}")

print("\n=== Testing FastAPI App ===")
try:
    print(f"App title: {app.title}")
    print(f"App version: {app.version}")
    print("✅ FastAPI app is valid")
except Exception as e:
    print(f"❌ FastAPI app test failed: {e}")

print("\n=== Startup Test Complete ===")
