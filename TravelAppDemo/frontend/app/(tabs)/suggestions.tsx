import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { router } from 'expo-router';
import { createTripPrompt, TripRecommendation } from '@/utils';

export default function SuggestionsScreen() {
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningDestination, setPlanningDestination] = useState('');
  
  const personalizedRecommendations = [
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
      whyYoullLoveIt: 'You rated shopping and cultural experiences highly. Marrakech offers vibrant markets and rich cultural experiences.',
      confidence: 78
    }
  ];

  const userInsights = [
    'You love food experiences (rated 5/5 for food tours)',
    'Cultural activities are your favorite (average 4.5/5 rating)',
    'You prefer moderate budget travel ($1,800-3,200 range)',
    'You enjoy both free and paid activities equally',
    'Traditional/authentic experiences appeal to you most'
  ];

  const handlePlanTrip = async (recommendation: TripRecommendation) => {
    const tripPrompt = createTripPrompt(recommendation);
    
    console.log('🎯 Planning trip to:', recommendation.destination);
    console.log('📝 Trip prompt:', tripPrompt);
    
    // Start planning state
    setIsPlanning(true);
    setPlanningDestination(recommendation.destination);
    
    try {
      // Call the LLM directly
      const response = await fetch('http://localhost:8000/chat/enhanced/', {
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
        
        // Store the itinerary data in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('currentItinerary', JSON.stringify(result));
        }
        
        // Navigate to the home page (now integrated with scheduling)
        router.push('/(tabs)/');
      } else {
        console.error('❌ LLM API error:', response.status);
        // Fallback to regular chat endpoint
        const fallbackResponse = await fetch('http://localhost:8000/chat/', {
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
            description: `Trip to ${recommendation.destination}`,
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
            sessionStorage.setItem('currentItinerary', JSON.stringify(simplifiedItinerary));
          }
          
          router.push('/(tabs)/');
        } else {
          console.error('❌ Both API endpoints failed');
          alert('Sorry, I encountered an error while planning your trip. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ Error planning trip:', error);
      alert('Sorry, I encountered an error while planning your trip. Please try again.');
    } finally {
      setIsPlanning(false);
      setPlanningDestination('');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Next Adventure</Text>
          <Text style={styles.subtitle}>AI-powered recommendations based on your preferences</Text>
        </View>

        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Your Travel Profile</Text>
          {userInsights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <Text style={styles.insightText}>• {insight}</Text>
            </View>
          ))}
        </View>

        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Personalized Recommendations</Text>
          {personalizedRecommendations.map((recommendation) => (
            <View key={recommendation.id} style={styles.recommendationCard}>
              <View style={styles.recommendationHeader}>
                <View style={styles.destinationInfo}>
                  <Text style={styles.destinationName}>{recommendation.destination}</Text>
                  <Text style={styles.destinationDetails}>
                    {recommendation.duration} • ${recommendation.estimatedCost} • {recommendation.confidence}% match
                  </Text>
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
                {recommendation.highlights.map((highlight, index) => (
                  <View key={index} style={styles.highlightItem}>
                    <Text style={styles.highlightText}>• {highlight}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.planTripButton}
                onPress={() => handlePlanTrip(recommendation)}
              >
                <Text style={styles.planTripButtonText}>Plan This Trip</Text>
              </TouchableOpacity>
            </View>
          ))}
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
              🤖 AI is analyzing your preferences{'\n'}
              📅 Building day-by-day schedule{'\n'}
              💰 Calculating costs and booking options{'\n'}
              🎯 Finding the best activities and alternatives
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
}); 