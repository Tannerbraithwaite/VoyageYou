import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Alert, SafeAreaView } from 'react-native';
import GlassCard from '@/components/ui/GlassCard';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import DetailsModal from '@/components/DetailsModal';
import { Ionicons } from '@expo/vector-icons';
import { VoyageYouHeader } from '@/components';
import { safeLocalStorage } from '@/utils/storage';
import { safeSessionStorage } from '@/utils/storage';

interface Activity {
  time: string;
  activity: string;
  price: number;
  type: 'bookable' | 'estimated';
}

interface SavedSchedule {
  id: string;
  name: string;
  destination: string;
  duration: string;
  savedAt: string;
  status: 'unbooked' | 'booked' | 'past';
  itinerary: any; // Keep as any for now to avoid type conflicts
  schedule: any[]; // Changed to match the corrected type
  
  // Trip status fields
  checkoutDate?: string;
  tripStartDate?: string;
  tripEndDate?: string;
  
  // Enhanced information fields
  flights: any[];
  hotels: any[];
  activities: any[];
  dates: string[];
  costBreakdown: {
    total: number;
    bookable: number;
    estimated: number;
  };
}

export default function ScheduleScreen() {
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<SavedSchedule | null>(null);
  const [showScheduleDetails, setShowScheduleDetails] = useState(false);
  const [activityRatings, setActivityRatings] = useState<Record<string, number>>({});
  
  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsType, setDetailsType] = useState<'flight' | 'hotel'>('flight');
  const [detailsData, setDetailsData] = useState<any>(null);

  // Function to show details modal
  const showDetails = (type: 'flight' | 'hotel', data: any) => {
    setDetailsType(type);
    setDetailsData(data);
    setShowDetailsModal(true);
  };

  // Function to get status description text
  const getStatusDescription = (schedule: any, status: string): string => {
    if (status === 'unbooked') return 'Ready to book';
    if (status === 'booked') return 'Already booked';
    if (status === 'past') {
      // Check if this past trip was actually booked
      if (schedule.checkoutDate || 
          (typeof window !== 'undefined' && safeSessionStorage.getItem('lastBookingConfirmation'))) {
        return 'Trip completed (was booked)';
      }
      return 'Trip dates have passed';
    }
    return 'Ready to book';
  };

  // Function to automatically determine trip status
  const determineTripStatus = (schedule: any): 'unbooked' | 'booked' | 'past' => {
    const now = new Date();
    
    // FIRST PRIORITY: Check if trip dates have passed (time takes precedence)
    if (schedule.tripEndDate) {
      try {
        const tripEnd = new Date(schedule.tripEndDate);
        if (tripEnd < now) {
          return 'past';
        }
      } catch (error) {
        // Error parsing trip end date
      }
    }
    
    // Check if schedule has itinerary dates
    if (schedule.itinerary && schedule.itinerary.schedule) {
      const itineraryDates = schedule.itinerary.schedule
        .map((day: any) => day.date)
        .filter((date: string) => date && date !== 'Undecided Dates');
      
      if (itineraryDates.length > 0) {
        try {
          // Find the latest date in the itinerary
          const latestTripDate = new Date(Math.max(...itineraryDates.map((date: string) => new Date(date).getTime())));
          
          if (latestTripDate < now) {
            return 'past';
          }
        } catch (error) {
          // Error parsing itinerary dates
        }
      }
    }
    
    // SECOND PRIORITY: Check if this trip has been booked through checkout process
    // Look for booking confirmation in safeSessionStorage or check for checkoutDate
    if (schedule.checkoutDate) {
      return 'booked';
    }
    
    // Check if there's a recent booking for this schedule
    if (typeof window !== 'undefined') {
      try {
        const lastBooking = safeSessionStorage.getItem('lastBookingConfirmation');
        if (lastBooking) {
          const bookingData = JSON.parse(lastBooking);
          if (bookingData.success && bookingData.booking) {
            // Check if the booking matches this schedule (by destination or name)
            const bookingDestination = bookingData.booking.itinerary_summary?.destination;
            if (bookingDestination && 
                (schedule.destination === bookingDestination || 
                 schedule.name.toLowerCase().includes(bookingDestination.toLowerCase()))) {
              return 'booked';
            }
          }
        }
      } catch (error) {
        // Error checking booking data
      }
    }
    
    // DEFAULT: If not past and not booked, it's unbooked
    return 'unbooked';
  };

  // Load saved schedules from safeLocalStorage
  const loadSavedSchedules = async () => {
    try {
      const stored = await safeLocalStorage.getItem('savedSchedules');
      console.log('🔍 Raw stored schedules:', stored);
      
      if (stored) {
        const schedules = JSON.parse(stored);
        console.log('📋 Parsed schedules:', schedules);
        console.log('📊 Number of schedules found:', schedules.length);
        
        // Filter out invalid schedules that don't have the required structure
        const validSchedules = schedules.filter((schedule: any) => {
          const isValid = schedule && 
                 schedule.id && 
                 schedule.name && 
                 schedule.destination &&
                 (schedule.schedule || schedule.itinerary); // Must have either schedule or itinerary
          
          if (!isValid) {
            console.log('❌ Invalid schedule found:', {
              hasSchedule: !!schedule,
              hasId: !!schedule?.id,
              hasName: !!schedule?.name,
              hasDestination: !!schedule?.destination,
              hasScheduleOrItinerary: !!(schedule?.schedule || schedule?.itinerary),
              schedule: schedule
            });
          }
          
          return isValid;
        });
        
        // Apply automatic status assignment to valid schedules
        const updatedSchedules = validSchedules.map((schedule: any) => ({
          ...schedule,
          status: determineTripStatus(schedule)
        }));
        
        console.log('✅ Valid schedules:', validSchedules.length);
        console.log('📋 Setting saved schedules state:', updatedSchedules);
        setSavedSchedules(updatedSchedules);
        
        // If we filtered out any invalid schedules, update safeLocalStorage
        if (validSchedules.length !== schedules.length) {
          await safeLocalStorage.setItem('savedSchedules', JSON.stringify(validSchedules));
          console.log(`❌ Filtered out ${schedules.length - validSchedules.length} invalid schedules`);
        } else {
          console.log('✅ All schedules are valid');
        }
      } else {
        console.log('📭 No saved schedules found in storage');
      }
    } catch (error) {
      console.error('Error loading saved schedules:', error);
      // Clear corrupted data
      await safeLocalStorage.removeItem('savedSchedules');
      setSavedSchedules([]);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadSavedSchedules();
      // Also refresh status to detect any new bookings
      setTimeout(refreshScheduleStatus, 100);
    }, [])
  );

  // Refresh status when component focuses to detect new bookings
  const refreshScheduleStatus = () => {
    if (savedSchedules.length > 0) {
      const updatedSchedules = savedSchedules.map(schedule => ({
        ...schedule,
        status: determineTripStatus(schedule)
      }));
      setSavedSchedules(updatedSchedules);
      
      if (typeof window !== 'undefined') {
        safeLocalStorage.setItem('savedSchedules', JSON.stringify(updatedSchedules));
      }
    }
  };

  useEffect(() => {
    loadSavedSchedules();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked': return '#10b981';
      case 'unbooked': return '#f59e0b';
      case 'past': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'booked': return '✅';
      case 'unbooked': return '⏳';
      case 'past': return '📅';
      default: return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleScheduleClick = (schedule: SavedSchedule) => {
    setSelectedSchedule(schedule);
    setShowScheduleDetails(true);
  };

  const handleCheckout = (schedule: SavedSchedule) => {
    // Store the selected schedule in safeSessionStorage for checkout
    if (typeof window !== 'undefined') {
      safeSessionStorage.setItem('selectedItinerary', JSON.stringify(schedule.itinerary));
    }
    router.push('/checkout');
  };

  // Navigate to trip edit screen for booked trips
  const handleEditTrip = (schedule: SavedSchedule) => {
    // Store trip data for the edit screen
    if (typeof window !== 'undefined') {
      safeSessionStorage.setItem('selectedTripForEdit', JSON.stringify(schedule));
    }

    // Close the details modal before navigating
    setShowScheduleDetails(false);

    // Navigate to the trip edit screen
    router.push('/trip-edit');
  };

  // Inject the selected schedule back into the Home tab for editing (for unbooked trips)
  const handleEditSchedule = (schedule: SavedSchedule) => {
    // Persist itinerary so the Home screen can pick it up
    if (typeof window !== 'undefined') {
      safeSessionStorage.setItem('currentItinerary', JSON.stringify(schedule.itinerary));
    }

    // Close the details modal before navigating
    setShowScheduleDetails(false);

    // Navigate to the Home tab so the user can modify the schedule
    router.push('/');
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    const updatedSchedules = savedSchedules.filter(s => s.id !== scheduleId);
    setSavedSchedules(updatedSchedules);
    
    if (typeof window !== 'undefined') {
      safeLocalStorage.setItem('savedSchedules', JSON.stringify(updatedSchedules));
    }
    
    if (selectedSchedule?.id === scheduleId) {
      setSelectedSchedule(null);
      setShowScheduleDetails(false);
    }
  };



  const setRating = (key: string, rating: number) => {
    setActivityRatings(prev => {
      const updated = { ...prev, [key]: rating };
      if (typeof window !== 'undefined') {
        try { safeLocalStorage.setItem('activityRatings', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
  };

  const renderStars = (key: string) => {
    const current = activityRatings[key] || 0;
    return (
      <View style={styles.ratingRow}>
        {[1,2,3,4,5].map(star => (
          <TouchableOpacity key={star} style={styles.starButton} onPress={() => setRating(key, star)}>
            <Text style={[styles.star, star <= current && styles.starFilled]}>{star <= current ? '★' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <GlassCard style={styles.header}>
          <Text style={styles.headerTitle}>📅 My Saved Schedules</Text>
          <Text style={styles.headerSubtitle}>
            Manage and view all your travel schedules
          </Text>
        </GlassCard>

        {/* Schedules List */}
        <View style={styles.schedulesSection}>
          
          {savedSchedules.length === 0 ? (
            <GlassCard style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📋</Text>
              <Text style={styles.emptyStateTitle}>No Saved Schedules</Text>
              <Text style={styles.emptyStateText}>
                Create a schedule in the Home tab and save it to see it here!
              </Text>
              <TouchableOpacity 
                style={styles.createScheduleButton}
                onPress={() => router.push('/')}
              >
                <Text style={styles.createScheduleButtonText}>Go to Home</Text>
              </TouchableOpacity>
            </GlassCard>
          ) : (
            savedSchedules.map((schedule) => (
              <TouchableOpacity
                key={schedule.id}
                style={styles.scheduleCard}
                onPress={() => handleScheduleClick(schedule)}
              >
                <View style={styles.scheduleHeader}>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleName}>{schedule.name}</Text>
                    <Text style={styles.scheduleDestination}>{schedule.destination}</Text>
                    <Text style={styles.scheduleDuration}>{schedule.duration}</Text>
                    <Text style={styles.scheduleDate}>Saved: {formatDate(schedule.savedAt)}</Text>
                  </View>
                  <View style={styles.scheduleStatus}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(schedule.status) }]}>
                      <Text style={styles.statusIcon}>{getStatusIcon(schedule.status)}</Text>
                      <Text style={styles.statusText}>{schedule.status}</Text>
                    </View>
                    {/* Status description */}
                    <Text style={styles.statusDescription}>
                      {getStatusDescription(schedule, schedule.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.scheduleActions}>
                  {/* Status is automatically determined - no manual editing */}
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusInfoText}>
                      {getStatusDescription(schedule, schedule.status)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Schedule Details Modal */}
      <Modal
        visible={showScheduleDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowScheduleDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSchedule && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedSchedule.name}</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowScheduleDetails(false)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  {/* Schedule Info */}
                  <GlassCard style={styles.detailSection}>
                    <Text style={styles.detailTitle}>📋 Schedule Information</Text>
                    <Text style={styles.detailText}>Destination: {selectedSchedule.destination}</Text>
                    <Text style={styles.detailText}>Duration: {selectedSchedule.duration}</Text>
                    <Text style={styles.detailText}>Status: {selectedSchedule.status}</Text>
                    <Text style={styles.detailText}>Saved: {formatDate(selectedSchedule.savedAt)}</Text>
                  </GlassCard>

                  {/* Enhanced Information Sections */}
                  {/* Flights */}
                  {selectedSchedule.flights && selectedSchedule.flights.length > 0 && (
                    <GlassCard style={styles.detailSection}>
                      <Text style={styles.detailTitle}>✈️ Flight Information</Text>
                      {selectedSchedule.flights.map((flight, index) => (
                        <View key={index} style={styles.infoItem}>
                          <View style={styles.infoHeader}>
                            <Text style={styles.infoLabel}>{flight.type === 'outbound' ? 'Departure' : 'Return'}</Text>
                            <TouchableOpacity
                              style={styles.detailButton}
                              onPress={() => showDetails('flight', flight)}
                            >
                              <Ionicons name="information-circle" size={20} color="#007AFF" />
                              <Text style={styles.detailButtonText}>View Details</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.infoText}>{flight.airline} {flight.flight}</Text>
                          <Text style={styles.infoSubtext}>{flight.departure} at {flight.time}</Text>
                          <Text style={styles.infoPrice}>${flight.price}</Text>
                        </View>
                      ))}
                    </GlassCard>
                  )}

                  {/* Hotels */}
                  {selectedSchedule.hotels && selectedSchedule.hotels.length > 0 && (
                    <GlassCard style={styles.detailSection}>
                      <Text style={styles.detailTitle}>🏨 Hotel Information</Text>
                      {selectedSchedule.hotels.map((hotel, index) => (
                        <View key={index} style={styles.infoItem}>
                          <View style={styles.infoHeader}>
                            <Text style={styles.infoText}>{hotel.name}</Text>
                            <TouchableOpacity
                              style={styles.detailButton}
                              onPress={() => showDetails('hotel', hotel)}
                            >
                              <Ionicons name="information-circle" size={20} color="#007AFF" />
                              <Text style={styles.detailButtonText}>View Details</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.infoSubtext}>{hotel.address}</Text>
                          <Text style={styles.infoSubtext}>Check-in: {hotel.check_in} | Check-out: {hotel.check_out}</Text>
                          <Text style={styles.infoSubtext}>Room: {hotel.room_type} | Nights: {hotel.total_nights}</Text>
                          <Text style={styles.infoPrice}>${hotel.price}/night</Text>
                        </View>
                      ))}
                    </GlassCard>
                  )}

                  {/* Cost Breakdown */}
                  {selectedSchedule.costBreakdown && (
                    <GlassCard style={styles.detailSection}>
                      <Text style={styles.detailTitle}>💰 Cost Breakdown</Text>
                      <View style={styles.costRow}>
                        <Text style={styles.costLabel}>Total Cost:</Text>
                        <Text style={styles.costTotal}>${selectedSchedule.costBreakdown.total}</Text>
                      </View>
                      <View style={styles.costRow}>
                        <Text style={styles.costLabel}>Bookable Activities:</Text>
                        <Text style={styles.costAmount}>${selectedSchedule.costBreakdown.bookable}</Text>
                      </View>
                      <View style={styles.costRow}>
                        <Text style={styles.costLabel}>Estimated Activities:</Text>
                        <Text style={styles.costAmount}>${selectedSchedule.costBreakdown.estimated}</Text>
                      </View>
                    </GlassCard>
                  )}

                  {/* Trip Dates */}
                  {selectedSchedule.dates && selectedSchedule.dates.length > 0 && (
                    <GlassCard style={styles.detailSection}>
                      <Text style={styles.detailTitle}>📅 Trip Dates</Text>
                      {selectedSchedule.dates.map((date, index) => (
                        <Text key={index} style={styles.dateText}>
                          Day {index + 1}: {date}
                        </Text>
                      ))}
                    </GlassCard>
                  )}

                  {/* Daily Schedule */}
                  <GlassCard style={styles.detailSection}>
                    <Text style={styles.detailTitle}>📅 Daily Schedule</Text>
                    {selectedSchedule.schedule && Array.isArray(selectedSchedule.schedule) ? (
                      selectedSchedule.schedule.map((day, dayIndex) => {
                        // Safely check if day and day.activities exist
                        if (!day || !day.activities || !Array.isArray(day.activities)) {
                          return (
                            <View key={dayIndex} style={styles.daySection}>
                              <Text style={styles.dayTitle}>Day {dayIndex + 1}</Text>
                              <Text style={styles.noActivitiesText}>No activities available for this day</Text>
                            </View>
                          );
                        }
                        
                        return (
                          <View key={dayIndex} style={styles.daySection}>
                            <Text style={styles.dayTitle}>Day {dayIndex + 1}</Text>
                            {day.activities.map((activity: any, activityIndex: number) => {
                              // Safely check if activity has required properties
                              if (!activity || !activity.time || !activity.name) {
                                return (
                                  <View key={activityIndex} style={styles.activityItem}>
                                    <Text style={styles.invalidActivityText}>Invalid activity data</Text>
                                  </View>
                                );
                              }
                              
                              const key = `${selectedSchedule.id}|${dayIndex}|${activityIndex}|${activity.time}|${activity.name}`;
                              return (
                                <View key={activityIndex} style={styles.activityItem}>
                                  <View style={styles.activityTimeSection}>
                                    <Text style={styles.activityTime}>{activity.time}</Text>
                                    <View style={[styles.typeBadge, activity.type === 'bookable' ? styles.bookableBadge : styles.estimatedBadge]}>
                                      <Text style={styles.typeText}>
                                        {activity.type === 'bookable' ? 'Bookable' : 'Estimated'}
                                      </Text>
                                    </View>
                                  </View>
                                  <View style={styles.activityContent}>
                                    <Text style={styles.activityName}>{activity.name}</Text>
                                    <Text style={styles.activityPrice}>${activity.price || 0}</Text>
                                    {/* Show activity description if available */}
                                    {activity.description && (
                                      <Text style={styles.activityDescription}>
                                        {activity.description}
                                      </Text>
                                    )}
                                  </View>
                                  {/* Ratings visible only for past schedules */}
                                  {selectedSchedule.status === 'past' && renderStars(key)}
                                </View>
                              );
                            })}
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.noScheduleSection}>
                        <Text style={styles.noScheduleText}>
                          No schedule data available. This schedule may be from an older version of the app.
                        </Text>
                        <TouchableOpacity 
                          style={styles.migrateButton}
                          onPress={() => {
                            Alert.alert(
                              'Migrate Schedule',
                              'This schedule is from an older version. Would you like to delete it and create a new one?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                  text: 'Delete & Create New', 
                                  style: 'destructive',
                                  onPress: () => {
                                    handleDeleteSchedule(selectedSchedule.id);
                                    setShowScheduleDetails(false);
                                    // Optionally redirect to create new schedule
                                    router.push('/(tabs)');
                                  }
                                }
                              ]
                            );
                          }}
                        >
                          <Text style={styles.migrateButtonText}>🔄 Migrate to New Format</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </GlassCard>

                  {/* Secondary Actions */}
                  <View style={styles.secondaryActions}>
                    
                    {/* Edit button - different behavior for booked vs unbooked trips */}
                    {selectedSchedule.status === 'unbooked' && (
                      <TouchableOpacity 
                        style={styles.editButton}
                        onPress={() => {
                          handleEditSchedule(selectedSchedule);
                        }}
                      >
                        <Text style={styles.editButtonText}>✏️ Edit Schedule</Text>
                      </TouchableOpacity>
                    )}

                    {selectedSchedule.status === 'booked' && (
                      <TouchableOpacity 
                        style={styles.editButton}
                        onPress={() => {
                          handleEditTrip(selectedSchedule);
                        }}
                      >
                        <Text style={styles.editButtonText}>🔧 Manage Trip</Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* Delete button - only for unbooked trips */}
                    {selectedSchedule.status === 'unbooked' && (
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => {
                          Alert.alert(
                            'Delete Schedule',
                            'Are you sure you want to delete this schedule?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { 
                                text: 'Delete', 
                                style: 'destructive',
                                onPress: () => {
                                  handleDeleteSchedule(selectedSchedule.id);
                                }
                              }
                            ]
                          );
                        }}
                      >
                        <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Primary Action */}
                  <View style={styles.primaryAction}>
                    {/* Checkout button - only for unbooked trips */}
                    {selectedSchedule.status === 'unbooked' && (
                      <TouchableOpacity 
                        style={styles.checkoutButton}
                        onPress={() => {
                          handleCheckout(selectedSchedule);
                        }}
                      >
                        <Text style={styles.checkoutButtonText}>💳 Checkout</Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* Manage Trip button for booked trips */}
                    {selectedSchedule.status === 'booked' && (
                      <TouchableOpacity 
                        style={[styles.checkoutButton, { backgroundColor: '#8b5cf6' }]}
                        onPress={() => {
                          handleEditTrip(selectedSchedule);
                        }}
                      >
                        <Text style={styles.checkoutButtonText}>🔧 Manage Trip</Text>
                      </TouchableOpacity>
                    )}
                    
                    {selectedSchedule.status === 'past' && (
                      <View style={[styles.checkoutButton, { backgroundColor: '#6b7280' }]}>
                        <Text style={styles.checkoutButtonText}>📅 {getStatusDescription(selectedSchedule, 'past')}</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Details Modal */}
      <DetailsModal
        visible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        type={detailsType}
        data={detailsData}
      />
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
  content: {
    paddingTop: 20,
    paddingBottom: 100, // Increased padding to ensure content is visible above navigation bar
  },
  header: {
    padding: 24,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
    fontWeight: '500',
  },
  schedulesSection: {
    margin: 16,
  },
  scheduleCard: {
    marginBottom: 16,
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
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  scheduleDestination: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 2,
  },
  scheduleDuration: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  scheduleDate: {
    fontSize: 12,
    color: '#999',
  },
  scheduleStatus: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  statusDescription: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  scheduleActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  statusInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  statusInfoText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  emptyStateIcon: {
    fontSize: 48,
    color: '#6366f1',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  createScheduleButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
  },
  createScheduleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
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
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: 'white',
  },
  modalBody: {
    padding: 24,
    paddingBottom: 40,
  },
  detailSection: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    marginBottom: 16,
    letterSpacing: -0.3,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  detailText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 8,
  },
  daySection: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#0f0f0f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6366f1',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.5,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  activityItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    lineHeight: 24,
  },
  activityDescription: {
    fontSize: 13,
    color: '#ccc',
    marginTop: 4,
    lineHeight: 18,
  },
  activityTimeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366f1',
  },
  activityPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textAlign: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  bookableBadge: {
    backgroundColor: '#10b981',
  },
  estimatedBadge: {
    backgroundColor: '#475569',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  starButton: {
    marginHorizontal: 2,
  },
  star: {
    fontSize: 16,
    color: '#666',
  },
  starFilled: {
    color: '#FFD700',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginBottom: 15,
  },
  primaryAction: {
    paddingHorizontal: 20,
  },
  checkoutButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  editButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  infoItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
  },
  infoPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
    marginTop: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 14,
    color: '#999',
  },
  costTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
  },
  costAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
  },
  dateText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 8,
  },
  noActivitiesText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  invalidActivityText: {
    fontSize: 14,
    color: '#ef4444',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  noScheduleSection: {
    padding: 20,
    alignItems: 'center',
  },
  noScheduleText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  migrateButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  migrateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },

});
