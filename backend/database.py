from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Database URL
DATABASE_URL = "sqlite:///./travel_app.db"

# Create engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)  # Hashed password
    travel_style = Column(String)  # solo, couple, family, group
    budget_range = Column(String)  # budget, moderate, luxury
    additional_info = Column(Text)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    verification_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Location for flight origin (departure city)
    location = Column(String, nullable=True)  # City, Country format (e.g., "New York, NY")
    
    # Additional profile fields
    phone = Column(String, nullable=True)
    birthdate = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    nationality = Column(String, nullable=True)
    passport_number = Column(String, nullable=True)
    emergency_contact = Column(String, nullable=True)
    
    # Relationships
    interests = relationship("UserInterest", back_populates="user")
    trips = relationship("Trip", back_populates="user")
    preferences = relationship("UserPreference", back_populates="user")

class UserInterest(Base):
    __tablename__ = "user_interests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    interest = Column(String)  # art, food, culture, etc.
    
    # Relationships
    user = relationship("User", back_populates="interests")

class UserPreference(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    preference_type = Column(String)  # hotel_type, transport_preference, etc.
    preference_value = Column(String)
    
    # Relationships
    user = relationship("User", back_populates="preferences")

class Trip(Base):
    __tablename__ = "trips"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    destination = Column(String)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    description = Column(Text)
    total_cost = Column(Float, default=0.0)
    status = Column(String, default="planned")  # planned, booked, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="trips")
    activities = relationship("Activity", back_populates="trip")
    flights = relationship("Flight", back_populates="trip")
    hotels = relationship("Hotel", back_populates="trip")

class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    name = Column(String)
    description = Column(Text)
    day_number = Column(Integer)
    time = Column(String)
    price = Column(Float, default=0.0)
    activity_type = Column(String)  # bookable, estimated
    booking_status = Column(String, default="not_booked")  # not_booked, booked, completed
    rating = Column(Integer, default=0)  # 1-5 stars
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    trip = relationship("Trip", back_populates="activities")

class Flight(Base):
    __tablename__ = "flights"
    
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    airline = Column(String)
    flight_number = Column(String)
    departure_airport = Column(String)
    arrival_airport = Column(String)
    departure_time = Column(DateTime)
    arrival_time = Column(DateTime)
    price = Column(Float)
    flight_type = Column(String)  # outbound, return
    booking_status = Column(String, default="not_booked")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    trip = relationship("Trip", back_populates="flights")

class Hotel(Base):
    __tablename__ = "hotels"
    
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    name = Column(String)
    address = Column(String)
    room_type = Column(String)
    check_in_date = Column(DateTime)
    check_out_date = Column(DateTime)
    price_per_night = Column(Float)
    total_nights = Column(Integer)
    booking_status = Column(String, default="not_booked")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    trip = relationship("Trip", back_populates="hotels")

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    destination = Column(String)
    reason = Column(Text)
    confidence_score = Column(Float)  # 0.0 to 1.0
    recommendation_type = Column(String)  # trip, activity, hotel
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# Password reset tokens
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime)
    used = Column(Boolean, default=False)

    # Relationships
    user = relationship("User")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    is_bot = Column(Boolean, default=False)
    response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine) 