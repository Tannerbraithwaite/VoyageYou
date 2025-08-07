#!/usr/bin/env python3
import os
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    print("ERROR: No OPENAI_API_KEY found in .env file")
    exit(1)

print(f"API Key found: {api_key[:10]}...{api_key[-4:]}")
print(f"OpenAI version: {openai.__version__}")

# Test the API with a simple request
try:
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful travel assistant."},
            {"role": "user", "content": "Suggest a 3-day itinerary for Tokyo focusing on technology and food. Return a JSON response with destination, duration, and a simple schedule."}
        ],
        max_tokens=500,
        api_key=api_key
    )
    
    print("\n=== SUCCESS: API Key is working! ===")
    print(f"Response: {response.choices[0].message.content}")
    
except Exception as e:
    print(f"\n=== ERROR: API call failed ===")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {str(e)}")
    import traceback
    traceback.print_exc() 