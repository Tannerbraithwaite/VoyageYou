#!/usr/bin/env python3

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=== Debug OpenAI Import ===")

# Test 1: Basic import
try:
    import openai
    print(f"✅ OpenAI import successful")
    print(f"OpenAI version: {openai.__version__}")
    print(f"Has ChatCompletion: {hasattr(openai, 'ChatCompletion')}")
    print(f"Has OpenAI class: {hasattr(openai, 'OpenAI')}")
except Exception as e:
    print(f"❌ OpenAI import failed: {e}")
    sys.exit(1)

# Test 2: API key
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("❌ OPENAI_API_KEY not found")
    sys.exit(1)
print(f"✅ API Key found: {api_key[:10]}...")

# Test 3: Setup API key
try:
    openai.api_key = api_key
    print("✅ API key set successfully")
except Exception as e:
    print(f"❌ Failed to set API key: {e}")
    sys.exit(1)

# Test 4: Make API call (exact same as services.py)
try:
    print("Testing API call...")
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say hello!"}
        ],
        max_tokens=50
    )
    
    print("✅ API call successful!")
    print(f"Response: {response['choices'][0]['message']['content']}")
    
except Exception as e:
    print(f"❌ API call failed: {e}")
    print(f"Error type: {type(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("=== All tests passed! ===") 