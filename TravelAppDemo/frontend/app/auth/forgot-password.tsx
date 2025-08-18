import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import authService from '@/services/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setIsLoading(true);
    setSuccessMessage(''); // Clear previous message
    try {
      await authService.forgotPassword(email);
      const message = 'If an account with that email exists, a reset link has been sent.';
      setSuccessMessage(message);
      
      // Show native alert on mobile, but web users will see the inline message
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Success',
          message,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      setSuccessMessage(''); // Clear success message on error
      Alert.alert('Error', error instanceof Error ? error.message : 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your email and we'll send you a link to reset your password.</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSubmit} disabled={isLoading}>
        <Text style={styles.buttonText}>{isLoading ? 'Sending...' : 'Send Reset Link'}</Text>
      </TouchableOpacity>
      
      {/* Success Message - visible inline for web users */}
      {successMessage ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{successMessage}</Text>
          {Platform.OS === 'web' && (
            <TouchableOpacity style={styles.backButton} onPress={() => router.push('/auth/login')}>
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#1a1a1a',
    color: 'white',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  successContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#1a3a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4ade80',
  },
  successText: {
    fontSize: 14,
    color: '#4ade80',
    textAlign: 'center',
    marginBottom: 12,
  },
  backButton: {
    backgroundColor: '#4ade80',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a3a1a',
  },
});
