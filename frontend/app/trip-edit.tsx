import React, { useState, useEffect } from 'react';
import { safeSessionStorage } from '@/utils/storage';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Alert, TextInput, SafeAreaView } from 'react-native';
import GlassCard from '@/components/ui/GlassCard';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/config/api';

interface TripPolicies {
  flight_policies: {
    cancellation: {
      free_cancellation_hours: number;
      cancellation_fee: number;
      refund_percentage: number;
      policy_text: string;
    };
    modification: {
      free_modification_hours: number;
      modification_fee: number;
      policy_text: string;
    };
    baggage: {
      included_bags: number;
      additional_bag_fee: number;
      policy_text: string;
    };
    meals: {
      included_meals: string;
      meal_options: string[];
      policy_text: string;
    };
  };
  hotel_policies: {
    cancellation: {
      free_cancellation_hours: number;
      cancellation_fee: number;
      refund_percentage: number;
      policy_text: string;
    };
    modification: {
      free_modification_hours: number;
      modification_fee: number;
      policy_text: string;
    };
    room_upgrades: {
      available_upgrades: string[];
      policy_text: string;
    };
  };
}

interface SavedSchedule {
  id: string;
  name: string;
  destination: string;
  duration: string;
  status: 'unbooked' | 'booked' | 'past';
  flights: any[];
  hotels: any[];
  costBreakdown: {
    total: number;
    bookable: number;
    estimated: number;
  };
}

export default function TripEditScreen() {
  const [trip, setTrip] = useState<SavedSchedule | null>(null);
  const [policies, setPolicies] = useState<TripPolicies | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModification, setSelectedModification] = useState<string | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [modificationDetails, setModificationDetails] = useState<any>({});

  useEffect(() => {
    loadTripData();
  }, []);

  const loadTripData = async () => {
    try {
      // Get trip data from route params or session storage
      const tripId = 'sample-trip-id'; // In real app, get from route params
      
      // Load policies
      const policiesResponse = await fetch(`${API_BASE_URL}/api/trips/${tripId}/policies`);
      const policiesData = await policiesResponse.json();
      
      if (policiesData.success) {
        setPolicies(policiesData.policies);
      }

      // Load trip data from session storage
      if (typeof window !== 'undefined') {
        const savedTrip = safeSessionStorage.getItem('selectedTripForEdit');
        if (savedTrip) {
          setTrip(JSON.parse(savedTrip));
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading trip data:', error);
      setLoading(false);
    }
  };

  const handleModification = (type: string) => {
    setSelectedModification(type);
    setModificationDetails({});
    
    // Show different UI based on modification type
    if (type === 'cancel') {
      showCancelConfirmation();
    } else {
      // For other modifications, show input form
      setShowConfirmationModal(true);
    }
  };

  const showCancelConfirmation = () => {
    if (!policies || !trip) return;

    const flightPolicy = policies.flight_policies.cancellation;
    const hotelPolicy = policies.hotel_policies.cancellation;
    
    const refundAmount = trip.costBreakdown.total * (flightPolicy.refund_percentage / 100) - flightPolicy.cancellation_fee;
    
    Alert.alert(
      'Cancel Trip',
      `Are you sure you want to cancel this trip?\n\nRefund Policy:\n• ${flightPolicy.policy_text}\n• ${hotelPolicy.policy_text}\n\nEstimated Refund: $${refundAmount.toFixed(2)}`,
      [
        { text: 'Keep Trip', style: 'cancel' },
        { 
          text: 'Cancel Trip', 
          style: 'destructive',
          onPress: () => confirmCancellation()
        }
      ]
    );
  };

  const confirmCancellation = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips/${trip?.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'User requested cancellation',
          hours_until_departure: 48,
          total_cost: trip?.costBreakdown.total || 0
        })
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert(
          'Trip Cancelled',
          result.message,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', 'Failed to cancel trip');
      }
    } catch (error) {
      console.error('Error cancelling trip:', error);
      Alert.alert('Error', 'Failed to cancel trip');
    }
  };

  const handleModificationSubmit = async () => {
    if (!selectedModification || !trip) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/trips/${trip.id}/modify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedModification,
          changes: modificationDetails,
          current_total: trip.costBreakdown.total
        })
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert(
          'Modification Successful',
          result.message,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', 'Failed to modify trip');
      }
    } catch (error) {
      console.error('Error modifying trip:', error);
      Alert.alert('Error', 'Failed to modify trip');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading trip details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip || !policies) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load trip details</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <GlassCard style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Manage Trip</Text>
              <Text style={styles.headerSubtitle}>{trip.name}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Trip Summary */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Trip Summary</Text>
          <Text style={styles.tripInfo}>Destination: {trip.destination}</Text>
          <Text style={styles.tripInfo}>Duration: {trip.duration}</Text>
          <Text style={styles.tripInfo}>Total Cost: ${trip.costBreakdown.total}</Text>
          <Text style={styles.tripInfo}>Status: {trip.status}</Text>
        </GlassCard>

        {/* Flight Policies */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>✈️ Flight Policies</Text>
          
          <View style={styles.policyItem}>
            <Text style={styles.policyTitle}>Cancellation Policy</Text>
            <Text style={styles.policyText}>{policies.flight_policies.cancellation.policy_text}</Text>
          </View>

          <View style={styles.policyItem}>
            <Text style={styles.policyTitle}>Modification Policy</Text>
            <Text style={styles.policyText}>{policies.flight_policies.modification.policy_text}</Text>
          </View>

          <View style={styles.policyItem}>
            <Text style={styles.policyTitle}>Baggage Policy</Text>
            <Text style={styles.policyText}>{policies.flight_policies.baggage.policy_text}</Text>
          </View>

          <View style={styles.policyItem}>
            <Text style={styles.policyTitle}>Meal Options</Text>
            <Text style={styles.policyText}>{policies.flight_policies.meals.policy_text}</Text>
            {policies.flight_policies.meals.meal_options.map((option, index) => (
              <Text key={index} style={styles.mealOption}>• {option}</Text>
            ))}
          </View>
        </GlassCard>

        {/* Hotel Policies */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>🏨 Hotel Policies</Text>
          
          <View style={styles.policyItem}>
            <Text style={styles.policyTitle}>Cancellation Policy</Text>
            <Text style={styles.policyText}>{policies.hotel_policies.cancellation.policy_text}</Text>
          </View>

          <View style={styles.policyItem}>
            <Text style={styles.policyTitle}>Modification Policy</Text>
            <Text style={styles.policyText}>{policies.hotel_policies.modification.policy_text}</Text>
          </View>

          <View style={styles.policyItem}>
            <Text style={styles.policyTitle}>Room Upgrades</Text>
            <Text style={styles.policyText}>{policies.hotel_policies.room_upgrades.policy_text}</Text>
            {policies.hotel_policies.room_upgrades.available_upgrades.map((upgrade, index) => (
              <Text key={index} style={styles.upgradeOption}>• {upgrade}</Text>
            ))}
          </View>
        </GlassCard>

        {/* Modification Options */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Available Modifications</Text>
          
          <TouchableOpacity 
            style={styles.modificationButton}
            onPress={() => handleModification('change_dates')}
          >
            <Ionicons name="calendar" size={24} color="#6366f1" />
            <Text style={styles.modificationButtonText}>Change Dates</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modificationButton}
            onPress={() => handleModification('change_flight')}
          >
            <Ionicons name="airplane" size={24} color="#6366f1" />
            <Text style={styles.modificationButtonText}>Change Flight</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modificationButton}
            onPress={() => handleModification('change_hotel')}
          >
            <Ionicons name="bed" size={24} color="#6366f1" />
            <Text style={styles.modificationButtonText}>Change Hotel</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modificationButton}
            onPress={() => handleModification('add_baggage')}
          >
            <Ionicons name="bag" size={24} color="#6366f1" />
            <Text style={styles.modificationButtonText}>Add Baggage</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modificationButton}
            onPress={() => handleModification('add_meal')}
          >
            <Ionicons name="restaurant" size={24} color="#6366f1" />
            <Text style={styles.modificationButtonText}>Add Meals</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modificationButton}
            onPress={() => handleModification('upgrade_room')}
          >
            <Ionicons name="star" size={24} color="#6366f1" />
            <Text style={styles.modificationButtonText}>Upgrade Room</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modificationButton, styles.cancelButton]}
            onPress={() => handleModification('cancel')}
          >
            <Ionicons name="close-circle" size={24} color="#dc2626" />
            <Text style={[styles.modificationButtonText, styles.cancelButtonText]}>Cancel Trip</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>

      {/* Modification Details Modal */}
      <Modal
        visible={showConfirmationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConfirmationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedModification?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowConfirmationModal(false)}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {selectedModification === 'add_baggage' && (
                <View>
                  <Text style={styles.inputLabel}>Number of Additional Bags:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={modificationDetails.bags?.toString() || ''}
                    onChangeText={(text) => setModificationDetails({...modificationDetails, bags: parseInt(text) || 0})}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.helpText}>Each additional bag costs $35</Text>
                </View>
              )}

              {selectedModification === 'add_meal' && (
                <View>
                  <Text style={styles.inputLabel}>Number of Meals:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={modificationDetails.meals?.toString() || ''}
                    onChangeText={(text) => setModificationDetails({...modificationDetails, meals: parseInt(text) || 0})}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.helpText}>Each meal costs $15</Text>
                </View>
              )}

              {selectedModification === 'upgrade_room' && (
                <View>
                  <Text style={styles.inputLabel}>Number of Nights:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={modificationDetails.nights?.toString() || ''}
                    onChangeText={(text) => setModificationDetails({...modificationDetails, nights: parseInt(text) || 0})}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.helpText}>Room upgrade costs $50 per night</Text>
                </View>
              )}

              {(selectedModification === 'change_dates' || selectedModification === 'change_flight' || selectedModification === 'change_hotel') && (
                <View>
                  <Text style={styles.inputLabel}>Reason for Change:</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={modificationDetails.reason || ''}
                    onChangeText={(text) => setModificationDetails({...modificationDetails, reason: text})}
                    placeholder="Please specify the reason for this change"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelModalButton}
                onPress={() => setShowConfirmationModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleModificationSubmit}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    paddingBottom: 20, // Minimal padding - navigation bar doesn't need extra space
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#999',
  },
  section: {
    margin: 16,
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
    marginBottom: 16,
  },
  tripInfo: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
  },
  policyItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  mealOption: {
    fontSize: 14,
    color: '#999',
    marginLeft: 10,
    marginTop: 4,
  },
  upgradeOption: {
    fontSize: 14,
    color: '#999',
    marginLeft: 10,
    marginTop: 4,
  },
  modificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  modificationButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 12,
  },
  cancelButton: {
    borderColor: '#dc2626',
    backgroundColor: '#1a0a0a',
  },
  cancelButtonText: {
    color: '#dc2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cancelModalButton: {
    flex: 1,
    padding: 12,
    marginRight: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    marginLeft: 10,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
