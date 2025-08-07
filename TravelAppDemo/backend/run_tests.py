#!/usr/bin/env python3
"""
Test runner for the Travel App backend
"""

import subprocess
import sys
import os

def run_backend_tests():
    """Run all backend tests"""
    print("🧪 Running Backend Tests...")
    print("=" * 50)
    
    # Install test dependencies if needed
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", 
            "pytest", "pytest-asyncio", "httpx", "pytest-cov"
        ], check=True, capture_output=True)
        print("✅ Test dependencies installed")
    except subprocess.CalledProcessError:
        print("⚠️  Some test dependencies may not be installed")
    
    # Run tests with coverage
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "test_main.py", "test_database.py",
            "-v", "--cov=.", "--cov-report=term-missing",
            "--cov-report=html:htmlcov"
        ], check=True)
        print("✅ All backend tests passed!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Backend tests failed with exit code: {e.returncode}")
        return False

def run_frontend_tests():
    """Run frontend tests"""
    print("\n🧪 Running Frontend Tests...")
    print("=" * 50)
    
    # Change to frontend directory
    frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
    
    try:
        # Install dependencies
        subprocess.run(["npm", "install"], cwd=frontend_dir, check=True, capture_output=True)
        print("✅ Frontend dependencies installed")
        
        # Run tests
        result = subprocess.run([
            "npm", "test", "--", "--coverage", "--watchAll=false"
        ], cwd=frontend_dir, check=True)
        print("✅ All frontend tests passed!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Frontend tests failed with exit code: {e.returncode}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Test Suite for Travel App")
    print("=" * 50)
    
    backend_success = run_backend_tests()
    frontend_success = run_frontend_tests()
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"Backend Tests: {'✅ PASSED' if backend_success else '❌ FAILED'}")
    print(f"Frontend Tests: {'✅ PASSED' if frontend_success else '❌ FAILED'}")
    
    if backend_success and frontend_success:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 