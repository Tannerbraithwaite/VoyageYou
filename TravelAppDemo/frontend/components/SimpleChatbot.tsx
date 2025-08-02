import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface SimpleChatbotProps {
  userId: number;
}

export default function SimpleChatbot({ userId }: SimpleChatbotProps) {
  console.log('SimpleChatbot component loaded with userId:', userId);
  
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, `You: ${userMessage}`]);

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
        setMessages(prev => [...prev, `Bot: ${result.bot_response}`]);
      } else {
        setMessages(prev => [...prev, 'Bot: Sorry, I encountered an error.']);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, 'Bot: Sorry, I encountered an error.']);
    }
  };

  console.log('SimpleChatbot component rendering...');
  console.log('Messages array:', messages);
  console.log('Input message:', inputMessage);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Travel Assistant</Text>
        <Text style={styles.headerSubtitle}>Ask me anything about travel!</Text>
      </View>

      <View style={styles.messagesContainer}>
        {messages.length === 0 && (
          <Text style={styles.welcomeText}>
            Hi! I'm your AI travel assistant. Ask me anything!
          </Text>
        )}
        
        {messages.map((message, index) => {
          console.log('Rendering message at index:', index, 'message:', message);
          return (
            <Text key={index} style={styles.messageText}>
              {message}
            </Text>
          );
        })}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Ask me about travel..."
          placeholderTextColor="#666"
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={!inputMessage.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 20,
    paddingTop: 40,
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
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 40,
  },
  messageText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
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
  },
  sendButton: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 