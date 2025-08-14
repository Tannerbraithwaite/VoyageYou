from database import SessionLocal, User, UserInterest, Trip, Activity, Flight, Hotel, Recommendation
from datetime import datetime, timedelta
import random
from auth import AuthService

def seed_database():
    """Seed the database with sample data"""
    db = SessionLocal()
    
    try:
        # Create sample users
        users = [
            User(
                name="Sarah Johnson",
                email="sarah.johnson@email.com",
                password=AuthService.get_password_hash("password123"),
                travel_style="solo",
                budget_range="moderate",
                additional_info="I prefer boutique hotels over chains, love trying local street food, and always pack light. I'm comfortable with public transportation and enjoy getting lost in new cities.",
                is_verified=True
            ),
            User(
                name="Mike Chen",
                email="mike.chen@email.com",
                password=AuthService.get_password_hash("password123"),
                travel_style="couple",
                budget_range="luxury",
                additional_info="We love luxury experiences and fine dining. Prefer private tours and high-end accommodations.",
                is_verified=True
            ),
            User(
                name="Emma Rodriguez",
                email="emma.rodriguez@email.com",
                password=AuthService.get_password_hash("password123"),
                travel_style="family",
                budget_range="moderate",
                additional_info="Traveling with two kids (8 and 12). Need family-friendly activities and spacious accommodations.",
                is_verified=True
            )
        ]
        
        for user in users:
            db.add(user)
        db.commit()
        
        # Add interests for users
        user_interests = [
            # Sarah's interests
            UserInterest(user_id=1, interest="art"),
            UserInterest(user_id=1, interest="food"),
            UserInterest(user_id=1, interest="culture"),
            
            # Mike's interests
            UserInterest(user_id=2, interest="food"),
            UserInterest(user_id=2, interest="luxury"),
            UserInterest(user_id=2, interest="culture"),
            
            # Emma's interests
            UserInterest(user_id=3, interest="family"),
            UserInterest(user_id=3, interest="nature"),
            UserInterest(user_id=3, interest="culture"),
        ]
        
        for interest in user_interests:
            db.add(interest)
        db.commit()
        
        # Create sample trips
        trips = [
            Trip(
                user_id=1,
                destination="Paris",
                start_date=datetime(2024, 7, 15),
                end_date=datetime(2024, 7, 18),
                description="3 days in Paris - Art & Food Lover's Dream",
                total_cost=2218.0,
                status="planned"
            ),
            Trip(
                user_id=1,
                destination="Tokyo",
                start_date=datetime(2024, 3, 10),
                end_date=datetime(2024, 3, 15),
                description="5 days exploring Tokyo's culture and cuisine",
                total_cost=3200.0,
                status="completed"
            ),
            Trip(
                user_id=2,
                destination="Barcelona",
                start_date=datetime(2024, 1, 20),
                end_date=datetime(2024, 1, 24),
                description="Luxury weekend in Barcelona",
                total_cost=2100.0,
                status="completed"
            ),
            Trip(
                user_id=3,
                destination="New York",
                start_date=datetime(2023, 11, 15),
                end_date=datetime(2023, 11, 18),
                description="Family trip to NYC",
                total_cost=1800.0,
                status="completed"
            )
        ]
        
        for trip in trips:
            db.add(trip)
        db.commit()
        
        # Create sample activities for Paris trip
        paris_activities = [
            Activity(
                trip_id=1,
                name="Arrive at Hotel",
                day_number=1,
                time="09:00",
                price=0.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=1,
                name="City Walking Tour",
                day_number=1,
                time="10:30",
                price=25.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=1,
                name="Lunch at Local Bistro",
                day_number=1,
                time="13:00",
                price=35.0,
                activity_type="estimated",
                booking_status="not_booked"
            ),
            Activity(
                trip_id=1,
                name="Museum Visit",
                day_number=1,
                time="15:00",
                price=18.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=1,
                name="Dinner & Wine Tasting",
                day_number=1,
                time="18:00",
                price=65.0,
                activity_type="estimated",
                booking_status="not_booked"
            ),
            Activity(
                trip_id=1,
                name="Breakfast at Hotel",
                day_number=2,
                time="08:00",
                price=0.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=1,
                name="Art Gallery Tour",
                day_number=2,
                time="09:30",
                price=30.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=1,
                name="Street Food Market",
                day_number=2,
                time="12:00",
                price=20.0,
                activity_type="estimated",
                booking_status="not_booked"
            ),
            Activity(
                trip_id=1,
                name="Boat Tour",
                day_number=2,
                time="14:00",
                price=45.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=1,
                name="Concert at Opera House",
                day_number=2,
                time="19:00",
                price=120.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=1,
                name="Sunrise Photography Tour",
                day_number=3,
                time="07:30",
                price=40.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=1,
                name="Cooking Class",
                day_number=3,
                time="10:00",
                price=85.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=1,
                name="Wine Cellar Visit",
                day_number=3,
                time="13:30",
                price=55.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=1,
                name="Shopping & Souvenirs",
                day_number=3,
                time="16:00",
                price=0.0,
                activity_type="estimated",
                booking_status="not_booked"
            ),
            Activity(
                trip_id=1,
                name="Farewell Dinner",
                day_number=3,
                time="20:00",
                price=75.0,
                activity_type="estimated",
                booking_status="not_booked"
            )
        ]
        
        for activity in paris_activities:
            db.add(activity)
        db.commit()
        
        # Create sample flights for Paris trip
        paris_flights = [
            Flight(
                trip_id=1,
                airline="Air France",
                flight_number="AF 1234",
                departure_airport="JFK",
                arrival_airport="CDG",
                departure_time=datetime(2024, 7, 15, 10, 30),
                arrival_time=datetime(2024, 7, 15, 23, 45),
                price=850.0,
                flight_type="outbound",
                booking_status="booked"
            ),
            Flight(
                trip_id=1,
                airline="Air France",
                flight_number="AF 1235",
                departure_airport="CDG",
                arrival_airport="JFK",
                departure_time=datetime(2024, 7, 18, 14, 15),
                arrival_time=datetime(2024, 7, 18, 17, 30),
                price=850.0,
                flight_type="return",
                booking_status="booked"
            )
        ]
        
        for flight in paris_flights:
            db.add(flight)
        db.commit()
        
        # Create sample hotel for Paris trip
        paris_hotel = Hotel(
            trip_id=1,
            name="Hotel Le Marais",
            address="123 Rue de Rivoli, Paris",
            room_type="Deluxe Room",
            check_in_date=datetime(2024, 7, 15, 15, 0),
            check_out_date=datetime(2024, 7, 18, 11, 0),
            price_per_night=180.0,
            total_nights=3,
            booking_status="booked"
        )
        
        db.add(paris_hotel)
        db.commit()
        
        # Create sample recommendations
        recommendations = [
            Recommendation(
                user_id=1,
                destination="Florence, Italy",
                reason="Based on your interest in art, you would love the Uffizi Gallery and Renaissance architecture",
                confidence_score=0.85,
                recommendation_type="trip",
                is_active=True
            ),
            Recommendation(
                user_id=1,
                destination="Barcelona, Spain",
                reason="Perfect for food lovers with amazing tapas and Catalan cuisine",
                confidence_score=0.78,
                recommendation_type="trip",
                is_active=True
            ),
            Recommendation(
                user_id=2,
                destination="Kyoto, Japan",
                reason="Rich in cultural heritage with temples, gardens, and traditional experiences",
                confidence_score=0.82,
                recommendation_type="trip",
                is_active=True
            )
        ]
        
        for rec in recommendations:
            db.add(rec)
        db.commit()
        
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database() 