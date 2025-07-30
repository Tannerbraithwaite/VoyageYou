import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    setResponse('');
    
    // Simulate API call delay
    setTimeout(() => {
      setResponse('Working on your query...');
      setIsLoading(false);
      setMessage('');
    }, 1000);
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
                  {isLoading ? '...' : 'Send'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {response && (
              <View style={styles.responseContainer}>
                <Text style={styles.responseText}>{response}</Text>
              </View>
            )}
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
  responseContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    borderWidth: 1,
    borderColor: '#333',
  },
  responseText: {
    fontSize: 14,
    color: '#ccc',
    fontStyle: 'italic',
    fontWeight: '500',
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
