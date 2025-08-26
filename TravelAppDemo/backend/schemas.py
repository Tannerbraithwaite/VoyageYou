from pydantic import BaseModel, EmailStr, Field, validator, root_validator
from typing import List, Optional, ForwardRef, Union
from datetime import datetime, timedelta
import re

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
    token: str = Field(..., min_length=1, description="Reset token required")
    new_password: str = Field(..., min_length=8, max_length=128, description="Strong password required")
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if not re.search(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$', v):
            raise ValueError('Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character (@$!%*?&)')
        return v

# PDF Export schemas
class ExportItineraryRequest(BaseModel):
    itinerary_data: dict
    email_pdf: bool = False  # True for mobile (email), False for web (download)

class OAuthRequest(BaseModel):
    id_token: str
    provider: str  # "google" or "apple"

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="Full name (2-50 characters)")
    email: EmailStr = Field(..., description="Valid email address required")
    password: str = Field(..., min_length=8, max_length=128, description="Strong password required")
    
    @validator('password')
    def validate_password(cls, v):
        if not re.search(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$', v):
            raise ValueError('Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character (@$!%*?&)')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        if not re.match(r'^[a-zA-Z\s\-\']+$', v.strip()):
            raise ValueError('Name can only contain letters, spaces, hyphens, and apostrophes')
        return v.strip()

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
    city: Optional[str] = None  # For multi-city trips
    activities: List[ItineraryActivity]

class FlightInfo(BaseModel):
    airline: str
    flight: str
    departure: str
    time: str
    price: float
    type: str  # "outbound" or "return"
    alternatives: Optional[List['FlightInfo']] = []

class HotelInfo(BaseModel):
    city: Optional[str] = None  # For multi-city trips
    name: str
    address: str
    check_in: str
    check_out: str
    room_type: str
    price: float
    total_nights: int
    alternatives: Optional[List['HotelInfo']] = []

class InterCityTransport(BaseModel):
    from_location: str
    to: str
    type: str  # "flight", "train", "bus"
    carrier: str
    departure_time: str
    arrival_time: str
    price: float
    description: str

# Single City Itinerary
class SingleCityItinerary(BaseModel):
    trip_type: str = "single_city"
    destination: str
    duration: str
    description: str
    flights: List[FlightInfo]
    hotel: HotelInfo
    schedule: List[ItineraryDay]
    total_cost: float
    bookable_cost: float
    estimated_cost: float

# Multi-City Itinerary
class MultiCityItinerary(BaseModel):
    trip_type: str = "multi_city"
    destinations: List[str]
    duration: str
    description: str
    flights: List[FlightInfo]
    hotels: List[HotelInfo]
    inter_city_transport: List[InterCityTransport]
    schedule: List[ItineraryDay]
    total_cost: float
    bookable_cost: float
    estimated_cost: float

# Union type for both itinerary types
EnhancedItineraryResponse = Union[SingleCityItinerary, MultiCityItinerary]

# Checkout and payment validation schemas
class CreditCardInfo(BaseModel):
    card_number: str = Field(..., pattern=r'^\d{13,19}$', description="13-19 digit card number")
    cardholder_name: str = Field(..., min_length=2, max_length=50, description="Cardholder full name")
    expiry_date: str = Field(..., pattern=r'^(0[1-9]|1[0-2])\/\d{2}$', description="MM/YY format")
    cvv: str = Field(..., pattern=r'^\d{3,4}$', description="3-4 digit CVV")
    billing_address: str = Field(..., min_length=10, max_length=200, description="Complete billing address")
    
    @validator('card_number')
    def validate_card_number(cls, v):
        # Luhn algorithm for credit card validation
        def luhn_checksum(card_num):
            def digits_of(n):
                return [int(d) for d in str(n)]
            digits = digits_of(card_num)
            odd_digits = digits[-1::-2]
            even_digits = digits[-2::-2]
            checksum = sum(odd_digits)
            for d in even_digits:
                checksum += sum(digits_of(d*2))
            return checksum % 10
        
        cleaned = v.replace(' ', '').replace('-', '')
        if luhn_checksum(cleaned) != 0:
            raise ValueError('Invalid credit card number')
        return cleaned
    
    @validator('expiry_date')
    def validate_expiry_date(cls, v):
        try:
            month, year = v.split('/')
            month, year = int(month), int(f"20{year}")
            exp_date = datetime(year, month, 1)
            if exp_date < datetime.now():
                raise ValueError('Card has expired')
        except ValueError as e:
            if 'Card has expired' in str(e):
                raise e
            raise ValueError('Invalid expiry date format. Use MM/YY')
        return v
    
    @validator('cardholder_name')
    def validate_cardholder_name(cls, v):
        if not re.match(r'^[a-zA-Z\s\-\']+$', v.strip()):
            raise ValueError('Cardholder name can only contain letters, spaces, hyphens, and apostrophes')
        return v.strip()

class TravelerInfo(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50, description="First name")
    last_name: str = Field(..., min_length=1, max_length=50, description="Last name") 
    date_of_birth: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="YYYY-MM-DD format")
    passport_number: str = Field(..., min_length=6, max_length=15, description="Passport number")
    passport_expiry: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="YYYY-MM-DD format")
    nationality: str = Field(..., min_length=2, max_length=50, description="Nationality")
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if not re.match(r'^[a-zA-Z\s\-\']+$', v.strip()):
            raise ValueError('Names can only contain letters, spaces, hyphens, and apostrophes')
        return v.strip()
    
    @validator('date_of_birth')
    def validate_date_of_birth(cls, v):
        try:
            birth_date = datetime.strptime(v, '%Y-%m-%d')
            age = (datetime.now() - birth_date).days / 365.25
            if age < 0:
                raise ValueError('Birth date cannot be in the future')
            if age > 120:
                raise ValueError('Invalid birth date')
        except ValueError as e:
            if 'time data' in str(e):
                raise ValueError('Invalid date format. Use YYYY-MM-DD')
            raise e
        return v
    
    @validator('passport_expiry')
    def validate_passport_expiry(cls, v):
        try:
            exp_date = datetime.strptime(v, '%Y-%m-%d')
            if exp_date < datetime.now() + timedelta(days=180):  # 6 months validity
                raise ValueError('Passport must be valid for at least 6 months')
        except ValueError as e:
            if 'time data' in str(e):
                raise ValueError('Invalid date format. Use YYYY-MM-DD')
            raise e
        return v
    
    @validator('passport_number')
    def validate_passport_number(cls, v):
        cleaned = v.strip().upper()
        if not re.match(r'^[A-Z0-9]+$', cleaned):
            raise ValueError('Passport number can only contain letters and numbers')
        return cleaned

class ContactInfo(BaseModel):
    email: EmailStr = Field(..., description="Valid email address required")
    phone: str = Field(..., description="Valid phone number")
    emergency_contact_name: str = Field(..., min_length=2, max_length=50, description="Emergency contact name")
    emergency_contact_phone: str = Field(..., description="Emergency contact phone")
    
    @validator('phone', 'emergency_contact_phone')
    def validate_phone_numbers(cls, v):
        # Remove common formatting characters
        cleaned = re.sub(r'[\s()-]', '', v)
        if not re.match(r'^\+?1?[0-9]{10,15}$', cleaned):
            raise ValueError('Please enter a valid phone number')
        return cleaned
    
    @validator('emergency_contact_name')
    def validate_emergency_name(cls, v):
        if not re.match(r'^[a-zA-Z\s\-\']+$', v.strip()):
            raise ValueError('Emergency contact name can only contain letters, spaces, hyphens, and apostrophes')
        return v.strip()

class CheckoutRequest(BaseModel):
    travelers: List[TravelerInfo] = Field(..., min_items=1, max_items=10, description="Traveler information")
    payment_info: CreditCardInfo = Field(..., description="Payment information")
    contact_info: ContactInfo = Field(..., description="Contact information")
    itinerary_data: dict = Field(..., description="Trip itinerary data")
    special_requests: Optional[str] = Field(None, max_length=1000, description="Special requests")

# Update forward references
# Note: model_rebuild() is not needed in newer Pydantic versions 