import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Platform, Alert, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { createTripPrompt, TripRecommendation } from '@/utils';
import { useTripSettings } from '@/components/TripSettingsContext';
import DatePicker from '@/components/DatePicker';
import { calculateTripDuration } from '@/utils';
import { TripDates } from '@/types';
import authService from '@/services/auth';
import { VoyageYouHeader } from '@/components';
import { safeSessionStorage, safeLocalStorage } from '@/utils/storage';
import { API_BASE_URL } from '@/config/api';

export default function SuggestionsScreen() {
  const { settings, update } = useTripSettings();

  // Planning workflow state (re-added)
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningDestination, setPlanningDestination] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successDestination, setSuccessDestination] = useState('');

  const [tripDatesPerRec, setTripDatesPerRec] = useState<Record<number, TripDates>>({});

  // New state for travel profile
  const [userInsights, setUserInsights] = useState<string[]>([]);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [hasGeneratedProfile, setHasGeneratedProfile] = useState(false);

  // New state for trip recommendations
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<any[]>([]);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [hasGeneratedRecommendations, setHasGeneratedRecommendations] = useState(false);

  // Load user profile and saved data on component mount
  useEffect(() => {
    loadUserProfile();
    loadSavedData();
  }, []);

  // Load saved travel profile and recommendations from safeLocalStorage
  const loadSavedData = () => {
    try {
      if (typeof window !== 'undefined') {
        // Load saved travel profile
        const savedProfile = safeLocalStorage.getItem('userTravelProfile');
        if (savedProfile) {
          const profileData = JSON.parse(savedProfile);
          setUserInsights(profileData.insights);
          setHasGeneratedProfile(true);

        }

        // Load saved recommendations
        const savedRecommendations = safeLocalStorage.getItem('userTripRecommendations');
        if (savedRecommendations) {
          const recommendationsData = JSON.parse(savedRecommendations);
          setPersonalizedRecommendations(recommendationsData.recommendations);
          setHasGeneratedRecommendations(true);

        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  // Save travel profile to safeLocalStorage
  const saveTravelProfile = (insights: string[]) => {
    try {
      if (typeof window !== 'undefined') {
        const profileData = {
          insights,
          generatedAt: new Date().toISOString()
        };
        safeLocalStorage.setItem('userTravelProfile', JSON.stringify(profileData));

      }
    } catch (error) {
      console.error('Error saving travel profile:', error);
    }
  };

  // Save trip recommendations to safeLocalStorage
  const saveTripRecommendations = (recommendations: any[]) => {
    try {
      if (typeof window !== 'undefined') {
        const recommendationsData = {
          recommendations,
          generatedAt: new Date().toISOString()
        };
        safeLocalStorage.setItem('userTripRecommendations', JSON.stringify(recommendationsData));

      }
    } catch (error) {
      console.error('Error saving trip recommendations:', error);
    }
  };

  // Remove automatic recommendation generation
  // useEffect(() => {
  //   if (hasGeneratedProfile && userInsights.length > 0 && !hasGeneratedRecommendations) {
  //     generateTripRecommendations();
  //   }
  // }, [hasGeneratedProfile, userInsights, hasGeneratedRecommendations]);

  const loadUserProfile = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        // Load initial profile data
        const profileResponse = await fetch(`${API_BASE_URL}/users/${user.id}`, {
          credentials: 'include'
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();

      // Check if user has enough data for profile generation
      const hasProfileData = profileData && (
        profileData.name || 
        profileData.travel_style || 
        profileData.budget_range || 
        profileData.additional_info
      );

      if (!hasProfileData) {
        Alert.alert(
          'Complete Your Profile First', 
          'To generate personalized travel insights, please complete your profile with travel preferences and interests first.',
          [
            {
              text: 'Go to Profile',
              onPress: () => router.push('/(tabs)/profile')
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        return;
      }
          console.log('Loaded profile data:', profileData);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const generateTripRecommendations = async () => {
    try {
      setIsGeneratingRecommendations(true);
      const user = await authService.getCurrentUser();
      
      if (!user) {
        Alert.alert('Error', 'Please log in to generate trip recommendations');
        return;
      }

      // Fetch user profile data
      const profileResponse = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        credentials: 'include'
      });
      
      if (!profileResponse.ok) {
        console.warn('User profile not found or empty - this is normal for new users');
      }
      
      const profileData = await profileResponse.json();

      // Check if user has enough data for profile generation
      const hasProfileData = profileData && (
        profileData.name || 
        profileData.travel_style || 
        profileData.budget_range || 
        profileData.additional_info
      );

      if (!hasProfileData) {
        Alert.alert(
          'Complete Your Profile First', 
          'To generate personalized travel insights, please complete your profile with travel preferences and interests first.',
          [
            {
              text: 'Go to Profile',
              onPress: () => router.push('/(tabs)/profile')
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        return;
      }
      
      // Fetch user's past trips (completed trips with ratings)
      const tripsResponse = await fetch(`${API_BASE_URL}/users/${user.id}/trips/`, {
        credentials: 'include'
      });
      
      if (!tripsResponse.ok) {
        throw new Error('Failed to fetch user trips');
      }
      
      const tripsData = await tripsResponse.json();
      
      // Filter for completed trips and get activities with ratings
      const completedTrips = tripsData.filter((trip: any) => trip.status === 'completed');
      let allActivitiesWithRatings: any[] = [];
      
      for (const trip of completedTrips) {
        const activitiesResponse = await fetch(`${API_BASE_URL}/trips/${trip.id}/activities/`, {
          credentials: 'include'
        });
        
        if (activitiesResponse.ok) {
          const activities = await activitiesResponse.json();
          const ratedActivities = activities.filter((activity: any) => activity.rating > 0);
          allActivitiesWithRatings.push(...ratedActivities);
        }
      }
      
      // Fetch user interests
      const interestsResponse = await fetch(`${API_BASE_URL}/users/${user.id}/interests/`, {
        credentials: 'include'
      });
      
      let interests: string[] = [];
      if (interestsResponse.ok) {
        const interestsData = await interestsResponse.json();
        interests = interestsData.map((interest: any) => interest.interest);
      }
      
      // Create the prompt for trip recommendations
      const formattedRatings = allActivitiesWithRatings.map(activity => 
        `- ${activity.name} (${activity.activity_type}): ${activity.rating}/5 stars, $${activity.price}`
      ).join('\n');
      
      const tripRecommendationsPrompt = `You are a creative and adventurous travel expert creating personalized trip recommendations. Based on the following user information, suggest 3-5 diverse and exciting destinations that would be perfect for this traveler.

**IMPORTANT: Use high creativity and variety in your suggestions. Think outside the box and suggest unique destinations that might not be immediately obvious but would be perfect for this user's preferences.**

**User Profile Information:**
- Name: ${profileData.name}
- Travel Style: ${profileData.travel_style || 'Not specified'}
- Budget Range: ${profileData.budget_range || 'Not specified'}
- Additional Info: ${profileData.additional_info || 'Not specified'}
- Interests: ${interests.join(', ') || 'Not specified'}

**User Travel Profile Insights:**
${userInsights.map(insight => `- ${insight}`).join('\n')}

**Past Trip Ratings & Activities:**
${formattedRatings || 'No rated activities found'}

**Analysis Instructions:**
Analyze the user's travel preferences, ratings, and profile to suggest destinations that would be perfect for them. Consider:
1. What types of activities they consistently rate highly
2. Their budget preferences and travel style
3. Cultural and experiential preferences
4. Any patterns in destinations or activity types
5. How well destinations align with their interests
6. **Be creative and suggest diverse destinations - mix popular and hidden gems**

**Output Format:**
Return ONLY valid JSON in this exact format (remove duration and estimatedCost fields):
[
  {
    "id": 1,
    "destination": "City, Country",
    "reason": "Why this destination is perfect for this user (1-2 sentences)",
    "highlights": [
      "Specific activity or experience 1",
      "Specific activity or experience 2",
      "Specific activity or experience 3",
      "Specific activity or experience 4",
      "Specific activity or experience 5"
    ],
    "whyYoullLoveIt": "Detailed explanation of why this user will love this destination (2-3 sentences)",
    "confidence": 85
  }
]

**Requirements:**
- Generate 3-5 destination suggestions with HIGH VARIETY and CREATIVITY
- Each destination should have 5 specific highlights
- Confidence scores should be 75-95 based on how well the destination matches user preferences
- Focus on destinations that align with their highest-rated activities and interests
- Make recommendations specific and actionable
- Consider their travel style (solo, couple, family, group) and budget range
- **Suggest a mix of destinations: some obvious choices, some creative surprises, some hidden gems**
- **Think globally and consider diverse cultures, climates, and experiences**

Return ONLY the JSON array, no other text.`;


      
      // Send to LLM
      const response = await fetch(`${API_BASE_URL}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: tripRecommendationsPrompt,
          user_id: user.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Trip Recommendations Response:', result);
        
        // Parse the response to extract JSON
        const responseText = result.bot_response;
        let recommendations = [];
        
        try {
          // Look for JSON in the response
          const startIdx = responseText.indexOf('[');
          const endIdx = responseText.lastIndexOf(']') + 1;
          
          if (startIdx !== -1 && endIdx > startIdx) {
            const jsonStr = responseText.substring(startIdx, endIdx);
            recommendations = JSON.parse(jsonStr);
          }
        } catch (parseError) {
          console.error('Error parsing recommendations JSON:', parseError);
        }
        
        if (recommendations.length > 0) {
          // Add missing fields to match the expected format
          const formattedRecommendations = recommendations.map((rec: any, index: number) => ({
            id: rec.id || index + 1,
            destination: rec.destination,
            reason: rec.reason,
            duration: '3-5 days', // Default duration
            estimatedCost: 2000, // Default cost
            highlights: rec.highlights || [],
            whyYoullLoveIt: rec.whyYoullLoveIt,
            confidence: rec.confidence || 80
          }));
          
          setPersonalizedRecommendations(formattedRecommendations);
          setHasGeneratedRecommendations(true);
          saveTripRecommendations(formattedRecommendations); // Save generated recommendations
        } else {
          // Fallback to default recommendations if parsing fails
          setPersonalizedRecommendations([
            {
              id: 1,
              destination: 'Kyoto, Japan',
              reason: 'Based on your love for traditional culture and high ratings for Japanese activities',
              duration: '4 days',
              estimatedCost: 2800,
              highlights: [
                'Traditional Tea Ceremony at Historic Temples',
                'Sushi Making Class with Master Chef',
                'Zen Garden Meditation Experience',
                'Traditional Kimono Wearing',
                'Ancient Temple Architecture Tour'
              ],
              whyYoullLoveIt: 'You rated Japanese culture activities highly in Tokyo, and Kyoto offers even more authentic traditional experiences.',
              confidence: 95
            },
            {
              id: 2,
              destination: 'Florence, Italy',
              reason: 'Perfect for your art appreciation and food interests',
              duration: '3 days',
              estimatedCost: 2200,
              highlights: [
                'Uffizi Gallery Masterpieces Tour',
                'Tuscan Wine Tasting Experience',
                'Traditional Pasta Making Class',
                'Renaissance Architecture Walk',
                'Local Market Food Tour'
              ],
              whyYoullLoveIt: 'You loved the art galleries in Barcelona and food tours. Florence combines world-class art with incredible Italian cuisine.',
              confidence: 88
            },
            {
              id: 3,
              destination: 'Portland, Oregon',
              reason: 'Great for your budget-conscious travel style and food interests',
              duration: '3 days',
              estimatedCost: 1500,
              highlights: [
                'Food Cart Tour (Portland is famous for food carts!)',
                'Forest Park Hiking Trails',
                'Local Craft Beer Tasting',
                'Powell\'s Books (World\'s largest independent bookstore)',
                'Rose Garden Visit'
              ],
              whyYoullLoveIt: 'You enjoy food experiences and outdoor activities. Portland offers amazing food culture at a more affordable price point.',
              confidence: 82
            },
            {
              id: 4,
              destination: 'Marrakech, Morocco',
              reason: 'Exotic culture and markets that match your shopping interests',
              duration: '4 days',
              estimatedCost: 1900,
              highlights: [
                'Souk Market Shopping Experience',
                'Traditional Moroccan Cooking Class',
                'Atlas Mountains Day Trip',
                'Historic Medina Walking Tour',
                'Traditional Hammam Spa'
              ],
              whyYoullLoveIt: 'You rated shopping and cultural experiences highly. Marrakech offers vibrant market and rich cultural experiences.',
              confidence: 78
            }
          ]);
          setHasGeneratedRecommendations(true);
          saveTripRecommendations([
            {
              id: 1,
              destination: 'Kyoto, Japan',
              reason: 'Based on your love for traditional culture and high ratings for Japanese activities',
              duration: '4 days',
              estimatedCost: 2800,
              highlights: [
                'Traditional Tea Ceremony at Historic Temples',
                'Sushi Making Class with Master Chef',
                'Zen Garden Meditation Experience',
                'Traditional Kimono Wearing',
                'Ancient Temple Architecture Tour'
              ],
              whyYoullLoveIt: 'You rated Japanese culture activities highly in Tokyo, and Kyoto offers even more authentic traditional experiences.',
              confidence: 95
            },
            {
              id: 2,
              destination: 'Florence, Italy',
              reason: 'Perfect for your art appreciation and food interests',
              duration: '3 days',
              estimatedCost: 2200,
              highlights: [
                'Uffizi Gallery Masterpieces Tour',
                'Tuscan Wine Tasting Experience',
                'Traditional Pasta Making Class',
                'Renaissance Architecture Walk',
                'Local Market Food Tour'
              ],
              whyYoullLoveIt: 'You loved the art galleries in Barcelona and food tours. Florence combines world-class art with incredible Italian cuisine.',
              confidence: 88
            },
            {
              id: 3,
              destination: 'Portland, Oregon',
              reason: 'Great for your budget-conscious travel style and food interests',
              duration: '3 days',
              estimatedCost: 1500,
              highlights: [
                'Food Cart Tour (Portland is famous for food carts!)',
                'Forest Park Hiking Trails',
                'Local Craft Beer Tasting',
                'Powell\'s Books (World\'s largest independent bookstore)',
                'Rose Garden Visit'
              ],
              whyYoullLoveIt: 'You enjoy food experiences and outdoor activities. Portland offers amazing food culture at a more affordable price point.',
              confidence: 82
            },
            {
              id: 4,
              destination: 'Marrakech, Morocco',
              reason: 'Exotic culture and markets that match your shopping interests',
              duration: '4 days',
              estimatedCost: 1900,
              highlights: [
                'Souk Market Shopping Experience',
                'Traditional Moroccan Cooking Class',
                'Atlas Mountains Day Trip',
                'Historic Medina Walking Tour',
                'Traditional Hammam Spa'
              ],
              whyYoullLoveIt: 'You rated shopping and cultural experiences highly. Marrakech offers vibrant market and rich cultural experiences.',
              confidence: 78
            }
          ]);
        }
      } else {
        throw new Error('Failed to generate trip recommendations');
      }
    } catch (error) {
      console.error('Error generating trip recommendations:', error);
      Alert.alert('Error', 'Failed to generate trip recommendations. Using default suggestions.');
      
      // Fallback to default recommendations
      setPersonalizedRecommendations([
        {
          id: 1,
          destination: 'Kyoto, Japan',
          reason: 'Based on your love for traditional culture and high ratings for Japanese activities',
          duration: '4 days',
          estimatedCost: 2800,
          highlights: [
            'Traditional Tea Ceremony at Historic Temples',
            'Sushi Making Class with Master Chef',
            'Zen Garden Meditation Experience',
            'Traditional Kimono Wearing',
            'Ancient Temple Architecture Tour'
          ],
          whyYoullLoveIt: 'You rated Japanese culture activities highly in Tokyo, and Kyoto offers even more authentic traditional experiences.',
          confidence: 95
        },
        {
          id: 2,
          destination: 'Florence, Italy',
          reason: 'Perfect for your art appreciation and food interests',
          duration: '3 days',
          estimatedCost: 2200,
          highlights: [
            'Uffizi Gallery Masterpieces Tour',
            'Tuscan Wine Tasting Experience',
            'Traditional Pasta Making Class',
            'Renaissance Architecture Walk',
            'Local Market Food Tour'
          ],
          whyYoullLoveIt: 'You loved the art galleries in Barcelona and food tours. Florence combines world-class art with incredible Italian cuisine.',
          confidence: 88
        },
        {
          id: 3,
          destination: 'Portland, Oregon',
          reason: 'Great for your budget-conscious travel style and food interests',
          duration: '3 days',
          estimatedCost: 1500,
          highlights: [
            'Food Cart Tour (Portland is famous for food carts!)',
            'Forest Park Hiking Trails',
            'Local Craft Beer Tasting',
            'Powell\'s Books (World\'s largest independent bookstore)',
            'Rose Garden Visit'
          ],
          whyYoullLoveIt: 'You enjoy food experiences and outdoor activities. Portland offers amazing food culture at a more affordable price point.',
          confidence: 82
        },
        {
          id: 4,
          destination: 'Marrakech, Morocco',
          reason: 'Exotic culture and markets that match your shopping interests',
          duration: '4 days',
          estimatedCost: 1900,
          highlights: [
            'Souk Market Shopping Experience',
            'Traditional Moroccan Cooking Class',
            'Atlas Mountains Day Trip',
            'Historic Medina Walking Tour',
            'Traditional Hammam Spa'
          ],
          whyYoullLoveIt: 'You rated shopping and cultural experiences highly. Marrakech offers vibrant market and rich cultural experiences.',
          confidence: 78
        }
      ]);
      setHasGeneratedRecommendations(true);
      saveTripRecommendations([
        {
          id: 1,
          destination: 'Kyoto, Japan',
          reason: 'Based on your love for traditional culture and high ratings for Japanese activities',
          duration: '4 days',
          estimatedCost: 2800,
          highlights: [
            'Traditional Tea Ceremony at Historic Temples',
            'Sushi Making Class with Master Chef',
            'Zen Garden Meditation Experience',
            'Traditional Kimono Wearing',
            'Ancient Temple Architecture Tour'
          ],
          whyYoullLoveIt: 'You rated Japanese culture activities highly in Tokyo, and Kyoto offers even more authentic traditional experiences.',
          confidence: 95
        },
        {
          id: 2,
          destination: 'Florence, Italy',
          reason: 'Perfect for your art appreciation and food interests',
          duration: '3 days',
          estimatedCost: 2200,
          highlights: [
            'Uffizi Gallery Masterpieces Tour',
            'Tuscan Wine Tasting Experience',
            'Traditional Pasta Making Class',
            'Renaissance Architecture Walk',
            'Local Market Food Tour'
          ],
          whyYoullLoveIt: 'You loved the art galleries in Barcelona and food tours. Florence combines world-class art with incredible Italian cuisine.',
          confidence: 88
        },
        {
          id: 3,
          destination: 'Portland, Oregon',
          reason: 'Great for your budget-conscious travel style and food interests',
          duration: '3 days',
          estimatedCost: 1500,
          highlights: [
            'Food Cart Tour (Portland is famous for food carts!)',
            'Forest Park Hiking Trails',
            'Local Craft Beer Tasting',
            'Powell\'s Books (World\'s largest independent bookstore)',
            'Rose Garden Visit'
          ],
          whyYoullLoveIt: 'You enjoy food experiences and outdoor activities. Portland offers amazing food culture at a more affordable price point.',
          confidence: 82
        },
        {
          id: 4,
          destination: 'Marrakech, Morocco',
          reason: 'Exotic culture and markets that match your shopping interests',
          duration: '4 days',
          estimatedCost: 1900,
          highlights: [
            'Souk Market Shopping Experience',
            'Traditional Moroccan Cooking Class',
            'Atlas Mountains Day Trip',
            'Historic Medina Walking Tour',
            'Traditional Hammam Spa'
          ],
          whyYoullLoveIt: 'You rated shopping and cultural experiences highly. Marrakech offers vibrant market and rich cultural experiences.',
          confidence: 78
        }
      ]);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  const generateTravelProfile = async () => {
    try {
      setIsGeneratingProfile(true);
      const user = await authService.getCurrentUser();
      
      if (!user) {
        Alert.alert('Error', 'Please log in to generate your travel profile');
        return;
      }

      // If this is an update, clear old recommendations since they're based on old profile
      if (hasGeneratedProfile) {
        setPersonalizedRecommendations([]);
        setHasGeneratedRecommendations(false);
        // Clear saved recommendations
        if (typeof window !== 'undefined') {
          safeLocalStorage.removeItem('userTripRecommendations');
        }

      }

      // Fetch user profile data
      const profileResponse = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        credentials: 'include'
      });
      
      if (!profileResponse.ok) {
        console.warn('User profile not found or empty - this is normal for new users');
      }
      
      const profileData = await profileResponse.json();

      // Check if user has enough data for profile generation
      const hasProfileData = profileData && (
        profileData.name || 
        profileData.travel_style || 
        profileData.budget_range || 
        profileData.additional_info
      );

      if (!hasProfileData) {
        Alert.alert(
          'Complete Your Profile First', 
          'To generate personalized travel insights, please complete your profile with travel preferences and interests first.',
          [
            {
              text: 'Go to Profile',
              onPress: () => router.push('/(tabs)/profile')
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        return;
      }
      
      // Fetch user's past trips (completed trips with ratings)
      const tripsResponse = await fetch(`${API_BASE_URL}/users/${user.id}/trips/`, {
        credentials: 'include'
      });
      
      if (!tripsResponse.ok) {
        throw new Error('Failed to fetch user trips');
      }
      
      const tripsData = await tripsResponse.json();
      
      // Filter for completed trips and get activities with ratings
      const completedTrips = tripsData.filter((trip: any) => trip.status === 'completed');
      let allActivitiesWithRatings: any[] = [];
      
      for (const trip of completedTrips) {
        const activitiesResponse = await fetch(`${API_BASE_URL}/trips/${trip.id}/activities/`, {
          credentials: 'include'
        });
        
        if (activitiesResponse.ok) {
          const activities = await activitiesResponse.json();
          const ratedActivities = activities.filter((activity: any) => activity.rating > 0);
          allActivitiesWithRatings.push(...ratedActivities);
        }
      }
      
      // Fetch user interests
      const interestsResponse = await fetch(`${API_BASE_URL}/users/${user.id}/interests/`, {
        credentials: 'include'
      });
      
      let interests: string[] = [];
      if (interestsResponse.ok) {
        const interestsData = await interestsResponse.json();
        interests = interestsData.map((interest: any) => interest.interest);
      }
      
      // Create the prompt for the LLM
      const formattedRatings = allActivitiesWithRatings.map(activity => 
        `- ${activity.name} (${activity.activity_type}): ${activity.rating}/5 stars, $${activity.price}`
      ).join('\n');
      
      const travelProfilePrompt = `You are a travel expert analyzing a user's travel preferences and history. Based on the following information, create a personalized travel profile that captures their unique travel style, preferences, and patterns.

**User Profile Information:**
- Name: ${profileData.name}
- Travel Style: ${profileData.travel_style || 'Not specified'}
- Budget Range: ${profileData.budget_range || 'Not specified'}
- Additional Info: ${profileData.additional_info || 'Not specified'}
- Interests: ${interests.join(', ') || 'Not specified'}

**Past Trip Ratings & Activities:**
${formattedRatings || 'No rated activities found'}

**Analysis Instructions:**
Analyze the user's ratings, travel patterns, and preferences to create a comprehensive travel profile. Focus on:
1. What types of activities they consistently rate highly
2. Their budget preferences and spending patterns
3. Travel style preferences (solo, couple, family, group)
4. Cultural and experiential preferences
5. Any patterns in destinations or activity types

**Output Format:**
Return ONLY a bullet-point list of insights about the user's travel preferences, similar to this format:
• You love food experiences (rated 5/5 for food tours)
• Cultural activities are your favorite (average 4.5/5 rating)
• You prefer moderate budget travel ($1,800-3,200 range)
• You enjoy both free and paid activities equally
• Traditional/authentic experiences appeal to you most

Make the insights specific, data-driven, and actionable for future trip planning. Keep each bullet point concise and insightful.`;


      
      // Send to LLM using the travel profile endpoint
      const response = await fetch(`${API_BASE_URL}/chat/travel-profile/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: travelProfilePrompt,
          user_id: user.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        
        // Parse the response to extract bullet points
        const responseText = result.bot_response;
        const bulletPoints = responseText
          .split('\n')
          .filter((line: string) => line.trim().startsWith('•') || line.trim().startsWith('-'))
          .map((line: string) => line.trim().replace(/^[•-]\s*/, ''))
          .filter((point: string) => point.length > 0);
        
        if (bulletPoints.length > 0) {
          setUserInsights(bulletPoints);
          setHasGeneratedProfile(true);
          saveTravelProfile(bulletPoints); // Save generated profile
          
          // Show success message
          if (hasGeneratedProfile) {
            Alert.alert('✅ Profile Updated!', 'Your travel profile has been refreshed with the latest data. You can now generate new trip recommendations based on your updated profile.');
          }
        } else {
          // Fallback to default insights if parsing fails
          setUserInsights([
            'You love food experiences (rated 5/5 for food tours)',
            'Cultural activities are your favorite (average 4.5/5 rating)',
            'You prefer moderate budget travel ($1,800-3,200 range)',
            'You enjoy both free and paid activities equally',
            'Traditional/authentic experiences appeal to you most'
          ]);
          setHasGeneratedProfile(true);
          saveTravelProfile([
            'You love food experiences (rated 5/5 for food tours)',
            'Cultural activities are your favorite (average 4.5/5 rating)',
            'You prefer moderate budget travel ($1,800-3,200 range)',
            'You enjoy both free and paid activities equally',
            'Traditional/authentic experiences appeal to you most'
          ]);
          
          // Show success message for fallback
          if (hasGeneratedProfile) {
            Alert.alert('✅ Profile Updated!', 'Your travel profile has been refreshed with fallback insights. You can now generate new trip recommendations.');
          }
        }
      } else {
        throw new Error('Failed to generate travel profile');
      }
    } catch (error) {
      console.error('Error generating travel profile:', error);
      Alert.alert('Error', 'Failed to generate travel profile. Please try again.');
      
      // Fallback to default insights
      setUserInsights([
        'You love food experiences (rated 5/5 for food tours)',
        'Cultural activities are your favorite (average 4.5/5 rating)',
        'You prefer moderate budget travel ($1,800-3,200 range)',
        'You enjoy both free and paid activities equally',
        'Traditional/authentic experiences appeal to you most'
      ]);
      setHasGeneratedProfile(true);
      saveTravelProfile([
        'You love food experiences (rated 5/5 for food tours)',
        'Cultural activities are your favorite (average 4.5/5 rating)',
        'You prefer moderate budget travel ($1,800-3,200 range)',
        'You enjoy both free and paid activities equally',
        'Traditional/authentic experiences appeal to you most'
      ]);
      
      // Show success message for error fallback
      if (hasGeneratedProfile) {
        Alert.alert('✅ Profile Updated!', 'Your travel profile has been refreshed with fallback insights due to an error. You can now generate new trip recommendations.');
      }
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  // No fallback data - recommendations start blank

  const handlePlanTrip = async (recommendation: TripRecommendation) => {
    // Override duration inside prompt to chosenDays
    let tripPrompt = createTripPrompt(recommendation);

    const dates = tripDatesPerRec[(recommendation as any).id || 0];
    if (dates?.startDate && dates.endDate) {
      const diffDays = calculateTripDuration(dates.startDate, dates.endDate);
      // replace original duration text in prompt
      tripPrompt = tripPrompt.replaceAll(recommendation.duration, `${diffDays} days`);
      const startISO = dates.startDate.toISOString().split('T')[0];
      const endISO = dates.endDate.toISOString().split('T')[0];
      const flexText = dates.isFlexible ? ' (flexible)' : '';
      tripPrompt += `\nTrip Dates: ${startISO} to ${endISO} (${diffDays} days)${flexText}.`;
      update({ startDate: dates.startDate, days: diffDays });
    }
    

    
    // Start planning state
    setIsPlanning(true);
    setPlanningDestination(recommendation.destination);
    
    try {
      // Call the LLM directly
      const response = await fetch(`${API_BASE_URL}/chat/enhanced/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: tripPrompt,
          user_id: 1, // Default user ID for demo
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ LLM response received:', result);
        
        // Store the itinerary data in safeSessionStorage
        if (typeof window !== 'undefined') {
          safeSessionStorage.setItem('currentItinerary', JSON.stringify(result));
          console.log('💾 Itinerary saved to session storage');
        }
        
        // Show success message briefly
        setSuccessDestination(recommendation.destination);
        setShowSuccess(true);
        
        // Navigate to the home page after a brief delay
        setTimeout(() => {
          console.log('🚀 Attempting to navigate to home page...');
          console.log('📍 Current location: suggestions tab');
          
          // Try multiple navigation approaches
          try {
            // First try: navigate to the tabs layout
            console.log('🔄 Attempt 1: router.push("/(tabs)")');
            router.push('/(tabs)');
            console.log('✅ Navigation command sent successfully');
          } catch (navError) {
            console.error('❌ First navigation attempt failed:', navError);
            
            try {
              // Second try: navigate to the root
              console.log('🔄 Attempt 2: router.push("/")');
              router.push('/');
              console.log('✅ Second navigation attempt successful');
            } catch (secondError) {
              console.error('❌ Second navigation attempt failed:', secondError);
              
              try {
                // Third try: navigate to the tabs layout again
                console.log('🔄 Attempt 3: router.push("/(tabs)")');
                router.push('/(tabs)');
                console.log('✅ Third navigation attempt successful');
              } catch (thirdError) {
                console.error('❌ Third navigation attempt failed:', thirdError);
                console.log('🚨 All navigation attempts failed - user will need to manually navigate');
              }
            }
          }
        }, 800); // Reduced from 1500ms to 800ms
      } else {
        console.error('❌ LLM API error:', response.status);
        // Fallback to regular chat endpoint
        const fallbackResponse = await fetch(`${API_BASE_URL}/chat/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: tripPrompt,
            user_id: 1,
          }),
        });

        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          console.log('✅ Fallback response received:', fallbackResult);
          
          // Store a simplified itinerary
          const simplifiedItinerary = {
            destination: recommendation.destination,
            duration: recommendation.duration,
            description: `AI-planned trip to ${recommendation.destination} based on your preferences. ${recommendation.whyYoullLoveIt}`,
            flights: [],
            hotel: {
              name: 'Hotel TBD',
              address: 'Address TBD',
              check_in: 'TBD',
              check_out: 'TBD',
              room_type: 'Standard',
              price: 150,
              total_nights: parseInt(recommendation.duration.split(' ')[0])
            },
            schedule: [],
            total_cost: recommendation.estimatedCost,
            bookable_cost: recommendation.estimatedCost * 0.6,
            estimated_cost: recommendation.estimatedCost * 0.4
          };
          
          if (typeof window !== 'undefined') {
            safeSessionStorage.setItem('currentItinerary', JSON.stringify(simplifiedItinerary));
            console.log('💾 Simplified itinerary saved to session storage');
          }
          
          // Show success message briefly
          setSuccessDestination(recommendation.destination);
          setShowSuccess(true);
          
          // Navigate to the home page after a brief delay
          setTimeout(() => {
            console.log('🚀 Attempting to navigate to home page...');
            console.log('📍 Current location: suggestions tab');
            
            // Try multiple navigation approaches
            try {
              // First try: navigate to the tabs layout
              console.log('🔄 Attempt 1: router.push("/(tabs)")');
              router.push('/(tabs)');
              console.log('✅ Navigation command sent successfully');
            } catch (navError) {
              console.error('❌ First navigation attempt failed:', navError);
              
              try {
                // Second try: navigate to the root
                console.log('🔄 Attempt 2: router.push("/")');
                router.push('/');
                console.log('✅ Second navigation attempt successful');
              } catch (secondError) {
                console.error('❌ Second navigation attempt failed:', secondError);
                
                try {
                  // Third try: navigate to the tabs layout again
                  console.log('🔄 Attempt 3: router.push("/(tabs)")');
                  router.push('/(tabs)');
                  console.log('✅ Third navigation attempt successful');
                } catch (thirdError) {
                  console.error('❌ Third navigation attempt failed:', thirdError);
                  console.log('🚨 All navigation attempts failed - user will need to manually navigate');
                }
              }
            }
          }, 800); // Reduced from 1500ms to 800ms
        } else {
          console.error('❌ Both API endpoints failed');
          Alert.alert('Error', 'Sorry, I encountered an error while planning your trip. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ Error planning trip:', error);
      Alert.alert('Error', 'Sorry, I encountered an error while planning your trip. Please try again.');
    } finally {
      setIsPlanning(false);
      setPlanningDestination('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <VoyageYouHeader />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Next Adventure</Text>
          <Text style={styles.subtitle}>AI-powered recommendations based on your preferences</Text>
        </View>

        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Your Travel Profile</Text>
          {userInsights.length > 0 ? (
            <>
              {userInsights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <Text style={styles.insightText}>• {insight}</Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.noProfileText}>
              Click the button below to generate your personalized travel profile based on your ratings and preferences.
            </Text>
          )}
          
          <TouchableOpacity
            style={styles.generateProfileButton}
            onPress={generateTravelProfile}
            disabled={isGeneratingProfile}
          >
            {isGeneratingProfile ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.generateProfileButtonText}>Generating Profile...</Text>
              </View>
            ) : (
              <Text style={styles.generateProfileButtonText}>
                {hasGeneratedProfile ? '🔄 Refresh Travel Profile' : 'Get My Travel Profile'}
              </Text>
            )}
          </TouchableOpacity>
          
          {hasGeneratedProfile && (
            <TouchableOpacity
              style={styles.generateRecommendationsButton}
              onPress={generateTripRecommendations}
              disabled={isGeneratingRecommendations}
            >
              <Text style={styles.generateRecommendationsButtonText}>
                {isGeneratingRecommendations ? 'Generating...' : '🎯 Generate Trip Recommendations'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Personalized Recommendations</Text>
          
          {isGeneratingRecommendations ? (
            <View style={styles.loadingRecommendations}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingRecommendationsText}>
                Generating personalized trip recommendations based on your profile...
              </Text>
            </View>
          ) : personalizedRecommendations.length > 0 ? (
            <>
              {personalizedRecommendations.map((recommendation, index) => {
            const dates = tripDatesPerRec[(recommendation as any).id || index];
            const startDate = dates?.startDate ?? null;
            const endDate = dates?.endDate ?? null;
            const days = startDate && endDate ? calculateTripDuration(startDate, endDate) : parseInt(recommendation.duration);
            return (
              <View key={(recommendation as any).id || index} style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <View style={styles.destinationInfo}>
                    <Text style={styles.destinationName}>{recommendation.destination}</Text>
                    {/* Removed duration & price; confidence badge already shows match */}
                    <Text style={styles.destinationDetails}></Text>
                  </View>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>{recommendation.confidence}%</Text>
                  </View>
                </View>

                <Text style={styles.reasonText}>{recommendation.reason}</Text>

                <View style={styles.whyYoullLoveSection}>
                  <Text style={styles.whyYoullLoveTitle}>Why You'll Love It</Text>
                  <Text style={styles.whyYoullLoveText}>{recommendation.whyYoullLoveIt}</Text>
                </View>

                <View style={styles.highlightsSection}>
                  <Text style={styles.highlightsTitle}>Top Highlights</Text>
                  {recommendation.highlights.map((highlight: string, index: number) => (
                    <View key={index} style={styles.highlightItem}>
                      <Text style={styles.highlightText}>• {highlight}</Text>
                    </View>
                  ))}
                </View>

                {/* Start date selector */}
                <DatePicker
                  tripDates={dates ?? { startDate: null, endDate: null, isFlexible: false }}
                  onDatesChange={(d: TripDates) => setTripDatesPerRec(prev => ({ ...prev, [(recommendation as any).id || index]: d }))}
                />

                {/* Plan button uses days variable already */}
                <TouchableOpacity
                  style={styles.planTripButton}
                  onPress={() => handlePlanTrip(recommendation)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.planTripButtonText}>Plan This Trip</Text>
                  <Text style={styles.planTripButtonSubtext}>
                    🤖 AI will create a complete itinerary
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.aiPlanningInfo}>
                  <Text style={styles.aiPlanningText}>
                    ✈️ Flights • 🏨 Hotels • 📅 Daily Schedule • 🎯 Activities • 💰 Pricing
                  </Text>
                </View>
              </View>
            );
          })}
            </>
          ) : (
            <View style={styles.noRecommendations}>
              <Text style={styles.noRecommendationsText}>
                {hasGeneratedProfile 
                  ? 'Click the button above to generate personalized trip recommendations based on your travel profile!'
                  : 'Generate your travel profile first to get personalized trip recommendations!'
                }
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 These recommendations get smarter as you rate more activities!
          </Text>
        </View>
      </ScrollView>
      
      {/* Planning Modal */}
      <Modal
        visible={isPlanning}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.planningModal}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.planningTitle}>Planning Your Trip</Text>
            <Text style={styles.planningSubtitle}>
              Creating a detailed itinerary for {planningDestination}...
            </Text>
            <Text style={styles.planningDetails}>
              🤖 AI is analyzing your preferences and the destination{'\n'}
              ✈️ Researching flight options and pricing{'\n'}
              🏨 Finding the best hotel recommendations{'\n'}
              📅 Building a day-by-day schedule{'\n'}
              🎯 Selecting activities based on your interests{'\n'}
              💰 Calculating realistic costs and alternatives{'\n'}
              🚗 Planning practical logistics and transportation
            </Text>
            <Text style={styles.planningNote}>
              This usually takes 10-30 seconds. Your complete itinerary will be ready on the Home tab!
            </Text>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        transparent={true}
        animationType="fade"
        onShow={() => {
          console.log('🎉 Success modal is now visible');
        }}
        onDismiss={() => {
          console.log('👋 Success modal was dismissed');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>Trip Planned Successfully!</Text>
            <Text style={styles.successSubtitle}>
              Your {successDestination} itinerary is ready
            </Text>
            <Text style={styles.successDetails}>
              ✈️ Flights and hotels selected{'\n'}
              📅 Daily schedule created{'\n'}
              🎯 Activities tailored to your interests{'\n'}
              💰 Costs calculated{'\n'}
              🚀 Redirecting to your itinerary...
            </Text>
            
            <TouchableOpacity
              style={styles.manualNavButton}
              onPress={() => {
                console.log('🔄 Manual navigation button pressed');
                // Hide the success modal first
                setShowSuccess(false);
                // Then navigate
                try {
                  router.push('/(tabs)');
                  console.log('✅ Manual navigation successful');
                } catch (error) {
                  console.error('❌ Manual navigation failed:', error);
                }
              }}
            >
              <Text style={styles.manualNavButtonText}>Go to My Trip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* DatePicker handles its own modal */}
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
  },
  header: {
    padding: 24,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 28,
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
  insightsSection: {
    margin: 16,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  insightItem: {
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    fontWeight: '500',
  },
  generateProfileButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 20,
  },
  generateProfileButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  noProfileText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingRecommendations: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  loadingRecommendationsText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  regenerateButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  regenerateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },
  generateRecommendationsButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  generateRecommendationsButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  noRecommendations: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  noRecommendationsText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  recommendationsSection: {
    margin: 16,
  },
  recommendationCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  destinationDetails: {
    fontSize: 14,
    color: '#ccc',
    fontWeight: '500',
  },
  confidenceBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  reasonText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '500',
  },
  whyYoullLoveSection: {
    marginBottom: 16,
  },
  whyYoullLoveTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  whyYoullLoveText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    fontWeight: '500',
  },
  highlightsSection: {
    marginBottom: 16,
  },
  highlightsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  highlightItem: {
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    fontWeight: '500',
  },
  planTripButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  planTripButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  planTripButtonSubtext: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  aiPlanningInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  aiPlanningText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planningModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 32,
    margin: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  planningTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  planningSubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  planningDetails: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  planningNote: {
    fontSize: 14,
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  successModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 32,
    margin: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  successIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  successDetails: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  manualNavButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 20,
  },
  manualNavButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
}); 