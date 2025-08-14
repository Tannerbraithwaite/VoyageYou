import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import GlassCard from '@/components/ui/GlassCard';
import { router } from 'expo-router';
import authService from '@/services/auth';

export default function ProfileScreen() {
  const [name, setName] = useState('Sarah Johnson');
  const [travelStyle, setTravelStyle] = useState('solo');
  const [budget, setBudget] = useState('moderate');
  const [interests, setInterests] = useState(['art', 'food', 'culture', 'photography', 'architecture']);
  const [additionalInfo, setAdditionalInfo] = useState('I prefer boutique hotels over chains, love trying local street food, and always pack light. I am comfortable with public transportation and enjoy getting lost in new cities.');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'success', 'error', or ''
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  // Load user profile data when component mounts
  useEffect(() => {
    const init = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          router.replace('/auth/login');
          return;
        }
        setUserId(user.id);
        await loadUserProfile(user.id);
      } catch (e) {
        router.replace('/auth/login');
      }
    };
    init();
  }, []);

  const loadUserProfile = async (resolvedUserId?: number) => {
    try {
      console.log('Loading user profile...');
      const effectiveUserId = typeof resolvedUserId === 'number' ? resolvedUserId : userId;
      if (!effectiveUserId) {
        console.log('No user id available, skipping load');
        return;
      }
      
      // Load user profile
      const profileResponse = await fetch(`http://localhost:8000/users/${effectiveUserId}`, {
        credentials: 'include'
      });
      console.log('Profile load response status:', profileResponse.status);
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('Loaded profile data:', profileData);
        
        // Update state with loaded data
        setName(profileData.name || 'Sarah Johnson');
        setTravelStyle(profileData.travel_style || 'solo');
        setBudget(profileData.budget_range || 'moderate');
        setAdditionalInfo(profileData.additional_info || '');
        
        // Load user interests
        const interestsResponse = await fetch(`http://localhost:8000/users/${effectiveUserId}/interests/`, {
          credentials: 'include'
        });
        console.log('Interests load response status:', interestsResponse.status);
        
        if (interestsResponse.ok) {
          const interestsData = await interestsResponse.json();
          console.log('Loaded interests data:', interestsData);
          
          // Extract interest IDs from the response
          const loadedInterests = interestsData.map((interest: any) => interest.interest || interest.interest_name);
          setInterests(loadedInterests.length > 0 ? loadedInterests : ['art', 'food', 'culture', 'photography', 'architecture']);
        } else {
          console.log('Failed to load interests, using defaults');
          setInterests(['art', 'food', 'culture', 'photography', 'architecture']);
        }
      } else {
        console.log('Failed to load profile, using defaults');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const travelStyles = [
    { id: 'solo', label: 'Solo Traveler', icon: 'S' },
    { id: 'couple', label: 'Couple', icon: 'C' },
    { id: 'family', label: 'Family', icon: 'F' },
    { id: 'group', label: 'Group', icon: 'G' },
  ];

  const budgetLevels = [
    { id: 'budget', label: 'Budget', icon: '$' },
    { id: 'moderate', label: 'Moderate', icon: 'M' },
    { id: 'luxury', label: 'Luxury', icon: 'L' },
  ];

  const interestOptions = [
    { id: 'art', label: 'Art & Museums', icon: '🎨' },
    { id: 'food', label: 'Food & Dining', icon: '🍽️' },
    { id: 'culture', label: 'Culture & History', icon: '🏛️' },
    { id: 'nature', label: 'Nature & Outdoors', icon: '🌲' },
    { id: 'adventure', label: 'Adventure & Sports', icon: '🏔️' },
    { id: 'relaxation', label: 'Relaxation & Wellness', icon: '🧘' },
    { id: 'shopping', label: 'Shopping & Markets', icon: '🛍️' },
    { id: 'nightlife', label: 'Nightlife & Entertainment', icon: '🌙' },
    { id: 'photography', label: 'Photography', icon: '📸' },
    { id: 'architecture', label: 'Architecture', icon: '🏗️' },
    { id: 'music', label: 'Music & Concerts', icon: '🎵' },
    { id: 'technology', label: 'Technology & Innovation', icon: '💻' },
    { id: 'fashion', label: 'Fashion & Style', icon: '👗' },
    { id: 'wine', label: 'Wine & Spirits', icon: '🍷' },
    { id: 'beach', label: 'Beach & Water Sports', icon: '🏖️' },
    { id: 'hiking', label: 'Hiking & Trekking', icon: '🥾' },
  ];

  const toggleInterest = (interestId: string) => {
    if (interests.includes(interestId)) {
      setInterests(interests.filter(id => id !== interestId));
    } else {
      setInterests([...interests, interestId]);
    }
  };

  const handleLogout = () => {
    console.log('Logging out...');
    router.push('/auth/login');
  };

  const handleSaveProfile = async () => {
    console.log('=== SAVE PROFILE STARTED ===');
    setIsSaving(true);
    setSaveStatus('');

    try {
      if (!userId) {
        console.log('No user id found, redirecting to login');
        router.replace('/auth/login');
        return;
      }
      
      console.log('Making profile update request...');
      // Update user profile
      const profileResponse = await fetch(`http://localhost:8000/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          travel_style: travelStyle,
          budget_range: budget,
          additional_info: additionalInfo
        }),
        credentials: 'include'
      });

      console.log('Profile response status:', profileResponse.status);
      const profileData = await profileResponse.json();
      console.log('Profile response data:', profileData);

      console.log('Making interests update request...');
      // Update user interests
      const interestsResponse = await fetch(`http://localhost:8000/users/${userId}/interests/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interests),
        credentials: 'include'
      });

      console.log('Interests response status:', interestsResponse.status);
      const interestsData = await interestsResponse.json();
      console.log('Interests response data:', interestsData);

      console.log('Checking if both requests succeeded...');
      if (profileResponse.ok && interestsResponse.ok) {
        console.log('Both requests succeeded!');
        setSaveStatus('success');
        // Try both Alert and console
        console.log('SUCCESS: Profile saved successfully!');
        try {
          Alert.alert('Success', 'Profile saved successfully!');
        } catch (alertError) {
          console.log('Alert failed, but profile was saved:', alertError);
        }
      } else {
        console.log('One or both requests failed');
        setSaveStatus('error');
        console.log('ERROR: Failed to save profile');
        try {
          Alert.alert('Error', 'Failed to save profile. Please try again.');
        } catch (alertError) {
          console.log('Alert failed for error:', alertError);
        }
      }
    } catch (error) {
      console.error('Save profile error:', error);
      setSaveStatus('error');
      console.log('NETWORK ERROR: Please try again');
      try {
        Alert.alert('Error', 'Network error. Please try again.');
      } catch (alertError) {
        console.log('Alert failed for network error:', alertError);
      }
    } finally {
      console.log('Setting isSaving to false');
      setIsSaving(false);
    }
  };

  console.log('Profile component rendering with interests:', interests);
  console.log('Interest options:', interestOptions);
  console.log('Travel styles:', travelStyles);
  console.log('Budget levels:', budgetLevels);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Profile</Text>
      
      {isLoading && (
        <GlassCard style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your profile</Text>
        </GlassCard>
      )}

      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.textInput}
            placeholder="Enter your name"
            placeholderTextColor="#666"
          />
        </View>
      </GlassCard>

      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Travel Style</Text>
        <View style={styles.optionsContainer}>
          {travelStyles.map((style) => {
            console.log('Rendering travel style:', style);
            return (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.optionButton,
                  travelStyle === style.id && styles.selectedOption
                ]}
                onPress={() => setTravelStyle(style.id)}
              >
                <Text style={styles.optionIcon}>{style.icon}</Text>
                <Text style={[
                  styles.optionText,
                  travelStyle === style.id && styles.selectedOptionText
                ]}>
                  {style.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Budget Level</Text>
        <View style={styles.optionsContainer}>
          {budgetLevels.map((level) => {
            console.log('Rendering budget level:', level);
            return (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.optionButton,
                  budget === level.id && styles.selectedOption
                ]}
                onPress={() => setBudget(level.id)}
              >
                <Text style={styles.optionIcon}>{level.icon}</Text>
                <Text style={[
                  styles.optionText,
                  budget === level.id && styles.selectedOptionText
                ]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <Text style={styles.sectionSubtitle}>Select all that apply</Text>
        <View style={styles.interestsContainer}>
          {interestOptions.map((interest) => {
            const isSelected = interests.includes(interest.id);
            console.log('Rendering interest:', interest.id, 'selected:', isSelected);
            return (
              <TouchableOpacity
                key={interest.id}
                style={[
                  styles.interestButton,
                  isSelected && styles.selectedInterest
                ]}
                onPress={() => toggleInterest(interest.id)}
              >
                <Text style={styles.interestIcon}>{interest.icon}</Text>
                <Text style={[
                  styles.interestText,
                  isSelected && styles.selectedInterestText
                ]}>
                  {interest.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Anything else we should know?</Text>
        <Text style={styles.sectionSubtitle}>Tell us about your travel preferences in your own words</Text>
        <View style={styles.inputContainer}>
          <TextInput
            value={additionalInfo}
            onChangeText={setAdditionalInfo}
            style={styles.textArea}
            placeholder="e.g., I prefer boutique hotels over chains, love trying local street food, and always pack light. I'm comfortable with public transportation and enjoy getting lost in new cities."
            placeholderTextColor="#666"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>
        <Text style={styles.helpText}>
          This helps our AI understand your unique travel style and provide better recommendations
        </Text>
      </GlassCard>

      <TouchableOpacity 
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
        onPress={handleSaveProfile}
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>
          {isSaving ? 'Saving' : 'Save Profile'}
        </Text>
      </TouchableOpacity>

      {/* Status indicator */}
      {saveStatus === 'success' && (
        <GlassCard style={styles.statusContainer}>
          <Text style={styles.successText}>Profile saved successfully!</Text>
        </GlassCard>
      )}
      
      {saveStatus === 'error' && (
        <GlassCard style={styles.statusContainer}>
          <Text style={styles.errorText}>Failed to save profile</Text>
        </GlassCard>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: 'white',
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 8,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedOption: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  optionText: {
    fontSize: 16,
    color: 'white',
  },
  selectedOptionText: {
    color: 'white',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 8,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedInterest: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  interestIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  interestText: {
    fontSize: 16,
    color: 'white',
  },
  selectedInterestText: {
    color: 'white',
  },
  helpText: {
    fontSize: 12,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#4a4a4a',
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
  },
}); 