# Travel App Demo

A modern travel planning application built with React Native (Expo) frontend and Python FastAPI backend.

## Features

- **Natural Language Trip Planning**: Describe your trip in natural language and get personalized itineraries
- **Smart Scheduling**: Automatic scheduling with flight, hotel, and activity recommendations
- **Personalized Recommendations**: AI-powered suggestions based on your travel preferences
- **User Profiles**: Save your travel preferences and get personalized recommendations
- **Authentication**: Secure login/signup system with user management
- **Modern UI**: Sleek dark theme with purple-blue accents

## Tech Stack

### Frontend
- **React Native** with Expo
- **Expo Router** for navigation
- **TypeScript** for type safety
- **Modern UI** with dark theme and custom styling

### Backend
- **Python FastAPI** for high-performance API
- **SQLAlchemy** ORM for database management
- **SQLite** for lightweight database
- **Pydantic** for data validation
- **SHA256** password hashing for security

## Project Structure

```
TravelAppDemo/
├── frontend/                 # React Native Expo app
│   ├── app/                 # Expo Router pages
│   │   ├── (tabs)/         # Main app tabs
│   │   └── auth/           # Authentication pages
│   ├── components/          # Reusable components
│   └── assets/             # Images and fonts
├── backend/                 # Python FastAPI server
│   ├── database.py         # SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas
│   ├── services.py         # Business logic
│   ├── main.py             # FastAPI app
│   └── seed_data.py        # Sample data
└── README.md               # This file
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Python 3.7+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd TravelAppDemo/backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Initialize the database:
```bash
python3 -c "from database import create_tables; create_tables()"
python3 seed_data.py
```

4. Start the backend server:
```bash
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd TravelAppDemo/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open the app:
- **Web**: Press `w` to open in browser
- **iOS**: Press `i` to open in iOS simulator
- **Android**: Press `a` to open in Android emulator

## API Endpoints

### Authentication
- `POST /auth/signup` - Create new user account
- `POST /auth/login` - User login

### User Management
- `GET /users/{user_id}` - Get user profile
- `PUT /users/{user_id}` - Update user profile
- `POST /users/{user_id}/interests/` - Update user interests

### Trips & Activities
- `GET /users/{user_id}/trips/` - Get user trips
- `POST /trips/` - Create new trip
- `GET /trips/{trip_id}/activities/` - Get trip activities
- `POST /activities/{activity_id}/rating/` - Rate activity

### Recommendations
- `POST /users/{user_id}/recommendations/generate/` - Generate recommendations
- `GET /users/{user_id}/recommendations/` - Get user recommendations

## Features in Detail

### 1. Natural Language Trip Planning
Users can describe their desired trip in natural language, and the app generates personalized itineraries with:
- Flight recommendations
- Hotel suggestions
- Activity scheduling
- Cost estimates

### 2. Smart Scheduling
The app distinguishes between:
- **Bookable items**: Flights, hotels, tickets (can be purchased)
- **Estimated items**: Restaurants, shopping, activities (estimated costs)

### 3. User Profiles
Users can set:
- Travel style (solo, couple, family, group)
- Budget level (budget, moderate, luxury)
- Interests (art, food, culture, nature, etc.)
- Additional preferences in natural language

### 4. Personalized Recommendations
The app learns from user preferences and provides:
- Trip suggestions based on interests
- Activity recommendations
- Budget-appropriate options

## Development

### Database Schema
The app uses SQLite with the following main tables:
- `users` - User profiles and preferences
- `trips` - User trips and itineraries
- `activities` - Trip activities and ratings
- `flights` - Flight information
- `hotels` - Hotel bookings
- `recommendations` - Personalized suggestions

### Adding New Features
1. Update database models in `backend/database.py`
2. Create Pydantic schemas in `backend/schemas.py`
3. Add business logic in `backend/services.py`
4. Create API endpoints in `backend/main.py`
5. Update frontend components as needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for demo purposes only.

## Support

For questions or issues, please open an issue on GitHub.
