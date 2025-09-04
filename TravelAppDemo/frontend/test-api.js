// Simple API test script
const API_BASE_URL = 'https://travel-app-demo-production.up.railway.app';

async function testAPI() {
  console.log('Testing API connection to:', API_BASE_URL);
  
  try {
    // Test basic connectivity
    const response = await fetch(`${API_BASE_URL}/`);
    console.log('Basic connectivity test:', response.status);
    
    // Test signup endpoint
    const signupResponse = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User'
      })
    });
    
    const result = await signupResponse.json();
    console.log('Signup test result:', result);
    
  } catch (error) {
    console.error('API test failed:', error);
  }
}

testAPI();
