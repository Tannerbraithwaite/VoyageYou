import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';

interface ChatMessage {
  id: number;
  message: string;
  is_bot: boolean;
  response?: string;
  created_at: string;
}

interface ChatbotProps {
  userId: number;
}

/**
 * TravelChatbot Component
 * Provides an interactive chat interface with AI travel assistant
 * Features auto-scroll, chat history, and integration with itinerary system
 */
export default function TravelChatbot({ userId }: ChatbotProps) {
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = (animated: boolean = true) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated });
    }, 100);
  };

  // Check if user is near bottom of chat
  const handleScroll = (event: any) => {
    try {
      const { contentSize, layoutMeasurement, contentOffset } = event.nativeEvent;
      const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
      setIsNearBottom(isAtBottom);
      
      const shouldShow = !isAtBottom && messages.length > 3;
      if (shouldShow !== showScrollToBottom) {
        setShowScrollToBottom(shouldShow);
      }
    } catch (error) {
      // Silently handle scroll errors
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages]);

  // Auto-scroll when loading starts
  useEffect(() => {
    if (isLoading) {
      scrollToBottom(true);
    }
  }, [isLoading]);

  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        const response = await fetch('http://localhost:8000/');
        if (response.ok) {
          await response.json();
        }
      } catch (error) {
        setHasError(true);
      }
    };

    const loadChatHistory = async () => {
      try {
        const response = await fetch(`http://localhost:8000/users/${userId}/chat/history/`);
        
        if (response.ok) {
          const history = await response.json();
          setMessages(history.reverse());
        }
      } catch (error) {
        // Silently handle chat history loading errors
      }
    };

    testBackendConnection();
    loadChatHistory();
  }, [userId]);

  /**
   * Sends a message to the AI travel assistant
   * Handles both enhanced (structured) and fallback (text) responses
   */
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // Try enhanced endpoint first for structured responses
      const response = await fetch('http://localhost:8000/chat/enhanced/', {
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

        // Store the itinerary data in sessionStorage for home screen
        if (result.destination && typeof window !== 'undefined') {
          sessionStorage.setItem('currentItinerary', JSON.stringify(result));
        }

        const newUserMessage: ChatMessage = {
          id: Date.now(),
          message: userMessage,
          is_bot: false,
          created_at: new Date().toISOString(),
        };

        // Create a user-friendly summary instead of raw JSON
        const botResponseText = result.destination 
          ? `I've created a detailed itinerary for your trip to ${result.destination}!\n\n📅 Duration: ${result.duration}\n✈️ Flights: ${result.flights?.length || 0} flights included\n🏨 Hotel: ${result.hotel?.name || 'Hotel included'}\n💰 Total Cost: $${result.total_cost || 'TBD'}\n\nYour schedule has been loaded below. You can continue chatting with me to make changes or ask questions!`
          : 'I\'ve processed your request. Let me know if you need any adjustments!';

        const newBotMessage: ChatMessage = {
          id: Date.now() + 1,
          message: '',
          is_bot: true,
          response: botResponseText,
          created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, newUserMessage, newBotMessage]);
      } else {
        // Fallback to regular chat endpoint
        
        const fallbackResponse = await fetch('http://localhost:8000/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            user_id: userId,
          }),
        });

        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();

          const newUserMessage: ChatMessage = {
            id: Date.now(),
            message: userMessage,
            is_bot: false,
            created_at: new Date().toISOString(),
          };

          const newBotMessage: ChatMessage = {
            id: Date.now() + 1,
            message: '',
            is_bot: true,
            response: fallbackResult.bot_response,
            created_at: fallbackResult.created_at,
          };

          setMessages(prev => [...prev, newUserMessage, newBotMessage]);
        }
        // Silently handle endpoint failures
      }
    } catch (error) {
      // Silently handle errors
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Renders a single chat message with appropriate styling
   */
  const renderMessage = (message: ChatMessage) => {
    const isBot = message.is_bot;
    const messageText = isBot ? message.response || '' : message.message;

    return (
      <View key={message.id} style={[styles.messageContainer, isBot ? styles.botMessage : styles.userMessage]}>
        <View style={[styles.messageBubble, isBot ? styles.botBubble : styles.userBubble]}>
          <Text style={[styles.messageText, isBot ? styles.botText : styles.userText]}>
            {messageText || ' '}
          </Text>
        </View>
      </View>
    );
  };

  if (hasError) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error loading chatbot. Please refresh the page.</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Travel Assistant</Text>
          <Text style={styles.headerSubtitle}>Ask me anything about travel!</Text>
        </View>

        {/* Messages Container - Takes up remaining space */}
        <View style={styles.messagesWrapper}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onScroll={handleScroll}
            onContentSizeChange={() => scrollToBottom(true)}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 && (
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
            
            {messages.map((message) => renderMessage(message))}
            
            {isLoading && (
              <View style={[styles.messageContainer, styles.botMessage]}>
                <View style={[styles.messageBubble, styles.botBubble]}>
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text style={[styles.messageText, styles.botText, styles.typingText]}>
                    Thinking
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Floating Scroll to Bottom Button */}
        {showScrollToBottom && (
          <TouchableOpacity
            style={styles.scrollToBottomButton}
            onPress={() => {
              scrollToBottom(true);
              setShowScrollToBottom(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.scrollToBottomText}>↓</Text>
          </TouchableOpacity>
        )}

        {/* Input Container - Fixed at bottom */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Ask me about travel..."
            placeholderTextColor="#666"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  messagesWrapper: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  welcomeMessage: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  welcomeText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  welcomeBullet: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 16,
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
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
    position: 'relative',
    zIndex: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#0a0a0a',
    color: 'white',
    marginRight: 12,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
    padding: 20,
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 90, // Above the input container
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  scrollToBottomText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
}); 