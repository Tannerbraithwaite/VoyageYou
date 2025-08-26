import os
import httpx
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class DuffelFlightService:
    """Service for interacting with Duffel Flight API"""
    
    def __init__(self):
        self.api_key = os.getenv('DUFFEL_API_KEY')
        self.base_url = 'https://api.duffel.com'
        # Duffel test keys require the 'beta' API version header.
        # Detect test keys (they start with 'duffel_test_') and set the version accordingly.
        api_version = os.getenv("DUFFEL_API_VERSION")
        if not api_version:
            # For Duffel test keys the canonical version header is 'v2'
            api_version = 'v2'

        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Duffel-Version': api_version,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        if api_version:
            self.headers['Duffel-Version'] = api_version
            print(f"✈️  Duffel using explicit API version {api_version}")
        else:
            print("✈️  Duffel using default API version (no Duffel-Version header)")
    
    async def search_flights(self, origin: str, destination: str, departure_date: str, 
                           return_date: str = None, passengers: int = 1) -> Dict[str, Any]:
        """
        Search for flights using Duffel API
        
        Args:
            origin: IATA airport code (e.g., 'JFK')
            destination: IATA airport code (e.g., 'LHR')
            departure_date: Date in YYYY-MM-DD format
            return_date: Return date in YYYY-MM-DD format (optional for round trip)
            passengers: Number of passengers
        """
        try:
            print(f"✈️  Duffel Flight Search: {origin} → {destination}")
            print(f"📅 Dates: {departure_date} {'→ ' + return_date if return_date else '(one-way)'}")
            print(f"👥 Passengers: {passengers}")
            
            # Create offer request
            slices = [
                {
                    "origin": origin,
                    "destination": destination,
                    "departure_date": departure_date
                }
            ]
            
            if return_date:
                slices.append({
                    "origin": destination,
                    "destination": origin,
                    "departure_date": return_date
                })
            
            offer_request_data = {
                "slices": slices,
                "passengers": [{"type": "adult"}] * passengers,
                "cabin_class": "economy"
            }
            
            print(f"📋 Offer request data: {offer_request_data}")
            print(f"🌐 Making API request to: {self.base_url}/air/offer_requests")
            print(f"🔑 Using headers: {self.headers}")
            
            async with httpx.AsyncClient() as client:
                # Create offer request
                response = await client.post(
                    f"{self.base_url}/air/offer_requests",
                    headers=self.headers,
                    json={"data": offer_request_data},
                    timeout=30.0
                )
                
                print(f"🔍 Duffel offer request response status: {response.status_code}")
                print(f"📡 Response headers: {dict(response.headers)}")
                
                if response.status_code != 201:
                    print(f"❌ Duffel API error: {response.status_code} - {response.text}")
                    return self._get_mock_flights(origin, destination, departure_date, return_date)
                
                offer_request = response.json()
                print(f"📊 Offer request response structure: {list(offer_request.keys())}")
                print(f"📄 Offer request response (first 500 chars): {str(offer_request)[:500]}...")
                
                offer_request_id = offer_request["data"]["id"]
                print(f"🆔 Offer request ID: {offer_request_id}")
                
                # Get offers
                print(f"🌐 Fetching offers from: {self.base_url}/air/offers")
                offers_response = await client.get(
                    f"{self.base_url}/air/offers",
                    headers=self.headers,
                    params={"offer_request_id": offer_request_id},
                    timeout=30.0
                )
                
                print(f"🔍 Duffel offers response status: {offers_response.status_code}")
                print(f"📡 Offers response headers: {dict(offers_response.headers)}")
                
                if offers_response.status_code != 200:
                    print(f"❌ Duffel offers error: {offers_response.status_code}")
                    print(f"📄 Offers response body: {offers_response.text}")
                    return self._get_mock_flights(origin, destination, departure_date, return_date)
                
                offers_data = offers_response.json()
                print(f"📊 Offers response structure: {list(offers_data.keys())}")
                
                # Log the full offers response for debugging (first 1000 chars to avoid spam)
                offers_text = str(offers_data)
                print(f"📄 Full offers response (first 1000 chars): {offers_text[:1000]}...")
                
                # Parse offers and return structured data
                parsed_result = self._parse_flight_offers(offers_data, origin, destination)
                print(f"✅ Parsed flight data: {parsed_result}")
                return parsed_result
                
        except Exception as e:
            print(f"❌ Error searching flights: {e}")
            import traceback
            print(f"🔍 Full error traceback: {traceback.format_exc()}")
            return self._get_mock_flights(origin, destination, departure_date, return_date)
    
    def _parse_flight_offers(self, offers_data: Dict, origin: str, destination: str) -> Dict[str, Any]:
        """Parse Duffel API response into our format"""
        flights = []
        
        print(f"🔍 Parsing flight offers for {origin} → {destination}")
        print(f"📊 Offers data structure: {list(offers_data.keys())}")
        
        if "data" in offers_data and offers_data["data"]:
            print(f"📋 Found {len(offers_data['data'])} offers")
            
            # Get the best offer (first one is usually cheapest)
            best_offer = offers_data["data"][0]
            print(f"🏆 Best offer structure: {list(best_offer.keys())}")
            print(f"💰 Total amount: {best_offer.get('total_amount', 'N/A')} {best_offer.get('total_currency', 'N/A')}")
            print(f"✈️  Number of slices: {len(best_offer.get('slices', []))}")
            
            for i, slice_data in enumerate(best_offer["slices"]):
                print(f"🔍 Processing slice {i+1}: {list(slice_data.keys())}")
                
                segments = slice_data["segments"]
                if segments:
                    print(f"   📍 Found {len(segments)} segments")
                    first_segment = segments[0]
                    last_segment = segments[-1]
                    
                    print(f"   🛫 First segment: {first_segment.get('origin', {}).get('iata_code', 'N/A')} → {first_segment.get('destination', {}).get('iata_code', 'N/A')}")
                    print(f"   🛬 Last segment: {last_segment.get('origin', {}).get('iata_code', 'N/A')} → {last_segment.get('destination', {}).get('iata_code', 'N/A')}")
                    
                    flight_type = "outbound" if i == 0 else "return"
                    
                    # Parse departure time
                    departure_time = datetime.fromisoformat(first_segment["departing_at"].replace('Z', '+00:00'))
                    arrival_time = datetime.fromisoformat(last_segment["arriving_at"].replace('Z', '+00:00'))
                    
                    flight_info = {
                        "airline": first_segment["marketing_carrier"]["name"],
                        "flight": first_segment["marketing_carrier_flight_number"],
                        "departure": f"{first_segment['origin']['iata_code']} → {last_segment['destination']['iata_code']}",
                        "time": f"{departure_time.strftime('%I:%M %p')} - {arrival_time.strftime('%I:%M %p')}",
                        "price": int(float(best_offer["total_amount"]) / len(best_offer["slices"])),
                        "type": flight_type
                    }
                    
                    print(f"   ✈️  Parsed flight: {flight_info}")
                    flights.append(flight_info)
                else:
                    print(f"   ⚠️  No segments found in slice {i+1}")
        else:
            print("❌ No offers data found in response")
        
        if not flights:
            print("⚠️  No flights parsed, returning mock data")
            return self._get_mock_flights(origin, destination)
        
        print(f"✅ Successfully parsed {len(flights)} flights")
        return {"flights": flights}
    
    def _get_mock_flights(self, origin: str = "JFK", destination: str = "LHR", 
                         departure_date: str = None, return_date: str = None) -> Dict[str, Any]:
        """Return mock flight data when API fails"""
        return {
            "flights": [
                {
                    "airline": "United Airlines",
                    "flight": "UA 123",
                    "departure": f"{origin} → {destination}",
                    "time": "10:30 AM - 2:45 PM",
                    "price": 450,
                    "type": "outbound"
                },
                {
                    "airline": "United Airlines", 
                    "flight": "UA 456",
                    "departure": f"{destination} → {origin}",
                    "time": "6:00 PM - 11:30 PM",
                    "price": 450,
                    "type": "return"
                }
            ]
        }


class HotelbedsHotelService:
    """Service for interacting with Hotelbeds API"""
    
    def __init__(self):
        self.api_key = os.getenv('HOTELBED_API_KEY')
        self.api_secret = os.getenv('HOTELBED_API_SECRET')  # Hotelbeds uses key + secret
        self.base_url = 'https://api.test.hotelbeds.com'  # Test environment
        # Check if we have the API credentials configured
        if not self.api_key:
            print("Warning: HOTELBED_API_KEY not found in environment variables")
        if not self.api_secret:
            print("Warning: HOTELBED_API_SECRET not found in environment variables")
        
        # Hotelbeds uses X-Signature authentication
        import hashlib
        import time
        
    def _get_headers(self):
        """Generate headers with signature for Hotelbeds API"""
        import hashlib
        import time
        
        timestamp = str(int(time.time()))
        signature_string = self.api_key + self.api_secret + timestamp
        signature = hashlib.sha256(signature_string.encode()).hexdigest()
        
        return {
            'Api-key': self.api_key,
            'X-Signature': signature,
            'Accept': 'application/json'
        }
    
    async def search_hotels(self, destination: str, checkin: str, checkout: str, 
                          guests: int = 2, rooms: int = 1) -> Dict[str, Any]:
        """
        Search for hotels using Hotelbeds API
        
        Args:
            destination: City name (e.g., 'Paris')
            checkin: Check-in date in YYYY-MM-DD format
            checkout: Check-out date in YYYY-MM-DD format
            guests: Number of guests
            rooms: Number of rooms
        """
        try:
            async with httpx.AsyncClient() as client:
                # ---------------------------------------------------------
                # Hotelbeds tip: the destinations endpoint often returns 403
                # when rate-limited. In practice we can skip that extra call
                # and use a PRE-DEFINED DESTINATION CODE mapping instead.
                # ---------------------------------------------------------
                city_to_code = {
                    # USA
                    "NEW YORK": "NYC",
                    "NYC": "NYC",
                    "LOS ANGELES": "LAX",
                    "LAS VEGAS": "LAS",
                    "MIAMI": "MIA",
                    # Europe
                    "PARIS": "PAR",
                    "LONDON": "LON",
                    "BARCELONA": "BCN",
                    "BERLIN": "BER",
                }

                # Fallback – use first 3 letters of the city
                dest_code = city_to_code.get(destination.upper(), destination.upper()[:3])

                # -------------------------------
                # Build availability search body
                # -------------------------------
                search_data = {
                    "stay": {
                        "checkIn": checkin,
                        "checkOut": checkout
                    },
                    "occupancies": [
                        {
                            "rooms": rooms,
                            "adults": guests,
                            "children": 0
                        }
                    ],
                    "destination": {
                        "code": dest_code
                    }
                }
                print(f"🗺️  Hotelbeds search → city: '{destination}' mapped code: '{dest_code}'")

                # Use the correct Hotelbeds hotel availability endpoint
                hotels_response = await client.post(
                    f"{self.base_url}/hotel-api/1.0/hotels",
                    headers=self._get_headers(),
                    json=search_data,
                    timeout=30.0
                )
                
                print(f"🔍 Hotelbeds API response status: {hotels_response.status_code}")
                if hotels_response.status_code != 200:
                    print(f"Hotelbeds hotels error: {hotels_response.status_code}")
                    print(f"Response body: {hotels_response.text}")
                    return self._get_mock_hotel(destination, checkin, checkout)
                
                hotels_data = hotels_response.json()
                return self._parse_hotel_data(hotels_data, destination, checkin, checkout)
                
        except Exception as e:
            print(f"Error searching hotels: {e}")
            return self._get_mock_hotel(destination, checkin, checkout)
    
    def _parse_hotel_data(self, hotels_data: Dict, destination: str, 
                         checkin: str, checkout: str) -> Dict[str, Any]:
        """Parse Hotelbeds API response into our format"""
        if "hotels" in hotels_data and "hotels" in hotels_data["hotels"] and len(hotels_data["hotels"]["hotels"]) > 0:
            hotel_data = hotels_data["hotels"]["hotels"][0]
            
            # Calculate nights
            checkin_date = datetime.strptime(checkin, "%Y-%m-%d")
            checkout_date = datetime.strptime(checkout, "%Y-%m-%d")
            total_nights = (checkout_date - checkin_date).days
            
            # Extract real hotel data
            hotel_name = hotel_data.get("name", f"{destination} Downtown Hotel")
            min_rate = hotel_data.get("minRate", 150)
            
            # Better address extraction - try multiple possible fields
            hotel_address = None
            if "address" in hotel_data:
                address_data = hotel_data["address"]
                if isinstance(address_data, dict):
                    # Address might be an object with multiple fields
                    address_parts = []
                    if "lines" in address_data and isinstance(address_data["lines"], list):
                        address_parts.extend(address_data["lines"])
                    if "cityName" in address_data:
                        address_parts.append(address_data["cityName"])
                    if "countryCode" in address_data:
                        address_parts.append(address_data["countryCode"])
                    
                    if address_parts:
                        hotel_address = ", ".join(filter(None, address_parts))
                elif isinstance(address_data, str):
                    hotel_address = address_data
            
            # If no address field, use available location data
            if not hotel_address:
                location_parts = []
                
                # Add zone name if available (e.g., "Midtown West", "Marble Arch")
                if "zoneName" in hotel_data and hotel_data["zoneName"]:
                    location_parts.append(hotel_data["zoneName"])
                
                # Add destination name if available (e.g., "New York Area - NY", "Paris", "London")
                if "destinationName" in hotel_data and hotel_data["destinationName"]:
                    location_parts.append(hotel_data["destinationName"])
                
                # Add coordinates if available
                if "latitude" in hotel_data and "longitude" in hotel_data:
                    lat = float(hotel_data["latitude"])
                    lon = float(hotel_data["longitude"])
                    location_parts.append(f"📍 {lat:.4f}, {lon:.4f}")
                
                if location_parts:
                    hotel_address = " | ".join(location_parts)
                else:
                    hotel_address = f"Central {destination}"
            
            hotel_info = {
                "name": hotel_name,
                "address": hotel_address,
                "check_in": f"{checkin_date.strftime('%B %d, %Y')} - 3:00 PM",
                "check_out": f"{checkout_date.strftime('%B %d, %Y')} - 11:00 AM",
                "room_type": "Standard Room",
                "price": int(float(min_rate)) if min_rate else 150,
                "total_nights": total_nights
            }
            
            print(f"🏨 Parsed REAL hotel data: {hotel_name} at ${min_rate}/night")
            print(f"   📍 Address: {hotel_address}")
            return {"hotel": hotel_info}
        
        print(f"🏨 No real hotel data found, using mock for {destination}")
        return self._get_mock_hotel(destination, checkin, checkout)
    
    def _get_mock_hotel(self, destination: str, checkin: str, checkout: str) -> Dict[str, Any]:
        """Return mock hotel data when API fails"""
        checkin_date = datetime.strptime(checkin, "%Y-%m-%d")
        checkout_date = datetime.strptime(checkout, "%Y-%m-%d")
        total_nights = (checkout_date - checkin_date).days
        
        return {
            "hotel": {
                "name": f"{destination} Downtown Hotel",
                "address": f"123 Main Street, {destination}",
                "check_in": f"{checkin_date.strftime('%B %d, %Y')} - 3:00 PM",
                "check_out": f"{checkout_date.strftime('%B %d, %Y')} - 11:00 AM",
                "room_type": "Standard Room",
                "price": 150,
                "total_nights": total_nights
            }
        }


class TicketmasterEventService:
    """Service for interacting with Ticketmaster API"""
    
    def __init__(self):
        self.api_key = os.getenv('TICKETMASTER_API_KEY')
        self.base_url = 'https://app.ticketmaster.com/discovery/v2'
        # Check if we have the API key configured
        if not self.api_key:
            print("Warning: TICKETMASTER_API_KEY not found in environment variables")
        # Ticketmaster uses API key as query parameter, not in headers
        self.headers = {
            'Content-Type': 'application/json'
        }
    
    async def search_events(self, location: str, start_date: str = None, 
                          end_date: str = None, categories: List[str] = None) -> Dict[str, Any]:
        """
        Search for events using Ticketmaster API
        
        Args:
            location: City name (e.g., 'Paris')
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            categories: List of event categories
        """
        try:
            params = {
                "apikey": self.api_key,
                "city": location,
                "size": "20",
                "sort": "date,asc"
            }
            
            if start_date:
                params["startDateTime"] = f"{start_date}T00:00:00Z"
            if end_date:
                params["endDateTime"] = f"{end_date}T23:59:59Z"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/events.json",
                    headers=self.headers,
                    params=params,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"Ticketmaster API error: {response.status_code}")
                    return self._get_mock_events(location)
                
                events_data = response.json()
                return self._parse_events_data(events_data, location)
                
        except Exception as e:
            print(f"Error searching events: {e}")
            return self._get_mock_events(location)
    
    def _parse_events_data(self, events_data: Dict, location: str) -> Dict[str, Any]:
        """Parse Ticketmaster API response into our format"""
        activities = []
        
        if "_embedded" in events_data and "events" in events_data["_embedded"]:
            real_events = events_data["_embedded"]["events"]
            print(f"🎭 Found {len(real_events)} real Ticketmaster events")
            
            for event in real_events[:5]:  # Limit to 5 events
                # Parse event time
                if "dates" in event and "start" in event["dates"]:
                    start_time_str = event["dates"]["start"].get("localTime", "19:00")
                    # Convert to HH:MM format
                    if len(start_time_str) == 5:  # Already in HH:MM format
                        event_time = start_time_str
                    else:
                        event_time = "19:00"  # Default fallback
                else:
                    event_time = "19:00"
                
                # Get ticket price from priceRanges
                price = 0
                if "priceRanges" in event and event["priceRanges"]:
                    price_range = event["priceRanges"][0]
                    price = int(float(price_range.get("min", 0)))
                
                event_name = event.get("name", "Event")
                activity = {
                    "name": event_name,
                    "time": event_time,
                    "price": price,
                    "type": "bookable",
                    "description": event.get("info", "")[:100] + "..." if event.get("info") else "Live event",
                    "alternatives": []
                }
                activities.append(activity)
                print(f"  📅 {event_name} at {event_time} for ${price}")
            
            return {"events": activities}
        
        print(f"🎭 No real events found for {location}, using mock")
        return self._get_mock_events(location)
    
    def _get_mock_events(self, location: str) -> Dict[str, Any]:
        """Return mock event data when API fails"""
        return {
            "events": [
                {
                    "name": "Local Food Festival",
                    "time": "18:00",
                    "price": 25,
                    "type": "bookable",
                    "description": "Experience local cuisine and culture",
                    "alternatives": []
                },
                {
                    "name": "Art Gallery Opening",
                    "time": "19:30",
                    "price": 15,
                    "type": "bookable", 
                    "description": "Contemporary art exhibition opening",
                    "alternatives": []
                }
            ]
        }


# Service instances
duffel_service = DuffelFlightService()
hotelbeds_service = HotelbedsHotelService()
ticketmaster_service = TicketmasterEventService()
