#!/usr/bin/env python3
"""
Ultra-simple FastAPI app for Railway deployment
"""
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/healthz")
def health_check():
    return {"status": "ok"}
