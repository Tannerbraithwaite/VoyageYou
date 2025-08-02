from sqlalchemy.orm import Session
from database import User, UserInterest, Trip, Activity, Flight, Hotel, Recommendation, ChatMessage
from schemas import UserCreate, TripCreate, ActivityCreate, FlightCreate, HotelCreate
from datetime import datetime, timedelta
from typing import List, Dict, Any
import random
import hashlib
import openai
import os

class UserService:
    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        # Hash the password
        hashed_password = hashlib.sha256(user_data.password.encode()).hexdigest()
        
        db_user = User(
            name=user_data.name,
            email=user_data.email,
            password=hashed_password,
            travel_style=user_data.travel_style,
            budget_range=user_data.budget_range,
            additional_info=user_data.additional_info
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def get_user(db: Session, user_id: int) -> User:
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User:
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        return db.query(User).filter(User.email == email, User.password == hashed_password).first()
    
    @staticmethod
    def update_user(db: Session, user_id: int, user_data: dict) -> User:
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user:
            for key, value in user_data.items():
                if hasattr(db_user, key):
                    setattr(db_user, key, value)
            db_user.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(db_user)
        return db_user
    
    @staticmethod
    def add_user_interests(db: Session, user_id: int, interests: List[str]) -> List[UserInterest]:
        # Remove existing interests
        db.query(UserInterest).filter(UserInterest.user_id == user_id).delete()
        
        # Add new interests
        user_interests = []
        for interest in interests:
            db_interest = UserInterest(user_id=user_id, interest=interest)
            db.add(db_interest)
            user_interests.append(db_interest)
        
        db.commit()
        return user_interests

class TripService:
    @staticmethod
    def create_trip(db: Session, trip_data: TripCreate, user_id: int) -> Trip:
        db_trip = Trip(
            user_id=user_id,
            destination=trip_data.destination,
            start_date=trip_data.start_date,
            end_date=trip_data.end_date,
            description=trip_data.description
        )
        db.add(db_trip)
        db.commit()
        db.refresh(db_trip)
        return db_trip
    
    @staticmethod
    def get_user_trips(db: Session, user_id: int) -> List[Trip]:
        return db.query(Trip).filter(Trip.user_id == user_id).all()
    
    @staticmethod
    def get_trip_with_details(db: Session, trip_id: int) -> Trip:
        return db.query(Trip).filter(Trip.id == trip_id).first()

class ActivityService:
    @staticmethod
    def create_activity(db: Session, activity_data: ActivityCreate, trip_id: int) -> Activity:
        db_activity = Activity(
            trip_id=trip_id,
            name=activity_data.name,
            description=activity_data.description,
            day_number=activity_data.day_number,
            time=activity_data.time,
            price=activity_data.price,
            activity_type=activity_data.activity_type
        )
        db.add(db_activity)
        db.commit()
        db.refresh(db_activity)
        return db_activity
    
    @staticmethod
    def get_trip_activities(db: Session, trip_id: int) -> List[Activity]:
        return db.query(Activity).filter(Activity.trip_id == trip_id).order_by(Activity.day_number, Activity.time).all()
    
    @staticmethod
    def update_activity_rating(db: Session, activity_id: int, rating: int) -> Activity:
        db_activity = db.query(Activity).filter(Activity.id == activity_id).first()
        if db_activity:
            db_activity.rating = rating
            db.commit()
            db.refresh(db_activity)
        return db_activity

class ItineraryService:
    @staticmethod
    def generate_itinerary(db: Session, description: str, user_id: int) -> Dict[str, Any]:
        """
        AI-powered itinerary generation based on user description and preferences
        """
        # Parse description to extract key information
        destination, duration, preferences = ItineraryService._parse_description(description)
        
        # Get user preferences
        user = UserService.get_user(db, user_id)
        user_interests = db.query(UserInterest).filter(UserInterest.user_id == user_id).all()
        interests = [interest.interest for interest in user_interests]
        
        # Generate trip dates (example: 3 days from now)
        start_date = datetime.utcnow() + timedelta(days=30)
        end_date = start_date + timedelta(days=duration)
        
        # Create trip
        trip_data = TripCreate(
            destination=destination,
            start_date=start_date,
            end_date=end_date,
            description=description
        )
        trip = TripService.create_trip(db, trip_data, user_id)
        
        # Generate activities based on destination and user preferences
        activities = ItineraryService._generate_activities(destination, duration, interests, user.travel_style, user.budget_range)
        
        # Create activities in database
        total_cost = 0
        bookable_cost = 0
        estimated_cost = 0
        
        for day_activities in activities:
            for activity_data in day_activities:
                activity = ActivityService.create_activity(db, activity_data, trip.id)
                total_cost += activity.price
                if activity.activity_type == 'bookable':
                    bookable_cost += activity.price
                else:
                    estimated_cost += activity.price
        
        # Update trip with total cost
        trip.total_cost = total_cost
        db.commit()
        
        return {
            "trip": trip,
            "activities": activities,
            "total_cost": total_cost,
            "bookable_cost": bookable_cost,
            "estimated_cost": estimated_cost
        }
    
    @staticmethod
    def _parse_description(description: str) -> tuple:
        """Parse natural language description to extract trip details"""
        # Simple parsing logic - in a real app, this would use NLP
        description_lower = description.lower()
        
        # Extract destination (simplified)
        destinations = ['paris', 'tokyo', 'barcelona', 'new york', 'london', 'rome']
        destination = 'Paris'  # default
        for dest in destinations:
            if dest in description_lower:
                destination = dest.title()
                break
        
        # Extract duration
        duration = 3  # default
        if '3 days' in description_lower or 'three days' in description_lower:
            duration = 3
        elif '5 days' in description_lower or 'five days' in description_lower:
            duration = 5
        elif '7 days' in description_lower or 'week' in description_lower:
            duration = 7
        
        # Extract preferences
        preferences = []
        if 'art' in description_lower or 'museum' in description_lower:
            preferences.append('art')
        if 'food' in description_lower or 'dining' in description_lower:
            preferences.append('food')
        if 'culture' in description_lower or 'history' in description_lower:
            preferences.append('culture')
        
        return destination, duration, preferences
    
    @staticmethod
    def _generate_activities(destination: str, duration: int, interests: List[str], travel_style: str, budget_level: str) -> List[List[ActivityCreate]]:
        """Generate activities based on destination and user preferences"""
        activities_by_day = []
        
        # Activity templates for different destinations
        activity_templates = {
            'Paris': {
                'art': [
                    {'name': 'Louvre Museum Visit', 'price': 18, 'type': 'bookable'},
                    {'name': 'Musée d\'Orsay', 'price': 16, 'type': 'bookable'},
                    {'name': 'Street Art Walking Tour', 'price': 25, 'type': 'bookable'},
                ],
                'food': [
                    {'name': 'French Cooking Class', 'price': 85, 'type': 'bookable'},
                    {'name': 'Wine Tasting Experience', 'price': 65, 'type': 'bookable'},
                    {'name': 'Local Bistro Dinner', 'price': 45, 'type': 'estimated'},
                ],
                'culture': [
                    {'name': 'Eiffel Tower Visit', 'price': 26, 'type': 'bookable'},
                    {'name': 'Notre-Dame Cathedral', 'price': 0, 'type': 'estimated'},
                    {'name': 'Seine River Cruise', 'price': 35, 'type': 'bookable'},
                ]
            },
            'Tokyo': {
                'art': [
                    {'name': 'TeamLab Digital Art Museum', 'price': 30, 'type': 'bookable'},
                    {'name': 'Traditional Calligraphy Class', 'price': 40, 'type': 'bookable'},
                ],
                'food': [
                    {'name': 'Sushi Making Workshop', 'price': 80, 'type': 'bookable'},
                    {'name': 'Ramen Tasting Tour', 'price': 35, 'type': 'estimated'},
                ],
                'culture': [
                    {'name': 'Senso-ji Temple Visit', 'price': 0, 'type': 'estimated'},
                    {'name': 'Traditional Tea Ceremony', 'price': 60, 'type': 'bookable'},
                ]
            }
        }
        
        # Get templates for destination
        templates = activity_templates.get(destination, activity_templates['Paris'])
        
        # Generate activities for each day
        for day in range(1, duration + 1):
            day_activities = []
            
            # Morning activity
            if 'art' in interests:
                art_activity = random.choice(templates['art'])
                day_activities.append(ActivityCreate(
                    name=art_activity['name'],
                    day_number=day,
                    time='10:00',
                    price=art_activity['price'],
                    activity_type=art_activity['type']
                ))
            
            # Afternoon activity
            if 'culture' in interests:
                culture_activity = random.choice(templates['culture'])
                day_activities.append(ActivityCreate(
                    name=culture_activity['name'],
                    day_number=day,
                    time='14:00',
                    price=culture_activity['price'],
                    activity_type=culture_activity['type']
                ))
            
            # Evening activity
            if 'food' in interests:
                food_activity = random.choice(templates['food'])
                day_activities.append(ActivityCreate(
                    name=food_activity['name'],
                    day_number=day,
                    time='18:00',
                    price=food_activity['price'],
                    activity_type=food_activity['type']
                ))
            
            # Add some default activities if not enough interests
            if len(day_activities) < 2:
                default_activity = random.choice(list(templates.values())[0])
                day_activities.append(ActivityCreate(
                    name=default_activity['name'],
                    day_number=day,
                    time='12:00',
                    price=default_activity['price'],
                    activity_type=default_activity['type']
                ))
            
            activities_by_day.append(day_activities)
        
        return activities_by_day

class RecommendationService:
    @staticmethod
    def generate_recommendations(db: Session, user_id: int) -> List[Recommendation]:
        """Generate personalized recommendations based on user profile and history"""
        user = UserService.get_user(db, user_id)
        user_interests = db.query(UserInterest).filter(UserInterest.user_id == user_id).all()
        interests = [interest.interest for interest in user_interests]
        
        # Get user's past trips
        past_trips = db.query(Trip).filter(Trip.user_id == user_id, Trip.status == 'completed').all()
        
        # Generate recommendations based on interests and travel history
        recommendations = []
        
        if 'art' in interests:
            recommendations.append(Recommendation(
                user_id=user_id,
                destination='Florence, Italy',
                reason='Based on your interest in art, you would love the Uffizi Gallery and Renaissance architecture',
                confidence_score=0.85,
                recommendation_type='trip'
            ))
        
        if 'food' in interests:
            recommendations.append(Recommendation(
                user_id=user_id,
                destination='Barcelona, Spain',
                reason='Perfect for food lovers with amazing tapas and Catalan cuisine',
                confidence_score=0.78,
                recommendation_type='trip'
            ))
        
        if 'culture' in interests:
            recommendations.append(Recommendation(
                user_id=user_id,
                destination='Kyoto, Japan',
                reason='Rich in cultural heritage with temples, gardens, and traditional experiences',
                confidence_score=0.82,
                recommendation_type='trip'
            ))
        
        # Add recommendations to database
        for rec in recommendations:
            db.add(rec)
        
        db.commit()
        return recommendations
    
    @staticmethod
    def get_user_recommendations(db: Session, user_id: int) -> List[Recommendation]:
        return db.query(Recommendation).filter(
            Recommendation.user_id == user_id,
            Recommendation.is_active == True
        ).all()

class ChatbotService:
    @staticmethod
    def setup_openai(api_key: str):
        """Setup OpenAI client with API key"""
        openai.api_key = api_key
    
    @staticmethod
    def get_chat_history(db: Session, user_id: int, limit: int = 10) -> List[ChatMessage]:
        """Get recent chat history for a user"""
        return db.query(ChatMessage).filter(
            ChatMessage.user_id == user_id
        ).order_by(ChatMessage.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def save_user_message(db: Session, user_id: int, message: str) -> ChatMessage:
        """Save a user message to the database"""
        chat_message = ChatMessage(
            user_id=user_id,
            message=message,
            is_bot=False
        )
        db.add(chat_message)
        db.commit()
        db.refresh(chat_message)
        return chat_message
    
    @staticmethod
    def save_bot_response(db: Session, user_id: int, response: str) -> ChatMessage:
        """Save a bot response to the database"""
        chat_message = ChatMessage(
            user_id=user_id,
            message="",
            is_bot=True,
            response=response
        )
        db.add(chat_message)
        db.commit()
        db.refresh(chat_message)
        return chat_message
    
    @staticmethod
    def generate_response(db: Session, user_id: int, message: str, api_key: str) -> str:
        """Generate a response using OpenAI API"""
        try:
            # Setup OpenAI
            ChatbotService.setup_openai(api_key)
            
            # Get user profile for context
            user = UserService.get_user(db, user_id)
            if not user:
                return "I'm sorry, I couldn't find your profile. Please try logging in again."
            
            # Get user's travel preferences and history
            user_interests = db.query(UserInterest).filter(UserInterest.user_id == user_id).all()
            user_trips = TripService.get_user_trips(db, user_id)
            
            # Build context for the AI
            context = f"""
            You are a helpful travel assistant for a user with the following profile:
            - Name: {user.name}
            - Travel Style: {user.travel_style}
            - Budget Range: {user.budget_range}
            - Additional Info: {user.additional_info}
            - Interests: {', '.join([interest.interest for interest in user_interests])}
            - Previous Trips: {len(user_trips)} trips
            
            The user is asking: {message}
            
            Please provide a helpful, friendly response that takes into account their travel preferences and history. 
            Keep responses concise but informative. If they're asking about travel planning, offer specific suggestions 
            based on their profile.
            """
            
            # Call OpenAI API
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful travel assistant. Provide friendly, informative responses about travel planning, destinations, and travel tips."},
                    {"role": "user", "content": context}
                ],
                max_tokens=300,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"Error generating chatbot response: {e}")
            # Provide helpful fallback responses when API is unavailable
            if "quota" in str(e).lower() or "billing" in str(e).lower():
                return "I'm currently experiencing high demand. Here are some travel tips based on your profile:\n\n• As a solo traveler with moderate budget, consider destinations like Portugal, Thailand, or Mexico\n• For art lovers, Florence and Barcelona are excellent choices\n• For food enthusiasts, try Tokyo, Bangkok, or Istanbul\n\nWould you like me to help you plan a specific trip?"
            else:
                return "I'm sorry, I'm having trouble processing your request right now. Please try again later."
    
    @staticmethod
    def process_message(db: Session, user_id: int, message: str, api_key: str) -> Dict[str, Any]:
        """Process a user message and return bot response"""
        # Save user message
        user_message = ChatbotService.save_user_message(db, user_id, message)
        
        # Generate bot response
        bot_response = ChatbotService.generate_response(db, user_id, message, api_key)
        
        # Save bot response
        bot_message = ChatbotService.save_bot_response(db, user_id, bot_response)
        
        return {
            "user_message": user_message,
            "bot_response": bot_message,
            "response_text": bot_response
        }
