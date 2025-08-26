"""
Enhanced chat service with function calling capabilities.
"""
import json
import asyncio
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from tools import tool_registry
import os
from datetime import datetime, timedelta


class FunctionCallingChatService:
    """Chat service that uses OpenAI function calling with travel tools"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.max_tool_calls = 5  # Prevent infinite loops
        self.timeout_seconds = 30  # Tool execution timeout
    
    async def chat_with_tools(self, user_message: str, user_id: int) -> str:
        """
        Process user message with function calling capabilities
        """
        print(f"🤖 Starting function-calling chat for user {user_id}")
        print(f"📝 User message: {user_message}")
        
        # Get current date for context
        from datetime import datetime, timedelta
        today = datetime.now()
        future_date = today + timedelta(days=90)
        
        # System prompt that enforces tool usage  
        date_context = f"Today is {today.strftime('%B %d, %Y')}. For API calls, use dates starting from {future_date.strftime('%Y-%m-%d')} or later."
        
        system_prompt = f"""You are a professional travel assistant that helps users plan trips. 

CURRENT DATE CONTEXT: {date_context}

CRITICAL RULES:
1. ALWAYS use the provided tools to get real, current data for flights, hotels, and events
2. NEVER invent or fabricate travel information - only use data returned from tools
3. If a tool returns no results or fails, inform the user honestly - don't make up alternatives
4. Format all responses as proper JSON with detailed itineraries
5. IMPORTANT: ALWAYS use dates that are at least 90 days in the future
6. Always search for actual flights and hotels before creating an itinerary
7. When the user mentions "in 3 months" or similar, calculate the actual future date properly

Available tools:
- search_flights: Get real flight options between airports
- search_hotels: Get real hotel options in destinations  
- search_events: Get real events and activities

When a user asks for a trip, follow this process:
1. Determine the destination and dates
2. Use search_flights to get real flight options
3. Use search_hotels to get real hotel options
4. Use search_events to get real activities
5. Create a detailed itinerary ONLY using the real data returned

RESPONSE FORMAT: Always return a complete JSON itinerary with this structure:
- trip_type: "single_city" or "multi_city"
- destination: "City, Country" 
- duration: "X days"
- description: "Trip description"
- flights: array of real flights from search_flights
- hotel: real hotel data from search_hotels
- schedule: detailed daily schedule
- total_cost: calculated total
- bookable_cost: bookable total
- estimated_cost: estimated total"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        tool_calls_made = 0
        
        while tool_calls_made < self.max_tool_calls:
            try:
                # Get LLM response with tool definitions
                response = await self.client.chat.completions.create(
                    model="gpt-4",
                    messages=messages,
                    tools=tool_registry.get_tool_definitions(),
                    tool_choice="auto",
                    temperature=0.1  # Low temperature for consistent tool usage
                )
                
                message = response.choices[0].message
                
                # Check if LLM wants to call tools
                if message.tool_calls:
                    print(f"🔧 LLM requested {len(message.tool_calls)} tool calls")
                    
                    # Add the assistant's message to conversation
                    messages.append({
                        "role": "assistant", 
                        "content": message.content,
                        "tool_calls": [
                            {
                                "id": tc.id,
                                "type": tc.type,
                                "function": {
                                    "name": tc.function.name,
                                    "arguments": tc.function.arguments
                                }
                            }
                            for tc in message.tool_calls
                        ]
                    })
                    
                    # Execute each tool call
                    for tool_call in message.tool_calls:
                        tool_calls_made += 1
                        if tool_calls_made > self.max_tool_calls:
                            break
                            
                        function_name = tool_call.function.name
                        try:
                            function_args = json.loads(tool_call.function.arguments)
                        except json.JSONDecodeError:
                            function_args = {}
                        
                        print(f"🔧 Executing {function_name} with args: {function_args}")
                        
                        # Execute tool with timeout
                        try:
                            tool_result = await asyncio.wait_for(
                                tool_registry.execute_tool(function_name, function_args),
                                timeout=self.timeout_seconds
                            )
                        except asyncio.TimeoutError:
                            tool_result = {"error": f"Tool {function_name} timed out after {self.timeout_seconds}s"}
                        
                        # Add tool result to conversation
                        messages.append({
                            "role": "tool",
                            "content": json.dumps(tool_result, indent=2),
                            "tool_call_id": tool_call.id
                        })
                        
                        print(f"✅ Tool {function_name} result: {str(tool_result)[:200]}...")
                    
                    # Continue the conversation loop to get final response
                    continue
                
                else:
                    # No more tool calls, return final response
                    final_response = message.content
                    print(f"✅ Final response ready: {len(final_response)} characters")
                    
                    # Ensure response is valid JSON
                    try:
                        # Try to parse as JSON to validate
                        json.loads(final_response)
                        return final_response
                    except json.JSONDecodeError:
                        # If not valid JSON, wrap in a basic structure
                        fallback_response = {
                            "trip_type": "single_city",
                            "destination": "Unknown",
                            "duration": "3 days", 
                            "description": "Trip planning response",
                            "flights": [],
                            "hotel": {},
                            "schedule": [],
                            "total_cost": 0,
                            "bookable_cost": 0,
                            "estimated_cost": 0,
                            "response": final_response
                        }
                        return json.dumps(fallback_response, indent=2)
                        
            except Exception as e:
                print(f"❌ Error in function calling chat: {e}")
                error_response = {
                    "trip_type": "single_city",
                    "destination": "Error",
                    "duration": "0 days",
                    "description": f"Error occurred: {str(e)}",
                    "flights": [],
                    "hotel": {},
                    "schedule": [],
                    "total_cost": 0,
                    "bookable_cost": 0,
                    "estimated_cost": 0
                }
                return json.dumps(error_response, indent=2)
        
        # Max tool calls reached
        print(f"⚠️ Max tool calls ({self.max_tool_calls}) reached")
        timeout_response = {
            "trip_type": "single_city", 
            "destination": "Timeout",
            "duration": "0 days",
            "description": "Too many tool calls - please try a simpler request",
            "flights": [],
            "hotel": {},
            "schedule": [], 
            "total_cost": 0,
            "bookable_cost": 0,
            "estimated_cost": 0
        }
        return json.dumps(timeout_response, indent=2)


# Global instance
function_calling_chat_service = FunctionCallingChatService()
