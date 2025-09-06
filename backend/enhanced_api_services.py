"""
Enhanced API services for flights and hotels with detailed information and images
"""

import os
import httpx
import json
import asyncio
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
        
        # Content API endpoints (for batch processing)
        self.content_base_url = 'https://api.test.hotelbeds.com/hotel-content-api/1.0'
        self.booking_base_url = 'https://api.test.hotelbeds.com/hotel-api/1.0'
        
        # Local cache for hotel content (simulates database storage)
        self.hotel_content_cache = {}
        
        if not self.api_key or not self.api_secret:
            logger.warning("Hotelbeds API credentials not found")
        
        logger.info("Enhanced Hotelbeds service initialized with Content API batch processing")
    
    async def search_hotels_with_details(self, destination: str, check_in: str, 
                                       check_out: str, rooms: int = 1, adults: int = 2) -> Dict[str, Any]:
        """Search for hotels with comprehensive details including amenities, images, etc."""
        try:
            print(f"🔍 ENHANCED HOTEL SEARCH CALLED: {destination} from {check_in} to {check_out}")
            logger.info(f"Enhanced hotel search: {destination} from {check_in} to {check_out}")
            
            # Get basic hotel availability from working API
            print(f"🔍 Getting basic hotel availability from working API")
            
            try:
                # Import and use the working basic hotel service for availability
                from api_services import HotelbedsHotelService
                basic_service = HotelbedsHotelService()
                basic_result = await basic_service.search_hotels(destination, check_in, check_out, adults, rooms)
                
                if basic_result and "hotel" in basic_result:
                    basic_hotel = basic_result["hotel"]
                    print(f"🔍 Got basic hotel data: {basic_hotel['name']}")
                    
                    # Try to get rich content from Content API (batch processed)
                    content_data = await self._get_hotel_content_batch(basic_hotel)
                    
                    if content_data:
                        print(f"🔍 Got rich content from Content API batch data")
                        return self._merge_hotel_data(basic_hotel, content_data, destination, check_in, check_out, rooms, adults)
                    else:
                        print(f"🔍 No Content API data available, using basic enhancement")
                        return self._enhance_basic_hotel_data(basic_hotel, destination, check_in, check_out, rooms, adults)
                else:
                    print(f"🔍 No basic hotel data available")
                    return {"message": f"No hotels available for {destination} on the requested dates", "hotel": None}
                    
            except Exception as error:
                print(f"🔍 Error getting hotel data: {error}")
                return {"message": f"Unable to search hotels for {destination} due to an error", "hotel": None}
            
        except Exception as e:
            logger.error(f"Error in enhanced hotel search: {e}")
            return {"message": f"Unable to search hotels for {destination} due to an error", "hotel": None}
    
    async def _get_hotel_content_batch(self, basic_hotel: Dict) -> Optional[Dict[str, Any]]:
        """
        Get hotel content from batch-processed Content API data.
        
        This follows the CORRECT Content API usage pattern:
        1. Content API data is downloaded in batches (not real-time)
        2. Stored in local database/cache
        3. Queried locally for real-time needs
        
        For now, we'll simulate this with a few sample hotels to demonstrate the approach.
        """
        try:
            # Extract hotel code from basic hotel data
            hotel_code = basic_hotel.get("hotel_code")
            hotel_name = basic_hotel.get("name", "").lower()
            
            # Check local cache first (simulates database query)
            if hotel_code in self.hotel_content_cache:
                print(f"🔍 Found hotel content in local cache for code: {hotel_code}")
                return self.hotel_content_cache[hotel_code]
            
            # Simulate batch-processed Content API data for popular destinations
            # In production, this would come from a database populated by batch Content API calls
            sample_content = self._get_sample_hotel_content(hotel_name, basic_hotel.get("address", ""))
            
            if sample_content:
                # Cache the content (simulates database storage)
                if hotel_code:
                    self.hotel_content_cache[hotel_code] = sample_content
                print(f"🔍 Using sample Content API data for: {hotel_name}")
                return sample_content
            
            # Try to fetch from Content API (only for demonstration - not recommended for production)
            # This would be replaced by database queries in real implementation
            print(f"🔍 Attempting Content API call for demonstration purposes")
            return await self._fetch_hotel_content_demo(hotel_code, hotel_name)
            
        except Exception as e:
            print(f"🔍 Error getting hotel content: {e}")
            return None
    
    def _get_sample_hotel_content(self, hotel_name: str, destination: str) -> Optional[Dict[str, Any]]:
        """Get sample hotel content for popular destinations (simulates batch-processed data)"""
        
        # Sample content for Barcelona hotels (from batch Content API processing)
        barcelona_content = {
            "facilities": [
                {"facilityGroupCode": 1, "facilityName": "Free WiFi"},
                {"facilityGroupCode": 1, "facilityName": "Air Conditioning"},
                {"facilityGroupCode": 1, "facilityName": "Private Bathroom"},
                {"facilityGroupCode": 2, "facilityName": "24-Hour Front Desk"},
                {"facilityGroupCode": 2, "facilityName": "Concierge Service"},
                {"facilityGroupCode": 2, "facilityName": "Room Service"}
            ],
            "images": [
                {
                    "url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
                    "caption": "Hotel Exterior",
                    "imageTypeCode": "general"
                },
                {
                    "url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
                    "caption": "Lobby",
                    "imageTypeCode": "lobby"
                },
                {
                    "url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
                    "caption": "Standard Room",
                    "imageTypeCode": "room"
                }
            ],
            "policies": {
                "checkIn": "3:00 PM",
                "checkOut": "11:00 AM",
                "cancellation": "Free cancellation until 24 hours before arrival",
                "children": "Children welcome",
                "pets": "No pets allowed"
            },
            "rating": 4.2,
            "reviews": [
                {
                    "rating": 5,
                    "comment": "Excellent location in the heart of Barcelona",
                    "date": "2024-08-15"
                },
                {
                    "rating": 4,
                    "comment": "Great service and clean rooms",
                    "date": "2024-08-10"
                }
            ]
        }
        
        # For now, return None for all destinations to test real Content API
        # In production, this would return batch-processed data
        return None
    
    async def _fetch_hotel_content_demo(self, hotel_code: str, hotel_name: str) -> Optional[Dict[str, Any]]:
        """
        DEMONSTRATION ONLY: Fetch hotel content from Content API.
        
        WARNING: This is NOT recommended for production use because:
        1. Content API is designed for batch processing, not real-time calls
        2. Real-time calls can exceed rate limits and block credentials
        3. This violates Hotelbeds' recommended usage pattern
        
        In production, this would be replaced by database queries to locally stored Content API data.
        """
        try:
            if not hotel_code:
                print(f"🔍 No hotel code available for Content API call")
                return None
            
            headers = self._get_headers()
            if not headers:
                print(f"🔍 No API credentials available for Content API call")
                return None
            
            # Content API endpoint for hotel details
            url = f"{self.content_base_url}/hotels/{hotel_code}"
            
            print(f"🔍 Making Content API call to: {url}")
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=30.0)
                
                if response.status_code == 200:
                    content_data = response.json()
                    print(f"🔍 Content API call successful for hotel: {hotel_name}")
                    
                    # The real Content API nests data under 'hotel' key
                    if "hotel" in content_data:
                        hotel_data = content_data["hotel"]
                        print(f"🔍 Found hotel data: {hotel_data.get('name', {}).get('content', 'Unknown')}")
                        
                        # Cache the result (simulates database storage)
                        if hotel_code:
                            self.hotel_content_cache[hotel_code] = hotel_data
                        
                        return hotel_data
                    else:
                        print(f"🔍 No 'hotel' key in response")
                        return None
                else:
                    print(f"🔍 Content API call failed: {response.status_code}")
                    if response.status_code == 403:
                        print(f"🔍 Access denied - Content API may require different credentials or batch processing")
                    return None
                    
        except Exception as e:
            print(f"🔍 Error in Content API demo call: {e}")
            return None
    
    async def batch_download_hotel_content(self, destination_codes: List[str] = None):
        """
        DEMONSTRATION: How to properly implement Content API batch processing.
        
        This method shows the CORRECT way to use the Content API:
        1. Download all hotel data for specific destinations in batches
        2. Store in local database/cache
        3. Use for real-time queries without hitting API limits
        
        In production, this would be:
        - Run as a scheduled job (daily/weekly)
        - Store data in a proper database (PostgreSQL, MongoDB, etc.)
        - Handle pagination and rate limiting properly
        """
        try:
            print(f"🔍 Starting batch Content API download...")
            
            # Default destination codes to process
            if not destination_codes:
                destination_codes = ["BCN", "PAR", "LON", "NYC", "LAX"]
            
            headers = self._get_headers()
            if not headers:
                print(f"🔍 No API credentials available for batch download")
                return
            
            total_hotels = 0
            
            for dest_code in destination_codes:
                print(f"🔍 Processing destination: {dest_code}")
                
                # Content API endpoint for destination hotels
                url = f"{self.content_base_url}/hotels"
                params = {
                    "destinationCode": dest_code,
                    "limit": 100,  # Process in batches
                    "offset": 0
                }
                
                try:
                    async with httpx.AsyncClient() as client:
                        response = await client.get(url, headers=headers, params=params, timeout=60.0)
                        
                        if response.status_code == 200:
                            hotels_data = response.json()
                            
                            if "hotels" in hotels_data:
                                hotels = hotels_data["hotels"]
                                print(f"🔍 Downloaded {len(hotels)} hotels for {dest_code}")
                                
                                # Process each hotel and store in cache (simulates database)
                                for hotel in hotels[:10]:  # Limit to 10 for demo
                                    hotel_code = hotel.get("code")
                                    if hotel_code:
                                        # Get detailed hotel content
                                        detail_url = f"{self.content_base_url}/hotels/{hotel_code}"
                                        detail_response = await client.get(detail_url, headers=headers, timeout=30.0)
                                        
                                        if detail_response.status_code == 200:
                                            detail_data = detail_response.json()
                                            self.hotel_content_cache[hotel_code] = detail_data
                                            total_hotels += 1
                                        
                                        # Rate limiting - be respectful
                                        await asyncio.sleep(0.1)
                                
                            else:
                                print(f"🔍 No hotels found for {dest_code}")
                        else:
                            print(f"🔍 Failed to download hotels for {dest_code}: {response.status_code}")
                            
                except Exception as e:
                    print(f"🔍 Error processing {dest_code}: {e}")
                    continue
                
                # Rate limiting between destinations
                await asyncio.sleep(1.0)
            
            print(f"🔍 Batch download complete! Cached {total_hotels} hotels")
            print(f"🔍 These hotels are now available for real-time queries without API calls")
            
        except Exception as e:
            print(f"🔍 Error in batch download: {e}")
    
    def get_cached_hotel_count(self) -> int:
        """Get the number of hotels currently cached (simulates database query)"""
        return len(self.hotel_content_cache)
    
    def _extract_hotel_code_from_name(self, hotel_name: str) -> str:
        """Extract hotel code from hotel name (fallback method)"""
        # This is a fallback - in a real implementation, we'd have a mapping
        # For now, return None to indicate we can't get content
        return None
    
    def _merge_hotel_data(self, basic_hotel: Dict, content_data: Dict, destination: str,
                          check_in: str, check_out: str, rooms: int, adults: int) -> Dict[str, Any]:
        """Merge basic hotel data with rich content from Content API"""
        try:
            # Calculate nights
            check_in_date = datetime.strptime(check_in, "%Y-%m-%d")
            check_out_date = datetime.strptime(check_out, "%Y-%m-%d")
            total_nights = (check_out_date - check_in_date).days
            
            # Extract basic hotel info
            hotel_name = basic_hotel.get("name", f"{destination} Hotel")
            price = basic_hotel.get("price", 150)
            address = basic_hotel.get("address", f"Central {destination}")
            
            # Extract rich content from Content API
            amenities = []
            if "facilities" in content_data:
                for facility in content_data["facilities"]:
                    if facility.get("facilityGroupCode") == 1:  # Room facilities
                        amenities.append(facility.get("facilityName", ""))
            
            services = []
            if "facilities" in content_data:
                for facility in content_data["facilities"]:
                    if facility.get("facilityGroupCode") == 2:  # Hotel services
                        services.append(facility.get("facilityName", ""))
            
            # Get real images from Content API
            images = []
            if "images" in content_data and content_data["images"]:
                for img in content_data["images"][:5]:  # Limit to 5 images
                    if img.get("url"):
                        images.append({
                            "url": img["url"],
                            "caption": img.get("caption", ""),
                            "category": img.get("imageTypeCode", "general")
                        })
            
            # Get real policies from Content API
            policies = {}
            if "policies" in content_data:
                policies = content_data["policies"]
            
            # Get real ratings from Content API
            rating = None
            if "rating" in content_data:
                rating = content_data["rating"]
            
            # Get real reviews from Content API
            reviews = []
            if "reviews" in content_data and content_data["reviews"]:
                reviews = content_data["reviews"]
            
            # Location info - only real coordinates from API
            location_info = {}
            if "📍" in address:
                try:
                    coords_part = address.split("📍")[1].strip()
                    if "," in coords_part:
                        lat, lng = coords_part.split(",")
                        location_info = {
                            "coordinates": {
                                "lat": float(lat.strip()),
                                "lng": float(lng.strip())
                            }
                        }
                except:
                    pass
            
            enhanced_hotel = {
                "name": hotel_name,
                "address": address,
                "check_in": f"{check_in} - 3:00 PM",
                "check_out": f"{check_out} - 11:00 AM",
                "room_type": basic_hotel.get("room_type", "Standard Room"),
                "price": price,
                "total_nights": total_nights,
                "amenities": amenities,
                "services": services,
                "location": location_info,
                "policies": policies,
                "images": images,
                "rating": rating,
                "reviews": reviews
            }
            
            print(f"🔍 Merged hotel data created: {hotel_name} with {len(amenities)} amenities, {len(images)} images")
            return {"hotels": [enhanced_hotel]}
            
        except Exception as e:
            print(f"🔍 Error merging hotel data: {e}")
            return self._enhance_basic_hotel_data(basic_hotel, destination, check_in, check_out, rooms, adults)
    
    def _enhance_basic_hotel_data(self, basic_hotel: Dict, destination: str, 
                                 check_in: str, check_out: str, rooms: int, adults: int) -> Dict[str, Any]:
        """Enhance basic hotel data with additional details, images, etc."""
        try:
            # Calculate nights
            check_in_date = datetime.strptime(check_in, "%Y-%m-%d")
            check_out_date = datetime.strptime(check_out, "%Y-%m-%d")
            total_nights = (check_out_date - check_in_date).days
            
            # Extract basic hotel info
            hotel_name = basic_hotel.get("name", f"{destination} Hotel")
            price = basic_hotel.get("price", 150)
            address = basic_hotel.get("address", f"Central {destination}")
            
            # Only use amenities from API - no fake defaults
            amenities = []
            
            # Only use services from API - no fake defaults
            services = []
            
            # Location info - only real coordinates from API
            location_info = {}
            if "📍" in address:
                try:
                    coords_part = address.split("📍")[1].strip()
                    if "," in coords_part:
                        lat, lng = coords_part.split(",")
                        location_info = {
                            "coordinates": {
                                "lat": float(lat.strip()),
                                "lng": float(lng.strip())
                            }
                        }
                except:
                    pass
            
            # Only use real policies from API - no fake defaults
            policies = {}
            
            # No fake images - only real data from APIs
            images = []
            
            enhanced_hotel = {
                "name": hotel_name,
                "address": address,
                "check_in": f"{check_in} - 3:00 PM",
                "check_out": f"{check_out} - 11:00 AM",
                "room_type": basic_hotel.get("room_type", "Standard Room"),
                "price": price,
                "total_nights": total_nights,
                "amenities": amenities,
                "services": services,
                "location": location_info,
                "policies": policies,
                "images": images,
                "rating": None,
                "reviews": []
            }
            
            print(f"🔍 Enhanced hotel data created: {hotel_name} at ${price}/night")
            return {"hotels": [enhanced_hotel]}
            
        except Exception as e:
            print(f"🔍 Error enhancing basic hotel data: {e}")
            return self._get_enhanced_mock_hotels(destination, check_in, check_out, rooms, adults)
    
    def _get_headers(self) -> Dict[str, str]:
        """Get Hotelbeds API headers with authentication"""
        import hashlib
        import time
        
        api_key = os.getenv('HOTELBED_API_KEY', '')
        api_secret = os.getenv('HOTELBED_API_SECRET', '')
        
        if not api_key or not api_secret:
            logger.warning("Hotelbeds API credentials not found")
            return {}
        
        # Create signature for Hotelbeds API (same as working service)
        timestamp = str(int(time.time()))
        signature_string = api_key + api_secret + timestamp
        signature = hashlib.sha256(signature_string.encode()).hexdigest()
        
        return {
            'Api-key': api_key,
            'X-Signature': signature,
            'Accept': 'application/json'
        }
    
    def _parse_enhanced_hotel_data(self, hotels_data: Dict, destination: str, 
                                  check_in: str, check_out: str, rooms: int, adults: int) -> Dict[str, Any]:
        """Parse real Hotelbeds API response into enhanced format"""
        try:
            if "hotels" in hotels_data and "hotels" in hotels_data["hotels"] and len(hotels_data["hotels"]["hotels"]) > 0:
                hotel_data = hotels_data["hotels"]["hotels"][0]
                
                # Calculate nights
                check_in_date = datetime.strptime(check_in, "%Y-%m-%d")
                check_out_date = datetime.strptime(check_out, "%Y-%m-%d")
                total_nights = (check_out_date - check_in_date).days
                
                # Extract real hotel data
                hotel_name = hotel_data.get("name", f"{destination} Hotel")
                min_rate = hotel_data.get("minRate", 150)
                
                # Build address from available data
                address_parts = []
                if "zoneName" in hotel_data and hotel_data["zoneName"]:
                    address_parts.append(hotel_data["zoneName"])
                if "destinationName" in hotel_data and hotel_data["destinationName"]:
                    address_parts.append(hotel_data["destinationName"])
                if "latitude" in hotel_data and "longitude" in hotel_data:
                    lat = float(hotel_data["latitude"])
                    lon = float(hotel_data["longitude"])
                    address_parts.append(f"📍 {lat:.4f}, {lon:.4f}")
                
                hotel_address = " | ".join(address_parts) if address_parts else f"Central {destination}"
                
                # Get amenities from facilities if available
                amenities = []
                if "facilities" in hotel_data:
                    for facility in hotel_data["facilities"]:
                        if facility.get("facilityGroupCode") == 1:  # Room facilities
                            amenities.append(facility.get("facilityName", ""))
                
                # Only use amenities from API - no fake defaults
                if not amenities:
                    amenities = []
                
                # Get location info - only real coordinates from API
                location_info = {}
                if "latitude" in hotel_data and "longitude" in hotel_data:
                    location_info = {
                        "coordinates": {
                            "lat": float(hotel_data["latitude"]),
                            "lng": float(hotel_data["longitude"])
                        }
                    }
                
                # Only use real policies from API - no fake defaults
                policies = {}
                
                # No fake images - only real data from APIs
                images = []
                
                enhanced_hotel = {
                    "name": hotel_name,
                    "address": hotel_address,
                    "check_in": f"{check_in} - 3:00 PM",
                    "check_out": f"{check_out} - 11:00 AM",
                    "room_type": "Standard Room",
                    "price": int(float(min_rate)) if min_rate else 150,
                    "total_nights": total_nights,
                    "amenities": amenities,
                    "services": [],
                    "location": location_info,
                    "policies": policies,
                    "images": images,
                    "rating": None,
                    "reviews": []
                }
                
                logger.info(f"Enhanced real hotel data: {hotel_name} at ${min_rate}/night")
                return {"hotels": [enhanced_hotel]}
            
            # Fallback to mock data if no real data
            logger.info(f"No real hotel data found, using enhanced mock for {destination}")
            return self._get_enhanced_mock_hotels(destination, check_in, check_out, rooms, adults)
            
        except Exception as e:
            logger.error(f"Error parsing enhanced hotel data: {e}")
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
                    "name": "Hotel Information Unavailable",
                    "address": "Location information unavailable",
                    "check_in": f"{check_in} - 3:00 PM",
                    "check_out": f"{check_out} - 11:00 AM",
                    "room_type": "Deluxe Room",
                    "price": 300,
                    "total_nights": nights,
                    "amenities": [],
                    "services": [],
                    "location": {
                        "coordinates": {"lat": 48.8566, "lng": 2.3522}
                    },
                    "policies": {},
                    "images": [],
                    "rating": None,
                    "reviews": []
                }
            ]
        }

# Global instances
enhanced_flight_service = EnhancedDuffelFlightService()
enhanced_hotel_service = EnhancedHotelbedsService()
