import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { validateEmail, validatePassword, validateName, ValidationResult } from '@/utils';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation states
  const [nameValidation, setNameValidation] = useState<ValidationResult>({ isValid: true, errors: [] });
  const [emailValidation, setEmailValidation] = useState<ValidationResult>({ isValid: true, errors: [] });
  const [passwordValidation, setPasswordValidation] = useState<ValidationResult>({ isValid: true, errors: [] });
  const [confirmPasswordValidation, setConfirmPasswordValidation] = useState<ValidationResult>({ isValid: true, errors: [] });
  
  // Real-time validation
  useEffect(() => {
    if (name.length > 0) {
      setNameValidation(validateName(name));
    } else {
      setNameValidation({ isValid: true, errors: [] });
    }
  }, [name]);
  
  useEffect(() => {
    if (email.length > 0) {
      setEmailValidation(validateEmail(email));
    } else {
      setEmailValidation({ isValid: true, errors: [] });
    }
  }, [email]);
  
  useEffect(() => {
    if (password.length > 0) {
      setPasswordValidation(validatePassword(password));
    } else {
      setPasswordValidation({ isValid: true, errors: [] });
    }
  }, [password]);
  
  useEffect(() => {
    if (confirmPassword.length > 0) {
      const errors: string[] = [];
      if (password !== confirmPassword) {
        errors.push('Passwords do not match');
      }
      setConfirmPasswordValidation({ isValid: errors.length === 0, errors });
    } else {
      setConfirmPasswordValidation({ isValid: true, errors: [] });
    }
  }, [password, confirmPassword]);

  const handleSignup = async () => {
    // Force validation for all fields
    const nameVal = validateName(name);
    const emailVal = validateEmail(email);
    const passwordVal = validatePassword(password);
    const confirmVal = password !== confirmPassword ? { isValid: false, errors: ['Passwords do not match'] } : { isValid: true, errors: [] };
    
    setNameValidation(nameVal);
    setEmailValidation(emailVal);
    setPasswordValidation(passwordVal);
    setConfirmPasswordValidation(confirmVal);
    
    // Check if all validations pass
    if (!nameVal.isValid || !emailVal.isValid || !passwordVal.isValid || !confirmVal.isValid) {
      const allErrors = [...nameVal.errors, ...emailVal.errors, ...passwordVal.errors, ...confirmVal.errors];
      Alert.alert('Validation Error', allErrors[0]); // Show first error
      return;
    }

    if (!acceptTerms) {
      Alert.alert('Error', 'Please accept the Terms and Conditions');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Signup successful:', data);
        // Navigate to email verification page
        router.push(`/auth/verify-email?email=${encodeURIComponent(email.trim())}`);
      } else {
        Alert.alert('Error', data.detail || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTerms = () => {
    router.push('/auth/terms');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us and start planning your next adventure</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={[
                styles.textInput,
                name.length > 0 && !nameValidation.isValid && styles.textInputError,
                name.length > 0 && nameValidation.isValid && styles.textInputSuccess
              ]}
              placeholder="Enter your full name"
              placeholderTextColor="#666"
              autoCapitalize="words"
              autoCorrect={false}
            />
            {!nameValidation.isValid && nameValidation.errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>{error}</Text>
            ))}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={[
                styles.textInput,
                email.length > 0 && !emailValidation.isValid && styles.textInputError,
                email.length > 0 && emailValidation.isValid && styles.textInputSuccess
              ]}
              placeholder="Enter your email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {!emailValidation.isValid && emailValidation.errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>{error}</Text>
            ))}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={[
                styles.textInput,
                password.length > 0 && !passwordValidation.isValid && styles.textInputError,
                password.length > 0 && passwordValidation.isValid && styles.textInputSuccess
              ]}
              placeholder="Create a password"
              placeholderTextColor="#666"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {passwordValidation.isValid ? (
              <Text style={styles.passwordHint}>Must contain 8+ chars, uppercase, lowercase, number, special char</Text>
            ) : (
              passwordValidation.errors.map((error, index) => (
                <Text key={index} style={styles.errorText}>{error}</Text>
              ))
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={[
                styles.textInput,
                confirmPassword.length > 0 && !confirmPasswordValidation.isValid && styles.textInputError,
                confirmPassword.length > 0 && confirmPasswordValidation.isValid && styles.textInputSuccess
              ]}
              placeholder="Confirm your password"
              placeholderTextColor="#666"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {!confirmPasswordValidation.isValid && confirmPasswordValidation.errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>{error}</Text>
            ))}
          </View>

          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAcceptTerms(!acceptTerms)}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink} onPress={handleViewTerms}>
                    Terms and Conditions
                  </Text>
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.signupButtonText}>
              {isLoading ? 'Creating Account' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={[styles.socialButton, styles.googleButton]}>
            <View style={styles.socialButtonContent}>
              <View style={styles.googleLogo}>
                <Text style={styles.googleLogoText}>G</Text>
              </View>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.socialButton, styles.appleButton]}>
            <View style={styles.socialButtonContent}>
              <View style={styles.appleLogo}>
                <Text style={styles.appleLogoText}>⌘</Text>
              </View>
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginLink}>Sign In</Text>
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
    textAlign: 'center',
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
  passwordHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  textInputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  textInputSuccess: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    fontWeight: '500',
  },
  termsContainer: {
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 4,
    marginRight: 8,
    marginTop: 2,
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
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#ccc',
    fontWeight: '500',
    lineHeight: 20,
  },
  termsLink: {
    color: '#6366f1',
    fontWeight: '600',
  },
  signupButton: {
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
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
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
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButton: {
    borderColor: '#4285f4',
    backgroundColor: '#1a1a1a',
  },
  appleButton: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  googleLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleLogoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Arial',
  },
  appleLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appleLogoText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
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
  loginLink: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '700',
  },
}); 