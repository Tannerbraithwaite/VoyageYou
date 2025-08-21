#!/usr/bin/env python3
"""
Test script to demonstrate multi-city trip functionality
"""

import asyncio
import json
from services import ChatbotService

async def test_multi_city():
    """Test multi-city trip generation"""
    
    # Mock user message requesting a multi-city trip
    user_message = "I want to plan a trip to Naples and Rome for 5 days. I love art, food, and culture."
    
    print("🧪 Testing Multi-City Trip Generation")
    print("=" * 50)
    print(f"User Request: {user_message}")
    print()
    
    try:
        # Generate response using the updated ChatbotService
        response = await ChatbotService.generate_response(
            db=None,  # No database for this test
            user_id=1,
            message=user_message,
            api_key="test-key"  # This will use mock data
        )
        
        print("✅ Response Generated Successfully!")
        print()
        print("📋 Generated Itinerary:")
        print("-" * 30)
        
        # Try to parse as JSON to show structure
        try:
            # Find JSON in response
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = response[start_idx:end_idx]
                itinerary = json.loads(json_str)
                
                print(f"Trip Type: {itinerary.get('trip_type', 'Unknown')}")
                
                if itinerary.get('trip_type') == 'multi_city':
                    print(f"Destinations: {' → '.join(itinerary.get('destinations', []))}")
                    print(f"Duration: {itinerary.get('duration', 'Unknown')}")
                    print(f"Total Cost: ${itinerary.get('total_cost', 0)}")
                    
                    # Show hotels
                    hotels = itinerary.get('hotels', [])
                    print(f"\n🏨 Hotels ({len(hotels)}):")
                    for i, hotel in enumerate(hotels, 1):
                        print(f"  {i}. {hotel.get('name', 'Unknown')} in {hotel.get('city', 'Unknown')}")
                        print(f"     Price: ${hotel.get('price', 0)}/night × {hotel.get('total_nights', 0)} nights")
                    
                    # Show inter-city transport
                    transport = itinerary.get('inter_city_transport', [])
                    print(f"\n🚄 Inter-City Transport ({len(transport)}):")
                    for i, t in enumerate(transport, 1):
                        print(f"  {i}. {t.get('from', 'Unknown')} → {t.get('to', 'Unknown')}")
                        print(f"     Type: {t.get('type', 'Unknown')} • Price: ${t.get('price', 0)}")
                    
                    # Show schedule
                    schedule = itinerary.get('schedule', [])
                    print(f"\n📅 Schedule ({len(schedule)} days):")
                    for day in schedule:
                        city = day.get('city', 'Unknown')
                        activities = day.get('activities', [])
                        print(f"  Day {day.get('day', '?')} ({city}): {len(activities)} activities")
                        
                        for activity in activities:
                            activity_type = activity.get('type', 'unknown')
                            if activity_type == 'transport':
                                print(f"    🚄 {activity.get('name', 'Transport')} - ${activity.get('price', 0)}")
                            else:
                                print(f"    {'🎯' if activity_type == 'bookable' else '💡'} {activity.get('name', 'Activity')} - ${activity.get('price', 0)}")
                
                else:
                    print("⚠️  Generated single-city trip instead of multi-city")
                    print(f"Destination: {itinerary.get('destination', 'Unknown')}")
                
            else:
                print("⚠️  No JSON found in response")
                print("Response preview:", response[:200] + "..." if len(response) > 200 else response)
                
        except json.JSONDecodeError as e:
            print(f"⚠️  Could not parse JSON response: {e}")
            print("Response preview:", response[:200] + "..." if len(response) > 200 else response)
        
    except Exception as e:
        print(f"❌ Error generating response: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Starting Multi-City Trip Test")
    print()
    
    # Run the test
    asyncio.run(test_multi_city())
    
    print()
    print("�� Test completed!")
