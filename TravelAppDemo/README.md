# 🚀 Travel App Demo - AI-Powered Travel Planning

A modern, AI-powered travel planning application built with FastAPI backend and React Native frontend. Features intelligent trip planning, OAuth authentication, and real-time travel data integration.

## ✨ **Key Features**

### 🤖 **AI-Powered Travel Planning**
- **Intelligent Itinerary Generation**: Uses OpenAI GPT-4o to create personalized travel plans
- **Context-Aware Conversations**: Remembers user preferences and location context across chat sessions
- **Multi-City Trip Support**: Plan complex itineraries spanning multiple destinations
- **Real-Time Data Integration**: Fetches live flight, hotel, and activity data from external APIs

### 🔐 **Authentication & Security**
- **OAuth Integration**: Google and Apple sign-in support
- **JWT Token Management**: Secure session handling with refresh tokens
- **Password Security**: Bcrypt hashing for user credentials
- **Role-Based Access**: User permission management

### 📱 **Modern Mobile Interface**
- **React Native/Expo**: Cross-platform mobile app with native performance
- **Responsive Design**: Adaptive UI for different screen sizes
- **Real-Time Updates**: Live chat interface with instant responses
- **Offline Support**: Local storage for saved itineraries

### 🗄️ **Data Management**
- **SQLite Database**: Lightweight, reliable data storage
- **Real-Time APIs**: Integration with Duffel (flights), Hotelbeds (hotels), Ticketmaster (events)
- **Data Validation**: Comprehensive input validation and error handling
- **Backup & Recovery**: Automated data seeding and migration tools

## 🏗️ **Architecture**

### **Backend (FastAPI)**
```
backend/
├── main.py              # FastAPI application and endpoints
├── chat_tools.py        # AI chat service with function calling
├── oauth.py            # OAuth authentication service
├── database.py         # Database models and connection
├── schemas.py          # Pydantic data validation schemas
├── tools.py            # External API integration tools
├── logging_config.py   # Production logging configuration
└── requirements.txt    # Python dependencies
```

### **Frontend (React Native/Expo)**
```
frontend/
├── app/                # Main application screens
├── components/         # Reusable UI components
├── services/          # API communication layer
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
└── package.json       # Node.js dependencies
```

## 🚀 **Getting Started**

### **Prerequisites**
- Python 3.11+
- Node.js 18+
- Expo CLI
- OpenAI API key
- External API keys (Duffel, Hotelbeds, Ticketmaster)

### **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your API keys

# Initialize database
python seed_data.py

# Start the server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

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

## 🧪 **Testing**

### **Backend Tests**
```bash
cd backend
python -m pytest test_critical_functions.py -v
```

### **Frontend Tests**
```bash
cd frontend
npm test
```

## 📊 **API Endpoints**

### **Authentication**
- `POST /auth/oauth` - OAuth login (Google/Apple)
- `POST /auth/login` - Traditional login
- `POST /auth/signup` - User registration

### **Chat & Planning**
- `POST /chat/tools/` - AI-powered travel planning
- `POST /chat/tools/test` - Test endpoint for development

### **User Management**
- `GET /users/{user_id}` - Get user profile
- `PUT /users/{user_id}` - Update user profile
- `GET /users/{user_id}/trips` - Get user trips

### **Trip Management**
- `GET /trips/` - List all trips
- `POST /trips/` - Create new trip
- `GET /trips/{trip_id}` - Get specific trip

## 🔧 **Development Features**

### **Logging & Monitoring**
- **Structured Logging**: Production-ready logging with rotation
- **Performance Monitoring**: Function execution time tracking
- **Error Tracking**: Comprehensive error logging and context
- **Request Logging**: Full request/response cycle tracking

### **Code Quality**
- **Type Hints**: Full Python type annotation
- **Code Formatting**: Consistent code style
- **Error Handling**: Comprehensive exception management
- **Documentation**: Inline code documentation

### **Testing & Quality Assurance**
- **Unit Tests**: Comprehensive test coverage for critical functions
- **Mock Testing**: Isolated testing with mocked dependencies
- **Error Scenarios**: Edge case and error condition testing
- **Performance Testing**: Function performance validation

## 🌟 **Recent Improvements**

### **AI Chat System**
- ✅ **Enhanced Prompt Engineering**: Improved system prompts for better AI responses
- ✅ **Function Calling**: Real-time API integration during conversations
- ✅ **Context Management**: Multi-turn conversation support
- ✅ **Response Validation**: JSON output validation and error handling

### **User Experience**
- ✅ **Location Awareness**: User location integration for better trip planning
- ✅ **Preference Learning**: AI remembers user preferences across sessions
- ✅ **Alternative Suggestions**: Multiple activity options for each day
- ✅ **Cost Calculation**: Real-time pricing and budget management

### **Performance & Reliability**
- ✅ **Production Logging**: Structured logging for monitoring and debugging
- ✅ **Error Handling**: Comprehensive error handling and recovery
- ✅ **Database Optimization**: Efficient queries and data management
- ✅ **API Integration**: Robust external API integration with fallbacks

## 🚧 **Roadmap**

### **Phase 1: Core Features** ✅
- [x] AI-powered travel planning
- [x] OAuth authentication
- [x] Basic trip management
- [x] External API integration

### **Phase 2: Enhanced AI** ✅
- [x] Multi-turn conversations
- [x] Context-aware planning
- [x] Alternative suggestions
- [x] Cost optimization

### **Phase 3: Production Ready** 🚧
- [x] Production logging
- [x] Comprehensive testing
- [x] Error handling
- [ ] Performance optimization
- [ ] Security hardening

### **Phase 4: Advanced Features** 📋
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Social features
- [ ] Mobile notifications

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation**: Check the [docs/](docs/) folder
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join community discussions
- **Email**: Contact the development team

---

**Built with ❤️ using FastAPI, React Native, and OpenAI**
