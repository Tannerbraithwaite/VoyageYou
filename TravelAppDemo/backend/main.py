from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uvicorn

from database import get_db, create_tables, UserInterest, Flight, Hotel
from schemas import (
    UserCreate, User, UserUpdate, UserProfileResponse,
    TripCreate, Trip, TripResponse,
    ActivityCreate, Activity, ActivityUpdate,
    ItineraryRequest, ItineraryResponse,
    Recommendation, LoginRequest, LoginResponse
)
from services import UserService, TripService, ActivityService, ItineraryService, RecommendationService

# Create FastAPI app
app = FastAPI(
    title="TravelApp API",
    description="AI-powered travel planning and recommendation system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "TravelApp API is running!"}

# Authentication endpoints
@app.post("/auth/login", response_model=LoginResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login user with email and password"""
    user = UserService.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return LoginResponse(user=user, message="Login successful")

@app.post("/auth/signup", response_model=LoginResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account"""
    # Check if user already exists
    existing_user = UserService.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    user = UserService.create_user(db, user_data)
    return LoginResponse(user=user, message="Account created successfully")

# User endpoints
@app.post("/users/", response_model=User, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    return UserService.create_user(db, user)

@app.get("/users/{user_id}", response_model=User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID"""
    user = UserService.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}", response_model=User)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    """Update user profile"""
    user = UserService.update_user(db, user_id, user_update.dict(exclude_unset=True))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/users/{user_id}/interests/")
def update_user_interests(user_id: int, interests: List[str], db: Session = Depends(get_db)):
    """Update user interests"""
    user_interests = UserService.add_user_interests(db, user_id, interests)
    return {"message": f"Updated {len(user_interests)} interests for user {user_id}"}

@app.get("/users/{user_id}/profile", response_model=UserProfileResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
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
def get_user_trips(user_id: int, db: Session = Depends(get_db)):
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
def get_user_recommendations(user_id: int, db: Session = Depends(get_db)):
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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
