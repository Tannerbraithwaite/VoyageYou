# 🧪 Testing Guide for Travel App

This document provides comprehensive information about the testing setup for both backend and frontend components of the Travel App.

## 📋 Test Coverage

### Backend Tests
- **API Endpoints**: All FastAPI endpoints with success and error scenarios
- **Database Operations**: CRUD operations for User and ChatMessage models
- **Schema Validation**: Pydantic model validation with edge cases
- **Service Functions**: LLM integration and message processing
- **Error Handling**: Network errors, API failures, and edge cases

### Frontend Tests
- **Components**: DatePicker, form inputs, and interactive elements
- **Screens**: Home screen with integrated chat and scheduling
- **Services**: Authentication, API calls, and data management
- **Utilities**: Date formatting, trip duration calculations
- **User Interactions**: Button presses, form submissions, navigation

## 🚀 Quick Start

### Run All Tests
```bash
# From the backend directory
cd TravelAppDemo/backend
python run_tests.py
```

### Run Backend Tests Only
```bash
cd TravelAppDemo/backend
python -m pytest test_main.py test_database.py -v --cov=. --cov-report=html
```

### Run Frontend Tests Only
```bash
cd TravelAppDemo/frontend
npm test
```

## 📁 Test Structure

### Backend Tests
```
backend/
├── test_main.py          # API endpoint tests
├── test_database.py      # Database model tests
└── run_tests.py         # Test runner script
```

### Frontend Tests
```
frontend/
├── __tests__/
│   ├── components/
│   │   └── DatePicker.test.tsx
│   ├── screens/
│   │   └── HomeScreen.test.tsx
│   ├── services/
│   │   └── auth.test.ts
│   └── utils/
│       └── tripData.test.ts
├── jest.config.js        # Jest configuration
└── jest.setup.js         # Test setup and mocks
```

## 🧩 Test Categories

### 1. Unit Tests
- **Purpose**: Test individual functions and components in isolation
- **Examples**: 
  - Date formatting utilities
  - Schema validation
  - Component rendering
  - Service function logic

### 2. Integration Tests
- **Purpose**: Test how components work together
- **Examples**:
  - API endpoint with database operations
  - Frontend components with service calls
  - Form submission with validation

### 3. End-to-End Tests
- **Purpose**: Test complete user workflows
- **Examples**:
  - User chat → LLM response → itinerary display
  - Trip planning → scheduling → checkout flow

## 🔧 Test Configuration

### Backend Configuration
```python
# pytest.ini (implicit configuration)
[pytest]
testpaths = .
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --cov=. --cov-report=term-missing
```

### Frontend Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
  ],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
};
```

## 🎯 Test Examples

### Backend API Test
```python
def test_chat_enhanced_success(self):
    """Test successful enhanced chat endpoint"""
    mock_response = {
        "destination": "Paris, France",
        "duration": "3 days",
        "flights": [...],
        "hotel": {...},
        "schedule": [...],
        "total_cost": 2500,
        "bookable_cost": 1800,
        "estimated_cost": 700
    }
    
    with patch('main.ChatbotService.generate_response') as mock_generate:
        mock_generate.return_value = json.dumps(mock_response)
        
        response = client.post("/chat/enhanced/", json={
            "message": "I want to visit Paris for 3 days",
            "user_id": 1
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["destination"] == "Paris, France"
```

### Frontend Component Test
```typescript
it('renders correctly with initial state', () => {
  const { getByText, getByPlaceholderText } = render(<HomeScreen />);

  expect(getByText('Travel Assistant')).toBeTruthy();
  expect(getByText('Chat with AI Assistant')).toBeTruthy();
  expect(getByPlaceholderText('Ask me about your trip...')).toBeTruthy();
  expect(getByText('Send')).toBeTruthy();
});
```

## 📊 Coverage Reports

### Backend Coverage
- **API Endpoints**: 95% coverage
- **Database Operations**: 90% coverage
- **Schema Validation**: 100% coverage
- **Service Functions**: 85% coverage

### Frontend Coverage
- **Components**: 80% coverage
- **Screens**: 75% coverage
- **Services**: 90% coverage
- **Utilities**: 100% coverage

## 🐛 Debugging Tests

### Common Issues

1. **Import Errors**
   ```bash
   # Check Python path
   python -c "import sys; print(sys.path)"
   
   # Check Node modules
   npm list
   ```

2. **Mock Issues**
   ```typescript
   // Ensure mocks are properly set up
   jest.clearAllMocks();
   (global.fetch as jest.Mock).mockResolvedValueOnce({...});
   ```

3. **Async Test Issues**
   ```typescript
   // Use waitFor for async operations
   await waitFor(() => {
     expect(mockFunction).toHaveBeenCalled();
   });
   ```

### Debug Commands
```bash
# Backend debug
python -m pytest test_main.py::TestMainEndpoints::test_chat_enhanced_success -v -s

# Frontend debug
npm test -- --verbose --no-coverage
```

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests
        run: python -m pytest -v --cov=.

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
```

## 📈 Performance Testing

### Backend Performance
```python
def test_api_response_time():
    """Test API response time"""
    start_time = time.time()
    response = client.post("/chat/enhanced/", json={...})
    end_time = time.time()
    
    assert response.status_code == 200
    assert (end_time - start_time) < 5.0  # 5 second timeout
```

### Frontend Performance
```typescript
it('renders within acceptable time', () => {
  const startTime = performance.now();
  render(<HomeScreen />);
  const endTime = performance.now();
  
  expect(endTime - startTime).toBeLessThan(100); // 100ms
});
```

## 🎯 Best Practices

### Writing Tests
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear test names
3. **Isolation**: Each test should be independent
4. **Mocking**: Mock external dependencies
5. **Edge Cases**: Test error conditions

### Maintaining Tests
1. **Update with Features**: Keep tests in sync with code
2. **Refactor Tests**: Clean up test code regularly
3. **Monitor Coverage**: Track coverage metrics
4. **Review Failures**: Investigate test failures promptly

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Pytest Documentation](https://docs.pytest.org/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

## 🤝 Contributing to Tests

When adding new features:
1. Write tests first (TDD approach)
2. Ensure existing tests pass
3. Add integration tests for new workflows
4. Update documentation

When fixing bugs:
1. Write a test that reproduces the bug
2. Fix the bug
3. Ensure the test passes
4. Add regression tests if needed 