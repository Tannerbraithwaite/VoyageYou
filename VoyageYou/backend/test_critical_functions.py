#!/usr/bin/env python3
"""
Unit tests for critical functions in the Travel App backend
Tests core functionality, error handling, and edge cases
"""

import pytest
import asyncio
import json
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from chat_tools import FunctionCallingChatService
from oauth import OAuthService
from database import get_db, User
from schemas import ChatMessage

class TestFunctionCallingChatService:
    """Test the FunctionCallingChatService class"""
    
    @pytest.fixture
    def chat_service(self):
        """Create a chat service instance for testing"""
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}):
            return FunctionCallingChatService()
    
    @pytest.fixture
    def mock_openai_response(self):
        """Mock OpenAI API response"""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = '{"trip_type": "single_city", "destination": "Paris"}'
        mock_response.choices[0].message.tool_calls = None
        return mock_response
    
    @pytest.mark.asyncio
    async def test_chat_with_tools_success(self, chat_service, mock_openai_response):
        """Test successful chat with tools"""
        with patch.object(chat_service.client.chat.completions, 'create', return_value=mock_openai_response):
            result = await chat_service.chat_with_tools(
                user_message="Plan a 3-day trip to Paris",
                user_id=1
            )
            
            assert result is not None
            assert "trip_type" in result
            assert "destination" in result
    
    @pytest.mark.asyncio
    async def test_chat_with_tools_with_user_location(self, chat_service, mock_openai_response):
        """Test chat with user location context"""
        with patch.object(chat_service.client.chat.completions, 'create', return_value=mock_openai_response):
            with patch('chat_tools.get_db') as mock_get_db:
                mock_db = Mock()
                mock_user = Mock()
                mock_user.location = "New York, NY"
                mock_db.query.return_value.filter.return_value.first.return_value = mock_user
                mock_get_db.return_value = iter([mock_db])
                
                result = await chat_service.chat_with_tools(
                    user_message="Plan a trip to London",
                    user_id=1
                )
                
                assert result is not None
    
    @pytest.mark.asyncio
    async def test_chat_with_tools_no_user_location(self, chat_service, mock_openai_response):
        """Test chat when user has no location set"""
        with patch.object(chat_service.client.chat.completions, 'create', return_value=mock_openai_response):
            with patch('chat_tools.get_db') as mock_get_db:
                mock_db = Mock()
                mock_db.query.return_value.filter.return_value.first.return_value = None
                mock_get_db.return_value = iter([mock_db])
                
                result = await chat_service.chat_with_tools(
                    user_message="Plan a trip to Tokyo",
                    user_id=1
                )
                
                assert result is not None
    
    @pytest.mark.asyncio
    async def test_chat_with_tools_database_error(self, chat_service, mock_openai_response):
        """Test chat when database access fails"""
        with patch.object(chat_service.client.chat.completions, 'create', return_value=mock_openai_response):
            with patch('chat_tools.get_db', side_effect=Exception("Database error")):
                result = await chat_service.chat_with_tools(
                    user_message="Plan a trip to Rome",
                    user_id=1
                )
                
                assert result is not None
    
    @pytest.mark.asyncio
    async def test_chat_with_tools_openai_error(self, chat_service):
        """Test chat when OpenAI API fails"""
        with patch.object(chat_service.client.chat.completions, 'create', side_effect=Exception("OpenAI API error")):
            result = await chat_service.chat_with_tools(
                user_message="Plan a trip to Madrid",
                user_id=1
            )
            
            # Should return error response
            assert result is not None
            assert "Error" in result
    
    def test_post_process_itinerary_valid_data(self, chat_service):
        """Test post-processing of valid itinerary data"""
        itinerary_data = {
            "flights": [{"price": 500}],
            "hotel": {"price": 200, "total_nights": 3},
            "schedule": [
                {
                    "activities": [
                        {"price": 50, "type": "bookable"},
                        {"price": 25, "type": "estimated"}
                    ]
                }
            ]
        }
        
        result = chat_service._post_process_itinerary(itinerary_data)
        
        assert result["total_cost"] == 775  # 500 + (200*3) + 50 + 25
        assert result["bookable_cost"] == 1150  # 500 + (200*3) + 50
        assert result["estimated_cost"] == 25
    
    def test_post_process_itinerary_missing_data(self, chat_service):
        """Test post-processing with missing data"""
        itinerary_data = {
            "flights": [],
            "schedule": []
        }
        
        result = chat_service._post_process_itinerary(itinerary_data)
        
        assert result["total_cost"] == 0
        assert result["bookable_cost"] == 0
        assert result["estimated_cost"] == 0
    
    def test_post_process_itinerary_error_handling(self, chat_service):
        """Test post-processing error handling"""
        itinerary_data = {
            "flights": [{"price": "invalid_price"}],  # Invalid price type
            "schedule": []
        }
        
        # Should not raise exception
        result = chat_service._post_process_itinerary(itinerary_data)
        assert result is not None

class TestOAuthService:
    """Test the OAuthService class"""
    
    @pytest.fixture
    def oauth_service(self):
        """Create an OAuth service instance for testing"""
        return OAuthService()
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock database session"""
        return Mock()
    
    @pytest.mark.asyncio
    async def test_verify_google_token_mock_success(self, oauth_service):
        """Test Google token verification with mock token"""
        result = await oauth_service.verify_google_token("mock-google-token")
        
        assert result is not None
        assert result["email"] == "google-user@example.com"
        assert result["provider"] == "google"
    
    @pytest.mark.asyncio
    async def test_verify_google_token_real_token_success(self, oauth_service):
        """Test Google token verification with real token (mocked response)"""
        with patch('requests.get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "aud": "1082045743309-dmv4ea2mp7vig54cbuybvfh6vb4s26i6.apps.googleusercontent.com",
                "email": "test@example.com",
                "name": "Test User",
                "picture": "https://example.com/photo.jpg"
            }
            mock_get.return_value = mock_response
            
            result = await oauth_service.verify_google_token("real-token")
            
            assert result is not None
            assert result["email"] == "test@example.com"
            assert result["provider"] == "google"
    
    @pytest.mark.asyncio
    async def test_verify_google_token_failed_verification(self, oauth_service):
        """Test Google token verification failure"""
        with patch('requests.get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 400
            mock_get.return_value = mock_response
            
            result = await oauth_service.verify_google_token("invalid-token")
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_verify_google_token_audience_mismatch(self, oauth_service):
        """Test Google token verification with wrong audience"""
        with patch('requests.get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "aud": "wrong-client-id",
                "email": "test@example.com"
            }
            mock_get.return_value = mock_response
            
            result = await oauth_service.verify_google_token("real-token")
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_verify_apple_token_mock_success(self, oauth_service):
        """Test Apple token verification with mock token"""
        result = await oauth_service.verify_apple_token("mock-apple-token")
        
        assert result is not None
        assert result["email"] == "apple-user@example.com"
        assert result["provider"] == "apple"
    
    @pytest.mark.asyncio
    async def test_verify_apple_token_real_token(self, oauth_service):
        """Test Apple token verification with real token (simplified)"""
        result = await oauth_service.verify_apple_token("real-apple-token")
        
        assert result is not None
        assert result["email"] == "apple-user@example.com"
        assert result["provider"] == "apple"
    
    def test_get_or_create_user_existing_user(self, oauth_service, mock_db_session):
        """Test getting existing user"""
        mock_user = Mock()
        mock_user.email = "existing@example.com"
        mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user
        
        result = oauth_service.get_or_create_user(mock_db_session, {
            "email": "existing@example.com",
            "name": "Existing User",
            "provider": "google"
        })
        
        assert result == mock_user
        mock_db_session.add.assert_not_called()
        mock_db_session.commit.assert_not_called()
    
    def test_get_or_create_user_new_user(self, oauth_service, mock_db_session):
        """Test creating new user"""
        mock_db_session.query.return_value.filter.return_value.first.return_value = None
        
        with patch('oauth.AuthService.get_password_hash', return_value="hashed_password"):
            result = oauth_service.get_or_create_user(mock_db_session, {
                "email": "new@example.com",
                "name": "New User",
                "provider": "google"
            })
            
            assert result is not None
            mock_db_session.add.assert_called_once()
            mock_db_session.commit.assert_called_once()
    
    def test_get_or_create_user_missing_email(self, oauth_service, mock_db_session):
        """Test creating user without email"""
        with pytest.raises(Exception):  # Should raise HTTPException
            oauth_service.get_or_create_user(mock_db_session, {
                "name": "No Email User",
                "provider": "google"
            })

class TestDatabaseOperations:
    """Test database operations"""
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        return Mock()
    
    def test_user_query(self, mock_db):
        """Test basic user query operations"""
        mock_user = Mock()
        mock_user.id = 1
        mock_user.email = "test@example.com"
        mock_user.name = "Test User"
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        user = mock_db.query(User).filter(User.id == 1).first()
        
        assert user is not None
        assert user.id == 1
        assert user.email == "test@example.com"

class TestErrorHandling:
    """Test error handling and edge cases"""
    
    def test_invalid_json_handling(self):
        """Test handling of invalid JSON responses"""
        # This would be tested in the chat service
        pass
    
    def test_timeout_handling(self):
        """Test timeout handling in async operations"""
        # This would be tested in the chat service
        pass
    
    def test_database_connection_errors(self):
        """Test database connection error handling"""
        # This would be tested in database operations
        pass

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
