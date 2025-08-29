import requests
import json
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from database import User, get_db
from sqlalchemy.orm import Session
from auth import AuthService
import os

# OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "1082045743309-dmv4ea2mp7vig54cbuybvfh6vb4s26i6.apps.googleusercontent.com")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "your-google-client-secret")
APPLE_CLIENT_ID = os.getenv("APPLE_CLIENT_ID", "your-apple-client-id")
APPLE_TEAM_ID = os.getenv("APPLE_TEAM_ID", "your-apple-team-id")
APPLE_KEY_ID = os.getenv("APPLE_KEY_ID", "your-apple-key-id")

class OAuthService:
    @staticmethod
    async def verify_google_token(id_token: str) -> Optional[Dict[str, Any]]:
        """Verify Google ID token and return user info"""
        try:
            # For demo purposes, accept mock tokens
            if id_token == "mock-google-token":
                return {
                    "email": "google-user@example.com",
                    "name": "Google User",
                    "picture": "https://via.placeholder.com/150",
                    "provider": "google"
                }
            
            # Verify the token with Google
            response = requests.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
            )
            
            if response.status_code != 200:
                # Google token verification failed
                return None
                
            token_info = response.json()
            # Google token info retrieved
            
            # Verify the token is for our app
            if token_info.get("aud") != GOOGLE_CLIENT_ID:
                # Token audience mismatch
                return None
                
            return {
                "email": token_info.get("email"),
                "name": token_info.get("name"),
                "picture": token_info.get("picture"),
                "provider": "google"
            }
        except Exception as e:
            # Google token verification error
            return None

    @staticmethod
    async def verify_apple_token(id_token: str) -> Optional[Dict[str, Any]]:
        """Verify Apple ID token and return user info"""
        try:
            # For demo purposes, accept mock tokens
            if id_token == "mock-apple-token":
                return {
                    "email": "apple-user@example.com",
                    "name": "Apple User",
                    "provider": "apple"
                }
            
            # For Apple, we would need to verify the JWT token
            # This is a simplified implementation
            # In production, you'd need to verify the JWT signature with Apple's public keys
            
            # For demo purposes, we'll assume the token is valid
            # In real implementation, you'd decode and verify the JWT
            return {
                "email": "apple-user@example.com",  # Would be extracted from JWT
                "name": "Apple User",  # Would be extracted from JWT
                "provider": "apple"
            }
        except Exception as e:
            # Apple token verification error
            return None

    @staticmethod
    def get_or_create_user(db: Session, oauth_user: Dict[str, Any]) -> User:
        """Get existing user or create new user from OAuth data"""
        email = oauth_user.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is required from OAuth provider"
            )
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            return user
        
        # Create new user
        user = User(
            name=oauth_user.get("name", "OAuth User"),
            email=email,
            password=AuthService.get_password_hash("oauth-user-password"),  # Placeholder password
            travel_style="solo",  # Default values
            budget_range="moderate",
            additional_info=f"Signed up via {oauth_user.get('provider', 'OAuth')}"
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user

    @staticmethod
    async def handle_google_oauth(id_token: str, db: Session) -> Dict[str, Any]:
        """Handle Google OAuth login"""
        oauth_user = await OAuthService.verify_google_token(id_token)
        
        if not oauth_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token"
            )
        
        user = OAuthService.get_or_create_user(db, oauth_user)
        
        # Create tokens
        access_token = AuthService.create_access_token(data={"sub": str(user.id)})
        refresh_token = AuthService.create_refresh_token(data={"sub": str(user.id)})
        
        return {
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    @staticmethod
    async def handle_apple_oauth(id_token: str, db: Session) -> Dict[str, Any]:
        """Handle Apple OAuth login"""
        oauth_user = await OAuthService.verify_apple_token(id_token)
        
        if not oauth_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Apple token"
            )
        
        user = OAuthService.get_or_create_user(db, oauth_user)
        
        # Create tokens
        access_token = AuthService.create_access_token(data={"sub": str(user.id)})
        refresh_token = AuthService.create_refresh_token(data={"sub": str(user.id)})
        
        return {
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        } 