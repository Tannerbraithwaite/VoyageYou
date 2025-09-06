#!/usr/bin/env python3
"""
Test script to verify API key functionality for all travel APIs
"""

import os
import asyncio
import httpx
import json
import hashlib
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class APITester:
    def __init__(self):
        self.duffel_key = os.getenv('DUFFEL_API_KEY')
        self.hotelbeds_key = os.getenv('HOTELBED_API_KEY')
        self.hotelbeds_secret = os.getenv('HOTELBED_API_SECRET')
        self.ticketmaster_key = os.getenv('TICKETMASTER_API_KEY')
    
    def print_results(self, api_name: str, success: bool, data: dict = None, error: str = None):
        """Print formatted test results"""
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"\n{'='*50}")
        print(f"{api_name}: {status}")
        print(f"{'='*50}")
        
        if success and data:
            print("Response data:")
            print(json.dumps(data, indent=2)[:500] + "..." if len(str(data)) > 500 else json.dumps(data, indent=2))
        elif error:
            print(f"Error: {error}")
    
    async def test_duffel_api(self):
        """Test Duffel Flight API"""
        print("🔍 Testing Duffel API...")
        
        if not self.duffel_key:
            self.print_results("Duffel API", False, error="DUFFEL_API_KEY not found in environment")
            return False
        
        print(f"Using API key: {self.duffel_key[:10]}...")
        
        try:
            # Try different version headers
            version_headers = [
                {},  # No version header (use latest)
                {'Duffel-Version': 'v2'},
                {'Duffel-Version': 'beta'},
            ]
            
            for i, version_header in enumerate(version_headers):
                headers = {
                    'Authorization': f'Bearer {self.duffel_key}',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    **version_header
                }
                
                print(f"  Attempt {i+1}: {version_header if version_header else 'No version header'}")
            
                # Test with a simple offer request
                offer_request_data = {
                    "slices": [
                        {
                            "origin": "JFK",
                            "destination": "LHR", 
                            "departure_date": "2025-12-15"
                        }
                    ],
                    "passengers": [{"type": "adult"}],
                    "cabin_class": "economy"
                }
                
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://api.duffel.com/air/offer_requests",
                        headers=headers,
                        json={"data": offer_request_data},
                        timeout=30.0
                    )
                    
                    print(f"    Status Code: {response.status_code}")
                    response_data = response.json()
                    
                    if response.status_code == 201:
                        self.print_results("Duffel API", True, {
                            "offer_request_id": response_data.get("data", {}).get("id"),
                            "slices": len(response_data.get("data", {}).get("slices", [])),
                            "status": "Offer request created successfully",
                            "version_used": version_header if version_header else "default"
                        })
                        return True
                    elif response.status_code != 400:  # If not version error, try next
                        print(f"    Non-version error: {response_data}")
                        break
            
            # If we get here, all versions failed
            self.print_results("Duffel API", False, error=f"All version attempts failed. Last response: {response_data}")
            return False
                    
        except Exception as e:
            self.print_results("Duffel API", False, error=str(e))
            return False
    
    async def test_hotelbeds_api(self):
        """Test Hotelbeds Hotel API"""
        print("🔍 Testing Hotelbeds API...")
        
        if not self.hotelbeds_key or not self.hotelbeds_secret:
            self.print_results("Hotelbeds API", False, error="HOTELBED_API_KEY or HOTELBED_API_SECRET not found")
            return False
        
        print(f"Using API key: {self.hotelbeds_key[:10]}...")
        print(f"Using API secret: {self.hotelbeds_secret[:5]}...")
        
        try:
            # Generate signature for Hotelbeds
            timestamp = str(int(time.time()))
            signature_string = self.hotelbeds_key + self.hotelbeds_secret + timestamp
            signature = hashlib.sha256(signature_string.encode()).hexdigest()
            
            headers = {
                'Api-key': self.hotelbeds_key,
                'X-Signature': signature,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
            
            # Test with destinations endpoint first (simpler)
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.test.hotelbeds.com/hotel-content-api/1.0/locations/destinations",
                    headers=headers,
                    params={
                        "fields": "name,code",
                        "language": "ENG",
                        "from": "1",
                        "to": "10"
                    },
                    timeout=30.0
                )
                
                print(f"Status Code: {response.status_code}")
                response_data = response.json()
                
                if response.status_code == 200:
                    destinations = response_data.get("destinations", [])
                    self.print_results("Hotelbeds API", True, {
                        "destinations_found": len(destinations),
                        "first_destination": destinations[0] if destinations else None,
                        "status": "Destinations retrieved successfully"
                    })
                    return True
                else:
                    self.print_results("Hotelbeds API", False, error=f"HTTP {response.status_code}: {response_data}")
                    return False
                    
        except Exception as e:
            self.print_results("Hotelbeds API", False, error=str(e))
            return False
    
    async def test_ticketmaster_api(self):
        """Test Ticketmaster Events API"""
        print("🔍 Testing Ticketmaster API...")
        
        if not self.ticketmaster_key:
            self.print_results("Ticketmaster API", False, error="TICKETMASTER_API_KEY not found in environment")
            return False
        
        print(f"Using API key: {self.ticketmaster_key[:10]}...")
        
        try:
            params = {
                "apikey": self.ticketmaster_key,
                "city": "New York",
                "size": "5",
                "sort": "date,asc"
            }
            
            headers = {
                'Content-Type': 'application/json'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://app.ticketmaster.com/discovery/v2/events.json",
                    headers=headers,
                    params=params,
                    timeout=30.0
                )
                
                print(f"Status Code: {response.status_code}")
                response_data = response.json()
                
                if response.status_code == 200:
                    events = response_data.get("_embedded", {}).get("events", [])
                    self.print_results("Ticketmaster API", True, {
                        "events_found": len(events),
                        "first_event": events[0].get("name") if events else None,
                        "status": "Events retrieved successfully"
                    })
                    return True
                else:
                    self.print_results("Ticketmaster API", False, error=f"HTTP {response.status_code}: {response_data}")
                    return False
                    
        except Exception as e:
            self.print_results("Ticketmaster API", False, error=str(e))
            return False
    
    async def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting API Key Tests...")
        print(f"Current working directory: {os.getcwd()}")
        
        # Check environment variables first
        print("\n📋 Environment Variables Check:")
        env_vars = {
            "DUFFEL_API_KEY": self.duffel_key,
            "HOTELBED_API_KEY": self.hotelbeds_key, 
            "HOTELBED_API_SECRET": self.hotelbeds_secret,
            "TICKETMASTER_API_KEY": self.ticketmaster_key
        }
        
        for var, value in env_vars.items():
            if value:
                print(f"  ✅ {var}: Found (starts with {value[:10]}...)")
            else:
                print(f"  ❌ {var}: Not found")
        
        # Run individual tests
        results = []
        results.append(await self.test_duffel_api())
        results.append(await self.test_hotelbeds_api())
        results.append(await self.test_ticketmaster_api())
        
        # Summary
        print(f"\n{'='*60}")
        print("📊 TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Duffel API: {'✅ PASS' if results[0] else '❌ FAIL'}")
        print(f"Hotelbeds API: {'✅ PASS' if results[1] else '❌ FAIL'}")
        print(f"Ticketmaster API: {'✅ PASS' if results[2] else '❌ FAIL'}")
        print(f"\nTotal: {sum(results)}/3 APIs working")
        
        if sum(results) == 3:
            print("🎉 All APIs are working! You can enable real API integration.")
        elif sum(results) > 0:
            print("⚠️  Some APIs are working. Check the failed ones above.")
        else:
            print("❌ No APIs are working. Check your API keys and network connection.")
        
        return results

if __name__ == "__main__":
    tester = APITester()
    asyncio.run(tester.run_all_tests())
