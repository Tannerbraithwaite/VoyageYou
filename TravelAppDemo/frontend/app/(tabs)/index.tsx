import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{message: string, isBot: boolean}>>([]);
  const [userId] = useState(1); // Default user ID for demo

  console.log('HomeScreen rendering with isLoading:', isLoading, 'response:', response);

  // Test backend connection on component mount
  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        const response = await fetch('http://localhost:8000/');
        if (response.ok) {
          console.log('Backend connection successful');
        } else {
          console.error('Backend connection failed');
        }
      } catch (error) {
        console.error('Backend connection error:', error);
        Alert.alert('Connection Error', 'Unable to connect to the travel assistant. Please check your internet connection.');
      }
    };

    testBackendConnection();
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);
    
    // Add user message to chat history
    setChatHistory(prev => [...prev, { message: userMessage, isBot: false }]);
    
    try {
      const response = await fetch('http://localhost:8000/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          user_id: userId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const botResponse = result.response_text || result.bot_response || 'I received your message but had trouble processing it.';
        
        // Add bot response to chat history
        setChatHistory(prev => [...prev, { message: botResponse, isBot: true }]);
        setResponse(botResponse);
      } else {
        const errorText = await response.text();
        console.error('Chat API error:', response.status, errorText);
        const errorMessage = 'Sorry, I encountered an error. Please try again.';
        setChatHistory(prev => [...prev, { message: errorMessage, isBot: true }]);
        setResponse(errorMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = 'Sorry, I\'m having trouble connecting right now. Please check your internet connection.';
      setChatHistory(prev => [...prev, { message: errorMessage, isBot: true }]);
      setResponse(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSchedule = () => {
    router.push('/(tabs)/explore');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your AI Travel Companion</Text>
        <Text style={styles.subtitle}>Plan your next adventure with AI</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.description}>
          Describe your dream trip, get a personalized itinerary, discover local events and tickets, and receive recommendations tailored to your travel style.
        </Text>
        
        <View style={styles.chatSection}>
          <Text style={styles.sectionTitle}>Try Our AI Assistant</Text>
          <Text style={styles.chatDescription}>
            Ask about destinations, activities, or travel tips!
          </Text>
          
          <View style={styles.chatContainer}>
            {/* Chat History */}
            <ScrollView style={styles.chatHistory} showsVerticalScrollIndicator={false}>
              {chatHistory.length === 0 && (
                <View style={styles.welcomeMessage}>
                  <Text style={styles.welcomeText}>
                    Hi! I'm your AI travel assistant. I can help you with:
                  </Text>
                  <Text style={styles.welcomeBullet}>• Travel recommendations</Text>
                  <Text style={styles.welcomeBullet}>• Destination information</Text>
                  <Text style={styles.welcomeBullet}>• Travel planning tips</Text>
                  <Text style={styles.welcomeBullet}>• Budget advice</Text>
                  <Text style={styles.welcomeText}>
                    Just ask me anything!
                  </Text>
                </View>
              )}
              
              {chatHistory.map((chat, index) => (
                <View key={index} style={[styles.messageContainer, chat.isBot ? styles.botMessage : styles.userMessage]}>
                  <View style={[styles.messageBubble, chat.isBot ? styles.botBubble : styles.userBubble]}>
                    <Text style={[styles.messageText, chat.isBot ? styles.botText : styles.userText]}>
                      {chat.message}
                    </Text>
                    {chat.isBot && (
                      chat.message.toLowerCase().includes('paris') || 
                      chat.message.toLowerCase().includes('trip') || 
                      chat.message.toLowerCase().includes('itinerary') ||
                      chat.message.toLowerCase().includes('schedule') ||
                      chat.message.toLowerCase().includes('plan') ||
                      chat.message.toLowerCase().includes('recommend')
                    ) && (
                      <TouchableOpacity
                        style={styles.acceptScheduleButton}
                        onPress={handleAcceptSchedule}
                      >
                        <Text style={styles.acceptScheduleButtonText}>
                          Accept Schedule
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
              
              {isLoading && (
                <View style={[styles.messageContainer, styles.botMessage]}>
                  <View style={[styles.messageBubble, styles.botBubble]}>
                    <Text style={[styles.messageText, styles.botText, styles.typingText]}>
                      Thinking...
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.inputContainer}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="e.g., 'I want to visit Paris for 3 days'"
                placeholderTextColor="#666"
                style={styles.textInput}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={!message.trim() || isLoading}
              >
                <Text style={styles.sendButtonText}>
                  {isLoading ? 'Sending' : 'Send'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.flowSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Describe your trip</Text>
                <Text style={styles.stepDescription}>in natural language ("3 days in Paris, love art and food")</Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Get your itinerary</Text>
                <Text style={styles.stepDescription}>instantly, with a day-by-day schedule</Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Browse events & tickets</Text>
                <Text style={styles.stepDescription}>in your destination and bundle them for purchase</Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Personalize your profile</Text>
                <Text style={styles.stepDescription}>so the app learns your travel style</Text>
              </View>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>5</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Get suggestions</Text>
                <Text style={styles.stepDescription}>for trips and events you'll love!</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Use the tabs below to start planning your next adventure!</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 24,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  content: {
    padding: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ccc',
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '500',
  },
  chatSection: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  chatDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  chatContainer: {
    gap: 12,
  },
  chatHistory: {
    maxHeight: 300,
    marginBottom: 12,
  },
  welcomeMessage: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  welcomeBullet: {
    fontSize: 14,
    color: '#999',
    marginBottom: 6,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#6366f1',
  },
  botBubble: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#ccc',
  },
  typingText: {
    fontStyle: 'italic',
  },
  acceptScheduleButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptScheduleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#0a0a0a',
    color: 'white',
    minHeight: 50,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  flowSection: {
    marginBottom: 32,
  },
  stepsContainer: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  stepDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
});
