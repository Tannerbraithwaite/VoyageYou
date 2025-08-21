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
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
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
    ChatRequest, ChatResponse, ChatMessage, ExportItineraryRequest
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
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

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
            secure=os.getenv("ENV", "development") == "production",
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
    secure_flag = os.getenv("ENV", "development") == "production"
    response.delete_cookie("access_token", httponly=True, secure=secure_flag, samesite="lax")
    response.delete_cookie("refresh_token", httponly=True, secure=secure_flag, samesite="lax")
    return {"message": "Logged out successfully"}

# ---------------- Password Reset Flow -----------------


@app.post("/auth/forgot-password")
async def forgot_password(request_data: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Initiate password reset by sending email with reset token"""
    from database import PasswordResetToken, User
    from datetime import datetime, timedelta
    # Always respond success message to avoid email enumeration
    generic_response = {"message": "If an account with that email exists, a password reset link has been sent."}

    user = db.query(User).filter(User.email == request_data.email).first()
    if not user:
        return generic_response

    # Generate unique token
    import secrets, string
    token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(48))

    expires_at = datetime.utcnow() + timedelta(hours=1)

    # Store token
    reset_record = PasswordResetToken(user_id=user.id, token=token, expires_at=expires_at, used=False)
    db.add(reset_record)
    db.commit()

    # Send email (async call)
    await email_service.send_password_reset_email(user.email, user.name or "User", token)

    return generic_response


@app.post("/auth/reset-password")
async def reset_password(request_data: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using token"""
    from database import PasswordResetToken, User
    from datetime import datetime

    reset_record = db.query(PasswordResetToken).filter(PasswordResetToken.token == request_data.token).first()
    if not reset_record or reset_record.used or reset_record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == reset_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Hash new password and update
    hashed = AuthService.get_password_hash(request_data.new_password)
    user.password = hashed
    db.commit()

    # Mark token used
    reset_record.used = True
    db.commit()

    return {"message": "Password has been reset successfully. You can now log in."}

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

@app.get("/users/{user_id}/interests/")
def get_user_interests(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_cookies)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    """Get user interests"""
    interests = db.query(UserInterest).filter(UserInterest.user_id == user_id).all()
    return [{"id": interest.id, "interest": interest.interest} for interest in interests]

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

# New API search endpoints
@app.get("/flights/search")
async def search_flights(origin: str, destination: str, departure_date: str, 
                        return_date: str = None, passengers: int = 1):
    """Search for flights using Duffel API"""
    from api_services import duffel_service
    try:
        result = await duffel_service.search_flights(origin, destination, departure_date, return_date, passengers)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching flights: {str(e)}")

@app.get("/hotels/search")
async def search_hotels(destination: str, checkin: str, checkout: str, 
                       guests: int = 2, rooms: int = 1):
    """Search for hotels using Hotelbeds API"""
    from api_services import hotelbeds_service
    try:
        result = await hotelbeds_service.search_hotels(destination, checkin, checkout, guests, rooms)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching hotels: {str(e)}")

@app.get("/events/search")
async def search_events(location: str, start_date: str = None, end_date: str = None):
    """Search for events using Ticketmaster API"""
    from api_services import ticketmaster_service
    try:
        result = await ticketmaster_service.search_events(location, start_date, end_date)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching events: {str(e)}")

# Chatbot endpoints
@app.post("/chat/", response_model=ChatResponse)
async def chat_with_bot(chat_request: ChatRequest, db: Session = Depends(get_db)):
    """Chat with the AI travel assistant"""
    # Get OpenAI API key from environment variable
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, 
            detail="OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable with your API key."
        )
    
    try:
        result = await ChatbotService.process_message(db, chat_request.user_id, chat_request.message, api_key)
        
        return ChatResponse(
            message=chat_request.message,
            bot_response=result["response_text"],
            created_at=result["bot_response"].created_at if result["bot_response"] else datetime.utcnow()
        )
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing chat message: {str(e)}")

@app.post("/chat/travel-profile/", response_model=ChatResponse)
async def generate_travel_profile(chat_request: ChatRequest, db: Session = Depends(get_db)):
    """Generate travel profile with bullet points (non-JSON response)"""
    # Get OpenAI API key from environment variable
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, 
            detail="OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable with your API key."
        )
    
    try:
        result = await ChatbotService.process_travel_profile_message(db, chat_request.user_id, chat_request.message, api_key)
        
        return ChatResponse(
            message=chat_request.message,
            bot_response=result["response_text"],
            created_at=result["bot_response"].created_at if result["bot_response"] else datetime.utcnow()
        )
    except Exception as e:
        print(f"Error in travel profile endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing travel profile message: {str(e)}")

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

@app.post("/chat/enhanced/")
async def chat_with_enhanced_itinerary(chat_request: ChatRequest, db: Session = Depends(get_db)):
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
        response_text = await ChatbotService.generate_response(db, chat_request.user_id, chat_request.message, api_key)
        
        # Try to parse JSON response
        import json
        try:
            # Look for JSON in the response and clean it
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                
                # SIMPLIFIED JSON cleanup - preserve schedule data
                json_str = json_str.replace('\n', ' ').replace('\r', ' ')
                
                # Basic cleanup only
                import re
                json_str = re.sub(r',\s*}', '}', json_str)
                json_str = re.sub(r',\s*]', ']', json_str)
                
                print(f"🔍 JSON cleanup - original length: {len(response_text)}, cleaned length: {len(json_str)}")
                
                itinerary_data = json.loads(json_str)
                
                # CRITICAL: Ensure schedule is preserved
                if not itinerary_data.get('schedule') or len(itinerary_data.get('schedule', [])) == 0:
                    print("⚠️  Schedule missing after JSON parsing - this shouldn't happen!")
                    # Generate fallback schedule
                    if itinerary_data.get('trip_type') == 'multi_city':
                        destinations = itinerary_data.get('destinations', ['Naples, Italy', 'Rome, Italy'])
                        duration = itinerary_data.get('duration', '4 days')
                        
                        # Parse duration
                        days_match = re.search(r'(\d+)', duration)
                        if days_match:
                            num_days = int(days_match.group(1))
                            schedule = []
                            
                            # Naples activities (first 3 days)
                            naples_days = min(3, num_days - 1)
                            
                            for day in range(1, naples_days + 1):
                                schedule.append({
                                    "day": day,
                                    "date": f"July {14 + day}, 2024",
                                    "city": "Naples, Italy",
                                    "activities": [
                                        {
                                            "name": f"Day {day} Naples Activity",
                                            "time": "10:00 AM",
                                            "price": 25,
                                            "type": "bookable",
                                            "description": f"Explore Naples on day {day}",
                                            "alternatives": []
                                        }
                                    ]
                                })
                            
                            # Rome activities (remaining days)
                            for day in range(naples_days + 1, num_days + 1):
                                schedule.append({
                                    "day": day,
                                    "date": f"July {14 + day}, 2024",
                                    "city": "Rome, Italy",
                                    "activities": [
                                        {
                                            "name": f"Day {day} Rome Activity",
                                            "time": "10:00 AM",
                                            "price": 30,
                                            "type": "bookable",
                                            "description": f"Explore Rome on day {day}",
                                            "alternatives": []
                                        }
                                    ]
                                })
                            
                            itinerary_data['schedule'] = schedule
                            print(f"✅ Generated fallback schedule with {len(schedule)} days")
                
                print(f"🔍 Final itinerary data - schedule length: {len(itinerary_data.get('schedule', []))}")
                
                # Save bot response to database
                if db is not None:
                    try:
                        ChatbotService.save_bot_response(db, chat_request.user_id, response_text)
                    except Exception:
                        # Silently handle database errors
                        pass
                
                # Return the raw itinerary_data dictionary
                return itinerary_data
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
            cities = ['chicago', 'tokyo', 'london', 'barcelona', 'rome', 'naples', 'berlin', 'amsterdam', 'madrid']
            found_city = None
            
            # Check for multi-city requests
            multi_city_indicators = [' and ', ' & ', ', ', ' to ']
            is_multi_city = any(indicator in chat_request.message for indicator in multi_city_indicators)
            
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
                    'naples': 'Italy', 'berlin': 'Germany', 'amsterdam': 'Netherlands'
                }
                default_destination = f"{found_city.title()}, {country_map.get(found_city, 'International')}"
                
                # If this looks like a multi-city request, adjust the destination
                if is_multi_city and 'naples' in message_lower and 'rome' in message_lower:
                    default_destination = "Naples and Rome, Italy"
            
            # Save fallback bot response to database
            if db is not None:
                try:
                    fallback_response = f"Default itinerary for {default_destination}"
                    ChatbotService.save_bot_response(db, chat_request.user_id, fallback_response)
                except Exception:
                    # Silently handle database errors
                    pass
            
            # Return appropriate response based on whether it's multi-city
            if is_multi_city and 'naples' in message_lower and 'rome' in message_lower:
                # Extract duration from user message - improved parsing
                duration = "5 days"  # Default fallback
                
                # More comprehensive duration extraction
                if '3 days' in message_lower or '3 day' in message_lower:
                    duration = "3 days"
                elif '4 days' in message_lower or '4 day' in message_lower:
                    duration = "4 days"
                elif '5 days' in message_lower or '5 day' in message_lower:
                    duration = "5 days"
                elif '6 days' in message_lower or '6 day' in message_lower:
                    duration = "6 days"
                elif '7 days' in message_lower or '7 day' in message_lower or 'week' in message_lower:
                    duration = "7 days"
                elif '10 days' in message_lower or '10 day' in message_lower:
                    duration = "10 days"
                elif '14 days' in message_lower or '14 day' in message_lower or '2 weeks' in message_lower:
                    duration = "14 days"
                else:
                    # Try to extract duration from the user's specific request
                    # Look for patterns like "X day trip", "X days trip", "for X days", "X days in", "spending X days"
                    import re
                    
                    # Pattern 1: "X day trip" or "X days trip"
                    day_trip_match = re.search(r'(\d+)\s*days?\s*trip', message_lower)
                    if day_trip_match:
                        duration = f"{day_trip_match.group(1)} days"
                    
                    # Pattern 2: "for X days" or "X days in"
                    for_days_match = re.search(r'for\s*(\d+)\s*days?', message_lower)
                    if for_days_match:
                        duration = f"{for_days_match.group(1)} days"
                    
                    # Pattern 3: "spending X days" or "X days in"
                    spending_days_match = re.search(r'spending\s*(\d+)\s*days?', message_lower)
                    if spending_days_match:
                        duration = f"{spending_days_match.group(1)} days"
                    
                    # Pattern 4: "X days in [city]" or "X day in [city]"
                    days_in_city_match = re.search(r'(\d+)\s*days?\s*in', message_lower)
                    if days_in_city_match:
                        duration = f"{days_in_city_match.group(1)} days"
                
                print(f"🔍 Duration extracted from user message: '{duration}' (original message: '{message_lower}')")
                
                # Generate dynamic schedule based on extracted duration
                def generate_dynamic_schedule(duration_str: str) -> list:
                    """Generate schedule based on user's requested duration"""
                    # Parse duration to get number of days
                    import re
                    days_match = re.search(r'(\d+)', duration_str)
                    if not days_match:
                        return []  # Fallback to empty schedule
                    
                    num_days = int(days_match.group(1))
                    schedule = []
                    
                    # Naples activities (first 3 days or until day before Rome)
                    naples_days = min(3, num_days - 1)  # At least 1 day in Rome
                    
                    for day in range(1, naples_days + 1):
                        schedule.append(schemas.ItineraryDay(
                            day=day,
                            date=f"July {14 + day}, 2024",
                            city="Naples, Italy",
                            activities=[
                                schemas.ItineraryActivity(
                                    name=f"Day {day} Naples Activity",
                                    time="10:00 AM",
                                    price=25,
                                    type="bookable",
                                    description=f"Explore Naples on day {day}",
                                    alternatives=[]
                                ),
                                schemas.ItineraryActivity(
                                    name=f"Evening in Naples Day {day}",
                                    time="7:00 PM",
                                    price=0,
                                    type="estimated",
                                    description=f"Evening activities in Naples",
                                    alternatives=[]
                                )
                            ]
                        ))
                    
                    # Rome activities (remaining days)
                    for day in range(naples_days + 1, num_days + 1):
                        schedule.append(schemas.ItineraryDay(
                            day=day,
                            date=f"July {14 + day}, 2024",
                            city="Rome, Italy",
                            activities=[
                                schemas.ItineraryActivity(
                                    name=f"Day {day} Rome Activity",
                                    time="10:00 AM",
                                    price=30,
                                    type="bookable",
                                    description=f"Explore Rome on day {day}",
                                    alternatives=[]
                                ),
                                schemas.ItineraryActivity(
                                    name=f"Evening in Rome Day {day}",
                                    time="7:00 PM",
                                    price=0,
                                    type="estimated",
                                    description=f"Evening activities in Rome",
                                    alternatives=[]
                                )
                            ]
                        ))
                    
                    return schedule
                
                # REMOVED: Generic schedule generation that was overriding LLM content
                # The LLM should provide rich, personalized activities
                # Only use fallback if LLM completely fails
                
                # Return a simple fallback structure without overriding activities
                return schemas.MultiCityItinerary(
                    trip_type="multi_city",
                    destinations=["Naples, Italy", "Rome, Italy"],
                    duration=duration,
                    description="Multi-city trip to Naples and Rome",
                    flights=[],
                    hotels=[],
                    inter_city_transport=[],
                    schedule=[],
                    bookable_cost=0,
                    estimated_cost=0,
                    total_cost=0
                )
            else:
                # Extract duration from user message - same logic as multi-city
                duration = "3 days"  # Default fallback
                if '3 days' in message_lower or '3 day' in message_lower:
                    duration = "3 days"
                elif '4 days' in message_lower or '4 day' in message_lower:
                    duration = "4 days"
                elif '5 days' in message_lower or '5 day' in message_lower:
                    duration = "5 days"
                elif '6 days' in message_lower or '6 day' in message_lower:
                    duration = "6 days"
                elif '7 days' in message_lower or '7 day' in message_lower or 'week' in message_lower:
                    duration = "7 days"
                elif '10 days' in message_lower or '10 day' in message_lower:
                    duration = "10 days"
                elif '14 days' in message_lower or '14 day' in message_lower or '2 weeks' in message_lower:
                    duration = "14 days"
                else:
                    # Try to extract duration from the user's specific request
                    import re
                    
                    # Pattern 1: "X day trip" or "X days trip"
                    day_trip_match = re.search(r'(\d+)\s*days?\s*trip', message_lower)
                    if day_trip_match:
                        duration = f"{day_trip_match.group(1)} days"
                    
                    # Pattern 2: "for X days" or "X days in"
                    for_days_match = re.search(r'for\s*(\d+)\s*days?', message_lower)
                    if for_days_match:
                        duration = f"{for_days_match.group(1)} days"
                    
                    # Pattern 3: "spending X days" or "X days in"
                    spending_days_match = re.search(r'spending\s*(\d+)\s*days?', message_lower)
                    if spending_days_match:
                        duration = f"{spending_days_match.group(1)} days"
                    
                    # Pattern 4: "X days in [city]" or "X day in [city]"
                    days_in_city_match = re.search(r'(\d+)\s*days?\s*in', message_lower)
                    if days_in_city_match:
                        duration = f"{days_in_city_match.group(1)} days"
                
                print(f"🔍 Single-city duration extracted: '{duration}' (original message: '{message_lower}')")
                
                # Generate dynamic single-city schedule
                def generate_single_city_schedule(duration_str: str) -> list:
                    """Generate single-city schedule based on user's requested duration"""
                    import re
                    days_match = re.search(r'(\d+)', duration_str)
                    if not days_match:
                        return []
                    
                    num_days = int(days_match.group(1))
                    schedule = []
                    
                    for day in range(1, num_days + 1):
                        schedule.append(schemas.ItineraryDay(
                            day=day,
                            date=f"July {14 + day}, 2024",
                            activities=[
                                schemas.ItineraryActivity(
                                    name=f"Day {day} Activity",
                                    time="10:00 AM",
                                    price=25,
                                    type="bookable",
                                    description=f"Explore the city on day {day}",
                                    alternatives=[]
                                ),
                                schemas.ItineraryActivity(
                                    name=f"Evening Activity Day {day}",
                                    time="7:00 PM",
                                    price=0,
                                    type="estimated",
                                    description=f"Evening activities on day {day}",
                                    alternatives=[]
                                )
                            ]
                        ))
                    
                    return schedule
                
                # Generate the schedule dynamically
                single_city_schedule = generate_single_city_schedule(duration)
                print(f"📅 Generated {len(single_city_schedule)} days for single-city schedule based on duration: {duration}")
                
                # Return single city structure
                return schemas.SingleCityItinerary(
                    trip_type="single_city",
                    destination=default_destination,
                    duration=duration,
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
                    schedule=single_city_schedule,
                    total_cost=1200,
                    bookable_cost=1000,
                    estimated_cost=200
                )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error processing enhanced chat message")

@app.get("/users/{user_id}/chat/history/", response_model=List[ChatMessage])
def get_chat_history(user_id: int, limit: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_from_cookies)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    """Get chat history for a user"""
    return ChatbotService.get_chat_history(db, user_id, limit)

# PDF Export endpoints
@app.post("/itinerary/export")
async def export_itinerary(
    export_request: ExportItineraryRequest,
    current_user: User = Depends(get_current_user_from_cookies)
):
    """Export itinerary as PDF - email on mobile, download on web"""
    try:
        from pdf_service import pdf_service
        
        # Generate PDF
        pdf_buffer = pdf_service.generate_itinerary_pdf(
            export_request.itinerary_data, 
            current_user.email
        )
        
        destination = export_request.itinerary_data.get('destination', 'Travel')
        filename = pdf_service.generate_filename(destination, current_user.id)
        
        if export_request.email_pdf:
            # Mobile: Email the PDF
            pdf_bytes = pdf_buffer.getvalue()
            email_sent = await email_service.send_itinerary_pdf_email(
                current_user.email,
                current_user.name or "Traveler",
                pdf_bytes,
                filename,
                destination
            )
            
            if email_sent:
                return {"message": f"Itinerary PDF has been sent to {current_user.email}"}
            else:
                raise HTTPException(status_code=500, detail="Failed to send email")
        else:
            # Web: Return PDF for download
            from fastapi.responses import StreamingResponse
            
            pdf_buffer.seek(0)
            return StreamingResponse(
                iter([pdf_buffer.getvalue()]),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting itinerary: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

