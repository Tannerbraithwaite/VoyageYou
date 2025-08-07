import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from models import User, ChatMessage
from unittest.mock import MagicMock

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    """Override get_db for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

class TestDatabase:
    """Test suite for database operations"""
    
    def setup_method(self):
        """Set up test database"""
        Base.metadata.create_all(bind=engine)
    
    def teardown_method(self):
        """Clean up test database"""
        Base.metadata.drop_all(bind=engine)
    
    def test_create_user(self):
        """Test creating a user"""
        db = TestingSessionLocal()
        try:
            user = User(
                username="testuser",
                email="test@example.com",
                hashed_password="hashed_password"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            assert user.id is not None
            assert user.username == "testuser"
            assert user.email == "test@example.com"
        finally:
            db.close()
    
    def test_create_chat_message(self):
        """Test creating a chat message"""
        db = TestingSessionLocal()
        try:
            # Create user first
            user = User(
                username="testuser",
                email="test@example.com",
                hashed_password="hashed_password"
            )
            db.add(user)
            db.commit()
            
            # Create chat message
            message = ChatMessage(
                user_id=user.id,
                message="Test message",
                response="Test response",
                is_bot=True
            )
            db.add(message)
            db.commit()
            db.refresh(message)
            
            assert message.id is not None
            assert message.user_id == user.id
            assert message.message == "Test message"
            assert message.response == "Test response"
            assert message.is_bot is True
        finally:
            db.close()
    
    def test_user_chat_messages_relationship(self):
        """Test user-chat messages relationship"""
        db = TestingSessionLocal()
        try:
            # Create user
            user = User(
                username="testuser",
                email="test@example.com",
                hashed_password="hashed_password"
            )
            db.add(user)
            db.commit()
            
            # Create multiple chat messages
            messages = [
                ChatMessage(
                    user_id=user.id,
                    message="Message 1",
                    response="Response 1",
                    is_bot=True
                ),
                ChatMessage(
                    user_id=user.id,
                    message="Message 2",
                    response="Response 2",
                    is_bot=False
                )
            ]
            
            for message in messages:
                db.add(message)
            db.commit()
            
            # Query user and check messages
            user = db.query(User).filter(User.username == "testuser").first()
            assert len(user.chat_messages) == 2
            assert user.chat_messages[0].message == "Message 1"
            assert user.chat_messages[1].message == "Message 2"
        finally:
            db.close()

class TestDatabaseDependencies:
    """Test suite for database dependencies"""
    
    def test_get_db(self):
        """Test get_db dependency"""
        db_generator = get_db()
        db = next(db_generator)
        
        assert db is not None
        # Clean up
        try:
            next(db_generator)
        except StopIteration:
            pass

class TestDatabaseModels:
    """Test suite for database models"""
    
    def test_user_model(self):
        """Test User model fields"""
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password="hashed_password"
        )
        
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.hashed_password == "hashed_password"
        assert user.is_active is True  # Default value
    
    def test_chat_message_model(self):
        """Test ChatMessage model fields"""
        message = ChatMessage(
            user_id=1,
            message="Test message",
            response="Test response",
            is_bot=True
        )
        
        assert message.user_id == 1
        assert message.message == "Test message"
        assert message.response == "Test response"
        assert message.is_bot is True
        assert message.created_at is not None  # Auto-generated

class TestDatabaseOperations:
    """Test suite for database operations"""
    
    def test_user_crud_operations(self):
        """Test CRUD operations for User model"""
        db = TestingSessionLocal()
        try:
            # Create
            user = User(
                username="testuser",
                email="test@example.com",
                hashed_password="hashed_password"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            user_id = user.id
            
            # Read
            retrieved_user = db.query(User).filter(User.id == user_id).first()
            assert retrieved_user is not None
            assert retrieved_user.username == "testuser"
            
            # Update
            retrieved_user.username = "updateduser"
            db.commit()
            db.refresh(retrieved_user)
            assert retrieved_user.username == "updateduser"
            
            # Delete
            db.delete(retrieved_user)
            db.commit()
            
            # Verify deletion
            deleted_user = db.query(User).filter(User.id == user_id).first()
            assert deleted_user is None
        finally:
            db.close()
    
    def test_chat_message_crud_operations(self):
        """Test CRUD operations for ChatMessage model"""
        db = TestingSessionLocal()
        try:
            # Create user first
            user = User(
                username="testuser",
                email="test@example.com",
                hashed_password="hashed_password"
            )
            db.add(user)
            db.commit()
            
            # Create chat message
            message = ChatMessage(
                user_id=user.id,
                message="Test message",
                response="Test response",
                is_bot=True
            )
            db.add(message)
            db.commit()
            db.refresh(message)
            message_id = message.id
            
            # Read
            retrieved_message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
            assert retrieved_message is not None
            assert retrieved_message.message == "Test message"
            
            # Update
            retrieved_message.message = "Updated message"
            db.commit()
            db.refresh(retrieved_message)
            assert retrieved_message.message == "Updated message"
            
            # Delete
            db.delete(retrieved_message)
            db.commit()
            
            # Verify deletion
            deleted_message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
            assert deleted_message is None
        finally:
            db.close()

if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 