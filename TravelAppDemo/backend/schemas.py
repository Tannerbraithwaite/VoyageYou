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
LoginResponse.model_rebuild()

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