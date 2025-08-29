#!/usr/bin/env python3
"""
Test script for enhanced API services
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from enhanced_api_services import enhanced_flight_service, enhanced_hotel_service

async def test_enhanced_flight_service():
    """Test the enhanced flight service"""
    print("🧪 Testing Enhanced Flight Service...")
    
    try:
        # Test flight search with details
        flight_details = await enhanced_flight_service.search_flights_with_details(
            origin="JFK",
            destination="LHR",
            departure_date="2025-09-01",
            return_date="2025-09-04",
            passengers=2
        )
        
        print("✅ Flight service test successful!")
        print(f"📊 Found {len(flight_details.get('flights', []))} flights")
        
        if flight_details.get('flights'):
            flight = flight_details['flights'][0]
            print(f"✈️  First flight: {flight.get('airline')} {flight.get('flight')}")
            print(f"💰 Price: ${flight.get('price')}")
            print(f"👜 Baggage: {flight.get('baggage', {}).get('carry_on', 'N/A')}")
            print(f"🍽️  Meals: {flight.get('meals', [])}")
            print(f"✈️  Aircraft: {flight.get('aircraft', {}).get('model', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Flight service test failed: {e}")
        return False

async def test_enhanced_hotel_service():
    """Test the enhanced hotel service"""
    print("\n🧪 Testing Enhanced Hotel Service...")
    
    try:
        # Test hotel search with details
        hotel_details = await enhanced_hotel_service.search_hotels_with_details(
            destination="Paris",
            check_in="2025-09-01",
            check_out="2025-09-04",
            rooms=1,
            adults=2
        )
        
        print("✅ Hotel service test successful!")
        print(f"🏨 Found {len(hotel_details.get('hotels', []))} hotels")
        
        if hotel_details.get('hotels'):
            hotel = hotel_details['hotels'][0]
            print(f"🏨 Hotel: {hotel.get('name')}")
            print(f"📍 Address: {hotel.get('address')}")
            print(f"💰 Price: ${hotel.get('price')}/night")
            print(f"⭐ Rating: {hotel.get('rating', {}).get('overall', 'N/A')}")
            print(f"🖼️  Images: {len(hotel.get('images', []))} available")
            print(f"🏷️  Amenities: {len(hotel.get('amenities', []))} available")
        
        return True
        
    except Exception as e:
        print(f"❌ Hotel service test failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("🚀 Starting Enhanced API Services Test\n")
    
    # Test flight service
    flight_success = await test_enhanced_flight_service()
    
    # Test hotel service
    hotel_success = await test_enhanced_hotel_service()
    
    # Summary
    print("\n" + "="*50)
    print("📋 TEST SUMMARY")
    print("="*50)
    
    if flight_success:
        print("✅ Enhanced Flight Service: PASSED")
    else:
        print("❌ Enhanced Flight Service: FAILED")
    
    if hotel_success:
        print("✅ Enhanced Hotel Service: PASSED")
    else:
        print("❌ Enhanced Hotel Service: FAILED")
    
    if flight_success and hotel_success:
        print("\n🎉 All tests passed! Enhanced API services are working correctly.")
        return 0
    else:
        print("\n💥 Some tests failed. Please check the error messages above.")
        return 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n⏹️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)
