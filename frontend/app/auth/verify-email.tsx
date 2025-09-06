import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyEmailScreen() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'waiting' | 'success' | 'error'>('waiting');
  const params = useLocalSearchParams();
  const { email, token } = params;

  useEffect(() => {
    // If we have a token, automatically verify it
    if (token) {
      verifyEmail(token as string);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify?token=${verificationToken}`);
      
      if (response.ok) {
        setVerificationStatus('success');
        Alert.alert(
          'Email Verified!',
          'Your email has been verified successfully. You can now log in to your account.',
          [
            {
              text: 'Go to Login',
              onPress: () => router.push('/auth/login')
            }
          ]
        );
      } else {
        const errorData = await response.json();
        setVerificationStatus('error');
        Alert.alert('Verification Failed', errorData.detail || 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const resendVerification = async () => {
    Alert.alert('Resend Verification', 'This feature would be implemented to resend verification emails.');
  };

  const goToLogin = () => {
    router.push('/auth/login');
  };

  if (verificationStatus === 'success') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          </View>
          <Text style={styles.title}>Email Verified!</Text>
          <Text style={styles.subtitle}>
            Your email has been verified successfully. You can now log in to your account.
          </Text>
          <TouchableOpacity style={styles.button} onPress={goToLogin}>
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="close-circle" size={80} color="#ef4444" />
          </View>
          <Text style={styles.title}>Verification Failed</Text>
          <Text style={styles.subtitle}>
            The verification link is invalid or has expired. Please check your email for a new verification link.
          </Text>
          <TouchableOpacity style={styles.button} onPress={resendVerification}>
            <Text style={styles.buttonText}>Resend Verification</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={goToLogin}>
            <Text style={styles.secondaryButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail" size={80} color="#6366f1" />
        </View>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification link to:
        </Text>
        <Text style={styles.email}>{email || 'your email'}</Text>
        <Text style={styles.instructions}>
          Please check your email and click the verification link to activate your account.
        </Text>
        
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={20} color="#6366f1" />
          <Text style={styles.infoText}>
            The verification link will expire in 24 hours.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, isVerifying && styles.buttonDisabled]} 
          onPress={() => resendVerification()}
          disabled={isVerifying}
        >
          <Text style={styles.buttonText}>
            {isVerifying ? 'Verifying...' : 'Resend Verification'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={goToLogin}>
          <Text style={styles.secondaryButtonText}>Back to Login</Text>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  instructions: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    maxWidth: 300,
  },
  infoText: {
    fontSize: 14,
    color: '#ccc',
    marginLeft: 8,
    flex: 1,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    minWidth: 200,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  secondaryButton: {
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
}); 