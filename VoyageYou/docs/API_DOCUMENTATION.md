# 📚 Travel App API Documentation

Comprehensive API reference for the Travel App backend, including all endpoints, request/response formats, and authentication details.

## 🔐 **Authentication**

### **OAuth Login**
```http
POST /auth/oauth
```

**Request Body:**
```json
{
  "provider": "google|apple",
  "id_token": "oauth_id_token_string"
}
```

**Response:**
```json
{
  "access_token": "jwt_access_token",
  "refresh_token": "jwt_refresh_token",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "location": "New York, NY",
    "travel_style": "solo",
    "budget_range": "moderate"
  }
}
```

### **Traditional Login**
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "user_password"
}
```

**Response:**
```json
{
  "access_token": "jwt_access_token",
  "refresh_token": "jwt_refresh_token",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### **User Registration**
```http
POST /auth/signup
```

**Request Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "secure_password",
  "travel_style": "solo|couple|family|group",
  "budget_range": "budget|moderate|luxury",
  "additional_info": "Additional preferences"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "User Name",
  "email": "user@example.com",
  "travel_style": "solo",
  "budget_range": "moderate",
  "message": "User created successfully"
}
```

## 🤖 **AI Chat & Travel Planning**

### **AI-Powered Travel Planning**
```http
POST /chat/tools/
```

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Plan a 3-day trip to Paris",
  "user_id": 1
}
```

**Response Types:**

#### **Complete Itinerary Response:**
```json
{
  "trip_type": "single_city",
  "destination": "Paris, France",
  "duration": "3 days",
  "description": "Cultural exploration of Paris",
  "flights": [
    {
      "airline": "Air France",
      "flight": "AF123",
      "departure": "JFK → CDG",
      "time": "10:00 AM - 11:30 AM",
      "price": 800,
      "type": "outbound"
    }
  ],
  "hotel": {
    "name": "Hotel Paris",
    "address": "123 Champs-Élysées, Paris",
    "check_in": "2025-09-01 - 3:00 PM",
    "check_out": "2025-09-04 - 11:00 AM",
    "room_type": "Standard Room",
    "price": 300,
    "total_nights": 3
  },
  "schedule": [
    {
      "day": "2025-09-01",
      "activities": [
        {
          "name": "Eiffel Tower Visit",
          "time": "14:00",
          "price": 30,
          "type": "bookable",
          "description": "Visit the iconic Eiffel Tower"
        }
      ],
      "alternatives": [
        {
          "name": "Arc de Triomphe",
          "time": "14:00",
          "price": 15,
          "type": "bookable",
          "description": "Visit the historic monument"
        }
      ]
    }
  ],
  "total_cost": 1130,
  "bookable_cost": 1130,
  "estimated_cost": 0
}
```

#### **Clarifying Questions Response:**
```json
{
  "type": "question",
  "message": "I need more information to create your itinerary. Please provide a destination, duration, and preferred dates.",
  "needs_clarification": true
}
```

### **Test Chat Endpoint (Development)**
```http
POST /chat/tools/test
```

**Request Body:**
```json
{
  "message": "Plan a trip to Tokyo",
  "user_id": 1
}
```

**Response:** Same format as production endpoint, but bypasses authentication.

## 👤 **User Management**

### **Get User Profile**
```http
GET /users/{user_id}
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": 1,
  "name": "User Name",
  "email": "user@example.com",
  "location": "New York, NY",
  "travel_style": "solo",
  "budget_range": "moderate",
  "additional_info": "Loves art and culture",
  "created_at": "2025-08-29T10:00:00Z"
}
```

### **Update User Profile**
```http
PUT /users/{user_id}
```

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "location": "San Francisco, CA",
  "travel_style": "couple",
  "budget_range": "luxury",
  "additional_info": "Updated preferences"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Updated Name",
  "email": "user@example.com",
  "location": "San Francisco, CA",
  "travel_style": "couple",
  "budget_range": "luxury",
  "additional_info": "Updated preferences",
  "updated_at": "2025-08-29T11:00:00Z"
}
```

### **Get User Trips**
```http
GET /users/{user_id}/trips
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
[
  {
    "id": 1,
    "trip_type": "single_city",
    "destination": "Paris, France",
    "duration": "3 days",
    "created_at": "2025-08-29T10:00:00Z"
  }
]
```

## 🗄️ **Trip Management**

### **List All Trips**
```http
GET /trips/
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
[
  {
    "id": 1,
    "trip_type": "single_city",
    "destination": "Paris, France",
    "duration": "3 days",
    "user_id": 1,
    "created_at": "2025-08-29T10:00:00Z"
  }
]
```

### **Get Specific Trip**
```http
GET /trips/{trip_id}
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": 1,
  "trip_type": "single_city",
  "destination": "Paris, France",
  "duration": "3 days",
  "user_id": 1,
  "activities": [
    {
      "id": 1,
      "name": "Eiffel Tower Visit",
      "time": "14:00",
      "price": 30,
      "type": "bookable",
      "description": "Visit the iconic Eiffel Tower"
    }
  ],
  "created_at": "2025-08-29T10:00:00Z"
}
```

### **Create New Trip**
```http
POST /trips/
```

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "trip_type": "single_city",
  "destination": "Tokyo, Japan",
  "duration": "5 days",
  "user_id": 1
}
```

**Response:**
```json
{
  "id": 2,
  "trip_type": "single_city",
  "destination": "Tokyo, Japan",
  "duration": "5 days",
  "user_id": 1,
  "created_at": "2025-08-29T12:00:00Z"
}
```

## 🔧 **System Endpoints**

### **Health Check**
```http
GET /
```

**Response:**
```json
{
  "message": "Travel App API is running",
  "version": "1.0.0",
  "status": "healthy"
}
```

### **API Documentation**
```http
GET /docs
```

**Response:** Interactive API documentation (Swagger UI)

### **OpenAPI Schema**
```http
GET /openapi.json
```

**Response:** OpenAPI specification in JSON format

## 📊 **Data Models**

### **User Model**
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    location = Column(String)
    travel_style = Column(String, default="solo")
    budget_range = Column(String, default="moderate")
    additional_info = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### **Trip Model**
```python
class Trip(Base):
    __tablename__ = "trips"
    
    id = Column(Integer, primary_key=True, index=True)
    trip_type = Column(String, nullable=False)  # single_city, multi_city
    destination = Column(String, nullable=False)
    duration = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
```

### **Activity Model**
```python
class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    time = Column(String)
    price = Column(Float, default=0.0)
    type = Column(String, default="estimated")  # bookable, estimated
    description = Column(Text)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    day_number = Column(Integer)
```

## 🚨 **Error Handling**

### **Standard Error Response Format**
```json
{
  "detail": "Error message description",
  "error_code": "ERROR_CODE",
  "timestamp": "2025-08-29T12:00:00Z"
}
```

### **Common HTTP Status Codes**
- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation error
- **500 Internal Server Error**: Server error

### **Error Examples**

#### **Authentication Error (401)**
```json
{
  "detail": "Not authenticated",
  "error_code": "AUTH_REQUIRED",
  "timestamp": "2025-08-29T12:00:00Z"
}
```

#### **Validation Error (422)**
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ],
  "error_code": "VALIDATION_ERROR",
  "timestamp": "2025-08-29T12:00:00Z"
}
```

#### **Not Found Error (404)**
```json
{
  "detail": "User not found",
  "error_code": "USER_NOT_FOUND",
  "timestamp": "2025-08-29T12:00:00Z"
}
```

## 🔒 **Security Considerations**

### **Authentication**
- All protected endpoints require valid JWT access token
- Tokens expire after 30 minutes (configurable)
- Refresh tokens valid for 7 days
- OAuth tokens verified with provider APIs

### **Rate Limiting**
- API endpoints rate-limited to prevent abuse
- Chat endpoints have stricter limits
- Rate limits configurable per endpoint

### **Data Validation**
- All input validated using Pydantic schemas
- SQL injection protection via SQLAlchemy ORM
- XSS protection in response headers
- CORS configuration for frontend access

## 📝 **Usage Examples**

### **Complete User Flow Example**

1. **User Registration:**
```bash
curl -X POST "http://localhost:8000/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secure123",
    "travel_style": "solo",
    "budget_range": "moderate"
  }'
```

2. **User Login:**
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secure123"
  }'
```

3. **Plan a Trip:**
```bash
curl -X POST "http://localhost:8000/chat/tools/" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Plan a 3-day trip to Barcelona",
    "user_id": 1
  }'
```

4. **Get User Profile:**
```bash
curl -X GET "http://localhost:8000/users/1" \
  -H "Authorization: Bearer <access_token>"
```

## 🔧 **Development & Testing**

### **Environment Variables**
```bash
# Required
OPENAI_API_KEY=your_openai_key
SECRET_KEY=your_secret_key

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
APPLE_CLIENT_ID=your_apple_client_id

# External APIs
DUFFEL_API_KEY=your_duffel_key
HOTELBED_API_KEY=your_hotelbeds_key
HOTELBED_API_SECRET=your_hotelbeds_secret
TICKETMASTER_API_KEY=your_ticketmaster_key

# Optional
LOG_LEVEL=INFO
ENVIRONMENT=development
```

### **Running Tests**
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
python -m pytest test_critical_functions.py -v

# Run with coverage
python -m pytest test_critical_functions.py --cov=. --cov-report=html
```

### **Local Development**
```bash
# Start backend server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Access API docs
open http://localhost:8000/docs
```

---

**Last Updated:** August 29, 2025  
**Version:** 1.0.0  
**API Base URL:** `http://localhost:8000`
