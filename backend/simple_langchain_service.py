"""
Simplified LangChain-based Travel Itinerary Service

This service provides structured, reliable travel itinerary generation using LangChain
with guaranteed JSON output and better prompting, while keeping the implementation simple.
"""

import json
import os
import re
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Union

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

from database import User, UserInterest
from sqlalchemy.orm import Session
from services import ChatbotService


class SimpleLangChainTravelService:
    """
    Simplified LangChain-based travel itinerary service with structured output.
    """
    
    def __init__(self, openai_api_key: str):
        self.openai_api_key = openai_api_key
        self.llm = ChatOpenAI(
            api_key=openai_api_key,
            model="gpt-4o",  # Use GPT-4o for better reasoning
            temperature=0.1,  # Lower temperature for more consistent results
            max_tokens=4000
        )
        
        # Create JSON output parser for structured responses
        self.json_parser = JsonOutputParser()
        
        # Create the main prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self._get_system_prompt()),
            ("human", "{user_input}")
        ])
        
        # Create the chain
        self.chain = self.prompt | self.llm | self.json_parser
    
    def _get_system_prompt(self) -> str:
        """Get the comprehensive system prompt for travel itinerary generation"""
        return """You are an expert travel itinerary planner. Create detailed, realistic travel itineraries in JSON format.

CRITICAL RULES:
1. **ALWAYS respond with valid JSON only** - no other text before or after
2. **NEVER include fake or made-up data** - if you don't have real data, exclude those fields
3. **Create DETAILED, REALISTIC itineraries** with specific attractions, restaurants, and activities
4. **Geographic accuracy** - ensure all locations are correct and realistic for the destination
5. **Include 2-3 alternatives** for each activity with same structure
6. **Use realistic timing** - space activities appropriately (2-3 hours apart)
7. **Research actual attractions** - use real places, restaurants, and activities for each city

DESTINATION PARSING RULES:
- "Vancouver to Victoria" = single city trip to "Victoria, BC, Canada" (NOT Vicenza, Italy)
- "Victoria" alone = "Victoria, BC, Canada" (NOT Vicenza, Italy)
- "3 days in Naples, 1 day in Rome" = multi-city trip to ["Naples, Italy", "Rome, Italy"]

DURATION CALCULATION:
- "weekend trip" = 2 days
- "Saturday and Sunday" = 2 days  
- "3 days in Naples, 1 day in Rome" = 4 days total (3+1)

ACTIVITY CLASSIFICATION:
- "bookable": Museums, tours, shows with advance booking
- "estimated": Free attractions, meals, general activities

JSON FORMAT - SINGLE CITY:
{{
  "trip_type": "single_city",
  "destination": "Victoria, BC, Canada",
  "duration": "2 days",
  "description": "Weekend trip to Victoria",
  "schedule": [
    {{
      "day": 1,
      "date": "2024-12-15",
      "activities": [
        {{
          "name": "Inner Harbour Walk",
          "time": "10:00 AM",
          "price": 0,
          "type": "estimated",
          "description": "Scenic waterfront walk",
          "alternatives": [
            {{"name": "Beacon Hill Park", "time": "10:00 AM", "price": 0, "type": "estimated", "description": "Visit the scenic and historic Beacon Hill Park in downtown Victoria", "alternatives": []}},
            {{"name": "Abkhazi Garden", "time": "10:00 AM", "price": 15, "type": "estimated", "description": "Beautiful garden with unique plant collections and a teahouse", "alternatives": []}}
          ]
        }},
        {{
          "name": "Royal BC Museum",
          "time": "2:00 PM", 
          "price": 27,
          "type": "bookable",
          "description": "Learn about BC history and culture",
          "alternatives": [
            {{"name": "Craigdarroch Castle", "time": "2:00 PM", "price": 15, "type": "bookable", "description": "Tour the historic Victorian-era castle with stunning architecture", "alternatives": []}},
            {{"name": "Victoria Bug Zoo", "time": "2:00 PM", "price": 12, "type": "bookable", "description": "Explore the fascinating world of insects and arachnids", "alternatives": []}}
          ]
        }}
      ]
    }}
  ],
  "total_cost": 27,
  "bookable_cost": 27,
  "estimated_cost": 0
}}

JSON FORMAT - MULTI CITY:
{{
  "trip_type": "multi_city",
  "destinations": ["Naples, Italy", "Rome, Italy"],
  "duration": "4 days",
  "description": "Multi-city trip to Naples and Rome",
  "inter_city_transport": [
    {{
      "from_location": "Naples",
      "to": "Rome",
      "type": "train",
      "carrier": "Trenitalia",
      "departure_time": "10:00 AM",
      "arrival_time": "1:30 PM",
      "price": 45,
      "description": "High-speed train"
    }}
  ],
  "schedule": [
    {{
      "day": 1,
      "date": "2024-12-15",
      "city": "Naples, Italy",
      "activities": [
        {{
          "name": "Naples Historic Center",
          "time": "10:00 AM",
          "price": 0,
          "type": "estimated", 
          "description": "Explore UNESCO World Heritage site",
          "alternatives": []
        }}
      ]
    }}
  ],
  "total_cost": 45,
  "bookable_cost": 45,
  "estimated_cost": 0
}}

ACTIVITY CREATION GUIDELINES:
- **Research real attractions**: Use actual museums, parks, restaurants, and landmarks
- **Victoria, BC examples**: Butchart Gardens, Royal BC Museum, Fisherman's Wharf, Beacon Hill Park, Craigdarroch Castle
- **Paris examples**: Louvre, Eiffel Tower, Notre-Dame, Champs-Élysées, Montmartre
- **Rome examples**: Colosseum, Vatican, Trevi Fountain, Roman Forum, Pantheon
- **Naples examples**: Pompeii, Naples Underground, Castel dell'Ovo, Spaccanapoli

PRICING GUIDELINES:
- Museums: $15-35, Gardens: $20-40, Castles: $10-20, Free attractions: $0
- Restaurants: $30-80 for dinner, $15-40 for lunch, $10-25 for casual meals
- Tours: $25-60, Transportation: $5-50 depending on distance

IMPORTANT NOTES:
- Only include "flights" and "hotel" fields if you have REAL API data
- Focus on creating detailed, realistic schedules with actual attractions
- Use proper pricing based on typical costs for each destination
- Include 2-3 meaningful alternatives for each activity
- Ensure all activities match the correct city for multi-city trips
- Space activities 2-3 hours apart for realistic timing"""

    def _get_user_profile(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get user profile data for personalization"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            interests = db.query(UserInterest).filter(UserInterest.user_id == user_id).all()
            
            return {
                "travel_style": user.travel_style if user else "solo",
                "budget_range": user.budget_range if user else "moderate", 
                "interests": [i.interest for i in interests] if interests else [],
                "location": user.location if user else "New York, NY, USA"
            }
        except Exception as e:
            print(f"Error getting user profile: {e}")
            return {
                "travel_style": "solo",
                "budget_range": "moderate",
                "interests": [],
                "location": "New York, NY, USA"
            }
    
    async def generate_itinerary(self, db: Session, user_id: int, user_input: str) -> Dict[str, Any]:
        """
        Generate travel itinerary using simplified LangChain approach with conversation history
        
        Args:
            db: Database session
            user_id: User ID for personalization
            user_input: Natural language trip request
            
        Returns:
            Structured itinerary data
        """
        try:
            print(f"🚀 SimpleLangChain: Starting itinerary generation for: '{user_input}'")
            
            # Get user profile for personalization
            user_profile = self._get_user_profile(db, user_id)
            print(f"👤 User profile: {user_profile}")
            
            # Build conversation context with history
            conversation_context = self._build_conversation_context(db, user_id, user_input, user_profile)
            print(f"📝 Conversation context: {conversation_context[:200]}...")
            
            # Generate itinerary using the chain with conversation context
            print("🔍 Generating itinerary with LangChain...")
            result = await self.chain.ainvoke({"user_input": conversation_context})
            
            print(f"✅ Generated itinerary: {type(result)}")
            print(f"🔍 Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
            
            # Ensure we have required fields
            if isinstance(result, dict):
                result = self._validate_and_fix_result(result, user_input)
                
                # Enhance with real API data if possible
                print("🔧 Enhancing with real API data...")
                enhanced_result = await self._enhance_with_real_data(result)
                
                print("🎉 SimpleLangChain: Itinerary generation complete!")
                return enhanced_result
            else:
                raise ValueError(f"Unexpected result type: {type(result)}")
                
        except Exception as e:
            print(f"❌ SimpleLangChain error: {e}")
            print(f"🔍 Error type: {type(e).__name__}")
            print(f"🔍 User input: '{user_input}'")
            print(f"🔍 User profile: {user_profile}")
            import traceback
            traceback.print_exc()
            
            # Log the specific error for debugging
            print(f"🚨 LangChain service failed for user input: '{user_input}'")
            print(f"🚨 Falling back to basic itinerary generation")
            
            # Return a structured fallback response
            return self._create_fallback_response(user_input, user_profile)
    
    def _build_conversation_context(self, db: Session, user_id: int, user_input: str, user_profile: Dict[str, Any]) -> str:
        """Build conversation context with history for better continuity"""
        try:
            # Get recent chat history (last 2 turns)
            from services import ChatbotService
            chat_history = ChatbotService.get_chat_history(db, user_id, limit=2)
            
            # Build conversation context
            context_parts = []
            
            # Add user profile
            interests_str = ', '.join(user_profile['interests']) if user_profile['interests'] else 'general travel'
            context_parts.append(f"""Traveler Profile:
- Travel Style: {user_profile['travel_style']}
- Budget: {user_profile['budget_range']}
- Interests: {interests_str}
- Home Location: {user_profile['location']}""")
            
            # Add conversation history if available
            if chat_history:
                context_parts.append("Recent Conversation:")
                for msg in reversed(chat_history):
                    if msg.is_bot and msg.response:
                        # Truncate long responses to avoid context overflow
                        response_content = msg.response
                        if len(response_content) > 300:
                            if response_content.strip().startswith('{'):
                                try:
                                    import json
                                    data = json.loads(response_content)
                                    if 'destination' in data and 'duration' in data:
                                        response_content = f"Previous itinerary: {data['destination']} for {data['duration']}"
                                    else:
                                        response_content = "Previous travel itinerary created"
                                except:
                                    response_content = "Previous travel itinerary created"
                            else:
                                response_content = response_content[:200] + "... [truncated]"
                        context_parts.append(f"Assistant: {response_content}")
                    elif msg.message and msg.message != user_input:  # Exclude current message
                        context_parts.append(f"User: {msg.message}")
            
            # Add current user input
            context_parts.append(f"Current Request: {user_input}")
            
            # Add instruction
            context_parts.append("Please create a personalized itinerary based on this conversation and profile. If this is a follow-up to a previous request, build upon the previous context.")
            
            return "\n\n".join(context_parts)
            
        except Exception as e:
            print(f"Error building conversation context: {e}")
            # Fallback to simple profile enhancement
            return self._enhance_input_with_profile(user_input, user_profile)
    
    def _enhance_input_with_profile(self, user_input: str, user_profile: Dict[str, Any]) -> str:
        """Enhance user input with profile context (fallback method)"""
        interests_str = ', '.join(user_profile['interests']) if user_profile['interests'] else 'general travel'
        
        enhanced = f"""User Request: {user_input}

Traveler Profile:
- Travel Style: {user_profile['travel_style']}
- Budget: {user_profile['budget_range']}
- Interests: {interests_str}
- Home Location: {user_profile['location']}

Please create a personalized itinerary based on this request and profile."""
        
        return enhanced
    
    def _validate_and_fix_result(self, result: Dict[str, Any], user_input: str) -> Dict[str, Any]:
        """Validate and fix the generated result"""
        
        # Ensure required fields exist
        if 'trip_type' not in result:
            result['trip_type'] = 'single_city'
        
        if 'destination' not in result and 'destinations' not in result:
            # Try to extract from user input
            if 'victoria' in user_input.lower():
                result['destination'] = 'Victoria, BC, Canada'
            else:
                result['destination'] = 'Paris, France'  # Default fallback
        
        if 'duration' not in result:
            if 'weekend' in user_input.lower() or 'saturday and sunday' in user_input.lower():
                result['duration'] = '2 days'
            else:
                result['duration'] = '3 days'
        
        if 'schedule' not in result:
            result['schedule'] = []
        
        # Ensure cost fields exist
        if 'total_cost' not in result:
            result['total_cost'] = 0
        if 'bookable_cost' not in result:
            result['bookable_cost'] = 0
        if 'estimated_cost' not in result:
            result['estimated_cost'] = 0
        
        return result
    
    async def _enhance_with_real_data(self, itinerary_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance itinerary with real API data"""
        try:
            # Only enhance if we have the basic structure
            if not itinerary_data.get('schedule'):
                return itinerary_data
            
            destination = itinerary_data.get('destination', '')
            if not destination:
                destinations = itinerary_data.get('destinations', [])
                if destinations:
                    destination = destinations[0]
            
            if destination:
                city = destination.split(',')[0].strip()
                
                # Try to enhance with real hotel data
                try:
                    from api_services import hotelbeds_service
                    from datetime import datetime, timedelta
                    
                    # Use future dates for API calls
                    start_date = (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d')
                    end_date = (datetime.now() + timedelta(days=93)).strftime('%Y-%m-%d')
                    
                    hotel_data = await hotelbeds_service.search_hotels(city, start_date, end_date)
                    
                    if hotel_data.get('hotel') and not hotel_data['hotel'].get('name', '').endswith('Downtown Hotel'):
                        # Only use real data (not mock)
                        real_hotel = hotel_data['hotel']
                        itinerary_data['hotel'] = {
                            "name": real_hotel['name'],
                            "address": real_hotel['address'],
                            "check_in": real_hotel['check_in'],
                            "check_out": real_hotel['check_out'],
                            "room_type": real_hotel['room_type'],
                            "price": real_hotel['price'],
                            "total_nights": real_hotel['total_nights'],
                            "alternatives": []
                        }
                        print(f"✅ Enhanced with real hotel: {real_hotel['name']}")
                
                except Exception as e:
                    print(f"Hotel enhancement error: {e}")
                
                # Try to enhance with real flight data
                try:
                    from api_services import duffel_service
                    
                    # Map cities to IATA codes
                    city_to_iata = {
                        'victoria': 'YYJ', 'vancouver': 'YVR', 'calgary': 'YYC', 'toronto': 'YYZ',
                        'montreal': 'YUL', 'edmonton': 'YEG', 'winnipeg': 'YWG', 'ottawa': 'YOW',
                        'paris': 'CDG', 'london': 'LHR', 'rome': 'FCO', 'naples': 'NAP',
                        'new york': 'JFK', 'nyc': 'JFK', 'los angeles': 'LAX', 'chicago': 'ORD',
                        'miami': 'MIA', 'boston': 'BOS', 'seattle': 'SEA', 'san francisco': 'SFO'
                    }
                    
                    # Extract origin and destination from user input
                    origin_code = "JFK"  # Default fallback
                    dest_code = city[:3].upper()  # Default fallback
                    
                    # Try to detect origin city from user input
                    user_input_lower = user_input.lower()
                    for city_name, iata_code in city_to_iata.items():
                        if city_name in user_input_lower:
                            if 'from' in user_input_lower and user_input_lower.find(city_name) < user_input_lower.find('from'):
                                # City appears before "from", likely destination
                                dest_code = iata_code
                            elif 'to' in user_input_lower and user_input_lower.find(city_name) > user_input_lower.find('to'):
                                # City appears after "to", likely destination
                                dest_code = iata_code
                            elif 'from' in user_input_lower and user_input_lower.find(city_name) > user_input_lower.find('from'):
                                # City appears after "from", likely origin
                                origin_code = iata_code
                            else:
                                # No clear indicator, assume destination
                                dest_code = iata_code
                    
                    # If we found a destination but no origin, try to detect origin
                    if dest_code == city[:3].upper() and 'from' in user_input_lower:
                        # Look for origin city after "from"
                        from_index = user_input_lower.find('from')
                        after_from = user_input_lower[from_index + 4:].strip()
                        for city_name, iata_code in city_to_iata.items():
                            if city_name in after_from:
                                origin_code = iata_code
                                break
                    
                    print(f"🛫 Detected origin: {origin_code}, destination: {dest_code}")
                    
                    flight_data = await duffel_service.search_flights(
                        origin_code, dest_code, start_date, end_date
                    )
                    
                    if flight_data.get('flights'):
                        itinerary_data['flights'] = flight_data['flights']
                        print(f"✅ Enhanced with real flights: {len(flight_data['flights'])} flights")
                
                except Exception as e:
                    print(f"Flight enhancement error: {e}")
                
                # Try to enhance with real event data
                try:
                    from api_services import ticketmaster_service
                    
                    # Use future dates for API calls
                    start_date = (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d')
                    end_date = (datetime.now() + timedelta(days=93)).strftime('%Y-%m-%d')
                    
                    events_data = await ticketmaster_service.search_events(city, start_date, end_date)
                    
                    if events_data.get('events'):
                        # Filter out mock events
                        real_events = [e for e in events_data['events'] 
                                     if e['name'] not in ['Local Food Festival', 'Art Gallery Opening']]
                        
                        if real_events:
                            # Add real events to the last day of the schedule
                            if itinerary_data.get('schedule'):
                                last_day = itinerary_data['schedule'][-1]
                                if 'activities' not in last_day:
                                    last_day['activities'] = []
                                
                                # Add first 2 real events as activities
                                for event in real_events[:2]:
                                    last_day['activities'].append(event)
                                
                                print(f"✅ Enhanced with real events: {len(real_events[:2])} events")
                
                except Exception as e:
                    print(f"Event enhancement error: {e}")
        
        except Exception as e:
            print(f"Enhancement error: {e}")
        
        return itinerary_data
    
    def _create_fallback_response(self, user_input: str, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Create a fallback response when LangChain fails"""
        print("🔄 Creating fallback response...")
        
        # Try to extract basic info from user input
        input_lower = user_input.lower()
        
        # More comprehensive destination detection
        if 'vancouver' in input_lower and 'victoria' in input_lower:
            destination = "Victoria, BC, Canada"
            trip_type = "single_city"
        elif 'naples' in input_lower and 'rome' in input_lower:
            destinations = ["Naples, Italy", "Rome, Italy"]
            trip_type = "multi_city"
            destination = None
        elif 'calgary' in input_lower:
            destination = "Calgary, AB, Canada"
            trip_type = "single_city"
        elif 'toronto' in input_lower:
            destination = "Toronto, ON, Canada"
            trip_type = "single_city"
        elif 'montreal' in input_lower:
            destination = "Montreal, QC, Canada"
            trip_type = "single_city"
        elif 'victoria' in input_lower:
            destination = "Victoria, BC, Canada"
            trip_type = "single_city"
        elif 'vancouver' in input_lower:
            destination = "Vancouver, BC, Canada"
            trip_type = "single_city"
        elif 'naples' in input_lower:
            destination = "Naples, Italy"
            trip_type = "single_city"
        elif 'rome' in input_lower:
            destination = "Rome, Italy"
            trip_type = "single_city"
        elif 'paris' in input_lower:
            destination = "Paris, France"
            trip_type = "single_city"
        elif 'london' in input_lower:
            destination = "London, UK"
            trip_type = "single_city"
        elif 'new york' in input_lower or 'nyc' in input_lower:
            destination = "New York, NY, USA"
            trip_type = "single_city"
        elif 'tokyo' in input_lower:
            destination = "Tokyo, Japan"
            trip_type = "single_city"
        elif 'sydney' in input_lower:
            destination = "Sydney, Australia"
            trip_type = "single_city"
        else:
            # Try to extract any city name from the input
            import re
            city_match = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b', user_input)
            if city_match:
                city_name = city_match.group(1)
                destination = f"{city_name}"
                trip_type = "single_city"
            else:
                destination = "Paris, France"
                trip_type = "single_city"
        
        # Determine duration
        if 'weekend' in input_lower or 'saturday and sunday' in input_lower:
            duration = "2 days"
            duration_days = 2
        elif '4 day' in input_lower:
            duration = "4 days"
            duration_days = 4
        else:
            duration = "3 days"
            duration_days = 3
        
        # Create basic schedule
        schedule = []
        for day in range(1, duration_days + 1):
            day_date = (datetime.now() + timedelta(days=90 + day - 1)).strftime('%Y-%m-%d')
            
            if trip_type == "multi_city":
                current_city = destinations[0] if day <= 3 else destinations[1]
                city_name = current_city.split(',')[0]
            else:
                current_city = None
                city_name = destination.split(',')[0] if destination else "Paris"
            
            # Create more specific activities based on the destination
            if city_name.lower() in ['victoria', 'vancouver']:
                activity_name = f"Explore {city_name} Waterfront"
                activity_desc = f"Discover the scenic waterfront and historic sites of {city_name}"
                alt_name = f"{city_name} Historic District Walk"
                alt_desc = f"Walking tour through {city_name}'s historic downtown"
            elif city_name.lower() in ['naples', 'rome']:
                activity_name = f"Explore {city_name} Historic Center"
                activity_desc = f"Discover ancient history and culture in {city_name}"
                alt_name = f"{city_name} Food Tour"
                alt_desc = f"Taste authentic local cuisine in {city_name}"
            elif city_name.lower() == 'paris':
                activity_name = f"Explore {city_name} Historic Center"
                activity_desc = f"Discover the art, culture, and history of {city_name}"
                alt_name = f"{city_name} Seine River Walk"
                alt_desc = f"Scenic walk along the Seine River in {city_name}"
            elif city_name.lower() == 'london':
                activity_name = f"Explore {city_name} Royal Quarter"
                activity_desc = f"Visit historic landmarks and royal sites in {city_name}"
                alt_name = f"{city_name} Thames Walk"
                alt_desc = f"Walk along the Thames River in {city_name}"
            elif city_name.lower() in ['new york', 'nyc']:
                activity_name = f"Explore {city_name} Manhattan"
                activity_desc = f"Discover the iconic sights and energy of {city_name}"
                alt_name = f"{city_name} Central Park Walk"
                alt_desc = f"Explore the famous Central Park in {city_name}"
            elif city_name.lower() == 'tokyo':
                activity_name = f"Explore {city_name} Traditional Districts"
                activity_desc = f"Experience traditional culture and modern innovation in {city_name}"
                alt_name = f"{city_name} Temple Tour"
                alt_desc = f"Visit historic temples and shrines in {city_name}"
            elif city_name.lower() == 'sydney':
                activity_name = f"Explore {city_name} Harbor"
                activity_desc = f"Discover the iconic harbor and waterfront of {city_name}"
                alt_name = f"{city_name} Opera House Tour"
                alt_desc = f"Visit the famous Opera House in {city_name}"
            else:
                activity_name = f"Explore {city_name} City Center"
                activity_desc = f"Discover the highlights and culture of {city_name}"
                alt_name = f"{city_name} Walking Tour"
                alt_desc = f"Guided walking tour of {city_name}"
            
            activity = {
                "name": activity_name,
                "time": "10:00 AM",
                "price": 25,
                "type": "estimated",
                "description": activity_desc,
                "alternatives": [
                    {
                        "name": alt_name,
                        "time": "10:00 AM",
                        "price": 20,
                        "type": "estimated",
                        "description": alt_desc,
                        "alternatives": []
                    }
                ]
            }
            
            day_schedule = {
                "day": day,
                "date": day_date,
                "activities": [activity]
            }
            
            if trip_type == "multi_city":
                day_schedule["city"] = current_city
            
            schedule.append(day_schedule)
        
        # Build response
        response = {
            "trip_type": trip_type,
            "duration": duration,
            "description": f"Fallback itinerary based on: {user_input}",
            "schedule": schedule,
            "total_cost": duration_days * 25,
            "bookable_cost": 0,
            "estimated_cost": duration_days * 25
        }
        
        if trip_type == "multi_city":
            response["destinations"] = destinations
            response["inter_city_transport"] = [
                {
                    "from_location": destinations[0].split(',')[0],
                    "to": destinations[1].split(',')[0],
                    "type": "train",
                    "carrier": "High-speed rail",
                    "departure_time": "10:00 AM",
                    "arrival_time": "1:30 PM",
                    "price": 50,
                    "description": f"Train from {destinations[0].split(',')[0]} to {destinations[1].split(',')[0]}"
                }
            ]
        else:
            response["destination"] = destination
        
        return response


# Global service instance
simple_langchain_service = None

def get_simple_langchain_service(openai_api_key: str) -> SimpleLangChainTravelService:
    """Get or create simple LangChain service instance"""
    global simple_langchain_service
    if simple_langchain_service is None:
        simple_langchain_service = SimpleLangChainTravelService(openai_api_key)
    return simple_langchain_service
