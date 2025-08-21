#!/usr/bin/env python3
"""
Test script to check schema validation for multi-city itineraries
"""

from schemas import MultiCityItinerary, SingleCityItinerary, FlightInfo, HotelInfo, InterCityTransport, ItineraryDay, ItineraryActivity

def test_multi_city_schema():
    """Test if the MultiCityItinerary schema works correctly"""
    
    print("🧪 Testing Multi-City Schema Validation")
    print("=" * 50)
    
    try:
        # Create a multi-city itinerary
        multi_city = MultiCityItinerary(
            trip_type="multi_city",
            destinations=["Naples, Italy", "Rome, Italy"],
            duration="5 days",
            description="Multi-city trip to Naples and Rome",
            flights=[
                FlightInfo(
                    airline="United Airlines",
                    flight="UA 123",
                    departure="JFK → NAP",
                    time="10:30 AM - 12:45 PM",
                    price=600,
                    type="outbound"
                ),
                FlightInfo(
                    airline="United Airlines",
                    flight="UA 456",
                    departure="ROM → JFK",
                    time="2:00 PM - 5:30 PM",
                    price=600,
                    type="return"
                )
            ],
            hotels=[
                HotelInfo(
                    city="Naples, Italy",
                    name="Naples Downtown Hotel",
                    address="123 Via Roma, Naples, Italy",
                    check_in="July 15, 2024 - 3:00 PM",
                    check_out="July 17, 2024 - 11:00 AM",
                    room_type="Standard Room",
                    price=120,
                    total_nights=2
                ),
                HotelInfo(
                    city="Rome, Italy",
                    name="Rome Central Hotel",
                    address="456 Via del Corso, Rome, Italy",
                    check_in="July 17, 2024 - 3:00 PM",
                    check_out="July 20, 2024 - 11:00 AM",
                    room_type="Standard Room",
                    price=180,
                    total_nights=3
                )
            ],
            inter_city_transport=[
                InterCityTransport(
                    from_location="Naples, Italy",
                    to="Rome, Italy",
                    type="train",
                    carrier="Trenitalia",
                    departure_time="14:00",
                    arrival_time="16:00",
                    price=50,
                    description="High-speed train from Naples to Rome"
                )
            ],
            schedule=[
                ItineraryDay(
                    day=1,
                    date="July 15, 2024",
                    city="Naples, Italy",
                    activities=[
                        ItineraryActivity(
                            name="Naples City Tour",
                            time="10:30",
                            price=25,
                            type="bookable",
                            description="Explore the historic city center",
                            alternatives=[]
                        )
                    ]
                ),
                ItineraryDay(
                    day=2,
                    date="July 16, 2024",
                    city="Naples, Italy",
                    activities=[
                        ItineraryActivity(
                            name="Pompeii Visit",
                            time="09:00",
                            price=30,
                            type="bookable",
                            description="Ancient Roman ruins",
                            alternatives=[]
                        )
                    ]
                ),
                ItineraryDay(
                    day=3,
                    date="July 17, 2024",
                    city="Rome, Italy",
                    activities=[
                        ItineraryActivity(
                            name="Colosseum Tour",
                            time="10:00",
                            price=35,
                            type="bookable",
                            description="Ancient Roman amphitheater",
                            alternatives=[]
                        )
                    ]
                )
            ],
            total_cost=2000,
            bookable_cost=1500,
            estimated_cost=500
        )
        
        print("✅ Multi-city schema validation successful!")
        print(f"Trip type: {multi_city.trip_type}")
        print(f"Destinations: {multi_city.destinations}")
        print(f"Hotels: {len(multi_city.hotels)}")
        print(f"Transport: {len(multi_city.inter_city_transport)}")
        print(f"Schedule days: {len(multi_city.schedule)}")
        
        # Test serialization
        json_data = multi_city.model_dump()
        print(f"✅ Serialization successful: {len(json_data)} fields")
        
    except Exception as e:
        print(f"❌ Multi-city schema validation failed: {e}")
        import traceback
        traceback.print_exc()

def test_single_city_schema():
    """Test if the SingleCityItinerary schema works correctly"""
    
    print("\n🧪 Testing Single City Schema Validation")
    print("=" * 50)
    
    try:
        # Create a single city itinerary
        single_city = SingleCityItinerary(
            trip_type="single_city",
            destination="Paris, France",
            duration="3 days",
            description="Trip to Paris",
            flights=[
                FlightInfo(
                    airline="Air France",
                    flight="AF 123",
                    departure="JFK → CDG",
                    time="10:00 - 14:00",
                    price=600,
                    type="outbound"
                ),
                FlightInfo(
                    airline="Air France",
                    flight="AF 456",
                    departure="CDG → JFK",
                    time="16:00 - 20:00",
                    price=600,
                    type="return"
                )
            ],
            hotel=HotelInfo(
                name="Paris Hotel",
                address="123 Champs-Élysées, Paris",
                check_in="July 15, 2024 - 3:00 PM",
                check_out="July 18, 2024 - 11:00 AM",
                room_type="Standard Room",
                price=200,
                total_nights=3
            ),
            schedule=[
                ItineraryDay(
                    day=1,
                    date="July 15, 2024",
                    activities=[
                        ItineraryActivity(
                            name="Eiffel Tower Visit",
                            time="10:30",
                            price=25,
                            type="bookable",
                            description="Visit the iconic tower",
                            alternatives=[]
                        )
                    ]
                )
            ],
            total_cost=1500,
            bookable_cost=1200,
            estimated_cost=300
        )
        
        print("✅ Single city schema validation successful!")
        print(f"Trip type: {single_city.trip_type}")
        print(f"Destination: {single_city.destination}")
        print(f"Hotel: {single_city.hotel.name}")
        print(f"Schedule days: {len(single_city.schedule)}")
        
        # Test serialization
        json_data = single_city.model_dump()
        print(f"✅ Serialization successful: {len(json_data)} fields")
        
    except Exception as e:
        print(f"❌ Single city schema validation failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Starting Schema Validation Tests")
    print()
    
    test_multi_city_schema()
    test_single_city_schema()
    
    print()
    print("🏁 Schema tests completed!")
