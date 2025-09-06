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
from logging_config import get_chat_logger, log_performance, RequestLogger


class FunctionCallingChatService:
    """Chat service that uses OpenAI function calling with travel tools"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.max_tool_calls = 5  # Prevent infinite loops
        self.timeout_seconds = 30  # Tool execution timeout
        self.logger = get_chat_logger()
    
    @log_performance("chat")
    async def chat_with_tools(
        self,
        user_message: str,
        user_id: int,
        conversation_history: list | None = None,
        undecided_dates: bool = False,
    ) -> str:
        """
        Process user message with function calling capabilities
        """
        self.logger.info(f"Starting function-calling chat for user {user_id}")
        
        # Get current date for context
        from datetime import datetime, timedelta
        today = datetime.now()
        future_date = today + timedelta(days=1)  # Allow planning from tomorrow onwards
        self.logger.debug(f"Using date range: {today.strftime('%Y-%m-%d')} to {future_date.strftime('%Y-%m-%d')}")
        
        # Get user location for flight origin context
        user_location = "Unknown"  # Default value
        try:
            from database import get_db
            from sqlalchemy.orm import Session
            from database import User
            
            # Create a new database session for this request
            db = next(get_db())
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.location:
                user_location = user.location
                self.logger.info(f"User location found: {user_location}")
            else:
                self.logger.info("No user location found, will ask user for departure city")
        except Exception as e:
            self.logger.error(f"Error getting user location: {e}")
        
        # System prompt that enforces tool usage  
        # Pre-calculate date strings to avoid complex f-string expressions
        today_str = today.strftime('%B %d, %Y')
        future_date_str = future_date.strftime('%Y-%m-%d')
        
        undecided_clause = "The user has indicated their travel dates are undecided so DO NOT ask for specific dates." if undecided_dates else ""

        # Build system prompt in two parts to avoid f-string brace parsing errors.
        # Part 1 contains dynamic values using simple string concatenation.
        system_prompt = (
            "You are a professional travel assistant.\n\n"
            "CONTEXT: Today is " + today_str + ". Use dates from " + future_date_str + " onwards.\n"
            "USER LOCATION: " + user_location + "\n\n"
            "CRITICAL INSTRUCTIONS FOR INFORMATION GATHERING:\n"
            "1. **CHECK FOR SUFFICIENT INFORMATION** before creating an itinerary\n"
            "2. **REQUIRED INFORMATION** for trip planning:\n"
            "   - Destination(s) - specific cities/countries\n"
            "   - Travel dates OR clear indication they want planning without dates\n"
            "   - Trip duration (if dates not specified)\n"
            "   - User preferences for flights/hotels/activities\n\n"
            "3. **RESPONSE DECISION:**\n"
            "   - If missing critical info → Ask questions in plain text (NOT JSON)\n"
            "   - If sufficient info provided → Create JSON itinerary\n\n"
            "4. **JSON RESPONSE RULES (only when sufficient information):**\n"
            "   - **ALWAYS respond with valid JSON only** - no other text before or after\n"
            "   - **NO MARKDOWN** - do not wrap JSON in ```json code blocks\n"
            "   - **PURE JSON ONLY** - start with { and end with }\n"
            "   - **NEVER make up any information** - use real data from tool calls\n"
            "   - **FOCUS ON THE SCHEDULE FIRST** - this is the most important part\n"
            "   - **INCLUDE ALTERNATIVES** - Each activity must have 2-3 alternatives with same structure\n\n"
            "TOOLS: Use search_flights, search_hotels, search_events for real data only\n"
            "COSTS: Calculate total_cost as sum of ALL real prices (flights + hotels + activities)\n"
            "ACTIVITIES: Provide detailed descriptions and fill empty days with suggestions\n\n"
            "🚨 ABSOLUTE RULE: NEVER generate fake hotel names, addresses, prices, or flight details!\n"
            "   - If search_hotels() returns no results → set hotel to empty object {}\n"
            "   - If search_flights() returns no results → set flights to empty array []\n"
            "   - If no real data available → use empty structures, not placeholders\n\n"
            "RESPONSE FORMAT: JSON itinerary with trip_type, destination, duration, flights, hotel, schedule, total_cost, bookable_cost, estimated_cost\n\n"
        )

        # Part 2 is a literal block illustrating the expected JSON structure.
        json_example = """
JSON FORMAT - SINGLE CITY TRIP:
{
  "trip_type": "single_city",
  "destination": "Barcelona, Spain",
  "duration": "3 days",
  "description": "Single city trip to Barcelona",
  "flights": [],
  "hotel": {"name": "Hotel Name", "address": "Address", "check_in": "Check-in", "check_out": "Check-out", "room_type": "Room", "price": 200, "total_nights": 3},
  "schedule": [
    {"day": 1, "date": "2025-11-13", "activities": [
      {"name": "Sagrada Familia", "time": "10:00", "price": 26, "type": "estimated", "description": "Visit the iconic basilica", "alternatives": [
        {"name": "Casa Batlló", "time": "10:00", "price": 25, "type": "estimated", "description": "Modernist architecture masterpiece", "alternatives": []},
        {"name": "Casa Milà", "time": "10:00", "price": 22, "type": "estimated", "description": "Gaudí's stone quarry building", "alternatives": []}
      ]},
      {"name": "Park Güell", "time": "14:00", "price": 13, "type": "estimated", "description": "Explore Gaudí's colorful park", "alternatives": [
        {"name": "Tibidabo Amusement Park", "time": "14:00", "price": 28, "type": "estimated", "description": "Historic hilltop amusement park", "alternatives": []},
        {"name": "Montjuïc Hill", "time": "14:00", "price": 0, "type": "estimated", "description": "Panoramic city views", "alternatives": []}
      ]},
      {"name": "Tapas Tour", "time": "18:00", "price": 35, "type": "estimated", "description": "Traditional Spanish tapas experience", "alternatives": [
        {"name": "Flamenco Show", "time": "18:00", "price": 40, "type": "estimated", "description": "Traditional Spanish dance performance", "alternatives": []},
        {"name": "Sunset at Bunkers del Carmel", "time": "18:00", "price": 0, "type": "estimated", "description": "Best sunset views in Barcelona", "alternatives": []}
      ]}
    ]},
    {"day": 2, "date": "2025-11-14", "activities": [
      {"name": "La Rambla Walk", "time": "09:00", "price": 0, "type": "estimated", "description": "Stroll down the famous boulevard"},
      {"name": "Gothic Quarter", "time": "14:00", "price": 0, "type": "estimated", "description": "Explore medieval streets"},
      {"name": "Beach Time", "time": "16:00", "price": 0, "type": "estimated", "description": "Relax at Barceloneta Beach"}
    ]},
    {"day": 3, "date": "2025-11-15", "activities": [
      {"name": "Picasso Museum", "time": "09:00", "price": 20, "type": "estimated", "description": "View works by the famous artist"},
      {"name": "Food Market", "time": "15:00", "price": 25, "type": "estimated", "description": "Sample local delicacies"},
      {"name": "Farewell Dinner", "time": "19:00", "price": 60, "type": "estimated", "description": "Final meal with local specialties"}
    ]}
  ],
  "total_cost": 179,
  "bookable_cost": 0,
  "estimated_cost": 179
}

🚨 CRITICAL DATA RULES:
- The example above shows STRUCTURE ONLY - NOT real data
- NEVER use placeholder text like "Hotel Name", "Address", "Check-in"
- ALWAYS use search_flights() and search_hotels() tools to get REAL data
- If no real data available, set arrays to empty [] and costs to 0
- NEVER fabricate hotel names, addresses, prices, or flight details
- ONLY use data returned from actual API calls

**CRITICAL**: Use this EXACT structure. The schedule array MUST contain daily activities.

**EXAMPLES:**
- "Barcelona November 10-14" → CREATE ITINERARY immediately
- "Barcelona 4 days" → CREATE ITINERARY immediately  
- "Barcelona" → ASK for dates/duration
- "November 10-14" → ASK for destination

**CRITICAL**: The conversation context will tell you exactly what information is available. Follow it precisely.

🔥 FINAL INSTRUCTION: If the context shows 'can_create_itinerary: True', you MUST create an itinerary, NOT ask questions!

🚨 CRITICAL: DO NOT USE MARKDOWN FORMATTING!
- DO NOT start with ```json
- DO NOT end with ```
- START DIRECTLY with { and END with }
- PURE JSON ONLY - NO EXTRA TEXT OR FORMATTING!"""

        system_prompt += json_example

        if user_location == "Unknown":
            system_prompt += (
                "\nDEPARTURE CITY MISSING: You do NOT know the user's departure city. "
                "You may still create the itinerary JSON **without flights**. "
                "In that case, set the 'flights' array to an empty list and do not include flight costs. "
                "Do NOT ask for the departure city unless the user specifically wants flights included."
            )

        if undecided_clause:
            system_prompt += "\n" + undecided_clause

        # Debug: print full system prompt once per request
        self.logger.debug("System prompt prepared and sent to LLM")

        # Enhanced context analysis with conversation history
        user_message_lower = user_message.lower()
        
        # Analyze conversation history if available
        conversation_summary = ""
        if conversation_history and len(conversation_history) > 0:
            # Extract key information from conversation history
            all_text = " ".join([msg.get("message", "") for msg in conversation_history]).lower()
            
            # Check for destination in full conversation
            destination_detected = any(city in all_text for city in [
                "barcelona", "paris", "london", "rome", "madrid", "amsterdam", "berlin", "prague", "vienna", "budapest",
                "beijing", "shanghai", "tokyo", "seoul", "singapore", "bangkok", "dubai", "istanbul", "cairo", "mumbai",
                "sydney", "melbourne", "auckland", "toronto", "vancouver", "montreal", "new york", "los angeles", "chicago",
                "miami", "san francisco", "seattle", "boston", "washington", "philadelphia", "atlanta", "denver", "las vegas"
            ])
            
            # Check for duration in full conversation
            duration_detected = any(pattern in all_text for pattern in [
                "3 day", "3 days", "4 day", "4 days", "5 day", "5 days", "6 day", "6 days", "7 day", "7 days",
                "one week", "two week", "three week", "month", "weekend", "long weekend"
            ])
            
            # Check for specific dates in full conversation
            dates_detected = any(word in all_text for word in [
                "november", "december", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october",
                "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"
            ])
            
            # Pre-calculate values to avoid complex f-string expressions
            destination_status = "YES" if destination_detected else "NO"
            duration_status = "YES" if duration_detected else "NO"
            dates_status = "YES" if dates_detected else "NO"
            conversation_history_length = len(conversation_history)
            
            conversation_summary_template = (
                "CONVERSATION HISTORY ANALYSIS:\n"
                "- Previous messages: {msg_len} messages\n"
                "- Destination mentioned: {dest_status}\n"
                "- Duration mentioned: {dur_status}\n"
                "- Dates mentioned: {dates_status}\n"
            )

            conversation_summary = conversation_summary_template.format(
                msg_len=conversation_history_length,
                dest_status=destination_status,
                dur_status=duration_status,
                dates_status=dates_status,
            )
        else:
            # Fallback to current message analysis only
            destination_detected = any(city in user_message_lower for city in [
                "barcelona", "paris", "london", "rome", "madrid", "amsterdam", "berlin", "prague", "vienna", "budapest",
                "beijing", "shanghai", "tokyo", "seoul", "singapore", "bangkok", "dubai", "istanbul", "cairo", "mumbai",
                "sydney", "melbourne", "auckland", "toronto", "vancouver", "montreal", "new york", "los angeles", "chicago",
                "miami", "san francisco", "seattle", "boston", "washington", "philadelphia", "atlanta", "denver", "las vegas"
            ])
            
            duration_detected = any(pattern in user_message_lower for pattern in [
                "3 day", "3 days", "4 day", "4 days", "5 day", "5 days", "6 day", "6 days", "7 day", "7 days",
                "one week", "two week", "three week", "month", "weekend", "long weekend"
            ])
            
            dates_detected = any(word in user_message_lower for word in [
                "november", "december", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october",
                "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"
            ])
            
            conversation_summary = "CONVERSATION HISTORY: First message (no previous context)"
        
        # Check for departure location availability
        departure_available = user_location != "Unknown"
        
        # Determine if we have sufficient information
        has_destination = destination_detected
        # If the user selected 'undecided dates', treat timing as provided.
        has_timing = duration_detected or dates_detected or undecided_dates
        # Departure city is no longer mandatory; if missing we will create itinerary without flights
        can_create_itinerary = has_destination and has_timing
        
        self.logger.debug(f"Itinerary decision: destination={has_destination}, timing={has_timing}, can_create={can_create_itinerary}")
        
        # Simplify complex f-string expressions by pre-calculating values
        # Get the text to search in (either conversation history or current message)
        search_text = " ".join([msg.get("message", "") for msg in conversation_history]).lower() if conversation_history else user_message_lower
        
        destination_status = "YES - Barcelona" if destination_detected and "barcelona" in search_text else ("YES - City mentioned" if destination_detected else "NO")
        duration_status = "YES - 4 days mentioned" if duration_detected and "4 day" in search_text else ("YES - Duration mentioned" if duration_detected else "NO")
        dates_status = "YES - Specific dates mentioned" if dates_detected else "NO"
        departure_status = "Available: " + user_location if departure_available else "NOT AVAILABLE"
        decision = "CREATE ITINERARY IMMEDIATELY" if can_create_itinerary else "ASK FOR MISSING INFORMATION"
        required_action = "Use tools to create complete itinerary with real flights, hotels, and activities" if can_create_itinerary else "Ask specific questions for missing information only"
        barcelona_check = "YES" if conversation_history and "barcelona" in search_text else "NO"
        four_day_check = "YES" if conversation_history and "4 day" in search_text else "NO"
        
        # Pre-calculate all values to avoid complex f-string expressions
        conversation_history_length = len(conversation_history) if conversation_history else 0

        # Build conversation_context with str.format to avoid nested f-string parsing issues
        conversation_context_template = (
            "User is located in: {user_location}\n"
            "User's message: {user_message}\n\n"
            "{conversation_summary}\n\n"
            "ENHANCED CONTEXT ANALYSIS:\n"
            "- Destination detected: {destination_status}\n"
            "- Duration detected: {duration_status}\n"
            "- Dates detected: {dates_status}\n"
            "- Departure location: {departure_status}\n\n"
            "DECISION: {decision}\n\n"
            "REQUIRED ACTION: {required_action}\n\n"
            "IMPORTANT: If destination AND timing are provided in ANY previous message, proceed directly to itinerary creation. Do not ask for information already given.\n\n"
            "DEBUG INFO:\n"
            "- conversation_history length: {conversation_history_length}\n"
            "- all_text contains 'barcelona': {barcelona_check}\n"
            "- all_text contains '4 day': {four_day_check}\n"
            "- can_create_itinerary: {can_create_itinerary}"
        )

        conversation_context = conversation_context_template.format(
            user_location=user_location,
            user_message=user_message,
            conversation_summary=conversation_summary,
            destination_status=destination_status,
            duration_status=duration_status,
            dates_status=dates_status,
            departure_status=departure_status,
            decision=decision,
            required_action=required_action,
            conversation_history_length=conversation_history_length,
            barcelona_check=barcelona_check,
            four_day_check=four_day_check,
            can_create_itinerary=can_create_itinerary,
        )
        
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add conversation history to messages for multi-turn context
        if conversation_history:
            for msg in conversation_history:
                # Handle both dict format and ChatMessage objects
                if hasattr(msg, 'is_bot'):
                    # Database ChatMessage object
                    role = "assistant" if msg.is_bot else "user"
                    content = msg.response if msg.is_bot and msg.response else msg.message
                else:
                    # Dict format from frontend
                    role = msg.get("role", "user")
                    content = msg.get("message", "")
                
                if content and content.strip():  # Only add non-empty messages
                    messages.append({"role": role, "content": content})
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        # Debug logging - Pre-calculate values to avoid complex f-string expressions
        conversation_history_length = len(conversation_history) if conversation_history else 0
        first_message = conversation_history[0].get('message', '') if conversation_history else ''
        last_message = conversation_history[-1].get('message', '') if conversation_history else ''
        
        self.logger.debug(f"Conversation context prepared: {conversation_history_length} messages")
        
        tool_calls_made = 0
        
        while tool_calls_made < self.max_tool_calls:
            try:
                # Use GPT-4o like the working services.py version - no JSON mode enforcement
                model_name = os.getenv("OPENAI_MODEL", "gpt-4o")
                self.logger.info(f"Using model: {model_name}")
                
                response = await self.client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    tools=tool_registry.get_tool_definitions(),
                    tool_choice="auto",
                    temperature=0.7,  # Same as working version
                    max_tokens=4000
                )
                
                message = response.choices[0].message
                
                # Check if LLM wants to call tools
                if message.tool_calls:
                    tool_calls_count = len(message.tool_calls)
                    self.logger.info(f"LLM requested {tool_calls_count} tool calls")
                    
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
                        
                        self.logger.info(f"Executing {function_name} with args: {function_args}")
                        
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
                        
                        self.logger.info(f"Tool {function_name} executed successfully")
                    
                    # Continue the conversation loop to get final response
                    continue
                
                else:
                    # No more tool calls, return final response
                    final_response = message.content
                    self.logger.info(f"Final response ready: {len(final_response)} characters")
                    
                    # Strip markdown formatting if present
                    if "```json" in final_response or "```" in final_response:
                        print("🔧 Removing markdown formatting from JSON response")
                        # Remove all markdown code block formatting
                        final_response = final_response.replace("```json", "").replace("```", "").strip()
                        print(f"🔧 Cleaned response preview: {final_response[:100]}...")
                    
                    # Check if this is a question/clarification request (plain text) or itinerary (JSON)
                    try:
                        # Try to parse as JSON to validate if it's an itinerary
                        itinerary_data = json.loads(final_response)
                        print("📋 Response is valid JSON itinerary")
                        # Pre-calculate values to avoid complex f-string expressions
                        schedule_length = len(itinerary_data.get('schedule', []))
                        first_schedule_item = itinerary_data['schedule'][0] if itinerary_data['schedule'] else 'None'
                        json_keys = list(itinerary_data.keys())
                        response_preview = final_response[:500]
                        
                        self.logger.info("JSON response validated successfully")
                        
                        # If schedule is missing or empty, ask the model to regenerate once
                        if not itinerary_data.get('schedule') or len(itinerary_data.get('schedule')) == 0:
                            if tool_calls_made < self.max_tool_calls:
                                self.logger.warning("Schedule missing in itinerary, requesting regeneration from LLM")
                                messages.append({
                                    "role": "assistant",
                                    "content": json.dumps(itinerary_data)
                                })
                                messages.append({
                                    "role": "user",
                                    "content": "The itinerary JSON is missing the 'schedule' array. Please regenerate the full itinerary including a detailed 'schedule' with daily activities. Respond with valid JSON only."
                                })
                                continue  # restart loop to get new response
                        processed_itinerary = self._post_process_itinerary(itinerary_data)
                        return json.dumps(processed_itinerary, indent=2)
                    except json.JSONDecodeError:
                        # Response is plain text (likely asking clarifying questions)
                        self.logger.info("Response is plain text (clarifying questions)")
                        
                        # Check if it's asking questions (contains question marks or typical question phrases)
                        question_indicators = ['?', 'where', 'when', 'how many', 'which', 'what', 'could you tell me', 'would you like']
                        is_question = any(indicator in final_response.lower() for indicator in question_indicators)
                        
                        if is_question:
                            # Return as plain text wrapped in a special format for the frontend
                            question_response = {
                                "type": "question",
                                "message": final_response,
                                "needs_clarification": True
                            }
                            return json.dumps(question_response, indent=2)
                        else:
                            # If not a question, wrap in a basic itinerary structure
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
                self.logger.error(f"Error in function calling chat: {e}")
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
        
        self.logger.warning(f"Max tool calls ({self.max_tool_calls}) reached")
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

    def _post_process_itinerary(self, itinerary_data: dict) -> dict:
        """
        Post-process itinerary to ensure accurate costs and detailed activities
        """
        try:
            # Calculate accurate total costs
            total_cost = 0
            bookable_cost = 0
            
            # Sum up flight costs
            if 'flights' in itinerary_data and itinerary_data['flights']:
                for flight in itinerary_data['flights']:
                    if 'price' in flight and isinstance(flight['price'], (int, float)):
                        total_cost += flight['price']
                        bookable_cost += flight['price']
            
            # Add hotel cost
            if 'hotel' in itinerary_data and itinerary_data['hotel']:
                if 'price' in itinerary_data['hotel'] and isinstance(itinerary_data['hotel']['price'], (int, float)):
                    total_cost += itinerary_data['hotel']['price']
                    bookable_cost += itinerary_data['hotel']['price']
            
            # Sum up activity costs and enhance descriptions
            if 'schedule' in itinerary_data and itinerary_data['schedule']:
                for day in itinerary_data['schedule']:
                    if 'activities' in day and day['activities']:
                        for activity in day['activities']:
                            # Add activity cost to totals
                            if 'price' in activity and isinstance(activity['price'], (int, float)):
                                total_cost += activity['price']
                                if activity.get('type') == 'bookable':
                                    bookable_cost += activity['price']
                            
                            # Enhance activity descriptions if they're too brief
                            if 'description' in activity and len(activity['description']) < 50:
                                if 'name' in activity:
                                    activity['description'] = f"Experience {activity['name']} - a must-see attraction in the area. This activity offers a unique opportunity to immerse yourself in the local culture and create lasting memories."
                    
                    # Fill empty days with suggested activities
                    elif 'activities' not in day or not day['activities']:
                        day['activities'] = [
                            {
                                "name": "Local Exploration",
                                "time": "10:00",
                                "price": 0,
                                "type": "estimated",
                                "description": "Explore the charming streets, local markets, and hidden gems of the area. Visit local cafes, boutique shops, and take in the authentic atmosphere of the destination."
                            },
                            {
                                "name": "Cultural Experience",
                                "time": "15:00", 
                                "price": 25,
                                "type": "estimated",
                                "description": "Visit local museums, galleries, or cultural sites to learn about the history and heritage of the region. Immerse yourself in the local arts and traditions."
                            }
                        ]
                        total_cost += 25  # Add estimated cultural activity cost
            
            # Update the itinerary with calculated costs
            itinerary_data['total_cost'] = total_cost
            itinerary_data['bookable_cost'] = bookable_cost
            itinerary_data['estimated_cost'] = total_cost - bookable_cost
            
            estimated_cost = itinerary_data['estimated_cost']
            self.logger.info(f"Post-processed costs: total={total_cost}, bookable={bookable_cost}, estimated={estimated_cost}")
            
            return itinerary_data
            
        except Exception as e:
            self.logger.error(f"Error in post-processing: {e}")
            return itinerary_data


# Global instance
function_calling_chat_service = FunctionCallingChatService()
