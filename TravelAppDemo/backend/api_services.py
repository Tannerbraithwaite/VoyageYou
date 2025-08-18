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
            
            async with httpx.AsyncClient() as client:
                # Create offer request
                response = await client.post(
                    f"{self.base_url}/air/offer_requests",
                    headers=self.headers,
                    json={"data": offer_request_data},
                    timeout=30.0
                )
                
                if response.status_code != 201:
                    print(f"Duffel API error: {response.status_code} - {response.text}")
                    return self._get_mock_flights(origin, destination, departure_date, return_date)
                
                offer_request = response.json()
                offer_request_id = offer_request["data"]["id"]
                
                # Get offers
                offers_response = await client.get(
                    f"{self.base_url}/air/offers",
                    headers=self.headers,
                    params={"offer_request_id": offer_request_id},
                    timeout=30.0
                )
                
                if offers_response.status_code != 200:
                    print(f"Duffel offers error: {offers_response.status_code}")
                    return self._get_mock_flights(origin, destination, departure_date, return_date)
                
                offers_data = offers_response.json()
                
                # Parse offers and return structured data
                return self._parse_flight_offers(offers_data, origin, destination)
                
        except Exception as e:
            print(f"Error searching flights: {e}")
            return self._get_mock_flights(origin, destination, departure_date, return_date)
    
    def _parse_flight_offers(self, offers_data: Dict, origin: str, destination: str) -> Dict[str, Any]:
        """Parse Duffel API response into our format"""
        flights = []
        
        if "data" in offers_data and offers_data["data"]:
            # Get the best offer (first one is usually cheapest)
            best_offer = offers_data["data"][0]
            
            for i, slice_data in enumerate(best_offer["slices"]):
                segments = slice_data["segments"]
                if segments:
                    first_segment = segments[0]
                    last_segment = segments[-1]
                    
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
                    flights.append(flight_info)
        
        if not flights:
            return self._get_mock_flights(origin, destination)
        
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
            'Accept': 'application/json',
            'Content-Type': 'application/json'
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

                hotels_response = await client.post(
                    f"{self.base_url}/hotel-api/1.0/hotels",
                    headers=self._get_headers(),
                    json=search_data,
                    timeout=30.0
                )
                
                if hotels_response.status_code != 200:
                    print(f"Hotelbeds hotels error: {hotels_response.status_code}")
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
            hotel_address = hotel_data.get("address", f"123 Main St, {destination}")
            min_rate = hotel_data.get("minRate", 150)
            
            hotel_info = {
                "name": hotel_name,
                "address": hotel_address if isinstance(hotel_address, str) else f"Central {destination}",
                "check_in": f"{checkin_date.strftime('%B %d, %Y')} - 3:00 PM",
                "check_out": f"{checkout_date.strftime('%B %d, %Y')} - 11:00 AM",
                "room_type": "Standard Room",
                "price": int(float(min_rate)) if min_rate else 150,
                "total_nights": total_nights
            }
            
            print(f"🏨 Parsed REAL hotel data: {hotel_name} at ${min_rate}/night")
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
