# Chatbot Setup Guide

## Overview
The travel app now includes an AI-powered chatbot that can help users with travel planning, recommendations, and general travel advice. The chatbot uses OpenAI's GPT-3.5-turbo model to provide personalized responses based on the user's travel preferences and history.

## Features
- **Personalized Responses**: The chatbot considers the user's travel style, budget, interests, and travel history
- **Travel Planning Assistance**: Help with destination recommendations, itinerary planning, and travel tips
- **Budget Advice**: Suggestions based on the user's budget range
- **Chat History**: All conversations are saved and can be retrieved
- **Real-time Interaction**: Instant responses with typing indicators

## Setup Instructions

### 1. Get an OpenAI API Key
1. Go to [OpenAI's website](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to the API keys section
4. Create a new API key
5. Copy the API key (it starts with `sk-`)

### 2. Configure the API Key
You have several options to set the API key:

#### Option A: Environment Variable (Recommended)
```bash
export OPENAI_API_KEY="your_actual_api_key_here"
```

#### Option B: Direct in Code (Temporary)
Edit the `main.py` file and replace the API key check:
```python
# In main.py, around line 250
api_key = "your_actual_api_key_here"  # Replace with your actual key
```

#### Option C: Create a .env file
Create a `.env` file in the backend directory:
```
OPENAI_API_KEY=your_actual_api_key_here
```

### 3. Install Dependencies
```bash
cd backend
pip3 install -r requirements.txt
```

### 4. Start the Backend Server
```bash
python3 main.py
```

### 5. Start the Frontend
```bash
cd ../frontend
npm start
```

## Usage

### Accessing the Chatbot
1. Open the travel app
2. Navigate to the "Assistant" tab (new tab in the bottom navigation)
3. Start chatting with the AI travel assistant

### Example Conversations
- "I want to plan a trip to Europe"
- "What are some good destinations for solo travelers?"
- "I have a budget of $2000, where should I go?"
- "Tell me about the best time to visit Japan"
- "I love art and food, where should I travel?"

## API Endpoints

### POST /chat/
Send a message to the chatbot
```json
{
  "message": "I want to plan a trip to Europe",
  "user_id": 1
}
```

### GET /users/{user_id}/chat/history/
Get chat history for a user
```
GET /users/1/chat/history/?limit=20
```

## Database Schema

The chatbot uses a new `chat_messages` table:
- `id`: Primary key
- `user_id`: Foreign key to users table
- `message`: User's message (empty for bot responses)
- `is_bot`: Boolean indicating if it's a bot response
- `response`: Bot's response text (for bot messages)
- `created_at`: Timestamp

## Troubleshooting

### "OpenAI API key not configured" Error
- Make sure you've set the `OPENAI_API_KEY` environment variable
- Check that the API key is valid and has sufficient credits
- Verify the API key format (should start with `sk-`)

### "Error processing chat message" Error
- Check your internet connection
- Verify the OpenAI API key is valid
- Check the backend logs for more details

### Chatbot not responding
- Ensure the backend server is running
- Check that the frontend can connect to `localhost:8000`
- Verify the user ID is valid (currently hardcoded to 1)

## Security Notes
- Never commit your API key to version control
- Use environment variables for production deployments
- Consider implementing user authentication for production use
- Monitor API usage to avoid unexpected charges

## Cost Considerations
- OpenAI charges per token used
- GPT-3.5-turbo is relatively affordable (~$0.002 per 1K tokens)
- Monitor your usage in the OpenAI dashboard
- Consider implementing rate limiting for production use 