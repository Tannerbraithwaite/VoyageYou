"""
Enhanced API services for flights and hotels with detailed information and images
"""

import os
import httpx
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from dotenv import load_dotenv
from logging_config import get_logger

load_dotenv()

logger = get_logger(__name__)

class EnhancedDuffelFlightService:
    """Enhanced service for Duffel Flight API with detailed information"""
    
    def __init__(self):
        self.api_key = os.getenv('DUFFEL_API_KEY')
        self.base_url = 'https://api.duffel.com'
        api_version = os.getenv("DUFFEL_API_VERSION", "v2")
        
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Duffel-Version': api_version,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        logger.info(f"Enhanced Duffel service initialized with API version {api_version}")
    
    async def search_flights_with_details(self, origin: str, destination: str, 
                                        departure_date: str, return_date: str = None, 
                                        passengers: int = 1) -> Dict[str, Any]:
        """Search for flights with comprehensive details including baggage, amenities, etc."""
        try:
            logger.info(f"Enhanced flight search: {origin} → {destination} on {departure_date}")
            
            # Enhanced offer request with more details
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
                "passengers": [{"type": "adult"} for _ in range(passengers)],
                "cabin_class": "economy",
                "include_available_services": True,  # Get baggage, meals, etc.
                "include_offers": True
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
                    logger.warning(f"Duffel API error: {response.status_code}")
                    return self._get_enhanced_mock_flights(origin, destination, departure_date, return_date)
                
                offer_request = response.json()
                offer_request_id = offer_request["data"]["id"]
                
                # Get detailed offers
                offers_response = await client.get(
                    f"{self.base_url}/air/offers",
                    headers=self.headers,
                    params={"offer_request_id": offer_request_id},
                    timeout=30.0
                )
                
                if offers_response.status_code != 200:
                    logger.warning(f"Duffel offers error: {offers_response.status_code}")
                    return self._get_enhanced_mock_flights(origin, destination, departure_date, return_date)
                
                offers_data = offers_response.json()
                return self._parse_enhanced_flight_offers(offers_data, origin, destination)
                
        except Exception as e:
            logger.error(f"Error in enhanced flight search: {e}")
            return self._get_enhanced_mock_flights(origin, destination, departure_date, return_date)
    
    def _parse_enhanced_flight_offers(self, offers_data: Dict, origin: str, destination: str) -> Dict[str, Any]:
        """Parse Duffel API response with enhanced details"""
        flights = []
        
        if "data" in offers_data and offers_data["data"]:
            best_offer = offers_data["data"][0]
            
            for i, slice_data in enumerate(best_offer["slices"]):
                segments = slice_data["segments"]
                if segments:
                    first_segment = segments[0]
                    last_segment = segments[-1]
                    
                    flight_type = "outbound" if i == 0 else "return"
                    
                    # Parse times
                    departure_time = datetime.fromisoformat(first_segment["departing_at"].replace('Z', '+00:00'))
                    arrival_time = datetime.fromisoformat(last_segment["arriving_at"].replace('Z', '+00:00'))
                    
                    # Enhanced flight information
                    flight_info = {
                        "airline": first_segment["marketing_carrier"]["name"],
                        "flight": first_segment["marketing_carrier_flight_number"],
                        "departure": f"{first_segment['origin']['iata_code']} → {last_segment['destination']['iata_code']}",
                        "time": f"{departure_time.strftime('%I:%M %p')} - {arrival_time.strftime('%I:%M %p')}",
                        "price": int(float(best_offer["total_amount"]) / len(best_offer["slices"])),
                        "type": flight_type,
                        # Enhanced details
                        "baggage": self._extract_baggage_info(best_offer, i),
                        "cabin_class": best_offer.get("cabin_class", "economy"),
                        "meals": self._extract_meal_info(best_offer, i),
                        "aircraft": self._extract_aircraft_info(first_segment),
                        "duration": self._calculate_duration(departure_time, arrival_time),
                        "entertainment": self._extract_entertainment_info(best_offer),
                        "terminal_info": {
                            "departure_terminal": first_segment.get("origin", {}).get("terminal"),
                            "arrival_terminal": last_segment.get("destination", {}).get("terminal")
                        }
                    }
                    
                    flights.append(flight_info)
        
        return {"flights": flights}
    
    def _extract_baggage_info(self, offer: Dict, slice_index: int) -> Dict:
        """Extract baggage allowance information"""
        try:
            # This would need to be implemented based on Duffel's baggage API
            # For now, return standard information
            return {
                "carry_on": "1 personal item + 1 carry-on (max 12kg)",
                "checked_bags": "1 checked bag included (max 23kg)",
                "excess_fees": "$100 per additional bag",
                "special_items": "Sports equipment, musical instruments available"
            }
        except Exception as e:
            logger.warning(f"Error extracting baggage info: {e}")
            return {"carry_on": "Standard allowance", "checked_bags": "1 included"}
    
    def _extract_meal_info(self, offer: Dict, slice_index: int) -> List[str]:
        """Extract meal information"""
        try:
            # This would need to be implemented based on Duffel's meal API
            return ["Dinner included", "Beverages available"]
        except Exception as e:
            logger.warning(f"Error extracting meal info: {e}")
            return ["Meals available for purchase"]
    
    def _extract_aircraft_info(self, segment: Dict) -> Dict:
        """Extract aircraft information"""
        try:
            aircraft = segment.get("aircraft", {})
            return {
                "model": aircraft.get("name", "Unknown"),
                "configuration": aircraft.get("configuration", "Standard"),
                "seats": aircraft.get("total_seats", "Unknown")
            }
        except Exception as e:
            logger.warning(f"Error extracting aircraft info: {e}")
            return {"model": "Standard aircraft", "configuration": "Economy"}
    
    def _calculate_duration(self, departure: datetime, arrival: datetime) -> str:
        """Calculate flight duration"""
        duration = arrival - departure
        hours = duration.total_seconds() // 3600
        minutes = (duration.total_seconds() % 3600) // 60
        return f"{int(hours)}h {int(minutes)}m"
    
    def _extract_entertainment_info(self, offer: Dict) -> List[str]:
        """Extract entertainment information"""
        return ["Personal TV", "WiFi available for purchase", "Power outlets"]
    
    def _get_enhanced_mock_flights(self, origin: str, destination: str, 
                                  departure_date: str = None, return_date: str = None) -> Dict[str, Any]:
        """Return enhanced mock flight data when API fails"""
        return {
            "flights": [
                {
                    "airline": "United Airlines",
                    "flight": "UA123",
                    "departure": f"{origin} → {destination}",
                    "time": "10:00 AM - 11:30 PM",
                    "price": 800,
                    "type": "outbound",
                    "baggage": {
                        "carry_on": "1 personal item + 1 carry-on (max 12kg)",
                        "checked_bags": "1 checked bag included (max 23kg)",
                        "excess_fees": "$100 per additional bag"
                    },
                    "cabin_class": "economy",
                    "meals": ["Dinner included", "Beverages available"],
                    "aircraft": {"model": "Boeing 787-9", "configuration": "Standard", "seats": "300"},
                    "duration": "7h 30m",
                    "entertainment": ["Personal TV", "WiFi available", "Power outlets"],
                    "terminal_info": {"departure_terminal": "Terminal 7", "arrival_terminal": "Terminal 1"}
                }
            ]
        }

class EnhancedHotelbedsService:
    """Enhanced service for Hotelbeds API with detailed information and images"""
    
    def __init__(self):
        self.api_key = os.getenv('HOTELBED_API_KEY')
        self.api_secret = os.getenv('HOTELBED_API_SECRET')
        self.base_url = 'https://api.hotelbeds.com'
        
        if not self.api_key or not self.api_secret:
            logger.warning("Hotelbeds API credentials not found")
        
        logger.info("Enhanced Hotelbeds service initialized")
    
    async def search_hotels_with_details(self, destination: str, check_in: str, 
                                       check_out: str, rooms: int = 1, adults: int = 2) -> Dict[str, Any]:
        """Search for hotels with comprehensive details including amenities, images, etc."""
        try:
            logger.info(f"Enhanced hotel search: {destination} from {check_in} to {check_out}")
            
            # Enhanced hotel search with more details
            search_data = {
                "stay": {
                    "checkIn": check_in,
                    "checkOut": check_out
                },
                "occupancies": [{
                    "rooms": rooms,
                    "adults": adults,
                    "children": 0
                }],
                "destination": {
                    "zone": destination
                },
                "accommodations": ["HOTEL"],
                "includeDetails": True,
                "includeFacilities": True,
                "includePolicies": True,
                "includeLocation": True,
                "includeImages": True
            }
            
            # For now, return enhanced mock data
            # In production, you'd make the actual API call here
            return self._get_enhanced_mock_hotels(destination, check_in, check_out, rooms, adults)
            
        except Exception as e:
            logger.error(f"Error in enhanced hotel search: {e}")
            return self._get_enhanced_mock_hotels(destination, check_in, check_out, rooms, adults)
    
    def _get_enhanced_mock_hotels(self, destination: str, check_in: str, 
                                 check_out: str, rooms: int, adults: int) -> Dict[str, Any]:
        """Return enhanced mock hotel data with images and details"""
        check_in_date = datetime.strptime(check_in, "%Y-%m-%d")
        check_out_date = datetime.strptime(check_out, "%Y-%m-%d")
        nights = (check_out_date - check_in_date).days
        
        return {
            "hotels": [
                {
                    "name": "Luxury Hotel Paris",
                    "address": "123 Champs-Élysées, 75008 Paris, France",
                    "check_in": f"{check_in} - 3:00 PM",
                    "check_out": f"{check_out} - 11:00 AM",
                    "room_type": "Deluxe Room",
                    "price": 300,
                    "total_nights": nights,
                    "amenities": [
                        "Free WiFi", "Air Conditioning", "Mini Bar", "Room Service",
                        "24-hour Front Desk", "Concierge Service", "Spa", "Fitness Center",
                        "Swimming Pool", "Restaurant", "Bar", "Business Center"
                    ],
                    "services": [
                        "Restaurant", "Bar", "Fitness Center", "Business Center",
                        "Airport Shuttle", "Valet Parking", "Spa Services", "Tour Desk"
                    ],
                    "location": {
                        "coordinates": {"lat": 48.8566, "lng": 2.3522},
                        "distance_to_airport": "25 km",
                        "distance_to_center": "0.5 km",
                        "nearby_attractions": [
                            "Eiffel Tower (1.2 km)", "Arc de Triomphe (0.3 km)", 
                            "Champs-Élysées (0.1 km)", "Louvre Museum (2.1 km)"
                        ]
                    },
                    "policies": {
                        "check_in_time": "15:00",
                        "check_out_time": "11:00",
                        "cancellation_policy": "Free cancellation until 24h before arrival",
                        "taxes": "City tax: €3.30 per person per night",
                        "fees": "Resort fee: €15 per night"
                    },
                    "images": [
                        {
                            "url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
                            "caption": "Hotel Exterior",
                            "category": "exterior"
                        },
                        {
                            "url": "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop",
                            "caption": "Deluxe Room",
                            "category": "room"
                        },
                        {
                            "url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
                            "caption": "Restaurant",
                            "category": "dining"
                        }
                    ],
                    "rating": {
                        "overall": 4.8,
                        "cleanliness": 4.9,
                        "comfort": 4.7,
                        "location": 4.9,
                        "service": 4.8
                    },
                    "reviews": [
                        {
                            "rating": 5,
                            "comment": "Excellent location and service!",
                            "date": "2025-08-15"
                        },
                        {
                            "rating": 4,
                            "comment": "Great hotel, very clean and comfortable.",
                            "date": "2025-08-10"
                        }
                    ]
                }
            ]
        }

# Global instances
enhanced_flight_service = EnhancedDuffelFlightService()
enhanced_hotel_service = EnhancedHotelbedsService()
