import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app
import json
from datetime import datetime, timedelta

client = TestClient(app)

class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_signup_success(self):
        """Test successful user signup"""
        signup_data = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "TestPass123!"
        }
        
        with patch('main.AuthService.get_password_hash') as mock_hash:
            mock_hash.return_value = "hashed_password"
            
            response = client.post("/auth/signup", json=signup_data)
            
            assert response.status_code == 201
            data = response.json()
            assert "message" in data
            assert "user_id" in data
            assert "email" in data
    
    def test_signup_invalid_password(self):
        """Test signup with invalid password"""
        signup_data = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "weak"
        }
        
        response = client.post("/auth/signup", json=signup_data)
        assert response.status_code == 422
    
    def test_login_success(self):
        """Test successful login"""
        login_data = {
            "email": "test@example.com",
            "password": "TestPass123!"
        }
        
        with patch('main.AuthService.authenticate_user') as mock_auth:
            mock_user = MagicMock()
            mock_user.id = 1
            mock_user.email = "test@example.com"
            mock_user.name = "Test User"
            mock_auth.return_value = mock_user
            
            with patch('main.AuthService.create_access_token') as mock_token:
                mock_token.return_value = "test_token"
                
                response = client.post("/auth/login", json=login_data)
                
                assert response.status_code == 200
                data = response.json()
                assert "access_token" in data
                assert "refresh_token" in data
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        login_data = {
            "email": "test@example.com",
            "password": "wrongpassword"
        }
        
        with patch('main.AuthService.authenticate_user') as mock_auth:
            mock_auth.return_value = None
            
            response = client.post("/auth/login", json=login_data)
            assert response.status_code == 401

class TestUserManagement:
    """Test user management endpoints"""
    
    def test_get_user_profile(self):
        """Test getting user profile"""
        with patch('main.get_current_user') as mock_user:
            mock_user.return_value = MagicMock(id=1, name="Test User", email="test@example.com")
            
            response = client.get("/users/1")
            assert response.status_code == 200
    
    def test_update_user_profile(self):
        """Test updating user profile"""
        update_data = {
            "name": "Updated Name",
            "travel_style": "adventure",
            "budget_range": "moderate"
        }
        
        with patch('main.get_current_user') as mock_user:
            mock_user.return_value = MagicMock(id=1)
            
            response = client.put("/users/1", json=update_data)
            assert response.status_code == 200
    
    def test_add_user_interests(self):
        """Test adding user interests"""
        interests_data = {
            "interests": ["adventure", "culture", "food"]
        }
        
        with patch('main.get_current_user') as mock_user:
            mock_user.return_value = MagicMock(id=1)
            
            response = client.post("/users/1/interests/", json=interests_data)
            assert response.status_code == 200

class TestTripManagement:
    """Test trip management endpoints"""
    
    def test_create_trip(self):
        """Test creating a new trip"""
        trip_data = {
            "destination": "Paris, France",
            "start_date": "2024-07-15",
            "end_date": "2024-07-20",
            "budget": 2500,
            "travel_style": "cultural"
        }
        
        with patch('main.get_current_user') as mock_user:
            mock_user.return_value = MagicMock(id=1)
            
            response = client.post("/trips/", json=trip_data)
            assert response.status_code == 201
    
    def test_get_trip_details(self):
        """Test getting trip details"""
        with patch('main.get_current_user') as mock_user:
            mock_user.return_value = MagicMock(id=1)
            
            response = client.get("/trips/1")
            assert response.status_code == 200
    
    def test_get_user_trips(self):
        """Test getting user's trips"""
        with patch('main.get_current_user') as mock_user:
            mock_user.return_value = MagicMock(id=1)
            
            response = client.get("/users/1/trips/")
            assert response.status_code == 200

class TestItineraryPlanning:
    """Test itinerary planning endpoints"""
    
    def test_create_itinerary(self):
        """Test creating an itinerary"""
        itinerary_data = {
            "destination": "Paris, France",
            "duration": "5 days",
            "travel_style": "cultural",
            "budget": 2500,
            "preferences": ["museums", "food", "architecture"]
        }
        
        with patch('main.get_current_user') as mock_user:
            mock_user.return_value = MagicMock(id=1)
            
            response = client.post("/itinerary/", json=itinerary_data)
            assert response.status_code == 200
    
    def test_generate_recommendations(self):
        """Test generating travel recommendations"""
        with patch('main.get_current_user') as mock_user:
            mock_user.return_value = MagicMock(id=1)
            
            response = client.post("/users/1/recommendations/generate/")
            assert response.status_code == 200
    
    def test_get_recommendations(self):
        """Test getting user recommendations"""
        with patch('main.get_current_user') as mock_user:
            mock_user.return_value = MagicMock(id=1)
            
            response = client.get("/users/1/recommendations/")
            assert response.status_code == 200

class TestSearchServices:
    """Test search and API service endpoints"""
    
    def test_flight_search(self):
        """Test flight search"""
        params = {
            "origin": "JFK",
            "destination": "CDG",
            "departure_date": "2024-07-15",
            "return_date": "2024-07-20",
            "passengers": 1
        }
        
        response = client.get("/flights/search", params=params)
        assert response.status_code == 200
    
    def test_hotel_search(self):
        """Test hotel search"""
        params = {
            "destination": "Paris",
            "check_in": "2024-07-15",
            "check_out": "2024-07-20",
            "guests": 2
        }
        
        response = client.get("/hotels/search", params=params)
        assert response.status_code == 200
    
    def test_events_search(self):
        """Test events search"""
        params = {
            "location": "Paris",
            "date": "2024-07-15"
        }
        
        response = client.get("/events/search", params=params)
        assert response.status_code == 200

class TestBookingSystem:
    """Test booking system endpoints"""
    
    def test_create_booking(self):
        """Test creating a booking"""
        booking_data = {
            "trip_type": "flight",
            "details": {
                "flight_number": "AF123",
                "departure": "JFK",
                "arrival": "CDG",
                "date": "2024-07-15"
            },
            "traveler_info": {
                "name": "Test User",
                "email": "test@example.com"
            }
        }
        
        with patch('main.get_current_user') as mock_user:
            mock_user.return_value = MagicMock(id=1)
            
            response = client.post("/api/bookings/create", json=booking_data)
            assert response.status_code == 200
    
    def test_get_booking_details(self):
        """Test getting booking details"""
        with patch('main.get_current_user') as mock_user:
            mock_user.return_value = MagicMock(id=1)
            
            response = client.get("/api/bookings/1")
            assert response.status_code == 200
    
    def test_cancel_booking(self):
        """Test canceling a booking"""
        with patch('main.get_current_user') as mock_user:
            mock_user.return_value = MagicMock(id=1)
            
            response = client.post("/api/bookings/1/cancel")
            assert response.status_code == 200

class TestEnhancedAPIs:
    """Test enhanced API endpoints"""
    
    def test_enhanced_flight_search(self):
        """Test enhanced flight search"""
        flight_data = {
            "origin": "JFK",
            "destination": "CDG",
            "departure_date": "2024-07-15",
            "return_date": "2024-07-20",
            "passengers": 1,
            "preferences": {
                "airline": "Air France",
                "class": "economy"
            }
        }
        
        response = client.post("/api/flights/enhanced", json=flight_data)
        assert response.status_code == 200
    
    def test_enhanced_hotel_search(self):
        """Test enhanced hotel search"""
        hotel_data = {
            "destination": "Paris",
            "check_in": "2024-07-15",
            "check_out": "2024-07-20",
            "guests": 2,
            "preferences": {
                "stars": 4,
                "amenities": ["wifi", "breakfast"]
            }
        }
        
        response = client.post("/api/hotels/enhanced", json=hotel_data)
        assert response.status_code == 200

class TestExportAndUtilities:
    """Test export and utility endpoints"""
    
    def test_export_itinerary(self):
        """Test exporting itinerary"""
        export_data = {
            "itinerary_data": {
                "destination": "Paris",
                "duration": "5 days",
                "activities": []
            },
            "email_pdf": True
        }
        
        with patch('main.get_current_user') as mock_user:
            mock_user.return_value = MagicMock(id=1)
            
            response = client.post("/itinerary/export", json=export_data)
            assert response.status_code == 200
    
    def test_get_chat_history(self):
        """Test getting chat history"""
        with patch('main.get_current_user') as mock_user:
            mock_user.return_value = MagicMock(id=1)
            
            response = client.get("/users/1/chat/history/")
            assert response.status_code == 200
    
    def test_clear_chat_history(self):
        """Test clearing chat history"""
        with patch('main.get_current_user') as mock_user:
            mock_user.return_value = MagicMock(id=1)
            
            response = client.delete("/chat/1/clear")
            assert response.status_code == 200

class TestErrorHandling:
    """Test error handling scenarios"""
    
    def test_invalid_endpoint(self):
        """Test invalid endpoint returns 404"""
        response = client.get("/invalid/endpoint")
        assert response.status_code == 404
    
    def test_unauthorized_access(self):
        """Test unauthorized access returns 401"""
        response = client.get("/users/1")
        assert response.status_code == 401
    
    def test_invalid_json(self):
        """Test invalid JSON returns 422"""
        response = client.post("/auth/login", data="invalid json")
        assert response.status_code == 422

class TestHealthAndMonitoring:
    """Test health and monitoring endpoints"""
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/healthz")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
    
    def test_readiness_check(self):
        """Test readiness check endpoint"""
        response = client.get("/readyz")
        assert response.status_code == 200
        assert response.json()["ready"] is True
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        assert "TravelApp API is running" in response.json()["message"]

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
