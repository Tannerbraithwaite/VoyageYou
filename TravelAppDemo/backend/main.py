import sys
import os
print(f"[DEBUG] Python executable: {sys.executable}")
try:
    import openai
    print(f"[DEBUG] OpenAI version: {openai.__version__}")
    print(f"[DEBUG] Has ChatCompletion: {hasattr(openai, 'ChatCompletion')}")
    print(f"[DEBUG] Has OpenAI class: {hasattr(openai, 'OpenAI')}")
except Exception as e:
    print(f"[DEBUG] OpenAI import error: {e}")
print(f"[DEBUG] Current working directory: {os.getcwd()}")

from fastapi import FastAPI, Depends, HTTPException, status, Response, Request
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request as StarletteRequest
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import List
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()  # First try current directory
# If running from project root, also try backend/.env
if not os.getenv('OPENAI_API_KEY'):
    load_dotenv('backend/.env')

from database import get_db, create_tables, UserInterest, Flight, Hotel, User
import schemas
from schemas import (
    UserCreate, UserUpdate, UserProfileResponse,
    TripCreate, Trip, TripResponse,
    ActivityCreate, Activity, ActivityUpdate,
    ItineraryRequest, ItineraryResponse,
    Recommendation, LoginRequest, LoginResponse, TokenResponse, RefreshTokenRequest, OAuthRequest,
    SignupRequest, VerificationRequest, SignupResponse,
    ChatRequest, ChatResponse, ChatMessage
)
from services import UserService, TripService, ActivityService, ItineraryService, RecommendationService, ChatbotService
from auth import AuthService
from oauth import OAuthService
from email_service import email_service

# Create FastAPI app
app = FastAPI(
    title="TravelApp API",
    description="AI-powered travel planning and recommendation system",
    version="1.0.0"
)

# CORS: allowlist from env
ALLOWED_ORIGINS = os.getenv("ALLOW_ORIGINS", "http://localhost:8081").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

@app.middleware("http")
async def rate_limit_middleware(request: StarletteRequest, call_next):
    try:
        response = await limiter.limit("60/minute")(call_next)(request)
        return response
    except RateLimitExceeded as e:
        return Response(
            content="Too Many Requests",
            status_code=429,
            headers={"Retry-After": str(e.retry_after)}
        )

# Create database tables on startup
@app.on_event("startup")
def startup_event():
    create_tables()

# Health and readiness endpoints
@app.get("/")
async def root():
    return {"message": "TravelApp API is running!"}

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/readyz")
def readyz(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"ready": True}
    except Exception:
        raise HTTPException(status_code=503, detail="Not ready")

# Authentication endpoints
@app.post("/auth/login", response_model=LoginResponse)
def login(login_data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Login user with email and password"""
    user = AuthService.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Check if email is verified
    if not user.is_verified:
        raise HTTPException(
            status_code=401, 
            detail="Please verify your email address before logging in. Check your email for a verification link."
        )
    
    # Create tokens
    access_token = AuthService.create_access_token(data={"sub": str(user.id)})
    refresh_token = AuthService.create_refresh_token(data={"sub": str(user.id)})
    
    # Set secure HTTP-only cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=os.getenv("ENV", "development") == "production",
        samesite="lax",
        max_age=1800  # 30 minutes
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=os.getenv("ENV", "development") == "production",
        samesite="lax",
        max_age=604800  # 7 days
    )
    
    return LoginResponse(
        user=user,
        message="Login successful",
        access_token=access_token,
        refresh_token=refresh_token
    )

@app.post("/auth/signup", response_model=SignupResponse)
async def signup(user_data: SignupRequest, db: Session = Depends(get_db)):
    """Create a new user account with email verification"""
    # Check if user already exists
    existing_user = UserService.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Hash the password
    hashed_password = AuthService.get_password_hash(user_data.password)
    
    # Generate verification token
    verification_token = email_service.generate_verification_token()
    verification_expires = email_service.get_verification_expiry()
    
    # Create user with verification fields
    user = User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_password,
        travel_style="solo",
        budget_range="moderate",
        is_verified=False,
        verification_token=verification_token,
        verification_expires=verification_expires
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Send verification email
    email_sent = await email_service.send_verification_email(
        user_data.email, 
        user_data.name, 
        verification_token
    )
    
    if not email_sent:
        # If email fails, delete the user
        db.delete(user)
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to send verification email")
    
    return SignupResponse(
        message="Account created successfully. Please check your email to verify your account.",
        user_id=user.id,
        email=user.email
    )

@app.get("/auth/verify")
async def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify user email with token"""
    # Find user by verification token
    user = db.query(User).filter(
        User.verification_token == token,
        User.is_verified == False
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    
    # Check if token is expired
    if user.verification_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification token has expired")
    
    # Mark user as verified
    user.is_verified = True
    user.verification_token = None
    user.verification_expires = None
    db.commit()
    
    # Send welcome email
    await email_service.send_welcome_email(user.email, user.name)
    
    return {"message": "Email verified successfully! You can now log in."}

@app.post("/auth/refresh", response_model=TokenResponse)
def refresh_token(request: Request, response: Response):
    """Refresh access token using refresh token from cookies"""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token found")
    
    try:
        access_token = AuthService.refresh_access_token(refresh_token)
        
        # Set new access token cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            max_age=1800  # 30 minutes
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token
        )
    except HTTPException:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@app.post("/auth/logout")
def logout(response: Response):
    """Logout user by clearing cookies"""
    response.delete_cookie("access_token", httponly=True, secure=False, samesite="lax")
    response.delete_cookie("refresh_token", httponly=True, secure=False, samesite="lax")
    return {"message": "Logged out successfully"}

@app.post("/auth/oauth", response_model=LoginResponse)
async def oauth_login(oauth_data: OAuthRequest, response: Response, db: Session = Depends(get_db)):
    """OAuth login with Google or Apple"""
    try:
        if oauth_data.provider == "google":
            result = await OAuthService.handle_google_oauth(oauth_data.id_token, db)
        elif oauth_data.provider == "apple":
            result = await OAuthService.handle_apple_oauth(oauth_data.id_token, db)
        else:
            raise HTTPException(status_code=400, detail="Invalid OAuth provider")
        
        # Set secure HTTP-only cookies
        response.set_cookie(
            key="access_token",
            value=result["access_token"],
            httponly=True,
            secure=os.getenv("ENV", "development") == "production",
            samesite="lax",
            max_age=1800  # 30 minutes
        )
        
        response.set_cookie(
            key="refresh_token",
            value=result["refresh_token"],
            httponly=True,
            secure=os.getenv("ENV", "development") == "production",
            samesite="lax",
            max_age=604800  # 7 days
        )
        
        return LoginResponse(
            user=result["user"],
            message=f"Login successful via {oauth_data.provider}",
            access_token=result["access_token"],
            refresh_token=result["refresh_token"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth login failed: {str(e)}")

def get_current_user_from_cookies(request: Request, db: Session = Depends(get_db)) -> User:
    """Get current user from cookies"""
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = AuthService.verify_token(access_token)
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_id = int(user_id_str)
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.get("/auth/me", response_model=schemas.User)
def get_current_user(current_user: User = Depends(get_current_user_from_cookies)):
    """Get current user information"""
    return current_user

# User endpoints
@app.post("/users/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    return UserService.create_user(db, user)

@app.get("/users/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_cookies)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    """Get user by ID"""
    user = UserService.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_cookies)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    """Update user profile"""
    user = UserService.update_user(db, user_id, user_update.dict(exclude_unset=True))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/users/{user_id}/interests/")
def update_user_interests(user_id: int, interests: List[str], db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_cookies)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    """Update user interests"""
    user_interests = UserService.add_user_interests(db, user_id, interests)
    return {"message": f"Updated {len(user_interests)} interests for user {user_id}"}

@app.get("/users/{user_id}/profile", response_model=UserProfileResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_cookies)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    """Get complete user profile with interests"""
    user = UserService.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    interests = db.query(UserInterest).filter(UserInterest.user_id == user_id).all()
    return UserProfileResponse(user=user, interests=interests)

# Trip endpoints
@app.post("/trips/", response_model=Trip, status_code=status.HTTP_201_CREATED)
def create_trip(trip: TripCreate, user_id: int, db: Session = Depends(get_db)):
    """Create a new trip"""
    return TripService.create_trip(db, trip, user_id)

@app.get("/trips/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    """Get trip with all details"""
    trip = TripService.get_trip_with_details(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    activities = ActivityService.get_trip_activities(db, trip_id)
    flights = db.query(Flight).filter(Flight.trip_id == trip_id).all()
    hotels = db.query(Hotel).filter(Hotel.trip_id == trip_id).all()
    
    return TripResponse(trip=trip, activities=activities, flights=flights, hotels=hotels)

@app.get("/users/{user_id}/trips/", response_model=List[Trip])
def get_user_trips(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_cookies)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    """Get all trips for a user"""
    return TripService.get_user_trips(db, user_id)

# Activity endpoints
@app.post("/trips/{trip_id}/activities/", response_model=Activity, status_code=status.HTTP_201_CREATED)
def create_activity(trip_id: int, activity: ActivityCreate, db: Session = Depends(get_db)):
    """Create a new activity for a trip"""
    return ActivityService.create_activity(db, activity, trip_id)

@app.get("/trips/{trip_id}/activities/", response_model=List[Activity])
def get_trip_activities(trip_id: int, db: Session = Depends(get_db)):
    """Get all activities for a trip"""
    return ActivityService.get_trip_activities(db, trip_id)

@app.put("/activities/{activity_id}/rating/")
def update_activity_rating(activity_id: int, rating: int, db: Session = Depends(get_db)):
    """Update activity rating"""
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    activity = ActivityService.update_activity_rating(db, activity_id, rating)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"message": f"Updated rating for activity {activity_id}"}

# Itinerary generation endpoint
@app.post("/itinerary/", response_model=ItineraryResponse)
def generate_itinerary(request: ItineraryRequest, db: Session = Depends(get_db)):
    """Generate AI-powered itinerary from natural language description"""
    try:
        result = ItineraryService.generate_itinerary(db, request.description, request.user_id)
        
        # Convert activities to proper format
        all_activities = []
        for day_activities in result["activities"]:
            for activity in day_activities:
                all_activities.append(activity)
        
        return ItineraryResponse(
            trip=result["trip"],
            activities=all_activities,
            total_cost=result["total_cost"],
            bookable_cost=result["bookable_cost"],
            estimated_cost=result["estimated_cost"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating itinerary: {str(e)}")

# Recommendation endpoints
@app.post("/users/{user_id}/recommendations/generate/")
def generate_recommendations(user_id: int, db: Session = Depends(get_db)):
    """Generate personalized recommendations for a user"""
    recommendations = RecommendationService.generate_recommendations(db, user_id)
    return {"message": f"Generated {len(recommendations)} recommendations", "recommendations": recommendations}

@app.get("/users/{user_id}/recommendations/", response_model=List[Recommendation])
def get_user_recommendations(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_cookies)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    """Get all active recommendations for a user"""
    return RecommendationService.get_user_recommendations(db, user_id)

# Alternative activities endpoint
@app.get("/activities/{activity_id}/alternatives/")
def get_activity_alternatives(activity_id: int, db: Session = Depends(get_db)):
    """Get alternative activities for a given activity"""
    # Mock alternative activities - in a real app, this would query a database
    alternatives = {
        "City Walking Tour": [
            {"name": "Private Guided Tour", "price": 45, "type": "bookable", "description": "Exclusive 2-hour private tour with expert guide"},
            {"name": "Self-Guided Audio Tour", "price": 15, "type": "bookable", "description": "Downloadable audio guide with map"},
            {"name": "Bike Tour", "price": 35, "type": "bookable", "description": "3-hour cycling tour of major landmarks"},
        ],
        "Museum Visit": [
            {"name": "Louvre Skip-the-Line Tour", "price": 45, "type": "bookable", "description": "Guided tour with priority access"},
            {"name": "Musée d'Orsay Visit", "price": 22, "type": "bookable", "description": "Impressionist masterpieces collection"},
            {"name": "Pompidou Center", "price": 18, "type": "bookable", "description": "Modern and contemporary art"},
        ],
        "Art Gallery Tour": [
            {"name": "Private Gallery Tour", "price": 60, "type": "bookable", "description": "Exclusive access to private collections"},
            {"name": "Street Art Walking Tour", "price": 25, "type": "bookable", "description": "Explore Paris street art scene"},
            {"name": "Photography Workshop", "price": 75, "type": "bookable", "description": "Learn photography while touring galleries"},
        ],
    }
    
    # Get the current activity to find alternatives
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    activity_alternatives = alternatives.get(activity.name, [])
    return {
        "current_activity": activity,
        "alternatives": activity_alternatives
    }

# Mock endpoints for backward compatibility (for frontend)
@app.get("/events/")
def get_events(location: str = None):
    """Mock events endpoint for backward compatibility"""
    return {
        "events": [
            {"id": 1, "name": "Concert Night", "location": "Downtown", "price": 50.0, "date": "2024-07-01"},
            {"id": 2, "name": "Art Expo", "location": "Museum", "price": 20.0, "date": "2024-07-02"},
        ]
    }

@app.get("/suggestions/")
def get_suggestions():
    """Mock suggestions endpoint for backward compatibility"""
    return {
        "suggestions": [
            {"type": "event", "name": "Jazz Festival", "reason": "You like music"},
            {"type": "trip", "name": "Art City Tour", "reason": "You like art"},
        ]
    }

# Chatbot endpoints
@app.post("/chat/", response_model=ChatResponse)
def chat_with_bot(chat_request: ChatRequest, db: Session = Depends(get_db)):
    """Chat with the AI travel assistant"""
    # Get OpenAI API key from environment variable
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, 
            detail="OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable with your API key."
        )
    
    try:
        result = ChatbotService.process_message(db, chat_request.user_id, chat_request.message, api_key)
        
        return ChatResponse(
            message=chat_request.message,
            bot_response=result["response_text"],
            created_at=result["bot_response"].created_at
        )
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing chat message: {str(e)}")

@app.delete("/chat/{user_id}/clear")
def clear_chat_history(user_id: int, db: Session = Depends(get_db)):
    """Clear chat history for a user"""
    try:
        from database import ChatMessage
        db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete()
        db.commit()
        return {"message": f"Chat history cleared for user {user_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing chat history: {str(e)}")

@app.post("/chat/enhanced/", response_model=schemas.EnhancedItineraryResponse)
def chat_with_enhanced_itinerary(chat_request: ChatRequest, db: Session = Depends(get_db)):
    """Chat with the AI travel assistant and return structured itinerary data"""
    # Get OpenAI API key from environment variable
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, 
            detail="OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable with your API key."
        )
    
    try:
        # Save user message to database first
        if db is not None:
            try:
                ChatbotService.save_user_message(db, chat_request.user_id, chat_request.message)
            except Exception:
                # Silently handle database errors
                pass
        
        # Generate enhanced response
        response_text = ChatbotService.generate_response(db, chat_request.user_id, chat_request.message, api_key)
        
        # Try to parse JSON response
        import json
        try:
            # Look for JSON in the response and clean it
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                
                # Try to fix common JSON issues
                json_str = json_str.replace('\n', ' ').replace('\r', ' ')
                # Remove trailing commas before closing braces/brackets
                import re
                json_str = re.sub(r',\s*}', '}', json_str)
                json_str = re.sub(r',\s*]', ']', json_str)
                
                # More aggressive JSON cleanup
                # Remove any incomplete trailing content first
                last_complete_brace = -1
                brace_count = 0
                for i, char in enumerate(json_str):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            last_complete_brace = i
                            break
                
                if last_complete_brace > 0:
                    json_str = json_str[:last_complete_brace + 1]
                else:
                    # If no complete structure found, try to close what we have
                    if json_str.count('{') > json_str.count('}'):
                        missing_braces = json_str.count('{') - json_str.count('}')
                        json_str += '}' * missing_braces
                
                # Additional cleanup for common issues
                # Remove trailing commas before closing brackets/braces
                json_str = re.sub(r',\s*([}\]])', r'\1', json_str)
                # Fix any double commas
                json_str = re.sub(r',,+', ',', json_str)
                
                # Fix mathematical expressions in cost fields
                # Replace expressions like "300 + 400" with calculated values
                def calculate_expression(match):
                    try:
                        expr = match.group(1)
                        # Simple arithmetic evaluation (only basic operations)
                        if all(c in '0123456789+-*/ ().' for c in expr):
                            result = eval(expr)
                            return f'"{match.group(0).split(":")[0]}": {result}'
                        return match.group(0)
                    except:
                        return match.group(0)
                
                # Find and replace cost field expressions
                json_str = re.sub(r'"(total_cost|bookable_cost|estimated_cost)":\s*([^,}]+)', 
                                lambda m: f'"{m.group(1)}": {eval(m.group(2).strip()) if all(c in "0123456789+-*/ ()." for c in m.group(2).strip()) else m.group(2)}', 
                                json_str)
                
                itinerary_data = json.loads(json_str)
                
                # Fix any missing 'type' fields in flights
                if 'flights' in itinerary_data:
                    for i, flight in enumerate(itinerary_data['flights']):
                        if 'type' not in flight:
                            # Assign type based on position: first is outbound, rest are return
                            flight['type'] = 'outbound' if i == 0 else 'return'
                
                # Save bot response to database
                if db is not None:
                    try:
                        ChatbotService.save_bot_response(db, chat_request.user_id, response_text)
                    except Exception:
                        # Silently handle database errors
                        pass
                
                # Convert to EnhancedItineraryResponse
                return schemas.EnhancedItineraryResponse(**itinerary_data)
            else:
                # If no JSON found, return a default structure
                raise ValueError("No JSON structure found in response")
                
        except (json.JSONDecodeError, ValueError, Exception) as e:
            # Handle JSON parsing errors by falling back to default response
            pass
            
            # Return a default structure if JSON parsing fails
            # Try to extract destination from the conversation history and current message
            default_destination = "Paris, France"  # ultimate fallback
            
            # Check current message first
            message_lower = chat_request.message.lower()
            cities = ['chicago', 'tokyo', 'london', 'barcelona', 'rome', 'berlin', 'amsterdam', 'madrid']
            found_city = None
            
            for city in cities:
                if city in message_lower:
                    found_city = city
                    break
            
            # If no city in current message, check recent chat history
            if not found_city and db is not None:
                try:
                    recent_history = ChatbotService.get_chat_history(db, chat_request.user_id, limit=3)
                    for msg in recent_history:
                        if msg.message:
                            msg_lower = msg.message.lower()
                            for city in cities:
                                if city in msg_lower:
                                    found_city = city
                                    break
                        if found_city:
                            break
                except Exception:
                    # Silently handle errors
                    pass
            
            # Set destination based on found city
            if found_city:
                country_map = {
                    'chicago': 'USA', 'tokyo': 'Japan', 'london': 'UK', 
                    'barcelona': 'Spain', 'madrid': 'Spain', 'rome': 'Italy', 
                    'berlin': 'Germany', 'amsterdam': 'Netherlands'
                }
                default_destination = f"{found_city.title()}, {country_map.get(found_city, 'International')}"
            
            # Save fallback bot response to database
            if db is not None:
                try:
                    fallback_response = f"Default itinerary for {default_destination}"
                    ChatbotService.save_bot_response(db, chat_request.user_id, fallback_response)
                except Exception:
                    # Silently handle database errors
                    pass
            
            return schemas.EnhancedItineraryResponse(
                destination=default_destination,
                duration="3 days",
                description=f"Default itinerary for {default_destination}",
                flights=[
                    schemas.FlightInfo(
                        airline="United Airlines",
                        flight="UA 123",
                        departure="JFK → ORD",
                        time="10:30 AM - 12:45 PM",
                        price=400,
                        type="outbound"
                    ),
                    schemas.FlightInfo(
                        airline="United Airlines",
                        flight="UA 456",
                        departure="ORD → JFK",
                        time="2:00 PM - 5:30 PM",
                        price=400,
                        type="return"
                    )
                ],
                hotel=schemas.HotelInfo(
                    name="Chicago Downtown Hotel",
                    address="123 Michigan Ave, Chicago, IL",
                    check_in="July 15, 2024 - 3:00 PM",
                    check_out="July 18, 2024 - 11:00 AM",
                    room_type="Standard Room",
                    price=150,
                    total_nights=3
                ),
                schedule=[
                    schemas.ItineraryDay(
                        day=1,
                        date="July 15, 2024",
                        activities=[
                            schemas.ItineraryActivity(
                                name="City Walking Tour",
                                time="10:30",
                                price=25,
                                type="bookable",
                                description="Explore the historic city center",
                                alternatives=[
                                    schemas.ItineraryActivity(
                                        name="Private Guided Tour",
                                        time="10:30",
                                        price=45,
                                        type="bookable",
                                        description="Exclusive 2-hour private tour"
                                    )
                                ]
                            )
                        ]
                    )
                ],
                total_cost=2500,
                bookable_cost=1800,
                estimated_cost=700
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error processing enhanced chat message")

@app.get("/users/{user_id}/chat/history/", response_model=List[ChatMessage])
def get_chat_history(user_id: int, limit: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_cookies)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    """Get chat history for a user"""
    return ChatbotService.get_chat_history(db, user_id, limit)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
