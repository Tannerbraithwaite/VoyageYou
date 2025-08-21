#!/usr/bin/env python3
"""
Test script to check the LLM prompt for multi-city trips
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_prompt():
    """Test the multi-city prompt structure"""
    
    print("🧪 Testing Multi-City Prompt Structure")
    print("=" * 50)
    
    # Check if we have a real API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ No OpenAI API key found in .env file")
        print("Please add your OpenAI API key to the .env file")
        return
    
    print(f"✅ OpenAI API key found: {api_key[:10]}...")
    
    # Check the prompt structure
    print("\n📝 Multi-City Prompt Instructions:")
    print("- Multi-Location Support: If user mentions multiple cities, create separate itineraries")
    print("- Transportation Between Cities: Include inter-city transportation")
    print("- Separate Hotels: Recommend different hotels for each city")
    print("- Linear Schedule: Show transportation AFTER completing activities in first city")
    
    print("\n🔍 To test the actual LLM response:")
    print("1. Start the app: ./start_app.sh")
    print("2. Go to the chat interface")
    print("3. Ask: 'I want to plan a trip to Naples and Rome for 5 days'")
    print("4. Check if it generates a multi-city itinerary")
    
    print("\n📋 Expected JSON Structure:")
    print('''
    {
      "trip_type": "multi_city",
      "destinations": ["Naples, Italy", "Rome, Italy"],
      "hotels": [
        {"city": "Naples, Italy", "name": "Hotel Name", ...},
        {"city": "Rome, Italy", "name": "Hotel Name", ...}
      ],
      "inter_city_transport": [
        {"from": "Naples", "to": "Rome", "type": "train", ...}
      ],
      "schedule": [
        {"day": 1, "city": "Naples, Italy", "activities": [...]},
        {"day": 3, "city": "Rome, Italy", "activities": [...]}
      ]
    }
    ''')

if __name__ == "__main__":
    test_prompt()
