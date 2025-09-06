# 🛠️ VoyageYou Development Guide

Comprehensive guide for developers contributing to the VoyageYou project, including setup, coding standards, testing, and deployment.

## 🚀 **Quick Start**

### **Prerequisites**
- Python 3.11+
- Node.js 18+
- Git
- VS Code (recommended) or your preferred editor

### **Initial Setup**
```bash
# Clone the repository
git clone https://github.com/yourusername/travel-app-demo.git
cd travel-app-demo

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Environment setup
cd ../backend
cp .env.example .env
# Edit .env with your API keys
```

### **Start Development Servers**
```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🏗️ **Project Architecture**

### **Backend Architecture**
```
backend/
├── main.py              # FastAPI application entry point
├── chat_tools.py        # AI chat service with function calling
├── oauth.py            # OAuth authentication service
├── database.py         # Database models and connection
├── schemas.py          # Pydantic data validation schemas
├── tools.py            # External API integration tools
├── logging_config.py   # Production logging configuration
├── auth.py             # Authentication and authorization
├── email_service.py    # Email functionality
├── pdf_service.py      # PDF generation
└── requirements.txt    # Python dependencies
```

### **Frontend Architecture**
```
frontend/
├── app/                # Expo Router pages
│   ├── (tabs)/        # Main app tabs
│   ├── auth/          # Authentication pages
│   └── _layout.tsx    # Root layout
├── components/         # Reusable UI components
├── services/          # API communication layer
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
├── constants/         # App constants and configuration
└── utils/             # Utility functions
```

### **Data Flow**
```
User Input → Frontend → API → Backend → AI Service → External APIs → Database
    ↑                                                                    ↓
    ←────────────── Response ←─── Processing ←─── Data Collection ←──────┘
```

## 📝 **Coding Standards**

### **Python (Backend)**

#### **Code Style**
- Follow PEP 8 guidelines
- Use Black for code formatting
- Maximum line length: 88 characters
- Use type hints for all functions

#### **Naming Conventions**
```python
# Variables and functions: snake_case
user_location = "New York"
def get_user_profile(user_id: int) -> User:

# Classes: PascalCase
class UserService:

# Constants: UPPER_SNAKE_CASE
MAX_RETRY_ATTEMPTS = 3
DEFAULT_TIMEOUT = 30

# Private methods: _leading_underscore
def _validate_input(self, data: dict) -> bool:
```

#### **Documentation**
```python
def create_trip(
    user_id: int,
    destination: str,
    duration: str
) -> Trip:
    """
    Create a new trip for the specified user.
    
    Args:
        user_id: The ID of the user creating the trip
        destination: The destination city/country
        duration: The trip duration (e.g., "3 days")
    
    Returns:
        Trip: The created trip object
        
    Raises:
        ValueError: If destination is empty
        UserNotFoundError: If user_id doesn't exist
    """
    if not destination.strip():
        raise ValueError("Destination cannot be empty")
    
    # Implementation...
```

#### **Error Handling**
```python
# Use custom exceptions for business logic
class UserNotFoundError(Exception):
    """Raised when a user cannot be found"""
    pass

class InsufficientPermissionsError(Exception):
    """Raised when user lacks required permissions"""
    pass

# Handle exceptions gracefully
try:
    user = get_user(user_id)
except UserNotFoundError:
    logger.warning(f"User {user_id} not found")
    return None
except Exception as e:
    logger.error(f"Unexpected error getting user {user_id}: {e}")
    raise
```

### **TypeScript/React Native (Frontend)**

#### **Code Style**
- Use Prettier for formatting
- Follow ESLint rules
- Use functional components with hooks
- Prefer TypeScript over JavaScript

#### **Naming Conventions**
```typescript
// Variables and functions: camelCase
const userLocation = "New York";
const getUserProfile = (userId: number): User => {};

// Components: PascalCase
const UserProfile: React.FC<UserProfileProps> = ({ user }) => {};

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 30000;

// Types and interfaces: PascalCase
interface UserProfile {
  id: number;
  name: string;
  email: string;
}
```

#### **Component Structure**
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    // Side effects
  }, [user]);
  
  const handleUpdate = () => {
    // Handle update logic
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{user.name}</Text>
      {/* Component content */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

## 🧪 **Testing**

### **Backend Testing**

#### **Test Structure**
```python
# test_critical_functions.py
import pytest
from unittest.mock import Mock, patch
from chat_tools import FunctionCallingChatService

class TestFunctionCallingChatService:
    @pytest.fixture
    def chat_service(self):
        """Create a chat service instance for testing"""
        return FunctionCallingChatService()
    
    @pytest.mark.asyncio
    async def test_chat_with_tools_success(self, chat_service):
        """Test successful chat with tools"""
        # Test implementation
        pass
```

#### **Running Tests**
```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-cov

# Run all tests
python -m pytest

# Run specific test file
python -m pytest test_critical_functions.py -v

# Run with coverage
python -m pytest --cov=. --cov-report=html

# Run specific test
python -m pytest test_critical_functions.py::TestFunctionCallingChatService::test_chat_with_tools_success -v
```

#### **Mocking Best Practices**
```python
# Mock external dependencies
@patch('chat_tools.get_db')
@patch('chat_tools.AsyncOpenAI')
async def test_chat_service(mock_openai, mock_get_db):
    # Setup mocks
    mock_db = Mock()
    mock_user = Mock()
    mock_user.location = "New York"
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user
    mock_get_db.return_value = iter([mock_db])
    
    # Test implementation
    pass
```

### **Frontend Testing**

#### **Test Structure**
```typescript
// UserProfile.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { UserProfile } from '../UserProfile';

describe('UserProfile', () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
  };
  
  const mockOnUpdate = jest.fn();
  
  it('renders user information correctly', () => {
    const { getByText } = render(
      <UserProfile user={mockUser} onUpdate={mockOnUpdate} />
    );
    
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('john@example.com')).toBeTruthy();
  });
});
```

#### **Running Tests**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- UserProfile.test.tsx
```

## 🔍 **Debugging**

### **Backend Debugging**

#### **Logging**
```python
from logging_config import get_logger

logger = get_logger(__name__)

def some_function():
    logger.debug("Entering function")
    logger.info("Processing data")
    logger.warning("Deprecated feature used")
    logger.error("An error occurred")
```

#### **Debug Mode**
```bash
# Set environment variable
export LOG_LEVEL=DEBUG

# Or in .env file
LOG_LEVEL=DEBUG
```

#### **Interactive Debugging**
```python
import pdb; pdb.set_trace()  # Python debugger
import ipdb; ipdb.set_trace()  # Enhanced debugger

# Or use breakpoint() in Python 3.7+
breakpoint()
```

### **Frontend Debugging**

#### **Console Logging**
```typescript
console.log('Debug info:', { user, data });
console.warn('Warning message');
console.error('Error occurred:', error);
```

#### **React Native Debugger**
```bash
# Install React Native Debugger
brew install --cask react-native-debugger

# Start debugger
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

#### **Flipper (Advanced)**
```bash
# Install Flipper
brew install --cask flipper

# Configure for React Native debugging
```

## 📊 **Performance Optimization**

### **Backend Performance**

#### **Database Optimization**
```python
# Use select_from for complex queries
from sqlalchemy.orm import selectinload

# Eager loading to avoid N+1 queries
users = db.query(User).options(
    selectinload(User.trips),
    selectinload(User.activities)
).all()

# Use indexes for frequently queried fields
class User(Base):
    __tablename__ = "users"
    email = Column(String, unique=True, index=True)
    location = Column(String, index=True)
```

#### **Caching**
```python
from functools import lru_cache

@lru_cache(maxsize=128)
def get_user_preferences(user_id: int) -> dict:
    """Cache user preferences to avoid repeated database calls"""
    pass
```

#### **Async Operations**
```python
import asyncio
import aiohttp

async def fetch_multiple_apis(urls: List[str]) -> List[dict]:
    """Fetch multiple APIs concurrently"""
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url) for url in urls]
        return await asyncio.gather(*tasks)
```

### **Frontend Performance**

#### **React Optimization**
```typescript
import React, { memo, useCallback, useMemo } from 'react';

// Memoize expensive components
const ExpensiveComponent = memo(({ data }: Props) => {
  // Component implementation
});

// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Memoize callback functions
const handleUpdate = useCallback((id: number) => {
  updateItem(id);
}, []);
```

#### **Image Optimization**
```typescript
import { Image } from 'react-native';

// Use appropriate image sizes
<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode="cover"
  fadeDuration={0}
/>
```

## 🔒 **Security Best Practices**

### **Authentication & Authorization**
```python
# Always validate user permissions
def update_user_profile(user_id: int, current_user: User, data: dict) -> User:
    if current_user.id != user_id and not current_user.is_admin:
        raise InsufficientPermissionsError("Cannot update other users")
    
    # Proceed with update
    pass

# Use secure password hashing
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

### **Input Validation**
```python
from pydantic import BaseModel, validator
from typing import Optional

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    
    @validator('email')
    def validate_email(cls, v):
        if v and '@' not in v:
            raise ValueError('Invalid email format')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        if v and len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v
```

### **SQL Injection Prevention**
```python
# Use SQLAlchemy ORM (already implemented)
user = db.query(User).filter(User.id == user_id).first()

# If using raw SQL, use parameterized queries
cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
```

## 🚀 **Deployment**

### **Environment Configuration**
```bash
# Production environment
export ENVIRONMENT=production
export LOG_LEVEL=WARNING
export DATABASE_URL=postgresql://user:pass@host:port/db

# Development environment
export ENVIRONMENT=development
export LOG_LEVEL=DEBUG
export DATABASE_URL=sqlite:///./travel_app.db
```

### **Docker Deployment**
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### **Environment Variables**
```bash
# .env.production
ENVIRONMENT=production
LOG_LEVEL=WARNING
SECRET_KEY=your_production_secret_key
OPENAI_API_KEY=your_production_openai_key
DATABASE_URL=postgresql://user:pass@host:port/db
```

## 📚 **Useful Resources**

### **Documentation**
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

### **Tools**
- [Postman](https://www.postman.com/) - API testing
- [Insomnia](https://insomnia.rest/) - API client
- [DB Browser for SQLite](https://sqlitebrowser.org/) - Database management
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)

### **Learning Resources**
- [Python Type Hints](https://docs.python.org/3/library/typing.html)
- [React Hooks](https://reactjs.org/docs/hooks-intro.html)
- [Async Python](https://docs.python.org/3/library/asyncio.html)
- [Testing React Native](https://reactnative.dev/docs/testing)

## 🤝 **Contributing**

### **Development Workflow**
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes following coding standards
4. **Test** your changes thoroughly
5. **Commit** with descriptive messages: `git commit -m "Add amazing feature"`
6. **Push** to your branch: `git push origin feature/amazing-feature`
7. **Create** a Pull Request

### **Commit Message Format**
```
type(scope): description

feat(auth): add OAuth Google sign-in
fix(chat): resolve JSON parsing error
docs(api): update endpoint documentation
style(ui): improve button styling
refactor(database): optimize user queries
test(chat): add unit tests for chat service
```

### **Pull Request Guidelines**
- **Title**: Clear, descriptive title
- **Description**: Detailed explanation of changes
- **Testing**: Describe how to test the changes
- **Screenshots**: Include UI changes if applicable
- **Breaking Changes**: Note any breaking changes

---

**Happy Coding! 🎉**

For questions or support, please:
- Check the [API Documentation](API_DOCUMENTATION.md)
- Review existing issues on GitHub
- Create a new issue for bugs or feature requests
- Join our community discussions
