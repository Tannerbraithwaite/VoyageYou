"""
Tool registry for LLM function calling with travel APIs.
"""
import json
from typing import Dict, Any, List, Callable
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from api_services import duffel_service, hotelbeds_service, ticketmaster_service


class ToolSchema(BaseModel):
    """Schema for a tool definition"""
    name: str
    description: str
    parameters: Dict[str, Any]
    function: Callable


class FlightSearchParams(BaseModel):
    """Parameters for flight search tool"""
    origin: str = Field(..., description="Origin airport IATA code (e.g., 'JFK')")
    destination: str = Field(..., description="Destination airport IATA code (e.g., 'LHR')")
    departure_date: str = Field(..., description="Departure date in YYYY-MM-DD format")
    return_date: str = Field(..., description="Return date in YYYY-MM-DD format")
    passengers: int = Field(default=2, description="Number of passengers (1-9)")
    cabin_class: str = Field(default="economy", description="Cabin class: economy, premium_economy, business, first")


class HotelSearchParams(BaseModel):
    """Parameters for hotel search tool"""
    destination: str = Field(..., description="Destination city name or hotel destination code")
    check_in: str = Field(..., description="Check-in date in YYYY-MM-DD format")
    check_out: str = Field(..., description="Check-out date in YYYY-MM-DD format")
    guests: int = Field(default=2, description="Number of guests (1-8)")
    rooms: int = Field(default=1, description="Number of rooms (1-4)")


class EventSearchParams(BaseModel):
    """Parameters for event search tool"""
    location: str = Field(..., description="City or location name for events")
    start_date: str = Field(..., description="Start date for event search in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date for event search in YYYY-MM-DD format")
    category: str = Field(default="", description="Event category filter (optional)")


class ToolRegistry:
    """Registry for managing LLM-callable tools"""
    
    def __init__(self):
        self.tools: Dict[str, ToolSchema] = {}
        self._register_default_tools()
    
    def _register_default_tools(self):
        """Register default travel API tools"""
        
        # Flight search tool
        self.register_tool(
            name="search_flights",
            description="Search for flight options between two airports",
            parameters={
                "type": "object",
                "properties": {
                    "origin": {
                        "type": "string",
                        "description": "Origin airport IATA code (e.g., 'JFK')"
                    },
                    "destination": {
                        "type": "string", 
                        "description": "Destination airport IATA code (e.g., 'LHR')"
                    },
                    "departure_date": {
                        "type": "string",
                        "description": "Departure date in YYYY-MM-DD format"
                    },
                    "return_date": {
                        "type": "string",
                        "description": "Return date in YYYY-MM-DD format"
                    },
                    "passengers": {
                        "type": "integer",
                        "description": "Number of passengers (1-9)",
                        "default": 2
                    },
                    "cabin_class": {
                        "type": "string",
                        "description": "Cabin class: economy, premium_economy, business, first",
                        "default": "economy"
                    }
                },
                "required": ["origin", "destination", "departure_date", "return_date"]
            },
            function=self._search_flights
        )
        
        # Hotel search tool
        self.register_tool(
            name="search_hotels",
            description="Search for hotel options in a destination",
            parameters={
                "type": "object",
                "properties": {
                    "destination": {
                        "type": "string",
                        "description": "Destination city name or hotel destination code"
                    },
                    "check_in": {
                        "type": "string",
                        "description": "Check-in date in YYYY-MM-DD format"
                    },
                    "check_out": {
                        "type": "string",
                        "description": "Check-out date in YYYY-MM-DD format"
                    },
                    "guests": {
                        "type": "integer",
                        "description": "Number of guests (1-8)",
                        "default": 2
                    },
                    "rooms": {
                        "type": "integer",
                        "description": "Number of rooms (1-4)",
                        "default": 1
                    }
                },
                "required": ["destination", "check_in", "check_out"]
            },
            function=self._search_hotels
        )
        
        # Event search tool
        self.register_tool(
            name="search_events",
            description="Search for events and activities in a location",
            parameters={
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City or location name for events"
                    },
                    "start_date": {
                        "type": "string",
                        "description": "Start date for event search in YYYY-MM-DD format"
                    },
                    "end_date": {
                        "type": "string",
                        "description": "End date for event search in YYYY-MM-DD format"
                    },
                    "category": {
                        "type": "string",
                        "description": "Event category filter (optional)",
                        "default": ""
                    }
                },
                "required": ["location", "start_date", "end_date"]
            },
            function=self._search_events
        )
    
    def register_tool(self, name: str, description: str, parameters: Dict[str, Any], function: Callable):
        """Register a new tool"""
        self.tools[name] = ToolSchema(
            name=name,
            description=description,
            parameters=parameters,
            function=function
        )
    
    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """Get tool definitions in OpenAI function calling format"""
        return [
            {
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.parameters
                }
            }
            for tool in self.tools.values()
        ]
    
    async def execute_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a tool with given arguments"""
        if name not in self.tools:
            return {"error": f"Tool '{name}' not found"}
        
        tool = self.tools[name]
        
        try:
            print(f"🔧 Executing tool: {name} with args: {arguments}")
            result = await tool.function(**arguments)
            print(f"✅ Tool {name} completed successfully")
            return result
        except Exception as e:
            error_msg = f"Tool {name} failed: {str(e)}"
            print(f"❌ {error_msg}")
            return {"error": error_msg}
    
    async def _search_flights(self, **kwargs) -> Dict[str, Any]:
        """Internal flight search implementation"""
        params = FlightSearchParams(**kwargs)
        
        # Map city names to IATA codes if needed
        city_to_iata = {
            'paris': 'CDG', 'london': 'LHR', 'new york': 'JFK', 'los angeles': 'LAX',
            'tokyo': 'NRT', 'barcelona': 'BCN', 'berlin': 'BER', 'amsterdam': 'AMS',
            'rome': 'FCO', 'madrid': 'MAD', 'montreal': 'YUL', 'toronto': 'YYZ',
            'vancouver': 'YVR', 'chicago': 'ORD', 'miami': 'MIA', 'san francisco': 'SFO',
            'boston': 'BOS', 'seattle': 'SEA', 'dublin': 'DUB', 'stockholm': 'ARN',
            'copenhagen': 'CPH', 'oslo': 'OSL', 'zurich': 'ZUR', 'vienna': 'VIE',
            'prague': 'PRG', 'sydney': 'SYD', 'melbourne': 'MEL', 'singapore': 'SIN',
            'hong kong': 'HKG', 'seoul': 'ICN', 'mumbai': 'BOM', 'delhi': 'DEL',
            'bangkok': 'BKK', 'naples': 'NAP', 'milan': 'MXP'
        }
        
        origin = city_to_iata.get(params.origin.lower(), params.origin.upper())
        destination = city_to_iata.get(params.destination.lower(), params.destination.upper())
        
        result = await duffel_service.search_flights(
            origin=origin,
            destination=destination,
            departure_date=params.departure_date,
            return_date=params.return_date,
            passengers=params.passengers
        )
        
        return result
    
    async def _search_hotels(self, **kwargs) -> Dict[str, Any]:
        """Internal hotel search implementation"""
        params = HotelSearchParams(**kwargs)
        
        # Map city names to hotel destination codes
        city_to_hotel_code = {
            'london': 'LON', 'paris': 'PAR', 'new york': 'NYC', 'los angeles': 'LAX',
            'tokyo': 'TYO', 'barcelona': 'BCN', 'berlin': 'BER', 'amsterdam': 'AMS',
            'rome': 'ROM', 'madrid': 'MAD', 'montreal': 'MON', 'toronto': 'TOR',
            'vancouver': 'VAN', 'chicago': 'CHI', 'miami': 'MIA', 'san francisco': 'SFO',
            'boston': 'BOS', 'seattle': 'SEA', 'dublin': 'DUB', 'stockholm': 'STO',
            'copenhagen': 'COP', 'oslo': 'OSL', 'zurich': 'ZUR', 'vienna': 'VIE',
            'prague': 'PRG', 'sydney': 'SYD', 'melbourne': 'MEL', 'singapore': 'SIN',
            'hong kong': 'HKG', 'seoul': 'SEO', 'mumbai': 'BOM', 'delhi': 'DEL',
            'bangkok': 'BKK', 'naples': 'NAP', 'milan': 'MIL'
        }
        
        destination_code = city_to_hotel_code.get(params.destination.lower(), params.destination)
        
        result = await hotelbeds_service.search_hotels(
            destination=destination_code,
            checkin=params.check_in,
            checkout=params.check_out
        )
        
        return result
    
    async def _search_events(self, **kwargs) -> Dict[str, Any]:
        """Internal event search implementation"""
        params = EventSearchParams(**kwargs)
        
        result = await ticketmaster_service.search_events(
            location=params.location,
            start_date=params.start_date,
            end_date=params.end_date
        )
        
        return result


# Global tool registry instance
tool_registry = ToolRegistry()
