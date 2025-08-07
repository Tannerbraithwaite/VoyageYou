import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import authService from '@/services/auth';
import oauthService from '@/services/oauth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    console.log('Attempting login with:', { email: email.trim() });
    
    try {
      const data = await authService.login(email.trim(), password, rememberMe);
      console.log('Login successful:', data);
      
      // Navigate to main app
      try {
        router.push('/(tabs)');
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback navigation
        router.push('/(tabs)');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset functionality would be implemented here');
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const user = await oauthService.signInWithGoogle();
      if (user) {
        console.log('Google sign-in successful:', user);
        router.push('/(tabs)');
      } else {
        Alert.alert('Error', 'Google sign-in failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Google sign-in failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    try {
      const user = await oauthService.signInWithApple();
      if (user) {
        console.log('Apple sign-in successful:', user);
        router.push('/(tabs)');
      } else {
        Alert.alert('Error', 'Apple sign-in failed');
      }
    } catch (error) {
      console.error('Apple sign-in error:', error);
      Alert.alert('Error', 'Apple sign-in failed');
    } finally {
      setIsAppleLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your travel account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.textInput}
              placeholder="Enter your email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.textInput}
              placeholder="Enter your password"
              placeholderTextColor="#666"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
                          <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In' : 'Sign In'}
              </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={[styles.socialButton, isGoogleLoading && styles.socialButtonDisabled]} 
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            <Text style={styles.socialButtonText}>
              {isGoogleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.socialButton, isAppleLoading && styles.socialButtonDisabled]} 
            onPress={handleAppleSignIn}
            disabled={isAppleLoading}
          >
            <Text style={styles.socialButtonText}>
              {isAppleLoading ? 'Signing in with Apple...' : 'Continue with Apple'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#1a1a1a',
    color: 'white',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#ccc',
    fontWeight: '500',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 16,
  },
  socialButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#1a1a1a',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
  signupLink: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '700',
  },
}); 