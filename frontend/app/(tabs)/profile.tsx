import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, SafeAreaView } from 'react-native';
import GlassCard from '@/components/ui/GlassCard';
import { router } from 'expo-router';
import authService from '@/services/auth';
import { VoyageYouHeader } from '@/components';
import { API_BASE_URL } from '@/config/api';

export default function ProfileScreen() {
  const [name, setName] = useState('');

  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [location, setLocation] = useState('');
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [travelStyle, setTravelStyle] = useState('');
  const [budget, setBudget] = useState('');
  const [interests, setInterests] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
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
        await loadUserLocation(user.id);
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
      const profileResponse = await fetch(`${API_BASE_URL}/users/${effectiveUserId}`, {
        credentials: 'include'
      });
      console.log('Profile load response status:', profileResponse.status);
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('Loaded profile data:', profileData);
        
        // Update state with loaded data
        setName(profileData.name || '');
        setPhone(profileData.phone || '');
        setBirthdate(profileData.birthdate || '');
        setAge(profileData.birthdate ? calculateAge(profileData.birthdate) : null);
        setGender(profileData.gender || '');
        setNationality(profileData.nationality || '');
        setPassportNumber(profileData.passport_number || '');
        setEmergencyContact(profileData.emergency_contact || '');
        setLocation(profileData.location || '');
        setTravelStyle(profileData.travel_style || '');
        setBudget(profileData.budget_range || '');
        setAdditionalInfo(profileData.additional_info || '');
        
        // Load user interests
        const interestsResponse = await fetch(`${API_BASE_URL}/users/${effectiveUserId}/interests/`, {
          credentials: 'include'
        });
        console.log('Interests load response status:', interestsResponse.status);
        
        if (interestsResponse.ok) {
          const interestsData = await interestsResponse.json();
          console.log('Loaded interests data:', interestsData);
          
          // Extract interest IDs from the response
          const loadedInterests = interestsData.map((interest: any) => interest.interest || interest.interest_name);
          setInterests(loadedInterests.length > 0 ? loadedInterests : []);
        } else {
          console.log('Failed to load interests, using defaults');
          setInterests([]);
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

  const loadUserLocation = async (resolvedUserId?: number) => {
    try {
      const effectiveUserId = typeof resolvedUserId === 'number' ? resolvedUserId : userId;
      if (!effectiveUserId) {
        console.log('No user id available, skipping location load');
        return;
      }
      
      // Load user profile to get location
      const profileResponse = await fetch(`${API_BASE_URL}/users/${effectiveUserId}`, {
        credentials: 'include'
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.location) {
          setUserLocation(profileData.location);
          console.log('Loaded user location:', profileData.location);
        }
      }
    } catch (error) {
      console.error('Error loading user location:', error);
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

  const genderOptions = [
    { id: 'male', label: 'Male', icon: '👨' },
    { id: 'female', label: 'Female', icon: '👩' },
    { id: 'non-binary', label: 'Non-binary', icon: '🌈' },
    { id: 'prefer-not-to-say', label: 'Prefer not to say', icon: '🤐' },
  ];

  const nationalityOptions = [
    { id: 'us', label: 'United States', icon: '🇺🇸' },
    { id: 'uk', label: 'United Kingdom', icon: '🇬🇧' },
    { id: 'ca', label: 'Canada', icon: '🇨🇦' },
    { id: 'au', label: 'Australia', icon: '🇦🇺' },
    { id: 'de', label: 'Germany', icon: '🇩🇪' },
    { id: 'fr', label: 'France', icon: '🇫🇷' },
    { id: 'it', label: 'Italy', icon: '🇮🇹' },
    { id: 'es', label: 'Spain', icon: '🇪🇸' },
    { id: 'jp', label: 'Japan', icon: '🇯🇵' },
    { id: 'cn', label: 'China', icon: '🇨🇳' },
    { id: 'in', label: 'India', icon: '🇮🇳' },
    { id: 'br', label: 'Brazil', icon: '🇧🇷' },
    { id: 'mx', label: 'Mexico', icon: '🇲🇽' },
    { id: 'other', label: 'Other', icon: '🌍' },
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

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleBirthdateChange = (date: string) => {
    setBirthdate(date);
    const calculatedAge = calculateAge(date);
    setAge(calculatedAge);
  };

  const handleLogout = () => {
    console.log('Logging out...');
    router.push('/auth/login');
  };

  const handleSaveProfile = async () => {
    console.log('🔄 Starting profile save...');
    setIsSaving(true);
    
    // First check if user is authenticated
    const currentUser = await authService.getCurrentUser();
    console.log('🔍 Current user check result:', currentUser);
    
    if (!currentUser) {
      console.log('❌ No current user found - authentication required');
      Alert.alert('Authentication Required', 'Please log in to save your profile.', [
        { text: 'Login', onPress: () => router.push('/auth/login') }
      ]);
      setIsSaving(false);
      return;
    }
    console.log('✅ User authenticated:', currentUser.id, currentUser.email);
    console.log('=== SAVE PROFILE STARTED ===');
    setSaveStatus('');

    try {
      if (!userId) {
        console.log('No user id found, redirecting to login');
        router.replace('/auth/login');
        return;
      }
      
      console.log('Making profile update request...');
      // Update user profile
      const profilePayload = {
        name,
        phone,
        birthdate: birthdate ? new Date(birthdate).toISOString().split('T')[0] : null,
        gender,
        nationality,
        passport_number: passportNumber,
        emergency_contact: emergencyContact,
        location,
        travel_style: travelStyle,
        budget_range: budget,
        additional_info: additionalInfo
      };
      
      console.log('📤 Sending profile update to:', `${API_BASE_URL}/users/${userId}`);
      console.log('📦 Profile payload:', profilePayload);
      
      const profileResponse = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profilePayload),
        credentials: 'include'
      });

      console.log('📥 Profile response status:', profileResponse.status);
      console.log('📥 Profile response headers:', Object.fromEntries(profileResponse.headers.entries()));
      
      const profileData = await profileResponse.json();
      console.log('📥 Profile response data:', profileData);

      if (!profileResponse.ok) {
        console.error('❌ Profile update failed:', profileResponse.status, profileData);
        if (profileResponse.status === 401) {
          Alert.alert('Authentication Error', 'Please log in again to save your profile.', [
            { text: 'Login', onPress: () => router.push('/auth/login') }
          ]);
          return;
        } else if (profileResponse.status === 403) {
          Alert.alert('Permission Error', 'You do not have permission to update this profile.');
          return;
        } else {
          Alert.alert('Error', `Profile update failed: ${profileData.detail || 'Unknown error'}`);
          return;
        }
      }

      console.log('Making interests update request...');
      // Update user interests
      const interestsResponse = await fetch(`${API_BASE_URL}/users/${userId}/interests/`, {
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
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        onScrollBeginDrag={() => setShowNationalityDropdown(false)}
      >
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
        

        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            style={styles.textInput}
            placeholder="Enter your phone number"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location (Flight Origin)</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            style={styles.textInput}
            placeholder="e.g., New York, NY or London, UK"
            placeholderTextColor="#666"
            autoCapitalize="words"
          />
          <Text style={styles.helperText}>
            This is where your flights will depart from when planning trips
          </Text>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Birthdate</Text>
          <TextInput
            value={birthdate}
            onChangeText={handleBirthdateChange}
            style={styles.textInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#666"
          />
          {age !== null && (
            <Text style={styles.ageText}>Age: {age} years old</Text>
          )}
        </View>
      </GlassCard>

      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.optionsContainer}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  gender === option.id && styles.selectedOption
                ]}
                onPress={() => setGender(option.id)}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text style={[
                  styles.optionText,
                  gender === option.id && styles.selectedOptionText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nationality</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowNationalityDropdown(!showNationalityDropdown)}
          >
            <Text style={nationality ? styles.dropdownButtonText : styles.dropdownButtonPlaceholder}>
              {nationality ? 
                `${nationalityOptions.find(opt => opt.id === nationality)?.icon} ${nationalityOptions.find(opt => opt.id === nationality)?.label}` :
                'Select your nationality'
              }
            </Text>
            <Text style={[styles.dropdownArrow, showNationalityDropdown && styles.dropdownArrowRotated]}>
              ▼
            </Text>
          </TouchableOpacity>
          
          {showNationalityDropdown && (
            <View style={styles.dropdownOptions}>
              {nationalityOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setNationality(option.id);
                    setShowNationalityDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownOptionIcon}>{option.icon}</Text>
                  <Text style={styles.dropdownOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
        <Text style={styles.sectionTitle}>Travel Documents</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Passport Number</Text>
          <TextInput
            value={passportNumber}
            onChangeText={setPassportNumber}
            style={styles.textInput}
            placeholder="Enter your passport number"
            placeholderTextColor="#666"
            autoCapitalize="characters"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Emergency Contact</Text>
          <TextInput
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            style={styles.textInput}
            placeholder="Name and phone number"
            placeholderTextColor="#666"
          />
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

      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Data</Text>
        <Text style={styles.privacyText}>
          🔒 Your personal information is securely stored and used only to provide you with personalized travel recommendations. 
          We never share your data with third parties without your explicit consent.
        </Text>
        <Text style={styles.privacySubtext}>
          Required fields: Name{'\n'}
          Optional fields: All other information helps us provide better travel suggestions
        </Text>
      </GlassCard>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    position: 'relative',
  },
  scrollView: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
    paddingBottom: 140, // Add extra padding for tab bar and safe area
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
    color: '#a78bfa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#f87171',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  ageText: {
    fontSize: 14,
    color: '#6366f1',
    marginTop: 5,
    fontStyle: 'italic',
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    fontStyle: 'italic',
  },
  privacyText: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  privacySubtext: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
  dropdownButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    color: 'white',
    fontSize: 16,
  },
  dropdownButtonPlaceholder: {
    color: '#666',
    fontSize: 16,
  },
  dropdownArrow: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dropdownArrowRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownOptions: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    marginTop: 5,
    maxHeight: 200,
    overflow: 'scroll',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dropdownOptionIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  dropdownOptionText: {
    color: 'white',
    fontSize: 16,
  },
}); 