#!/usr/bin/env python3
"""
Test User Flow Script
Tests the complete user experience flow through the API
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_user_flow():
    """Test the complete user flow"""
    print("🚀 Testing Complete User Flow")
    print("=" * 50)
    
    # Test 1: Backend Health Check
    print("\n1️⃣ Testing Backend Health...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("   ✅ Backend is running")
            print(f"   📊 Response: {response.json()}")
        else:
            print(f"   ❌ Backend error: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Cannot connect to backend: {e}")
        return
    
    # Test 2: Create/Update User Profile with Location
    print("\n2️⃣ Testing User Profile with Location...")
    user_data = {
        "name": "Test User",
        "email": "test@example.com",
        "location": "New York, NY",  # This is the new location field!
        "travel_style": "solo",
        "budget_range": "moderate",
        "additional_info": "Testing the new location feature"
    }
    
    try:
        # Try to update user 1 (assuming it exists)
        response = requests.put(f"{BASE_URL}/users/1", json=user_data)
        if response.status_code == 200:
            print("   ✅ User profile updated with location")
            user_info = response.json()
            print(f"   📍 Location set to: {user_info.get('location', 'Not set')}")
        else:
            print(f"   ⚠️ User update failed: {response.status_code}")
            print(f"   📝 Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Error updating user: {e}")
    
    # Test 3: Test Enhanced Chat with Location Context
    print("\n3️⃣ Testing Enhanced Chat with Location...")
    
    # Test case A: Vague request (should ask questions)
    print("\n   📝 Test A: Vague request (should ask questions)")
    vague_request = {
        "message": "Plan me a trip",
        "user_id": 1
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat/tools/", json=vague_request)
        if response.status_code == 200:
            result = response.json()
            if result.get("type") == "question":
                print("   ✅ LLM correctly asked clarifying questions")
                print(f"   🤔 Question: {result.get('message', '')[:100]}...")
            else:
                print("   ⚠️ Expected question, got itinerary")
        else:
            print(f"   ❌ Chat request failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error in chat: {e}")
    
    # Test case B: Specific request with location (should create itinerary)
    print("\n   📝 Test B: Specific request with location")
    specific_request = {
        "message": "Plan a 3-day trip to Paris",
        "user_id": 1
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat/tools/", json=specific_request)
        if response.status_code == 200:
            result = response.json()
            if result.get("trip_type"):
                print("   ✅ LLM created itinerary successfully")
                print(f"   🎯 Trip type: {result.get('trip_type')}")
                print(f"   📍 Destination: {result.get('destination', 'Unknown')}")
                print(f"   📅 Duration: {result.get('duration', 'Unknown')}")
                
                # Check if location was used
                if "New York" in str(result):
                    print("   ✅ User location (NY) was used in planning")
                else:
                    print("   ⚠️ User location may not have been used")
            else:
                print("   ⚠️ Unexpected response format")
        else:
            print(f"   ❌ Chat request failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error in chat: {e}")
    
    # Test 4: Test User Preferences (Exclude flights)
    print("\n4️⃣ Testing User Preferences (Exclude flights)...")
    
    preferences_request = {
        "message": "Planning Mode: Undecided dates - planning ahead without specific dates\nPurchase Options:\n- Flights: Exclude\n- Hotel: Include\n- Activities: Include\nUser Location: New York, NY (flight departure city)\n\nUser Request: Plan a trip to Tokyo",
        "user_id": 1
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat/tools/", json=preferences_request)
        if response.status_code == 200:
            result = response.json()
            if result.get("trip_type"):
                print("   ✅ LLM created itinerary respecting preferences")
                print(f"   🎯 Trip type: {result.get('trip_type')}")
                
                # Check if flights were excluded
                if result.get("flights") and len(result.get("flights", [])) == 0:
                    print("   ✅ Flights correctly excluded as requested")
                else:
                    print("   ⚠️ Flights may not have been excluded")
            else:
                print("   ⚠️ Unexpected response format")
        else:
            print(f"   ❌ Chat request failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error in chat: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 User Flow Test Complete!")
    print("\n🌐 Access Points:")
    print(f"   Backend API: {BASE_URL}")
    print(f"   API Docs: {BASE_URL}/docs")
    print("\n💡 Next Steps:")
    print("   1. Open API docs to explore all endpoints")
    print("   2. Test different chat scenarios")
    print("   3. Try updating user profile with different locations")

if __name__ == "__main__":
    test_user_flow()
