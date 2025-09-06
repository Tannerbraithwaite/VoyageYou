# Voyage Yo Backend

A robust FastAPI backend with SQLite database for the AI-powered travel planning application.

## 🚀 Features

- **User Management**: Complete user profiles with travel preferences and interests
- **Trip Planning**: AI-powered itinerary generation from natural language descriptions
- **Activity Management**: Bookable and estimated activities with ratings
- **Flight & Hotel Booking**: Integrated booking system
- **Personalized Recommendations**: AI-driven suggestions based on user preferences
- **Database Persistence**: SQLite database with SQLAlchemy ORM
- **RESTful API**: Comprehensive API endpoints with proper validation

## 🛠️ Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM
- **SQLite**: Lightweight, serverless database
- **Pydantic**: Data validation using Python type annotations
- **Uvicorn**: ASGI server for running FastAPI applications

## 📋 Prerequisites

- Python 3.8+
- pip (Python package installer)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Initialize Database

```bash
# Create database tables
python -c "from database import create_tables; create_tables()"

# Seed with sample data
python seed_data.py
```

### 3. Run the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## 📚 API Documentation

Once the server is running, you can access:

- **Interactive API Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

## 🗄️ Database Schema

### Core Tables

#### Users
- `id`: Primary key
- `name`: User's full name
- `email`: Unique email address
- `travel_style`: solo, couple, family, group
- `budget_level`: budget, moderate, luxury
- `additional_info`: Natural language preferences
- `created_at`, `updated_at`: Timestamps

#### UserInterests
- `id`: Primary key
- `user_id`: Foreign key to Users
- `interest`: Interest category (art, food, culture, etc.)

#### Trips
- `id`: Primary key
- `user_id`: Foreign key to Users
- `destination`: Trip destination
- `start_date`, `end_date`: Trip dates
- `description`: Trip description
- `total_cost`: Total trip cost
- `status`: planned, booked, completed

#### Activities
- `id`: Primary key
- `trip_id`: Foreign key to Trips
- `name`: Activity name
- `description`: Activity description
- `day_number`: Day of trip
- `time`: Activity time
- `price`: Activity cost
- `activity_type`: bookable or estimated
- `booking_status`: not_booked, booked, completed
- `rating`: 1-5 star rating

#### Flights
- `id`: Primary key
- `trip_id`: Foreign key to Trips
- `airline`: Airline name
- `flight_number`: Flight number
- `departure_airport`, `arrival_airport`: Airport codes
- `departure_time`, `arrival_time`: Flight times
- `price`: Flight cost
- `flight_type`: outbound or return
- `booking_status`: Booking status

#### Hotels
- `id`: Primary key
- `trip_id`: Foreign key to Trips
- `name`: Hotel name
- `address`: Hotel address
- `room_type`: Type of room
- `check_in_date`, `check_out_date`: Stay dates
- `price_per_night`: Cost per night
- `total_nights`: Number of nights
- `booking_status`: Booking status

#### Recommendations
- `id`: Primary key
- `user_id`: Foreign key to Users
- `destination`: Recommended destination
- `reason`: Why this destination is recommended
- `confidence_score`: 0.0 to 1.0 confidence level
- `recommendation_type`: trip, activity, hotel
- `is_active`: Whether recommendation is active

## 🔌 API Endpoints

### Users
- `POST /users/` - Create new user
- `GET /users/{user_id}` - Get user by ID
- `PUT /users/{user_id}` - Update user profile
- `POST /users/{user_id}/interests/` - Update user interests
- `GET /users/{user_id}/profile` - Get complete user profile

### Trips
- `POST /trips/` - Create new trip
- `GET /trips/{trip_id}` - Get trip with all details
- `GET /users/{user_id}/trips/` - Get all user trips

### Activities
- `POST /trips/{trip_id}/activities/` - Create activity for trip
- `GET /trips/{trip_id}/activities/` - Get all trip activities
- `PUT /activities/{activity_id}/rating/` - Update activity rating

### Itinerary Generation
- `POST /itinerary/` - Generate AI-powered itinerary

### Recommendations
- `POST /users/{user_id}/recommendations/generate/` - Generate recommendations
- `GET /users/{user_id}/recommendations/` - Get user recommendations

### Alternative Activities
- `GET /activities/{activity_id}/alternatives/` - Get activity alternatives

## 🤖 AI Features

### Natural Language Processing
The backend includes intelligent parsing of natural language trip descriptions to extract:
- Destination
- Duration
- Travel preferences
- Budget considerations

### Personalized Recommendations
The system generates recommendations based on:
- User interests and preferences
- Travel history
- Budget level
- Travel style

### Smart Itinerary Generation
Creates detailed itineraries with:
- Day-by-day schedules
- Activity categorization (bookable vs estimated)
- Cost breakdowns
- Alternative suggestions

## 🧪 Testing

### Sample Data
The `seed_data.py` script creates:
- 3 sample users with different travel styles
- Multiple trips with activities
- Sample flights and hotels
- Personalized recommendations

### API Testing
You can test the API using:
- Interactive docs at `/docs`
- curl commands
- Postman or similar tools

## 🔧 Configuration

### Environment Variables
Create a `.env` file for configuration:
```env
DATABASE_URL=sqlite:///./travel_app.db
DEBUG=True
```

### Database Configuration
The default SQLite database is stored in `travel_app.db`. For production, consider:
- PostgreSQL for better performance
- Database migrations with Alembic
- Connection pooling

## 🚀 Deployment

### Development
```bash
uvicorn main:app --reload
```

### Production
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker (Optional)
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📝 License

This project is for demonstration purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or issues, please refer to the API documentation or create an issue in the repository. 