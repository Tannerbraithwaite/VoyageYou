#!/usr/bin/env python3
"""
Test script to make a direct API call to test multi-city functionality
"""

import asyncio
import httpx
import json

async def test_multi_city_api():
    """Test the multi-city API endpoint directly"""
    
    print("🧪 Testing Multi-City API Call")
    print("=" * 50)
    
    # Test message requesting multi-city trip
    test_message = "I want to plan a trip to Naples and Rome for 5 days. I love art, food, and culture."
    
    print(f"📝 Test Message: {test_message}")
    print()
    
    try:
        async with httpx.AsyncClient() as client:
            # Make the API call
            response = await client.post(
                "http://localhost:8000/chat/enhanced/",
                json={
                    "user_id": 1,
                    "message": test_message
                },
                timeout=60.0
            )
            
            if response.status_code == 200:
                print("✅ API call successful!")
                print()
                
                # Parse the response
                try:
                    data = response.json()
                    response_text = data.get('response', '')
                    
                    print("📋 LLM Response:")
                    print("-" * 30)
                    print(f"Raw response length: {len(response_text)}")
                    print(f"First 200 chars: {response_text[:200]}")
                    print(f"Last 200 chars: {response_text[-200:]}")
                    print()
                    print("Full response:")
                    print(response_text)
                    print()
                    
                    # Try to extract JSON from the response
                    start_idx = response_text.find('{')
                    end_idx = response_text.rfind('}') + 1
                    
                    if start_idx != -1 and end_idx > start_idx:
                        json_str = response_text[start_idx:end_idx]
                        try:
                            itinerary = json.loads(json_str)
                            
                            print("🔍 Parsed Itinerary:")
                            print("-" * 30)
                            print(f"Trip Type: {itinerary.get('trip_type', 'Unknown')}")
                            
                            if itinerary.get('trip_type') == 'multi_city':
                                print("✅ SUCCESS: Multi-city trip generated!")
                                destinations = itinerary.get('destinations', [])
                                print(f"Destinations: {' → '.join(destinations)}")
                                
                                # Check for key multi-city elements
                                hotels = itinerary.get('hotels', [])
                                transport = itinerary.get('inter_city_transport', [])
                                schedule = itinerary.get('schedule', [])
                                
                                print(f"Hotels: {len(hotels)} found")
                                print(f"Inter-city transport: {len(transport)} found")
                                print(f"Schedule days: {len(schedule)} found")
                                
                                # Check if schedule has city information
                                cities_in_schedule = [day.get('city') for day in schedule if day.get('city')]
                                print(f"Cities in schedule: {cities_in_schedule}")
                                
                            else:
                                print("⚠️  Single-city trip generated instead of multi-city")
                                print(f"Destination: {itinerary.get('destination', 'Unknown')}")
                                
                        except json.JSONDecodeError as e:
                            print(f"❌ Could not parse JSON: {e}")
                            print("This suggests the LLM is not following the JSON format instructions")
                    else:
                        print("❌ No JSON found in response")
                        print("This suggests the LLM is not following the JSON format instructions")
                        
                except Exception as e:
                    print(f"❌ Error parsing response: {e}")
                    
            else:
                print(f"❌ API call failed with status {response.status_code}")
                print(f"Response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error making API call: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Starting Multi-City API Test")
    print()
    
    # Run the test
    asyncio.run(test_multi_city_api())
    
    print()
    print("�� Test completed!")
