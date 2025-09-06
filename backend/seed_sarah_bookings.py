#!/usr/bin/env python3
"""
Seed additional booked trip data for Sarah Johnson
"""
from database import SessionLocal, User, Trip, Activity, Flight, Hotel
from datetime import datetime, timedelta
import random

def seed_sarah_bookings():
    """Add more booked trip data for Sarah Johnson (user_id=1)"""
    db = SessionLocal()
    
    try:
        # Check if Sarah Johnson exists
        sarah = db.query(User).filter(User.name == "Sarah Johnson").first()
        if not sarah:
            print("Sarah Johnson not found in database. Please run seed_data.py first.")
            return
        
        print(f"Adding booked trips for Sarah Johnson (ID: {sarah.id})")
        
        # Create additional trips for Sarah
        additional_trips = [
            # Completed trip to Rome
            Trip(
                user_id=sarah.id,
                destination="Rome, Italy",
                start_date=datetime(2024, 2, 14),
                end_date=datetime(2024, 2, 18),
                description="Valentine's Day solo trip to Rome - Art, History & Italian Cuisine",
                total_cost=1850.0,
                status="completed"
            ),
            # Booked trip to Barcelona
            Trip(
                user_id=sarah.id,
                destination="Barcelona, Spain",
                start_date=datetime(2024, 9, 5),
                end_date=datetime(2024, 9, 9),
                description="4 days in Barcelona - Gaudi, Tapas & Mediterranean vibes",
                total_cost=1650.0,
                status="booked"
            ),
            # Upcoming trip to Amsterdam
            Trip(
                user_id=sarah.id,
                destination="Amsterdam, Netherlands",
                start_date=datetime(2024, 11, 20),
                end_date=datetime(2024, 11, 24),
                description="Autumn weekend in Amsterdam - Museums, Canals & Dutch Culture",
                total_cost=1420.0,
                status="booked"
            )
        ]
        
        for trip in additional_trips:
            db.add(trip)
        db.commit()
        
        # Get the trip IDs for the new trips
        rome_trip = db.query(Trip).filter(
            Trip.user_id == sarah.id,
            Trip.destination == "Rome, Italy"
        ).first()
        
        barcelona_trip = db.query(Trip).filter(
            Trip.user_id == sarah.id,
            Trip.destination == "Barcelona, Spain"
        ).first()
        
        amsterdam_trip = db.query(Trip).filter(
            Trip.user_id == sarah.id,
            Trip.destination == "Amsterdam, Netherlands"
        ).first()
        
        # Rome trip activities (completed)
        rome_activities = [
            Activity(
                trip_id=rome_trip.id,
                name="Arrive at Hotel",
                day_number=1,
                time="14:00",
                price=0.0,
                activity_type="bookable",
                booking_status="completed"
            ),
            Activity(
                trip_id=rome_trip.id,
                name="Colosseum Tour",
                day_number=1,
                time="16:00",
                price=45.0,
                activity_type="bookable",
                booking_status="completed"
            ),
            Activity(
                trip_id=rome_trip.id,
                name="Dinner in Trastevere",
                day_number=1,
                time="20:00",
                price=55.0,
                activity_type="bookable",
                booking_status="completed"
            ),
            Activity(
                trip_id=rome_trip.id,
                name="Vatican Museums & Sistine Chapel",
                day_number=2,
                time="09:00",
                price=65.0,
                activity_type="bookable",
                booking_status="completed"
            ),
            Activity(
                trip_id=rome_trip.id,
                name="Gelato Tasting Tour",
                day_number=2,
                time="15:00",
                price=25.0,
                activity_type="bookable",
                booking_status="completed"
            ),
            Activity(
                trip_id=rome_trip.id,
                name="Trevi Fountain & Spanish Steps",
                day_number=2,
                time="17:00",
                price=0.0,
                activity_type="estimated",
                booking_status="completed"
            ),
            Activity(
                trip_id=rome_trip.id,
                name="Cooking Class - Pasta Making",
                day_number=3,
                time="10:00",
                price=85.0,
                activity_type="bookable",
                booking_status="completed"
            ),
            Activity(
                trip_id=rome_trip.id,
                name="Pantheon & Piazza Navona",
                day_number=3,
                time="15:00",
                price=0.0,
                activity_type="estimated",
                booking_status="completed"
            ),
            Activity(
                trip_id=rome_trip.id,
                name="Farewell Dinner",
                day_number=3,
                time="19:30",
                price=70.0,
                activity_type="bookable",
                booking_status="completed"
            )
        ]
        
        # Barcelona trip activities (booked)
        barcelona_activities = [
            Activity(
                trip_id=barcelona_trip.id,
                name="Arrive at Hotel",
                day_number=1,
                time="15:00",
                price=0.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=barcelona_trip.id,
                name="Sagrada Familia Tour",
                day_number=1,
                time="16:30",
                price=50.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=barcelona_trip.id,
                name="Tapas Crawl in Gothic Quarter",
                day_number=1,
                time="19:00",
                price=45.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=barcelona_trip.id,
                name="Park Güell & Gaudi Architecture",
                day_number=2,
                time="09:00",
                price=35.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=barcelona_trip.id,
                name="La Boqueria Market Food Tour",
                day_number=2,
                time="12:00",
                price=40.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=barcelona_trip.id,
                name="Flamenco Show",
                day_number=2,
                time="21:00",
                price=60.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=barcelona_trip.id,
                name="Montjuïc Hill & Magic Fountain",
                day_number=3,
                time="10:00",
                price=0.0,
                activity_type="estimated",
                booking_status="not_booked"
            ),
            Activity(
                trip_id=barcelona_trip.id,
                name="Beach Day at Barceloneta",
                day_number=3,
                time="14:00",
                price=0.0,
                activity_type="estimated",
                booking_status="not_booked"
            ),
            Activity(
                trip_id=barcelona_trip.id,
                name="Cava Tasting Experience",
                day_number=3,
                time="18:00",
                price=55.0,
                activity_type="bookable",
                booking_status="booked"
            )
        ]
        
        # Amsterdam trip activities (booked)
        amsterdam_activities = [
            Activity(
                trip_id=amsterdam_trip.id,
                name="Arrive at Hotel",
                day_number=1,
                time="13:00",
                price=0.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=amsterdam_trip.id,
                name="Van Gogh Museum",
                day_number=1,
                time="15:00",
                price=25.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=amsterdam_trip.id,
                name="Canal Cruise",
                day_number=1,
                time="17:00",
                price=35.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=amsterdam_trip.id,
                name="Jordaan District Walking Tour",
                day_number=2,
                time="10:00",
                price=20.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=amsterdam_trip.id,
                name="Anne Frank House",
                day_number=2,
                time="14:00",
                price=15.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=amsterdam_trip.id,
                name="Dutch Cheese Tasting",
                day_number=2,
                time="16:30",
                price=30.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=amsterdam_trip.id,
                name="Rijksmuseum",
                day_number=3,
                time="09:00",
                price=25.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=amsterdam_trip.id,
                name="Bike Tour of the City",
                day_number=3,
                time="13:00",
                price=25.0,
                activity_type="bookable",
                booking_status="booked"
            ),
            Activity(
                trip_id=amsterdam_trip.id,
                name="Farewell Dinner",
                day_number=3,
                time="19:00",
                price=65.0,
                activity_type="bookable",
                booking_status="booked"
            )
        ]
        
        # Add all activities
        all_activities = rome_activities + barcelona_activities + amsterdam_activities
        for activity in all_activities:
            db.add(activity)
        db.commit()
        
        # Rome flights (completed)
        rome_flights = [
            Flight(
                trip_id=rome_trip.id,
                airline="Alitalia",
                flight_number="AZ 610",
                departure_airport="JFK",
                arrival_airport="FCO",
                departure_time=datetime(2024, 2, 14, 8, 30),
                arrival_time=datetime(2024, 2, 14, 22, 15),
                price=720.0,
                flight_type="outbound",
                booking_status="completed"
            ),
            Flight(
                trip_id=rome_trip.id,
                airline="Alitalia",
                flight_number="AZ 611",
                departure_airport="FCO",
                arrival_airport="JFK",
                departure_time=datetime(2024, 2, 18, 12, 45),
                arrival_time=datetime(2024, 2, 18, 16, 20),
                price=720.0,
                flight_type="return",
                booking_status="completed"
            )
        ]
        
        # Barcelona flights (booked)
        barcelona_flights = [
            Flight(
                trip_id=barcelona_trip.id,
                airline="Iberia",
                flight_number="IB 6201",
                departure_airport="JFK",
                arrival_airport="BCN",
                departure_time=datetime(2024, 9, 5, 11, 20),
                arrival_time=datetime(2024, 9, 5, 23, 45),
                price=680.0,
                flight_type="outbound",
                booking_status="booked"
            ),
            Flight(
                trip_id=barcelona_trip.id,
                airline="Iberia",
                flight_number="IB 6202",
                departure_airport="BCN",
                arrival_airport="JFK",
                departure_time=datetime(2024, 9, 9, 10, 15),
                arrival_time=datetime(2024, 9, 9, 13, 30),
                price=680.0,
                flight_type="return",
                booking_status="booked"
            )
        ]
        
        # Amsterdam flights (booked)
        amsterdam_flights = [
            Flight(
                trip_id=amsterdam_trip.id,
                airline="KLM",
                flight_number="KL 612",
                departure_airport="JFK",
                arrival_airport="AMS",
                departure_time=datetime(2024, 11, 20, 9, 45),
                arrival_time=datetime(2024, 11, 20, 22, 30),
                price=650.0,
                flight_type="outbound",
                booking_status="booked"
            ),
            Flight(
                trip_id=amsterdam_trip.id,
                airline="KLM",
                flight_number="KL 613",
                departure_airport="AMS",
                arrival_airport="JFK",
                departure_time=datetime(2024, 11, 24, 13, 20),
                arrival_time=datetime(2024, 11, 24, 15, 45),
                price=650.0,
                flight_type="return",
                booking_status="booked"
            )
        ]
        
        # Add all flights
        all_flights = rome_flights + barcelona_flights + amsterdam_flights
        for flight in all_flights:
            db.add(flight)
        db.commit()
        
        # Rome hotel (completed)
        rome_hotel = Hotel(
            trip_id=rome_trip.id,
            name="Hotel Artemide",
            address="Via Nazionale 22, Rome, Italy",
            room_type="Superior Double Room",
            check_in_date=datetime(2024, 2, 14, 15, 0),
            check_out_date=datetime(2024, 2, 18, 11, 0),
            price_per_night=120.0,
            total_nights=4,
            booking_status="completed"
        )
        
        # Barcelona hotel (booked)
        barcelona_hotel = Hotel(
            trip_id=barcelona_trip.id,
            name="Hotel Casa Fuster",
            address="Passeig de Gràcia 132, Barcelona, Spain",
            room_type="Deluxe Room",
            check_in_date=datetime(2024, 9, 5, 15, 0),
            check_out_date=datetime(2024, 9, 9, 11, 0),
            price_per_night=150.0,
            total_nights=4,
            booking_status="booked"
        )
        
        # Amsterdam hotel (booked)
        amsterdam_hotel = Hotel(
            trip_id=amsterdam_trip.id,
            name="Hotel Pulitzer Amsterdam",
            address="Prinsengracht 315-331, Amsterdam, Netherlands",
            room_type="Canal View Room",
            check_in_date=datetime(2024, 11, 20, 15, 0),
            check_out_date=datetime(2024, 11, 24, 11, 0),
            price_per_night=180.0,
            total_nights=4,
            booking_status="booked"
        )
        
        # Add all hotels
        all_hotels = [rome_hotel, barcelona_hotel, amsterdam_hotel]
        for hotel in all_hotels:
            db.add(hotel)
        db.commit()
        
        print("✅ Successfully added booked trip data for Sarah Johnson:")
        print(f"   - Rome trip (completed): {len(rome_activities)} activities, 2 flights, 1 hotel")
        print(f"   - Barcelona trip (booked): {len(barcelona_activities)} activities, 2 flights, 1 hotel")
        print(f"   - Amsterdam trip (booked): {len(amsterdam_activities)} activities, 2 flights, 1 hotel")
        print(f"   - Total: {len(all_activities)} activities, {len(all_flights)} flights, {len(all_hotels)} hotels")
        
    except Exception as e:
        print(f"❌ Error seeding Sarah's bookings: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_sarah_bookings()
