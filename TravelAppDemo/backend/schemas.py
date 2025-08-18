from pydantic import BaseModel, EmailStr
from typing import List, Optional, ForwardRef
from datetime import datetime

# Base schemas
class Base(BaseModel):
    class Config:
        from_attributes = True

class Create(BaseModel):
    pass

class Update(BaseModel):
    pass

# Authentication schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    user: 'User'  # Forward reference
    message: str
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# Password reset schemas
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class OAuthRequest(BaseModel):
    id_token: str
    provider: str  # "google" or "apple"

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class VerificationRequest(BaseModel):
    token: str

class SignupResponse(BaseModel):
    message: str
    user_id: int
    email: str

# User schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    travel_style: Optional[str] = None
    budget_range: Optional[str] = None
    additional_info: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    travel_style: Optional[str] = None
    budget_range: Optional[str] = None
    additional_info: Optional[str] = None

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Update forward references
# Note: model_rebuild() is not needed in newer Pydantic versions

# Interest schemas
class UserInterestBase(BaseModel):
    interest: str

class UserInterestCreate(UserInterestBase):
    pass

class UserInterest(UserInterestBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# Trip schemas
class TripBase(BaseModel):
    destination: str
    start_date: datetime
    end_date: datetime
    description: Optional[str] = None

class TripCreate(TripBase):
    pass

class TripUpdate(BaseModel):
    destination: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    description: Optional[str] = None
    status: Optional[str] = None

class Trip(TripBase):
    id: int
    user_id: int
    total_cost: float
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Activity schemas
class ActivityBase(BaseModel):
    name: str
    description: Optional[str] = None
    day_number: int
    time: str
    price: float
    activity_type: str

class ActivityCreate(ActivityBase):
    pass

class ActivityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    day_number: Optional[int] = None
    time: Optional[str] = None
    price: Optional[float] = None
    activity_type: Optional[str] = None
    booking_status: Optional[str] = None
    rating: Optional[int] = None

class Activity(ActivityBase):
    id: int
    trip_id: int
    booking_status: str
    rating: int
    created_at: datetime

    class Config:
        from_attributes = True

# Flight schemas
class FlightBase(BaseModel):
    airline: str
    flight_number: str
    departure_airport: str
    arrival_airport: str
    departure_time: datetime
    arrival_time: datetime
    price: float
    flight_type: str

class FlightCreate(FlightBase):
    pass

class FlightUpdate(BaseModel):
    airline: Optional[str] = None
    flight_number: Optional[str] = None
    departure_airport: Optional[str] = None
    arrival_airport: Optional[str] = None
    departure_time: Optional[datetime] = None
    arrival_time: Optional[datetime] = None
    price: Optional[float] = None
    flight_type: Optional[str] = None
    booking_status: Optional[str] = None

class Flight(FlightBase):
    id: int
    trip_id: int
    booking_status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Hotel schemas
class HotelBase(BaseModel):
    name: str
    address: str
    room_type: str
    check_in_date: datetime
    check_out_date: datetime
    price_per_night: float
    total_nights: int

class HotelCreate(HotelBase):
    pass

class HotelUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    room_type: Optional[str] = None
    check_in_date: Optional[datetime] = None
    check_out_date: Optional[datetime] = None
    price_per_night: Optional[float] = None
    total_nights: Optional[int] = None
    booking_status: Optional[str] = None

class Hotel(HotelBase):
    id: int
    trip_id: int
    booking_status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Recommendation schemas
class RecommendationBase(BaseModel):
    destination: str
    reason: str
    confidence_score: float
    recommendation_type: str

class RecommendationCreate(RecommendationBase):
    pass

class Recommendation(RecommendationBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# API Response schemas
class TripResponse(BaseModel):
    trip: Trip
    activities: List[Activity]
    flights: List[Flight]
    hotels: List[Hotel]

class UserProfileResponse(BaseModel):
    user: User
    interests: List[UserInterest]

class ItineraryRequest(BaseModel):
    description: str
    user_id: int

class ItineraryResponse(BaseModel):
    trip: Trip
    activities: List[Activity]
    total_cost: float
    bookable_cost: float
    estimated_cost: float

class AlternativeActivity(BaseModel):
    name: str
    price: float
    type: str
    description: str

class ActivityAlternativesResponse(BaseModel):
    current_activity: Activity
    alternatives: List[AlternativeActivity]

# Chatbot schemas
class ChatMessageBase(BaseModel):
    message: str
    user_id: int

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessage(ChatMessageBase):
    id: int
    is_bot: bool
    created_at: datetime
    response: Optional[str] = None

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    user_id: int

class ChatResponse(BaseModel):
    message: str
    bot_response: str
    created_at: datetime

# Enhanced Itinerary schemas for LLM integration
class ItineraryActivity(BaseModel):
    name: str
    time: str
    price: float
    type: str  # "bookable" or "estimated"
    description: Optional[str] = None
    alternatives: Optional[List['ItineraryActivity']] = None

class ItineraryDay(BaseModel):
    day: int
    date: str
    activities: List[ItineraryActivity]

class FlightInfo(BaseModel):
    airline: str
    flight: str
    departure: str
    time: str
    price: float
    type: str  # "outbound" or "return"

class HotelInfo(BaseModel):
    name: str
    address: str
    check_in: str
    check_out: str
    room_type: str
    price: float
    total_nights: int

class EnhancedItineraryResponse(BaseModel):
    destination: str
    duration: str
    description: str
    flights: List[FlightInfo]
    hotel: HotelInfo
    schedule: List[ItineraryDay]
    total_cost: float
    bookable_cost: float
    estimated_cost: float

# Update forward references
# Note: model_rebuild() is not needed in newer Pydantic versions 