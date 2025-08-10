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

export default function TravelChatbot({ userId }: ChatbotProps) {
  console.log('TravelChatbot component loaded with userId:', userId);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        console.log('Testing backend connection...');
        const response = await fetch('http://localhost:8000/');
        console.log('Backend test response:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Backend is reachable:', data);
        }
      } catch (error) {
        console.error('Backend connection failed:', error);
        setHasError(true);
      }
    };

    const loadChatHistory = async () => {
      try {
        console.log('Loading chat history for user:', userId);
        const response = await fetch(`http://localhost:8000/users/${userId}/chat/history/`);
        console.log('Chat history response status:', response.status);
        
        if (response.ok) {
          const history = await response.json();
          console.log('Chat history loaded:', history);
          setMessages(history.reverse());
        } else {
          const errorText = await response.text();
          console.error('Error loading chat history:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    testBackendConnection();
    loadChatHistory();
  }, [userId]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    console.log('Sending message:', userMessage);

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

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Response data:', result);

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
          response: result.bot_response,
          created_at: result.created_at,
        };

        console.log('Adding messages to UI:', { newUserMessage, newBotMessage });
        setMessages(prev => [...prev, newUserMessage, newBotMessage]);
      } else {
        const errorText = await response.text();
        console.error('Error sending message:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  console.log('TravelChatbot component rendering...');
  console.log('Messages array:', messages);
  console.log('Input message:', inputMessage);
  console.log('Is loading:', isLoading);
  console.log('Has error:', hasError);
  
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
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
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
            
            {messages.map((message) => {
              console.log('Rendering message:', message);
              return renderMessage(message);
            })}
            
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
}); 