#!/usr/bin/env python3
"""
Minimal FastAPI app for testing Railway deployment
"""
import os
from fastapi import FastAPI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
if not os.getenv('OPENAI_API_KEY'):
    load_dotenv('backend/.env')

# Create minimal FastAPI app
app = FastAPI(title="TravelApp API - Minimal", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "TravelApp API is running!", "status": "ok"}

@app.get("/healthz")
async def healthz():
    return {"status": "ok", "health": "healthy"}

@app.get("/readyz")
async def readyz():
    return {"status": "ok", "ready": "true"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
